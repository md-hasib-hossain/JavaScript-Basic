const express = require('express');
const mysql = require('mysql2/promise'); // Promise version
const cors = require('cors');
const bcrypt = require('bcryptjs'); // পাসওয়ার্ড হ্যাশ করার জন্য
const jwt = require('jsonwebtoken'); // সিকিউর টোকেন জেনারেশনের জন্য
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // এখানে public ফোল্ডারটিকে স্ট্যাটিক হিসেবে যুক্ত করা হলো

const JWT_SECRET = process.env.JWT_SECRET || 'stationery_secret_key_123';
let db;

async function initializeDatabase() {
    try {
        // ১. প্রথমে ডাটাবেজ নাম ছাড়া কাস্টম পোর্ট (3307) ব্যবহার করে কানেক্ট করার চেষ্টা করব
        const tempConnection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306, // এখানে ৩৩০৭ পোর্টটি কানেক্ট হবে
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        // ২. ডাটাবেজ না থাকলে তৈরি করবে
        const dbName = process.env.DB_NAME || 'stationery_db';
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await tempConnection.end(); // টেম্পোরারি কানেকশন বন্ধ

        // ৩. এবার মূল ডাটাবেজের সাথে সঠিক পোর্টে কানেক্ট হবে
        db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName
        });

        console.log('Successfully connected to the MySQL database on port ' + (process.env.DB_PORT || 3306));

        // ৪. টেবিলসমূহ তৈরি করা (এক এক করে রান হবে)
        const queries = {
            Users: `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('Admin', 'Staff') DEFAULT 'Staff',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `,
            Categories: `
                CREATE TABLE IF NOT EXISTS categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `,
            Suppliers: `
                CREATE TABLE IF NOT EXISTS suppliers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    email VARCHAR(255),
                    address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `,
            Products: `
                CREATE TABLE IF NOT EXISTS products (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category_id INT,
                    supplier_id INT,
                    buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                    sell_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                    fixed_profit_percent DECIMAL(5, 2) DEFAULT 25.00,
                    quantity INT NOT NULL DEFAULT 0,
                    stock_alert INT NOT NULL DEFAULT 5,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
                );
            `,
            Customers: `
                CREATE TABLE IF NOT EXISTS customers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    address TEXT,
                    due_amount DECIMAL(10, 2) DEFAULT 0.00,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `,
            Orders: `
                CREATE TABLE IF NOT EXISTS orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    customer_id INT,
                    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    discount DECIMAL(10, 2) DEFAULT 0.00,
                    vat DECIMAL(10, 2) DEFAULT 0.00,
                    grand_total DECIMAL(10, 2) NOT NULL,
                    payment_method VARCHAR(50) DEFAULT 'Cash',
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
                );
            `,
            OrderItems: `
                CREATE TABLE IF NOT EXISTS order_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_id INT,
                    product_id INT,
                    quantity INT NOT NULL,
                    unit_price DECIMAL(10, 2) NOT NULL,
                    total_price DECIMAL(10, 2) NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
                );
            `,
            Invoices: `
                CREATE TABLE IF NOT EXISTS invoices (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_id INT,
                    invoice_no VARCHAR(100) NOT NULL UNIQUE,
                    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                    due_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
                );
            `
        };

        for (const [tableName, query] of Object.entries(queries)) {
            await db.query(query);
            console.log(`${tableName} table is ready.`);
        }

        // --- ৫. ডাটাবেজ খালি থাকলে একটি ডিফল্ট অ্যাডমিন (Admin) তৈরি করা ---
        const [rows] = await db.query('SELECT COUNT(*) as count FROM users');
        if (rows[0].count === 0) {
            const adminPassword = 'admin123';
            const salt = await bcrypt.genSalt(10);
            const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);

            await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['System Admin', 'admin@stationery.com', hashedAdminPassword, 'Admin']
            );
            console.log('----------------------------------------------------');
            console.log('Default Admin Created Successfully!');
            console.log('Email: admin@stationery.com | Password: admin123');
            console.log('----------------------------------------------------');
        }

    } catch (err) {
        console.error('Database configuration error!');
        console.error('Message:', err.message);
        console.log('\n--> PLEASE CHECK: Is MySQL running in your XAMPP Control Panel?');
    }
}

