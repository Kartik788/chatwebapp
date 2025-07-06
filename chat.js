let currentUser = null;
let currentReceiver = null;
let stompClient = null;

document.addEventListener("DOMContentLoaded", () => {
    currentUser = localStorage.getItem("loggedInUser");

    if (!currentUser) {
        alert("User not logged in");
        window.location.href = "login.html";
        return;
    }

    document.getElementById("currentUser").innerText = currentUser;

    connectWebSocket(); // Assuming you already have this function

    // Load the recent conversations list
    loadRecentConversations();
    loadNewUsers();

    // Send message on Enter key
    document.getElementById("messageInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });
});

function loadRecentConversations() {
    fetch(`http://localhost:9090/api/messages/conversations?user=${currentUser}`)
        .then(response => response.json())
        .then(conversations => {
            const userList = document.getElementById("userList");
            userList.innerHTML = "";

            conversations.forEach(conv => {
                const li = document.createElement("li");
                li.className = "user-item";
                li.innerHTML = `
        <img src="https://api.dicebear.com/7.x/initials/svg?seed=${conv.username}" class="avatar" />
        <div class="user-details">
            <span class="username">${conv.username}</span>
            <span class="last-message">${conv.lastMessage}</span>
        </div>
        <span class="timestamp">${formatTime(conv.timestamp)}</span>
    `;

                // If this is the currently selected receiver, highlight it
                if (conv.username === currentReceiver) {
                    li.classList.add("active");
                }

                li.addEventListener("click", () => {
                    currentReceiver = conv.username;
                    document.getElementById("chatWith").innerText = `Chat with ${conv.username}`;
                    loadConversation(currentUser, currentReceiver);

                    document.querySelectorAll(".user-item").forEach(e => e.classList.remove("active"));
                    li.classList.add("active");
                });

                userList.appendChild(li);
            });
        })
        .catch(err => console.error("Error loading conversations:", err));
}

function connectWebSocket() {
    const socket = new SockJS("http://localhost:9090/ws"); // Your backend WS endpoint
    stompClient = Stomp.over(socket);
    stompClient.connect({}, () => {
        console.log("Connected to WebSocket");

        stompClient.subscribe(`/topic/${currentUser}`, (message) => {
            if (message.body === "new-message") {
                // Only reload messages if you're chatting with that user
                if (currentReceiver) {
                    loadConversation(currentUser, currentReceiver);
                    loadRecentConversations();
                    loadNewUsers();
                    
                }
            }
        });
        stompClient.subscribe("/topic/new-user", (msg) => {
            if (msg.body === "new-user") {
                console.log("🔔 A new user just registered");
                loadNewUsers();
            }
        });
    });
}

function loadConversation(sender, receiver) {
    fetch(`http://localhost:9090/api/messages/conversation?sender=${sender}&receiver=${receiver}`)
        .then(res => res.json())
        .then(messages => {
            const chatWindow = document.getElementById("chatMessages");
            chatWindow.innerHTML = "";

            messages.forEach(msg => {
                const msgDiv = document.createElement("div");
                msgDiv.className = msg.sender === sender ? "message sent" : "message received";

                // Format timestamp to HH:MM (24hr) or AM/PM format
                const time = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                msgDiv.innerHTML = `
                    <div>${msg.message}</div>
                    <small class="timestamp">${time}</small>
                `;

                chatWindow.appendChild(msgDiv);
            });

            // Scroll to the bottom of chat
            chatWindow.scrollTop = chatWindow.scrollHeight;
        })
        .catch(error => {
            console.error("Error loading conversation:", error);
        });
}

function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!message || !currentReceiver) {
        alert("Please enter a message and select a user");
        return;
    }

    fetch("http://localhost:9090/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            sender: currentUser,
            receiver: currentReceiver,
            message: message
        })
    })
        .then(response => response.text())
        .then(result => {
            if (result.toLowerCase().includes("success")) {
                messageInput.value = "";
                loadConversation(currentUser, currentReceiver); // refresh chat
                loadRecentConversations();
                loadNewUsers();
                
            } else {
                alert("Message failed: " + result);
            }
        })
        .catch(err => {
            console.error("Send error:", err);
            alert("Error sending message");
        });
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}



function loadNewUsers() {
    fetch(`http://localhost:9090/api/discovery/new-users?user=${currentUser}`)
        .then(res => res.json())
        .then(users => {
            const newUserList = document.getElementById("newUsers");
            newUserList.innerHTML = "";

            users.forEach(user => {
                const li = document.createElement("li");
                li.className = "user-item";
                li.innerHTML = `
                    <img src="https://api.dicebear.com/7.x/initials/svg?seed=${user}" class="avatar" />
                    <div class="user-details">
                        <span class="username">${user}</span>
                        <span class="last-message">No messages yet</span>
                    </div>
                `;
                li.addEventListener("click", () => {
                    currentReceiver = user;
                    document.getElementById("chatWith").innerText = `Chat with ${user}`;
                    loadConversation(currentUser, currentReceiver);
                    loadRecentConversations(); // They will now move to top
                    loadNewUsers(); // Remove from new users
                });

                newUserList.appendChild(li);
            });
        });
}

