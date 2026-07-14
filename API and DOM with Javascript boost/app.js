// alert()

const target = document.getElementById("title");        // get the element with id "title"
target.style.color = "red";                                 // change the color of the element to red

const allbox = document.getElementsByClassName("box")           // get all elements with class "box"
// console.log(allbox);

for (let i = 0; i < allbox.length; i++) {               // loop through all elements with class "box"
    const element = allbox[i];                          // get the current element in the loop

    element.style.color = "white";
    element.style.backgroundColor = "red";

    // console.log(element);

    if (element.innerText == "Box-5") {                     // check if the inner text of the element is "Box-5"
        element.style.backgroundColor = "purple";           // change the background color of the element to purple if the inner text is "Box-5"
    }
}

document.getElementById("hendeladd").addEventListener("click", (event) => {  // event is optional
    // console.log("Hello boss");
    const inputbox = document.getElementById("Search-Box").value;       // value is used to get the value of input box
    // console.log(inputbox);

    const container = document.getElementById("comment-container")  // get the container where we want to add the new element

    const p = document.createElement("p");      // create a new paragraph element
    p.innerText = inputbox;                         // set the text of the new paragraph element to the value of the input box
    
    container.appendChild(p);   // append the new paragraph element to the container


})

// const handelsearch = (event) => {
//     console.log("Hello Boss");
// }






