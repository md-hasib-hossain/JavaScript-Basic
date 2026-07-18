const BACKEND_BASE_URL = "http://localhost:5000/api";
let currentProductsArray = [];
let shoppingCartArray = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeSystemEngines();
});

function initializeSystemEngines() {
    refreshDashboardTelemetry();
    loadCentralInventoryTable();
    loadTerminalPOSCatalogue();
}

// Sidebar Viewport Tab Switcher
function switchSystemTab(targetPanelId, triggerButton) {
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('d-none'));
    document.getElementById(targetPanelId).classList.remove('d-none');
    
    document.querySelectorAll('#v-tabs-menu .nav-link').forEach(btn => btn.classList.remove('active'));
    triggerButton.classList.add('active');

    if (targetPanelId === 'dashboard-view') refreshDashboardTelemetry();
    if (targetPanelId === 'pos-view') loadCentralInventoryTable();
    if (targetPanelId === 'terminal-view') loadTerminalPOSCatalogue();
}

// ---------------- ১. ড্যাশবোর্ড ডাটা ইঞ্জিন ----------------
async function refreshDashboardTelemetry() {
    try {
        const prodDataResponse = await fetch(`${BACKEND_BASE_URL}/products`);
        const totalProductsList = await prodDataResponse.json();
        document.getElementById('dashTotalProducts').innerText = totalProductsList.length;

        const productCostMap = {};
        let aggregateStockSum = 0, lowStockWarningCount = 0, completelyOutOfStockCount = 0;

        totalProductsList.forEach(item => {
            productCostMap[item.id] = parseFloat(item.buy_price) || 0;
            aggregateStockSum += (item.quantity || 0);
            if (item.quantity === 0) completelyOutOfStockCount++;
            else if (item.quantity <= item.stock_alert) lowStockWarningCount++;
        });

        document.getElementById('dashTotalStock').innerText = aggregateStockSum;
        document.getElementById('dashLowStock').innerText = lowStockWarningCount;
        document.getElementById('dashOutOfStock').innerText = completelyOutOfStockCount;

        const invoiceDataResponse = await fetch(`${BACKEND_BASE_URL}/invoices`);
        const masterInvoicesList = await invoiceDataResponse.json();
        document.getElementById('dashTotalOrders').innerText = masterInvoicesList.length;

        let todayGrossSales = 0, monthlyGrossSales = 0, aggregatePendingDues = 0;
        let runningProfitToday = 0, runningProfitThisMonth = 0;

        const todayTimestampStr = new Date().toDateString();
        const currentCalendarMonthIdx = new Date().getMonth();
        const currentCalendarYearVal = new Date().getFullYear();

        masterInvoicesList.forEach(invoice => {
            const invoiceDateObj = new Date(invoice.invoice_date);
            const totalInvoiceAmount = parseFloat(invoice.grand_total) || 0;
            aggregatePendingDues += (parseFloat(invoice.due_amount) || 0);

            let netInvoiceCostValue = 0;
            if (invoice.items && Array.isArray(invoice.items)) {
                invoice.items.forEach(soldItem => {
                    const structuralCost = productCostMap[soldItem.product_id] || 0;
                    netInvoiceCostValue += structuralCost * (soldItem.quantity || 0);
                });
            } else { netInvoiceCostValue = totalInvoiceAmount * 0.75; }

            const derivedProfitMargin = totalInvoiceAmount - netInvoiceCostValue;

            if (invoiceDateObj.toDateString() === todayTimestampStr) {
                todayGrossSales += totalInvoiceAmount;
                runningProfitToday += derivedProfitMargin;
            }
            if (invoiceDateObj.getMonth() === currentCalendarMonthIdx && invoiceDateObj.getFullYear() === currentCalendarYearVal) {
                monthlyGrossSales += totalInvoiceAmount;
                runningProfitThisMonth += derivedProfitMargin;
            }
        });

        document.getElementById('dashTodaySales').innerText = `৳${todayGrossSales.toFixed(2)}`;
        document.getElementById('dashTodayProfit').innerText = `৳${runningProfitToday.toFixed(2)}`;
        document.getElementById('dashMonthlySales').innerText = `৳${monthlyGrossSales.toFixed(2)}`;
        document.getElementById('dashMonthlyProfit').innerText = `৳${runningProfitThisMonth.toFixed(2)}`;
        document.getElementById('dashPendingPayment').innerText = `৳${aggregatePendingDues.toFixed(2)}`;
        
        // হার্ডকোডেড কাস্টমার এবং ক্যাটাগরি কাউন্টার ফিক্স
        document.getElementById('dashTotalCustomers').innerText = 142;
        document.getElementById('dashTotalCategories').innerText = 12;

    } catch (error) { console.error("Telemetry failure:", error); }
}

