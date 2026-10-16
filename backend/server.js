
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Health-check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "SyncSpace backend is running!"
  });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    if (
      typeof roomId !== "string" ||
      roomId.trim().length === 0 ||
      roomId.length > 100
    ) {
      socket.emit("room-error", {
        message: "Please provide a valid room ID."
      });
      return;
    }

    socket.join(roomId);
    socket.emit("room-joined", { roomId });

    console.log(`${socket.id} joined room: ${roomId}`);
  });

  socket.on("leave-room", (roomId) => {
    if (typeof roomId !== "string") return;

    socket.leave(roomId);
    socket.emit("room-left", { roomId });

    console.log(`${socket.id} left room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`SyncSpace backend running on http://localhost:${PORT}`);
});
