const product = [
    { id: "01", brand: "apple", Descriptions: "This is iphone", price: "$500", color: "Black" },
    { id: "02", brand: "apple", Descriptions: "This is iphone pro", price: "$600", color: "red" },
    { id: "03", brand: "apple", Descriptions: "This is iphone max", price: "$700", color: "Purple" },
    { id: "04", brand: "apple", Descriptions: "This is iphone old", price: "$800", color: "white" },
    { id: "05", brand: "apple", Descriptions: "This is iphone new", price: "$900", color: "blue" },
    { id: "06", brand: "apple", Descriptions: "This is iphone x", price: "$400", color: "skey" },
]

// for(let i =0; i<product.length; i++){
//     console.log(product[i]);
// }



// for (let i = 0; i < product.length; i++) {
//     const element = product[i];
//     if (element.color == "red") {
//         console.log(element);
//     }
// }

const result = product.find(Element => Element.id == "03");     // find() method এর মাধ্যমে array এর মধ্যে কোন একটি ভ্যালু কে খুঁজে বের করা যায়
console.log(result);