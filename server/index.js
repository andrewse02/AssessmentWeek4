const controller = require("./controller");
const path = require("path");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "/../client")));

const server = http.createServer(app);
const io = new Server(server);

app.get("/", controller.serveChat);

app.post("/login", controller.login);

app.post("/register", controller.register);

app.put("/users", controller.authorizeUser, controller.changeUsername);

io.on("connection", controller.onConnection);

server.listen(controller.port, () => console.log(`Server running on ${controller.port}`));


module.exports = {
    io
};
