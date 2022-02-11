const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json()); // When we want to be able to accept JSON.
app.use(express.static(path.join(__dirname, "/../client")));

const users = [];
const messages = [];

app.get("/api/compliment", (req, res) => {
    const compliments = [
        "Gee, you're a smart cookie!",
        "Cool shirt!",
        "Your Javascript skills are stellar."
    ];

    // choose random compliment
    let randomIndex = Math.floor(Math.random() * compliments.length);
    let randomCompliment = compliments[randomIndex];

    res.status(200).send(randomCompliment);
});

app.get("/api/fortune", (req, res) => {
    const fortunes = [
        "You are an absolute unit.",
        "Look to your future, you will see yourself as an absolute unit.",
        "Don't let your past as regular unit define you, you can still be an absolute unit.",
        "Wait patiently, an absolute unit may make your life better.",
        "Be grateful for the absolute units in your life."
    ];

    // choose random compliment
    let randomIndex = Math.floor(Math.random() * fortunes.length);
    let randomFortune = fortunes[randomIndex];

    res.status(200).send(randomFortune);
});

app.get("/chat", (req, res) => {
    res.sendFile(path.resolve("client/chat.html"));
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if(username && password) {
        for(let i = 0; i < users.length; i++) {
            if(users[i].username.toLowerCase() === username.toLowerCase()) {
                const matches = bcrypt.compareSync(password, users[i].password);

                if(matches) {
                    const censoredUser = {...users[i]};
                    delete censoredUser.password;

                    return res.status(200).send({user: censoredUser, messages});
                } else {
                    return res.status(400).send("Incorrect password!");
                }
            }
        }

        return res.status(400).send("Username does not exist!");
    }
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if(username && password) {
        for(let i = 0; i < users.length; i++) {
            if(users[i].username.toLowerCase() === username.toLowerCase()) {
                return res.status(400).send("Username already exists!");
            }
        }

        const passHash = bcrypt.hashSync(password, 10);

        const newUser = {
            id: users.length + 1,
            username
        };

        users.push({...newUser, password: passHash});
        return res.status(200).send(newUser);
    } else {
        return res.status(400).send("You must input Username and Password!");
    }
});

app.put("/users", (req, res) => {
    const { id, username } = req.body;

    if(id && username) {
        const index = users.findIndex(user => +user.id === +id);
        
        if(users[index]) {
            users[index].username = username;

            return res.status(200).send(users[index]);
        } else {
            return res.status(400).send("User does not exist!");
        }
    } else {
        return res.status(400).send("No ID field!");
    }
});

app.post("/messages", (req, res) => {
    const { id, username, message } = req.body;

    if(id && username && message) {
        const foundUser = users.find(user => +user.id === +id && user.username.toLowerCase() === username.toLowerCase());
        
        if(foundUser) {
            const newMessage = {
                id,
                username,
                messageID: messages.length + 1,
                message,
                date: new Date(Date.now())
            }

            messages.push(newMessage);
            res.status(200).send(messages);
        } else {
            res.status(400).send("Could not find user!");
        }
    } else {
        return res.status(400).send("All fields not in body!");
    }
});

app.delete("/messages", (req, res) => {
    const { messageID, userID } = req.body;

    if(messageID && userID) {
        const index = messages.findIndex(message => +message.messageID === +messageID);

        if(messages[index]) {
            messages.splice(index, 1);

            return res.status(200).send({index, serverMessages: messages});
        } else {
            console.log(messageID, messages);
            return res.status(400).send("Message does not exist!");
        }
    } else {
        console.log(req.body);
        return res.status(400).send("All fields not in body!");
    }
});

app.listen(4000, () => console.log("Server running on 4000"));
