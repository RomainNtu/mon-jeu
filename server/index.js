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

    socket.on("player_move", (data) => {
        socket.broadcast.emit("player_move", data);
    });

    socket.on("player_message", (data) => {
        io.emit("player_message", data);
    });

    socket.on("disconnect", () => {
        io.emit("player_disconnect", socket.id);
        console.log(`Utilisateur déconnecté : ${socket.id}`);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});