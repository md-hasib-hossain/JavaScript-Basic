// const productAllProducts = () => {
//     fetch('https://fakestoreapi.com/products')
//         .then(response => response.json())
//         .then(data => {
//             DisplayProducts(data);
//         });
// };

// const DisplayProducts = (products) => {
//     // Implementation for displaying products
//     const productContainer = document.getElementById('product-container');
//     products.forEach(product => {
//         // console.log(product);
//         const div = document.createElement('div');
//         div.classList.add('product-card');
//         div.innerHTML = `
//             <img class="product-image" src="${product.image}" alt="${product.title}" />
//             <h5>${product.title}</h5>
//             <p>description</p>
//             <h5>Price: $${product.price}</h5>
//             <button>Details</button>
//             <button>Add to Cart</button>
//         `;
//         productContainer.appendChild(div);
//     });
// };

// productAllProducts();

// // const cardAllCards = () => {
// //     fetch('https://fakestoreapi.com/products')
// //         .then(response => response.json())
// //         .then(data => {
// //             console.log(data);
// //         });
// // };






let count = 0;

const productAllProducts = () => {
    fetch("https://fakestoreapi.com/products")
        .then(res => res.json())
        .then(data => DisplayProducts(data))
        .catch(error => console.log(error));
};

const DisplayProducts = (products) => {

    const productContainer = document.getElementById("product-container");

    products.forEach(product => {

        const div = document.createElement("div");
        div.classList.add("product-card");

        div.innerHTML = `
            <img class="product-image" src="${product.image}" alt="${product.title}">

            <h4>${product.title.slice(0,25)}...</h4>

            <p>${product.description.slice(0,60)}...</p>

            <h3>$${product.price}</h3>

            <button onclick="showDetails('${product.title}')">
                Details
            </button>

            <button onclick="addToCart('${product.title}', ${product.price})">
                Add To Cart
            </button>
        `;

        productContainer.appendChild(div);
    });

};

function addToCart(title, price){

    count++;

    document.getElementById("total-products").innerText = count;

    const cartList = document.getElementById("cart-list");

    const item = document.createElement("div");

    item.classList.add("cart-item");

    item.innerHTML = `
        <span>${title.slice(0,15)}...</span>
        <span>$${price}</span>
    `;

    cartList.appendChild(item);

}

function showDetails(title){

    alert(title);

}

productAllProducts();


