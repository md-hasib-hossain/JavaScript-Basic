
function sum(num1, num2) {                  // Regular function
    const result = num1 + num2;             // Regular function এর মাধ্যমে return করা যায়
    return result;  
}

// const output = sum(10,20);
// console.log(output);

const sum2 = (num1, num2) => num1 + num2;  // Arrow function এর মাধ্যমে return করা যায়

const output2 = sum2(10, 20);       // Arrow function এর মাধ্যমে return করা যায়
console.log(output2);               // Arrow function এর মাধ্যমে return করা যায়


