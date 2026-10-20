
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import * as Y from "yjs";
import "dotenv/config";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
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
  if (update instanceof Uint8Array) {
    return update;
  }

  if (update instanceof ArrayBuffer) {
    return new Uint8Array(update);
  }

  if (
    Array.isArray(update) &&
    update.every(
      (value) =>
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 255
    )
  ) {
    return Uint8Array.from(update);
  }

  return null;
}

function getParticipants(roomId) {
  return [...(roomAwareness.get(roomId)?.values() || [])];
}

function broadcastAwareness(roomId) {
  io.to(roomId).emit("awareness:changed", {
    roomId,
    participants: getParticipants(roomId),
  });
}

function removeAwareness(socket, roomId) {
  const awareness = roomAwareness.get(roomId);

  if (!awareness || !awareness.delete(socket.id)) {
    return;
  }

  if (awareness.size === 0) {
    roomAwareness.delete(roomId);
  }

  broadcastAwareness(roomId);
}

app.get("/health", (req, res) => {
  res.json({
    status: "success",
    message: "SyncSpace backend is running!",
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  let displayName = `User-${socket.id.slice(0, 4)}`;

  const sendDocumentState = (roomId) => {
    socket.emit("yjs:sync", {
      roomId,
      update: Y.encodeStateAsUpdate(getRoomDocument(roomId)),
    });
  };

  const leaveApplicationRooms = () => {
    for (const roomId of [...socket.rooms]) {
      if (roomId === socket.id) {
        continue;
      }

      removeAwareness(socket, roomId);
      socket.leave(roomId);
    }
  };

  const joinRoom = (roomId, acknowledge, created = false) => {
    if (
      typeof roomId !== "string" ||
      roomId.trim().length === 0 ||
      roomId.trim().length > 100
    ) {
      const result = {
        ok: false,
        message: "Please provide a valid room ID.",
      };

      socket.emit("room-error", {
        message: result.message,
      });

      if (typeof acknowledge === "function") {
        acknowledge(result);
      }

      return;
    }

    const cleanRoomId = roomId.trim();

    // Preserve presence when the user is already in this room.
    if (socket.rooms.has(cleanRoomId)) {
      const result = {
        ok: true,
        roomId: cleanRoomId,
      };

      if (typeof acknowledge === "function") {
        acknowledge(result);
      }

      return;
    }

    leaveApplicationRooms();

    socket.join(cleanRoomId);
    getRoomDocument(cleanRoomId);

    socket.emit("room-joined", {
      roomId: cleanRoomId,
    });

    if (created) {
      socket.emit("room-created", {
        roomId: cleanRoomId,
      });
    }

    console.log(`${socket.id} joined room: ${cleanRoomId}`);

    sendDocumentState(cleanRoomId);

    // Register the participant when they enter the room.
    if (!roomAwareness.has(cleanRoomId)) {
      roomAwareness.set(cleanRoomId, new Map());
    }

    roomAwareness.get(cleanRoomId).set(socket.id, {
      socketId: socket.id,
      name: displayName,
      cursor: null,
    });

    broadcastAwareness(cleanRoomId);

    if (typeof acknowledge === "function") {
      acknowledge({
        ok: true,
        roomId: cleanRoomId,
      });
    }
  };

  socket.on("join-room", (roomId, acknowledge) => {
    joinRoom(roomId, acknowledge);
  });

  socket.on("create-room", (roomId, acknowledge) => {
    joinRoom(roomId, acknowledge, true);
  });

  socket.on("leave-room", (roomId, acknowledge) => {
    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId)
    ) {
      const result = {
        ok: false,
        message: "You are not in that room.",
      };

      socket.emit("room-error", {
        message: result.message,
      });

      if (typeof acknowledge === "function") {
        acknowledge(result);
      }

      return;
    }

    removeAwareness(socket, roomId);
    socket.leave(roomId);

    socket.emit("room-left", {
      roomId,
    });

    console.log(`${socket.id} left room: ${roomId}`);

    if (typeof acknowledge === "function") {
      acknowledge({
        ok: true,
        roomId,
      });
    }
  });

  // Send the current shared Yjs document to this client.
  socket.on("yjs:sync-request", (roomId) => {
    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId)
    ) {
      return;
    }

    sendDocumentState(roomId);
  });

  // Apply and broadcast valid Yjs document updates.
  socket.on("yjs:update", (data) => {
    if (!data || typeof data !== "object") {
      return;
    }

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

      socket.to(roomId).emit("yjs:update", {
        roomId,
        update,
      });
    } catch {
      socket.emit("room-error", {
        message: "Unable to apply the shared document update.",
      });
    }
  });

  // Update participant names and remote cursor coordinates.
  socket.on("awareness:update", (data) => {
    if (!data || typeof data !== "object") {
      return;
    }

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
      cursor === null ||
      (
        typeof cursor === "object" &&
        Number.isFinite(cursor.x) &&
        Number.isFinite(cursor.y) &&
        Math.abs(cursor.x) <= 10000 &&
        Math.abs(cursor.y) <= 10000
      );

    if (!hasValidCursor) {
      return;
    }

    displayName = name.trim();

    if (!roomAwareness.has(roomId)) {
      roomAwareness.set(roomId, new Map());
    }

    roomAwareness.get(roomId).set(socket.id, {
      socketId: socket.id,
      name: displayName,
      cursor:
        cursor &&
        Number.isFinite(cursor.x) &&
        Number.isFinite(cursor.y)
          ? {
              x: cursor.x,
              y: cursor.y,
            }
          : null,
    });

    broadcastAwareness(roomId);
  });

  // Broadcast whiteboard drawing segments to other room members.
  socket.on("whiteboard:segment", (data) => {
    if (!data || typeof data !== "object") {
      return;
    }

    const { roomId, x1, y1, x2, y2, color } = data;

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

    socket.to(roomId).emit("whiteboard:segment", {
      roomId,
      x1,
      y1,
      x2,
      y2,
      color,
    });
  });

  // Clear the whiteboard for other room members.
  socket.on("whiteboard:clear", (roomId) => {
    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId)
    ) {
      return;
    }

    socket.to(roomId).emit("whiteboard:clear", roomId);
  });

  // Keep the current code editor synchronization behavior.
  socket.on("code:update", (data) => {
    if (!data || typeof data !== "object") {
      return;
    }

    const { roomId, code } = data;

    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId) ||
      typeof code !== "string" ||
      code.length > 100000
    ) {
      return;
    }

    socket.to(roomId).emit("code:update", {
      roomId,
      code,
    });
  });

  // Remove participant awareness when the socket leaves a room.
  socket.on("disconnecting", () => {
    for (const roomId of [...socket.rooms]) {
      if (roomId !== socket.id) {
        removeAwareness(socket, roomId);
      }
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
      console.warn(
        "MongoDB URI is not set; starting without a database connection."
      );
    }

    server.once("error", (error) => {
      console.error(`Unable to start server: ${error.message}`);
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(
        `SyncSpace backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Unable to connect to MongoDB:",
      error.message
    );
    process.exit(1);
  }
}

startServer();
