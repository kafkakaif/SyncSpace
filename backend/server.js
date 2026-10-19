
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

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
    roomId.trim().length > 100
  ) {
    socket.emit("room-error", {
      message: "Please provide a valid room ID.",
    });
    return;
  }

  const cleanRoomId = roomId.trim();

  // Leave previous application rooms
  for (const room of socket.rooms) {
    if (room !== socket.id) {
      socket.leave(room);
    }
  }

  socket.join(cleanRoomId);

  socket.emit("room-joined", {
    roomId: cleanRoomId,
  });

  console.log(`${socket.id} joined room: ${cleanRoomId}`);
});



  socket.on("leave-room", (roomId) => {
    if (typeof roomId !== "string") return;

    socket.leave(roomId);
    socket.emit("room-left", { roomId });

    console.log(`${socket.id} left room: ${roomId}`);
  });

  
  // Real-time whiteboard drawing
  socket.on("whiteboard:segment", (data) => {
    if (!data || typeof data !== "object") return;

    const { roomId, x1, y1, x2, y2, color } = data;

    // Only allow drawing in a room this socket has joined
    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId) ||
      ![x1, y1, x2, y2].every(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value) &&
          Math.abs(value) <= 10000
      ) ||
      typeof color !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(color)
    ) {
      return;
    }

    // Broadcast to other users in this room, not the sender
    socket.to(roomId).emit("whiteboard:segment", {
      roomId,
      x1,
      y1,
      x2,
      y2,
      color,
    });
  });

  // Clear the shared whiteboard
  socket.on("whiteboard:clear", (roomId) => {
    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId)
    ) {
      return;
    }

    socket.to(roomId).emit("whiteboard:clear", roomId);
  });
  
socket.on("code:update", (data) => {
  if (!data || typeof data !== "object") return;

  const { roomId, code } = data;

  if (
    typeof roomId !== "string" ||
    !socket.rooms.has(roomId) ||
    typeof code !== "string" ||
    code.length > 100000
  ) {
    return;
  }

  // Share code with other users in the same room
  socket.to(roomId).emit("code:update", {
    roomId,
    code,
  });
});

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function startServer() {
  try {
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB");
    } else {
      console.warn("MongoDB URI is not set; starting without a database connection.");
    }

    server.once("error", (error) => {
      console.error(`Unable to start server: ${error.message}`);
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`SyncSpace backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
