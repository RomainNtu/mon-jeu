const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const { registerUser, authenticateUser } = require("./db/db.js");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Front-end URL
        methods: ["GET", "POST"],
    },
});

// API route for user registration
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await registerUser(username, password);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API route for user login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { user, token } = await authenticateUser(username, password);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Manage socket connections
io.on("connection", (socket) => {
    console.log(`Nouvel utilisateur connecté : ${socket.id}`);

    // Listen to player movements
    socket.on("player_move", (data) => {
        // Broadcast the message to all clients except the sender
        socket.broadcast.emit("player_move", { id: socket.id, ...data });
    });

    // Listen to player messages
    socket.on("player_message", (data) => {
        // Broadcast the message to all clients
        io.emit("player_message", data);
    });

    // Listen to player disconnections
    socket.on("disconnect", () => {
        console.log(`Utilisateur déconnecté : ${socket.id}`);
        // Inform other clients of the disconnection
        socket.broadcast.emit("player_disconnect", socket.id);
    });

    // Listen to manual disconnections
    socket.on("player_disconnect", () => {
        console.log(`Utilisateur déconnecté manuellement : ${socket.id}`);
        // Inform other clients of the disconnection
        socket.broadcast.emit("player_disconnect", socket.id);
    });
});

// Start the server
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});