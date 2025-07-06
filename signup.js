function signup() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const responseMsg = document.getElementById("responseMsg");

    // Check for empty fields
    if (!username || !password) {
        responseMsg.innerText = "Username or password is empty";
        responseMsg.style.color = "red";
        return;
    }

    fetch("http://localhost:9090/api/auth/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
    .then(async response => {
        const contentType = response.headers.get("content-type");
        let message;

        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            message = data.message || JSON.stringify(data);
        } else {
            message = await response.text();
        }

        // Show success message in green, others in red
        if (message.toLowerCase().includes("signup successful")) {
            responseMsg.style.color = "green";
        } else {
            responseMsg.style.color = "red";
        }

        responseMsg.innerText = message;
    })
    .catch(error => {
        console.error("Error:", error);
        responseMsg.style.color = "red";
        responseMsg.innerText = "Something went wrong!";
    });
}
