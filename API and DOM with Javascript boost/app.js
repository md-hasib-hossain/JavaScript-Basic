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





fetch("https://jsonplaceholder.typicode.com/users")  // fetch is used to get data from the API
    .then((response) => response.json())                // convert the response to JSON
    .then(data => {                                     // data is the JSON data
        // console.log(data);
        displayData(data);                              // log the data to the console
    })
    .catch((error) => {                                 // catch any errors that occur during the fetch
        console.log(error);                             // log the error to the console
    });

const displayData = (Userdata) => {                        // displayData is a function that takes in data as a parameter
    const container = document.getElementById("UserData_container")  // get the container where we want to add the new elements
    Userdata.forEach(user => {                              // loop through the data
        console.log(user);                                   // log the name of each user to the console

        const div = documrent.createElement("div");                       // create a new div element
        div.innerHTML  = `
        <h3>Name: ${user.name}</h3>
        <p>Email: ${user.email}</p>
        <p>Phone: ${user.phone}</p>
        <p>Website: ${user.website}</p>
        <p>Company: ${user.company.name}</p>
        <p>Address: ${user.address.street}, ${user.address.suite}, ${user.address.city}, ${user.address.zipcode}</p>
        `;
        // const div = document.createElement("div");
        // div.innerText = user.name;
        // container.appendChild(div);
    });
}








