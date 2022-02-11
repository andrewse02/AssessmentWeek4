const htmlBody = document.body;

const loginSection = document.getElementById("login-section");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginButton = document.getElementById("login-button");

const registerSection = document.getElementById("register-section");
const registerUsername = document.getElementById("register-username");
const registerPassword = document.getElementById("register-password");
const registerButton = document.getElementById("register-button");

let messages = [];

const messagesBox = document.createElement("div");
messagesBox.id = "messages-box";
const messagesList = document.createElement("ul");
messagesList.id = "messages";
messagesBox.appendChild(messagesList);

const messagesCreator = document.createElement("div");
messagesCreator.id = "messages-creator";
const messageInput = document.createElement("input");
messageInput.type = "text";
messageInput.id = "message-input";
messageInput.placeholder = "Message";
messageInput.autocomplete = "off";
const sendButton = document.createElement("button");
sendButton.id = "send-button";
sendButton.textContent = "Send";
messagesCreator.appendChild(messageInput);
messagesCreator.appendChild(sendButton);

const changeSection = document.createElement("section");
changeSection.id = "change-section";
const changeInput = document.createElement("input");
changeInput.id = "change-input";
changeInput.type = "text";
changeInput.placeholder = "Username";
changeInput.autocomplete = "off";
const changeButton = document.createElement("button");
changeButton.id = "change-button";
changeButton.textContent = "Change Username";
changeSection.appendChild(changeInput);
changeSection.appendChild(changeButton);

loginButton.addEventListener("click", (event) => {
    const body = {
        username: loginUsername.value,
        password: loginPassword.value
    };

    loginUsername.value = "";
    loginPassword.value = "";

    axios
        .post("/login", body)
        .then((res) => {
            console.log(res.data);
            sessionStorage.setItem("id", +res.data.user.id);
            sessionStorage.setItem("username", res.data.user.username);

            htmlBody.removeChild(loginSection);
            if (htmlBody.contains(registerSection)) {
                htmlBody.removeChild(registerSection);
            }

            htmlBody.appendChild(messagesBox);
            htmlBody.appendChild(messagesCreator);

            axios
                .get("/messages")
                .then((getRes) => {
                    populateMessages(getRes.data);
                })
                .catch((error) => {
                    console.log(error);
                    alert(error.response.data);
                });

            htmlBody.appendChild(changeSection);
        })
        .catch((error) => {
            console.log(error);
            alert(error.response.data);
        });
});

registerButton.addEventListener("click", (event) => {
    const body = {
        username: registerUsername.value,
        password: registerPassword.value
    };

    registerUsername.value = "";
    registerPassword.value = "";

    axios
        .post("/register", body)
        .then((res) => {
            console.log(res.data);
            document.querySelector("body").removeChild(registerSection);
        })
        .catch((error) => {
            console.log(error);
            alert(error.response.data);
        });
});

sendButton.addEventListener("click", (event) => {
    const body = {
        id: +sessionStorage.id,
        username: sessionStorage.username,
        message: messageInput.value
    };

    axios
        .post("/messages", body)
        .then((res) => {
            axios
                .get("/messages")
                .then((getRes) =>{
                    populateMessages(getRes.data);
                })
                .catch((error) => {
                    console.log(error);
                    alert(error.response.data);
                });
        })
        .catch((error) => {
            console.log(error);
            alert(error.response.data);
        });
});

changeButton.addEventListener("click", (event) => {
    const body = {
        id: +sessionStorage.id,
        username: changeInput.value
    };
    
    axios
        .put(`/users`, body)
        .then((res) => {
            sessionStorage.setItem("username", res.data.username);
        })
        .catch((error) => {
            console.log(error);
            alert(error.response.data);
        });
});

const populateMessages = (serverMessages) => {
    while(messagesList.firstChild) {
        messagesList.removeChild(messagesList.firstChild);
    }

    messages = [];

    for (let i = 0; i < serverMessages.length; i++) {
        const { id, username, messageID, message, date } = serverMessages[i];

        if (!messages.find((element) => element.messageID === messageID)) {
            messageInput.value = "";

            const messageHTML = `
            <div class="message">
                <p class="username">[${username}]: ${message}</p>
                <div class="date-delete">
                    <p class="date">${new Date(date).toLocaleTimeString()}</p>
                    <p class="delete" onclick="deleteMessage(${messageID}, ${id})">Delete</p>
                </div>
            </div>
            `;

            const newMessage = document.createElement("li");
            newMessage.innerHTML = messageHTML;

            messagesList.appendChild(newMessage);

            messages.push(serverMessages[i]);
        }
    }
};

const deleteMessage = (messageID, userID) => {
    const body = {
        messageID: +messageID,
        userID: +userID
    };

    axios
        .delete("/messages", {data: body})
        .then((res) => {
            messages.splice(res.data.index, 1);
            console.log(res.data.serverMessages);

            axios
                .get("/messages")
                .then((getRes) => {
                    populateMessages(getRes.data);
                })
                .catch((error) => {
                    console.log(error);
                    alert(error.response.data);
                });
        })
        .catch((error) => {
            console.log(error);
            alert(error.response.data);
        });

}