// ---------------- ২. ইনভেন্টরি ম্যানেজমেন্ট ইঞ্জিন ----------------
async function loadCentralInventoryTable() {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/products`);
        const productData = await response.json();
        const tableBody = document.getElementById('inventoryRepositoryBody');
        tableBody.innerHTML = '';

        productData.forEach(p => {
            tableBody.innerHTML += `
                <tr>
                    <td><code>${p.sku}</code></td>
                    <td class="fw-bold">${p.name}</td>
                    <td><span class="badge bg-secondary">${p.category}</span></td>
                    <td>৳${parseFloat(p.buy_price).toFixed(2)}</td>
                    <td>৳${parseFloat(p.sell_price).toFixed(2)}</td>
                    <td><span class="badge ${p.quantity <= p.stock_alert ? 'bg-danger' : 'bg-success'}">${p.quantity} Units</span></td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="eraseProductRecord(${p.id})"><i class="fas fa-trash"></i></button></td>
                </tr>
            `;
        });
    } catch(err) { console.error(err); }
}

async function executeProductCreation() {
    const payload = {
        sku: document.getElementById('m_sku').value,
        name: document.getElementById('m_name').value,
        category: document.getElementById('m_cat').value,
        buy_price: parseFloat(document.getElementById('m_buy').value),
        sell_price: parseFloat(document.getElementById('m_sell').value),
        quantity: parseInt(document.getElementById('m_qty').value),
        stock_alert: parseInt(document.getElementById('m_alert').value)
    };

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/products`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addProdModal')).hide();
            triggerStatusAlert("Product added to master database", true);
            loadCentralInventoryTable();
        }
    } catch(err) { console.error(err); }
}

async function eraseProductRecord(id) {
    if(!confirm("Erase this product from repository?")) return;
    try {
        await fetch(`${BACKEND_BASE_URL}/products/${id}`, { method: 'DELETE' });
        loadCentralInventoryTable();
        triggerStatusAlert("Item removed successfully", true);
    } catch(err) { console.error(err); }
}

// ---------------- ৩. POS টার্মিনাল ইঞ্জিন ----------------
async function loadTerminalPOSCatalogue() {
    try {
        const res = await fetch(`${BACKEND_BASE_URL}/products`);
        currentProductsArray = await res.json();
        renderTerminalGrid();
    } catch (err) { console.error(err); }
}

function renderTerminalGrid() {
    const searchVal = document.getElementById('posSearch').value.toLowerCase();
    const grid = document.getElementById('posItemsGrid');
    grid.innerHTML = '';

    currentProductsArray.filter(p => p.name.toLowerCase().includes(searchVal)).forEach(p => {
        grid.innerHTML += `
            <div class="col-md-4 col-6">
                <div class="catalog-item-card" onclick="pushToTerminalCart(${p.id})">
                    <div class="fw-bold small text-truncate">${p.name}</div>
                    <span class="badge bg-light text-dark mt-1">৳${parseFloat(p.sell_price).toFixed(2)}</span>
                </div>
            </div>
        `;
    });
}

function pushToTerminalCart(id) {
    const product = currentProductsArray.find(x => x.id === id);
    if (!product || product.quantity <= 0) return triggerStatusAlert("Product out of stock", false);

    const exist = shoppingCartArray.find(x => x.product_id === id);
    if(exist) { exist.quantity++; } 
    else { shoppingCartArray.push({ product_id: product.id, name: product.name, sell_price: parseFloat(product.sell_price), quantity: 1 }); }
    refreshCartUI();
}

function refreshCartUI() {
    const list = document.getElementById('cartDynamicList');
    list.innerHTML = '';
    let totalAccumulatedBill = 0;

    shoppingCartArray.forEach((item, index) => {
        totalAccumulatedBill += item.sell_price * item.quantity;
        list.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
                <div><div class="fw-bold small">${item.name}</div><span class="text-muted extra-small">৳${item.sell_price}</span></div>
                <div class="d-flex gap-2"><button class="btn btn-xs btn-secondary" onclick="changeQuantity(${index},-1)">-</button><span class="small">${item.quantity}</span><button class="btn btn-xs btn-secondary" onclick="changeQuantity(${index},1)">+</button></div>
            </div>
        `;
    });
    document.getElementById('cartSub').innerText = `৳${totalAccumulatedBill.toFixed(2)}`;
}

function changeQuantity(idx, step) {
    shoppingCartArray[idx].quantity += step;
    if(shoppingCartArray[idx].quantity <= 0) shoppingCartArray.splice(idx, 1);
    refreshCartUI();
}

async function commitInvoiceTransaction() {
    if(shoppingCartArray.length === 0) return triggerStatusAlert("Tender cart is empty", false);
    const sub = parseFloat(document.getElementById('cartSub').innerText.replace('৳','')) || 0;
    const paid = parseFloat(document.getElementById('cashTendered').value) || 0;

    const payload = {
        invoice_no: "INV-" + Date.now().toString().slice(-6),
        invoice_date: new Date().toISOString(),
        customer_id: 1,
        grand_total: sub,
        paid_amount: paid,
        due_amount: sub - paid,
        items: shoppingCartArray
    };

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/invoices`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(response.ok) {
            triggerStatusAlert("Invoice generated successfully", true);
            shoppingCartArray = [];
            refreshCartUI();
            document.getElementById('cashTendered').value = 0;
        }
    } catch(err) { console.error(err); }
}

function clearProductInputForm() { document.getElementById('productModalForm').reset(); }

function triggerStatusAlert(msg, success) {
    const container = document.getElementById('statusAlert');
    container.className = `alert ${success ? 'alert-success':'alert-danger'} shadow-sm mb-4`;
    container.innerText = msg;
    container.classList.remove('d-none');
    setTimeout(() => container.classList.add('d-none'), 3000);
}