// Initialize Database
initializeDatabase();

// =========================================================================
// API Routes: Authentication (Step 3: Login & Authentication)
// =========================================================================

// ১. ইউজার রেজিস্ট্রেশন এপিআই (Register/Add User)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide name, email and password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [name, email, hashedPassword, role || 'Staff']);

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// ২. ইউজার লগইন এপিআই (Login User)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// API Routes: Categories (ক্যাটাগরি ম্যানেজমেন্ট)
// =========================================================================

app.post('/api/categories', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const query = 'INSERT INTO categories (name, description) VALUES (?, ?)';
        const [result] = await db.query(query, [name, description || null]);

        res.status(201).json({
            message: 'Category created successfully',
            categoryId: result.insertId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY created_at DESC');
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// API Routes: Suppliers (সাপ্লায়ার ম্যানেজমেন্ট)
// =========================================================================

app.post('/api/suppliers', async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }

        const query = 'INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [name, phone || null, email || null, address || null]);

        res.status(201).json({
            message: 'Supplier added successfully',
            supplierId: result.insertId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/suppliers', async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT * FROM suppliers ORDER BY created_at DESC');
        res.status(200).json(suppliers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// API Routes: Products (পণ্য বা প্রোডাক্ট ম্যানেজমেন্ট) - Step 4
// =========================================================================

// ১. নতুন প্রোডাক্ট যুক্ত করা (Add Product)
app.post('/api/products', async (req, res) => {
    try {
        const { name, category_id, supplier_id, buy_price, sell_price, fixed_profit_percent, quantity, stock_alert } = req.body;

        if (!name || buy_price === undefined || sell_price === undefined) {
            return res.status(400).json({ error: 'Product Name, Buy Price, and Sell Price are required' });
        }

        const query = `
            INSERT INTO products 
            (name, category_id, supplier_id, buy_price, sell_price, fixed_profit_percent, quantity, stock_alert) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            name,
            category_id || null,
            supplier_id || null,
            buy_price,
            sell_price,
            fixed_profit_percent || 25.00, // ডিফল্ট লাভ ২৫%
            quantity || 0,
            stock_alert || 5 // ডিফল্ট অ্যালার্ট লিমিট ৫ পিস
        ]);

        res.status(201).json({
            message: 'Product added successfully',
            productId: result.insertId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. সব প্রোডাক্টের তালিকা দেখা (Get All Products with Category & Supplier Info)
app.get('/api/products', async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.name as category_name, s.name as supplier_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            ORDER BY p.created_at DESC
        `;
        const [products] = await db.query(query);
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৩. স্টক অ্যালার্ট এপিআই (Get Out of Stock / Low Stock Products)
app.get('/api/products/stock-alerts', async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.quantity <= p.stock_alert
            ORDER BY p.quantity ASC
        `;
        const [lowStockProducts] = await db.query(query);
        res.status(200).json(lowStockProducts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// API Routes: Customers, Orders & Sales - Step 5
// =========================================================================

// ১. কাস্টমার যুক্ত করা (Add Customer)
app.post('/api/customers', async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        const query = 'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [name, phone || null, address || null]);

        res.status(201).json({
            message: 'Customer added successfully',
            customerId: result.insertId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ২. সব কাস্টমারের তালিকা দেখা (Get All Customers)
app.get('/api/customers', async (req, res) => {
    try {
        const [customers] = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
        res.status(200).json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৩. নতুন সেলস/অর্ডার প্লেস করা এবং মেমো তৈরি করা (Create Order & Auto-Generate Invoice)
app.post('/api/orders', async (req, res) => {
    const connection = db; // Global connection object
    try {
        await connection.query('START TRANSACTION');

        const { customer_id, items, discount, vat, payment_method, paid_amount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in the order list' });
        }

        // ক. মোট বিল হিসাব করা এবং স্টক চেক করা
        let calculatedTotal = 0;
        for (const item of items) {
            const [productRows] = await connection.query('SELECT sell_price, quantity, name FROM products WHERE id = ?', [item.product_id]);
            if (productRows.length === 0) {
                await connection.query('ROLLBACK');
                return res.status(404).json({ error: `Product ID ${item.product_id} not found` });
            }

            const product = productRows[0];
            if (product.quantity < item.quantity) {
                await connection.query('ROLLBACK');
                return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.quantity}` });
            }

            calculatedTotal += Number(product.sell_price) * Number(item.quantity);
        }

        // খ. ডিসকাউন্ট ও ভ্যাট সহ গ্র্যান্ড টোটাল হিসাব
        const discountAmount = Number(discount || 0);
        const vatAmount = Number(vat || 0);
        const grandTotal = calculatedTotal - discountAmount + vatAmount;

        // গ. অর্ডার টেবিলে ডেটা ঢোকানো
        const orderQuery = 'INSERT INTO orders (customer_id, discount, vat, grand_total, payment_method) VALUES (?, ?, ?, ?, ?)';
        const [orderResult] = await connection.query(orderQuery, [customer_id || null, discountAmount, vatAmount, grandTotal, payment_method || 'Cash']);
        const orderId = orderResult.insertId;

        // ঘ. প্রতিটি আইটেম লুপ চালিয়ে অর্ডার-আইটেম এবং পণ্যের স্টক আপডেট করা
        for (const item of items) {
            const [productRows] = await connection.query('SELECT sell_price FROM products WHERE id = ?', [item.product_id]);
            const unitPrice = productRows[0].sell_price;
            const totalPrice = Number(unitPrice) * Number(item.quantity);

            // আইটেম ইনসার্ট
            const itemQuery = 'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)';
            await connection.query(itemQuery, [orderId, item.product_id, item.quantity, unitPrice, totalPrice]);

            // স্টক কমানো
            const updateStockQuery = 'UPDATE products SET quantity = quantity - ? WHERE id = ?';
            await connection.query(updateStockQuery, [item.quantity, item.product_id]);
        }

        // ঙ. ইউনিক ইনভয়েস জেনারেট করা (যেমন: INV-2026-XXXX)
        const invoiceNo = `INV-2026-${Date.now().toString().slice(-6)}`;
        const finalPaid = Number(paid_amount || 0);
        let finalDue = grandTotal - finalPaid;
        if (finalDue < 0) finalDue = 0;

        // ইনভয়েস ইনসার্ট
        const invoiceQuery = 'INSERT INTO invoices (order_id, invoice_no, paid_amount, due_amount) VALUES (?, ?, ?, ?)';
        await connection.query(invoiceQuery, [orderId, invoiceNo, finalPaid, finalDue]);

        // কাস্টমারের বাকি বিল আপডেট (যদি কাস্টমার রেজিস্টার্ড থাকে)
        if (customer_id && finalDue > 0) {
            const updateCustomerDue = 'UPDATE customers SET due_amount = due_amount + ? WHERE id = ?';
            await connection.query(updateCustomerDue, [finalDue, customer_id]);
        }

        // ট্রানজেকশন সফলভাবে শেষ
        await connection.query('COMMIT');

        res.status(201).json({
            message: 'Order created successfully and Stock updated!',
            orderId,
            invoiceNo,
            grandTotal,
            paidAmount: finalPaid,
            dueAmount: finalDue
        });

    } catch (err) {
        await connection.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// ৪. সব ইনভয়েসের তালিকা দেখা (Get All Invoices)
app.get('/api/invoices', async (req, res) => {
    try {
        const query = `
            SELECT i.*, o.grand_total, o.order_date, c.name as customer_name 
            FROM invoices i
            LEFT JOIN orders o ON i.order_id = o.id
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY i.invoice_date DESC
        `;
        const [invoices] = await db.query(query);
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Default Route (যদি index.html না থাকে তবে এটি দেখাবে)
app.get('/api/status', (req, res) => {
    res.send('Stationery Management System API is running...');
});

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});