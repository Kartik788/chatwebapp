function login(event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const responseMsg = document.getElementById("responseMsg");

    responseMsg.innerText = "";

    if (!username || !password) {
        responseMsg.innerText = "Username or password is empty";
        responseMsg.style.color = "red";
        return;
    }

    fetch("http://localhost:9090/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.text())
    .then(message => {
        responseMsg.style.color = "red";
        responseMsg.innerText = message;

        if (message === "User exists") {
            responseMsg.style.color = "green";
            localStorage.setItem("loggedInUser", username);
            window.location.href = "chat.html";
        }
    })
    .catch(error => {
        responseMsg.innerText = "Something went wrong!";
    });
}
