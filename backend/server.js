
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import * as Y from "yjs";
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

const roomDocuments = new Map();
const roomAwareness = new Map();
const MAX_YJS_UPDATE_SIZE = 1024 * 1024;

function getRoomDocument(roomId) {
  if (!roomDocuments.has(roomId)) {
    roomDocuments.set(roomId, new Y.Doc());
  }
  return roomDocuments.get(roomId);
}

function toUpdateBuffer(update) {
  if (update instanceof Uint8Array) return update;
  if (update instanceof ArrayBuffer) return new Uint8Array(update);
  if (Array.isArray(update) && update.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)) {
    return Uint8Array.from(update);
  }
  return null;
}

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

  const sendDocumentState = (roomId) => {
    socket.emit("yjs:sync", {
      roomId,
      update: Y.encodeStateAsUpdate(getRoomDocument(roomId)),
    });
  };

  const broadcastAwareness = (roomId) => {
    const participants = [...(roomAwareness.get(roomId)?.values() || [])];
    io.to(roomId).emit("awareness:changed", { roomId, participants });
  };

  const removeAwareness = (roomId) => {
    const awareness = roomAwareness.get(roomId);
    if (!awareness || !awareness.delete(socket.id)) return;
    if (awareness.size === 0) roomAwareness.delete(roomId);
    broadcastAwareness(roomId);
  };

  const leaveApplicationRooms = () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        removeAwareness(room);
        socket.leave(room);
      }
    }
  };



socket.on("join-room", (roomId, acknowledge) => {
  if (
    typeof roomId !== "string" ||
    roomId.trim().length === 0 ||
    roomId.trim().length > 100
  ) {
    socket.emit("room-error", {
      message: "Please provide a valid room ID.",
    });
    if (typeof acknowledge === "function") {
      acknowledge({ ok: false, message: "Please provide a valid room ID." });
    }
    return;
  }

  const cleanRoomId = roomId.trim();

  leaveApplicationRooms();

  socket.join(cleanRoomId);
  getRoomDocument(cleanRoomId);

  socket.emit("room-joined", {
    roomId: cleanRoomId,
  });

  console.log(`${socket.id} joined room: ${cleanRoomId}`);
  sendDocumentState(cleanRoomId);
  socket.emit("awareness:changed", {
    roomId: cleanRoomId,
    participants: [...(roomAwareness.get(cleanRoomId)?.values() || [])],
  });
  if (typeof acknowledge === "function") {
    acknowledge({ ok: true, roomId: cleanRoomId });
  }
});

socket.on("create-room", (roomId, acknowledge) => {
  if (
    typeof roomId !== "string" ||
    roomId.trim().length === 0 ||
    roomId.trim().length > 100
  ) {
    const result = { ok: false, message: "Please provide a valid room ID." };
    socket.emit("room-error", { message: result.message });
    if (typeof acknowledge === "function") acknowledge(result);
    return;
  }

  const cleanRoomId = roomId.trim();
  leaveApplicationRooms();

  socket.join(cleanRoomId);
  getRoomDocument(cleanRoomId);
  const result = { ok: true, roomId: cleanRoomId };
  socket.emit("room-joined", { roomId: cleanRoomId });
  socket.emit("room-created", { roomId: cleanRoomId });
  sendDocumentState(cleanRoomId);
  socket.emit("awareness:changed", {
    roomId: cleanRoomId,
    participants: [...(roomAwareness.get(cleanRoomId)?.values() || [])],
  });
  if (typeof acknowledge === "function") acknowledge(result);
  console.log(`${socket.id} created room: ${cleanRoomId}`);
});



  socket.on("leave-room", (roomId, acknowledge) => {
    if (typeof roomId !== "string" || !socket.rooms.has(roomId)) {
      const result = { ok: false, message: "You are not in that room." };
      socket.emit("room-error", { message: result.message });
      if (typeof acknowledge === "function") acknowledge(result);
      return;
    }

    socket.leave(roomId);
    removeAwareness(roomId);
    socket.emit("room-left", { roomId });

    console.log(`${socket.id} left room: ${roomId}`);
    if (typeof acknowledge === "function") acknowledge({ ok: true, roomId });
  });

  socket.on("yjs:sync-request", (roomId) => {
    if (typeof roomId !== "string" || !socket.rooms.has(roomId)) return;
    sendDocumentState(roomId);
  });

  socket.on("yjs:update", (data) => {
    if (!data || typeof data !== "object") return;

    const { roomId } = data;
    const update = toUpdateBuffer(data.update);
    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId) ||
      !update ||
      update.byteLength === 0 ||
      update.byteLength > MAX_YJS_UPDATE_SIZE
    ) {
      return;
    }

    try {
      Y.applyUpdate(getRoomDocument(roomId), update);
      socket.to(roomId).emit("yjs:update", { roomId, update });
    } catch {
      socket.emit("room-error", { message: "Unable to apply the shared document update." });
    }
  });

  socket.on("awareness:update", (data) => {
    if (!data || typeof data !== "object") return;

    const { roomId, name, cursor } = data;
    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId) ||
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 60
    ) {
      return;
    }

    const hasValidCursor =
      cursor === undefined ||
      (cursor &&
        typeof cursor === "object" &&
        Number.isFinite(cursor.x) &&
        Number.isFinite(cursor.y) &&
        Math.abs(cursor.x) <= 10000 &&
        Math.abs(cursor.y) <= 10000);
    if (!hasValidCursor) return;

    if (!roomAwareness.has(roomId)) roomAwareness.set(roomId, new Map());
    roomAwareness.get(roomId).set(socket.id, {
      socketId: socket.id,
      name: name.trim(),
      cursor: cursor ? { x: cursor.x, y: cursor.y } : null,
    });
    broadcastAwareness(roomId);
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

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) removeAwareness(room);
    }
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
