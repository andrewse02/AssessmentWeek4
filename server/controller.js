require("dotenv").config();
const secret = process.env.ACCESS_TOKEN_SECRET;
const jwt = require("jsonwebtoken");
const path = require("path");
const bcrypt = require("bcryptjs");

const port = process.env.PORT || 4000;

const users = [];
const messages = [];
let typing = [];

const serveChat = (req, res) => {
    res.sendFile(path.resolve("client/chat.html"));
};

const login = (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        for (let i = 0; i < users.length; i++) {
            if (users[i].username.toLowerCase() === username.toLowerCase()) {
                const matches = bcrypt.compareSync(password, users[i].password);

                if (matches) {
                    return res.status(200).send(users[i].token);
                } else {
                    return res.status(400).send("Incorrect password!");
                }
            }
        }

        return res.status(400).send("Username does not exist!");
    } else {
        return res.status(400).send("You must input Username and Password!");
    }
};

const register = (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        for (let i = 0; i < users.length; i++) {
            if (users[i].username.toLowerCase() === username.toLowerCase()) {
                return res.status(400).send("Username already exists!");
            }
        }

        const passHash = bcrypt.hashSync(password, 10);

        const newUser = {
            id: users.length + 1,
            username,
            password: passHash
        };

        const token = jwt.sign(newUser, secret);
        newUser.token = token;

        users.push(newUser);
        return res.status(200).send(token);
    } else {
        return res.status(400).send("You must input Username and Password!");
    }
};

const changeUsername = (socket, username) => {
    if(username) {
        const foundIndex = users.findIndex((user) => +user.id === +socket.user.id);

        if(users[foundIndex]) {
            users[foundIndex].username = username;
            const newToken = jwt.sign(users[foundIndex], secret);
            users[foundIndex].token = newToken;
            socket.user = users[foundIndex];

            const { token, password, ...censored } = socket.user;
            return censored;
        } else {
            return { error: "User not found!" };
        }
    } else {
        return { error: "No username input!" };
    }
};

const deleteMessage = (socket, id) => {
    if (id) {
        const foundMessage = messages.find((message) => +message.id === +id);

        if (foundMessage) {
            if (+foundMessage.userID === +socket.user.id) {
                return messages.splice(messages.indexOf(foundMessage), 1);
            } else {
                return { error: "You did not send this message!" };
            }
        } else {
            return { error: "Message does not exist!" };
        }
    } else {
        return { error: "ID not input!" };
    }
};

const authorizeUser = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.status(401).send("No token provided!");
    } else {
        jwt.verify(token, secret, (error, user) => {
            if (error) {
                return res.status(403).send("Unauthorized token provided!");
            } else {
                req.user = user;
                next();
            }
        });
    }
};

const onConnection = (socket) => {
    const io = require("./index.js").io;

    console.log("A client has connected.");
    
    socket.on("auth-request", (token) => {
        const authResponse = authorizeSocket(token);
        
        if(authResponse.user) {
            socket.user = authResponse.user;
            const { token, password, ...censored } = authResponse.user;
            socket.emit("auth-response", { error: null, user: censored});
        } else if(authResponse.error) {
            socket.emit("error", authResponse.error);
            socket.disconnect(true);
        }
    });

    socket.on("refresh-messages", () => {
        const authResponse = authorizeSocket(socket.user.token);

        if(authResponse.error) {
            return socket.emit("error", authResponse.error);
        } else {
            socket.emit("refresh-messages", messages);
        }
    });

    socket.on("message-request", (message) => {
        const authResponse = authorizeSocket(socket.user.token);

        if(authResponse.error) {
            return socket.emit("error", authResponse.error);
        } else {
            const newMessage = {
                id: messages.length + 1,
                username: authResponse.user.username,
                userID: authResponse.user.id,
                message,
                date: new Date(Date.now())
            };

            messages.push(newMessage);
            io.emit("refresh-messages", messages);
        }
    });

    socket.on("delete-request", (id) => {
        const authResponse = authorizeSocket(socket.user.token);

        if(authResponse.error) {
            return socket.emit("error", authResponse.error);
        } else {
            const deleteResponse = deleteMessage(socket, id);
            
            if(deleteResponse.error) {
                return socket.emit("error", deleteResponse.error);
            } else {
                io.emit("refresh-messages", messages);
            }
        }
    });

    socket.on("typing", () => {
        const authResponse = authorizeSocket(socket.user.token);

        if(authResponse.error) {
            return socket.emit("error", authResponse.error);
        } else {
            const typingEntry = { user: authResponse.user };
            
            let foundIndex = typing.findIndex((element) => +element.user.id === +authResponse.user.id);

            if(typing[foundIndex]) {
                let usernames = typing.map((object) => object.user.username);
                clearTimeout(typing[foundIndex].timeout);
                typingEntry.timeout = setTimeout(() => {
                    typing = typing.filter((element) => element.user.id !== authResponse.user.id);
                    usernames = typing.map((object) => object.user.username);

                    io.emit("typing", usernames);
                }, 3000);

                foundIndex = typing.findIndex((element) => +element.user.id === +authResponse.user.id);
                typing[foundIndex] = typingEntry;
            } else {
                typingEntry.timeout = setTimeout(() => {
                    typing = typing.filter((element) => element.user.id !== authResponse.user.id);
                    const usernames = typing.map((object) => object.user.username);

                    io.emit("typing", usernames);
                }, 3000);
                typing.push(typingEntry);
                const usernames = typing.map((object) => object.user.username);
                io.emit("typing", usernames);
            }
        }
    });

    socket.on("change-request", (username) => {
        const authResponse = authorizeSocket(socket.user.token);

        if(authResponse.error) {
            return socket.emit("error", authResponse.error);
        } else {
            const changeResponse = changeUsername(socket, username);

            if(changeResponse.error) {
                return socket.emit("error", changeResponse.error);
            } else {
                return socket.emit("change-response", changeResponse);
            }
        }
    });
};

const authorizeSocket = (token) => {
    const res = {
        error: null,
        user: null
    };

    if(token == null) {
        res.error = "Invalid/no token provided!";
        return res;
    } else {
        jwt.verify(token, secret, (error, user) => {
            if(error) {
                res.error = "Unauthorized token provided!";
            } else {
                res.user = user
                res.user.token = token;
            }
        });
    }

    return res;
};

module.exports = {
    port,
    serveChat,
    login,
    register,
    changeUsername,
    deleteMessage,
    authorizeUser,
    onConnection
};