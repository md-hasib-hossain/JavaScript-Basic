const numbers = [10, 15, 20, 25, 30, 35, 40];

console.log("Even Numbers:");
for (const num of numbers) {
    if (num % 2 === 0) {
        console.log(num);
    }
}

console.log("Odd Numbers:");
for (const num of numbers) {
    if (num % 2 !== 0) {
        console.log(num);
    }
}