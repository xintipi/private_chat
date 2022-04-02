const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    allowEIO3: true,
    cors: {
        origin: "*",
    },
    transports: ["polling", "websocket"]
});

function getUsers (socket, next) {
    const users = []
    const { username, token } = socket.handshake.auth

    if (!token) return next(new Error("invalid token or no fill username"))

    // if exist token, call api to check token. Then set username in socket
    socket.username = username

    // save array user was connected socket
    for (let [id, socket] of io.of("/").sockets) {
        users.push({userId: id, username: socket.username})
    }

    return users
}

/**
 * @param socket, next
 * @desc connection socket
 */
io.on('connection', (socket, next) => {
    console.log('a user connected');

    /* start emit event to client */
    socket.emit("getUsers", getUsers(socket, next))

    socket.broadcast.emit("userJustConnected", {
        userId: socket.id,
        username: socket.username
    })
    /* end emit event to client */

    /* start listen event from client */
    socket.on("privateMessage", ({message, to}) => {
        socket.to(to).emit("privateMessageToReceiver", {
            message,
            from: socket.id
        })
    })

    socket.on("disconnect", () => {
        console.log("user disconnected");
    })
    /* end listen event from client */
});

/**
 * @desc server listening with port 5000
 */
server.listen(5000, () => {
    // console.log('listening on *:5000');
});
