import CodeSession from "./models/CodeSession.js";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import WhiteboardState from "./models/WhiteboardState.js";
import * as Y from "yjs";
import "dotenv/config";
import authRouter from "./routes/auth.js";

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use("/api/auth", authRouter);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const roomDocuments = new Map();
const roomAwareness = new Map();
const roomYjsAwarenessClients = new Map();
const roomWhiteboardObjects = new Map();
const roomWhiteboardSaveQueues = new Map();

const MAX_YJS_UPDATE_SIZE = 1024 * 1024;
const DEFAULT_CODE = `// Welcome to SyncSpace

function collaborate() {
  console.log("Hello, team!");
}`;

function getWhiteboardObjects(roomId) {
  if (!roomWhiteboardObjects.has(roomId)) {
    roomWhiteboardObjects.set(roomId, []);
  }

  return roomWhiteboardObjects.get(roomId);
}

function toPersistedYjsUpdate(documentState) {
  if (Buffer.isBuffer(documentState)) {
    return Uint8Array.from(documentState);
  }

  if (documentState?.buffer) {
    return Uint8Array.from(Buffer.from(documentState.buffer));
  }

  return Uint8Array.from(documentState);
}

async function saveWhiteboardObjects(roomId) {
  const previousSave =
    roomWhiteboardSaveQueues.get(roomId) ?? Promise.resolve();

  const currentSave = previousSave.catch(() => {}).then(async () => {
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    // Snapshot the latest state when this save reaches the queue.
    const items = getWhiteboardObjects(roomId).map((item) => ({
      ...item,
      ...(Array.isArray(item.points) ? { points: [...item.points] } : {}),
    }));

    await WhiteboardState.findOneAndUpdate(
      { roomId },
      { $set: { items } },
      { upsert: true, new: true, runValidators: true }
    );
  });

  roomWhiteboardSaveQueues.set(roomId, currentSave);

  try {
    await currentSave;
  } finally {
    if (roomWhiteboardSaveQueues.get(roomId) === currentSave) {
      roomWhiteboardSaveQueues.delete(roomId);
    }
  }
}


async function loadWhiteboardObjects(roomId) {
  // Integration tests may run without a MongoDB connection.
  if (mongoose.connection.readyState !== 1) {
    return getWhiteboardObjects(roomId);
  }

  const savedState = await WhiteboardState.findOne({ roomId }).lean();
  const items = savedState?.items ?? [];

  roomWhiteboardObjects.set(roomId, items);

  return items;
}


const roomCodeSaveQueues = new Map();
const roomCodeLoadPromises = new Map();

async function loadRoomDocument(roomId) {
  if (roomDocuments.has(roomId)) {
    return roomDocuments.get(roomId);
  }

  // Ensure simultaneous joins share the same database load.
  if (roomCodeLoadPromises.has(roomId)) {
    return roomCodeLoadPromises.get(roomId);
  }

  const loading = (async () => {
    const doc = new Y.Doc();

    try {
      if (mongoUri && mongoose.connection.readyState !== 1) {
        throw new Error("MongoDB is unavailable; the code session cannot be recovered.");
      }

      if (mongoose.connection.readyState === 1) {
        const saved = await CodeSession.findOne({ roomId })
          .select("documentState")
          .lean();

        if (saved?.documentState) {
          Y.applyUpdate(doc, toPersistedYjsUpdate(saved.documentState));
        } else {
          doc.getText("code").insert(0, DEFAULT_CODE);
        }
      } else {
        // Keep the existing in-memory test mode working.
        doc.getText("code").insert(0, DEFAULT_CODE);
      }

      roomDocuments.set(roomId, doc);
      return doc;
    } catch (error) {
      doc.destroy();
      throw error;
    }
  })();

  roomCodeLoadPromises.set(roomId, loading);

  try {
    return await loading;
  } finally {
    if (roomCodeLoadPromises.get(roomId) === loading) {
      roomCodeLoadPromises.delete(roomId);
    }
  }
}

async function saveRoomDocument(roomId) {
  const previous = roomCodeSaveQueues.get(roomId) ?? Promise.resolve();

  const current = previous.catch(() => {}).then(async () => {
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const doc = roomDocuments.get(roomId);
    if (!doc) return;

    const documentState = Buffer.from(Y.encodeStateAsUpdate(doc));

    await CodeSession.findOneAndUpdate(
      { roomId },
      {
        $set: {
          documentState,
          lastSavedAt: new Date(),
        },
      },
      {
        upsert: true,
        runValidators: true,
      }
    );
  });

  roomCodeSaveQueues.set(roomId, current);

  try {
    await current;
  } finally {
    if (roomCodeSaveQueues.get(roomId) === current) {
      roomCodeSaveQueues.delete(roomId);
    }
  }
}

const CODE_SAVE_DEBOUNCE_MS = 1000;
const roomCodeSaveTimers = new Map();

function scheduleRoomDocumentSave(roomId, delay = CODE_SAVE_DEBOUNCE_MS) {
  if (roomCodeSaveTimers.has(roomId)) {
    clearTimeout(roomCodeSaveTimers.get(roomId));
  }

  const timer = setTimeout(() => {
    roomCodeSaveTimers.delete(roomId);
    saveRoomDocument(roomId).catch((error) => {
      console.error(`Unable to save code session for room ${roomId}:`, error.message);
    });
  }, delay);

  roomCodeSaveTimers.set(roomId, timer);
}

async function flushRoomDocumentSave(roomId) {
  if (roomCodeSaveTimers.has(roomId)) {
    clearTimeout(roomCodeSaveTimers.get(roomId));
    roomCodeSaveTimers.delete(roomId);
  }
  return saveRoomDocument(roomId);
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

function removeYjsAwareness(socket, roomId) {
  const clients = roomYjsAwarenessClients.get(roomId);
  const clientIds = clients?.get(socket.id);

  if (!clientIds) return;

  clients.delete(socket.id);
  if (clients.size === 0) {
    roomYjsAwarenessClients.delete(roomId);
  }

  socket.to(roomId).emit("yjs:awareness:remove", {
    roomId,
    clientIds: [...clientIds],
  });
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

  const sendDocumentState = async (roomId) => {
  try {
    const doc = await loadRoomDocument(roomId);

    // Only send the state if the user is still in this room.
    if (!socket.rooms.has(roomId)) return;

    socket.emit("yjs:sync", {
      roomId,
      update: Y.encodeStateAsUpdate(doc),
    });
  } catch (error) {
    console.error("Unable to send Yjs document state:", error.message);

    socket.emit("room-error", {
      message: "Unable to synchronize the shared code document.",
    });
  }
};

  const leaveApplicationRooms = () => {
    for (const roomId of [...socket.rooms]) {
      if (roomId === socket.id) {
        continue;
      }

      removeAwareness(socket, roomId);
      removeYjsAwareness(socket, roomId);
      socket.leave(roomId);
    }
  };

  const joinRoom = async (roomId, acknowledge, created = false) => {
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
    try {
  await loadRoomDocument(cleanRoomId);
} catch (error) {
  console.error("Unable to load saved code session:", error.message);

  socket.emit("room-error", {
    message: "Unable to load the saved code session.",
  });

  if (typeof acknowledge === "function") {
    acknowledge({
      ok: false,
      message: "Unable to load the saved code session.",
    });
  }

  return;
}

socket.join(cleanRoomId);
try {
  const items = await loadWhiteboardObjects(cleanRoomId);

  socket.emit("whiteboard:state", {
    roomId: cleanRoomId,
    items,
  });
} catch (error) {
  console.error("Unable to load whiteboard state:", error.message);

  socket.emit("room-error", {
    message: "Unable to load the saved whiteboard.",
  });

  socket.leave(cleanRoomId);
  return;
}
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

  socket.on("join-room", async (roomId, acknowledge) => {
  await joinRoom(roomId, acknowledge);
});

socket.on("create-room", async (roomId, acknowledge) => {
  await joinRoom(roomId, acknowledge, true);
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
    removeYjsAwareness(socket, roomId);
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


  // Apply and broadcast valid Yjs document updates.
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

    const doc = roomDocuments.get(roomId);

    if (!doc) {
      socket.emit("room-error", {
        message: "The shared code document is not ready.",
      });
      return;
    }

    try {
      Y.applyUpdate(doc, update);
    } catch (error) {
      socket.emit("room-error", {
        message: "Unable to apply the shared document update.",
      });
      return;
    }

    socket.to(roomId).emit("yjs:update", {
      roomId,
      update,
    });

    scheduleRoomDocumentSave(roomId);
  });

  socket.on("yjs:awareness", (data) => {
    if (!data || typeof data !== "object") return;

    const { roomId, clientId } = data;
    const update = toUpdateBuffer(data.update);

    if (
      typeof roomId !== "string" ||
      !socket.rooms.has(roomId) ||
      !Number.isSafeInteger(clientId) ||
      clientId <= 0 ||
      !update ||
      update.byteLength === 0 ||
      update.byteLength > 64 * 1024
    ) {
      return;
    }

    if (!roomYjsAwarenessClients.has(roomId)) {
      roomYjsAwarenessClients.set(roomId, new Map());
    }

    const roomClients = roomYjsAwarenessClients.get(roomId);
    if (!roomClients.has(socket.id)) {
      roomClients.set(socket.id, new Set());
    }
    roomClients.get(socket.id).add(clientId);

    socket.to(roomId).emit("yjs:awareness", {
      roomId,
      clientId,
      update,
    });
  });

  socket.on("yjs:awareness:sync-request", (roomId) => {
    if (typeof roomId === "string" && socket.rooms.has(roomId)) {
      socket.to(roomId).emit("yjs:awareness:sync-request", { roomId });
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
socket.on("whiteboard:state-request", (roomId) => {
  if (
    typeof roomId !== "string" ||
    !socket.rooms.has(roomId)
  ) {
    return;
  }

  socket.emit("whiteboard:state", {
    roomId,
    items: getWhiteboardObjects(roomId),
  });
});

  // Add a validated whiteboard object and broadcast it to room members.
socket.on("whiteboard:object:add", async (data) => {
  if (!data || typeof data !== "object") return;

  const { roomId, item } = data;

  if (
    typeof roomId !== "string" ||
    !socket.rooms.has(roomId) ||
    !item ||
    typeof item !== "object" ||
    typeof item.id !== "string" ||
    item.id.length === 0 ||
    item.id.length > 100 ||
    typeof item.color !== "string" ||
    !/^#[0-9a-fA-F]{6}$/.test(item.color)
  ) {
    return;
  }

  const validCoordinate = (value) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= 10000;

  let cleanItem;

  if (item.type === "line") {
    if (
      !Array.isArray(item.points) ||
      item.points.length < 4 ||
      item.points.length > 20000 ||
      item.points.some((value) => !validCoordinate(value)) ||
      item.points.length % 2 !== 0
    ) {
      return;
    }

    cleanItem = {
      id: item.id,
      type: "line",
      points: [...item.points],
      color: item.color,
    };
  } else if (item.type === "rect") {
    if (
      !validCoordinate(item.x) ||
      !validCoordinate(item.y) ||
      !validCoordinate(item.width) ||
      !validCoordinate(item.height) ||
      item.width < 0 ||
      item.height < 0
    ) {
      return;
    }

    cleanItem = {
      id: item.id,
      type: "rect",
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      color: item.color,
    };
  } else if (item.type === "circle") {
    if (!validCoordinate(item.x) || !validCoordinate(item.y) || !validCoordinate(item.radius) || item.radius < 0) return;
    cleanItem = { id: item.id, type: "circle", x: item.x, y: item.y, radius: item.radius, color: item.color };
  } else if (item.type === "arrow") {
    if (!Array.isArray(item.points) || item.points.length !== 4 || item.points.some((value) => !validCoordinate(value))) return;
    cleanItem = { id: item.id, type: "arrow", points: [...item.points], color: item.color };
  } else if (item.type === "diamond") {
    if (!validCoordinate(item.x) || !validCoordinate(item.y) || !validCoordinate(item.width) || !validCoordinate(item.height) || item.width < 0 || item.height < 0) return;
    cleanItem = { id: item.id, type: "diamond", x: item.x, y: item.y, width: item.width, height: item.height, color: item.color };
  } else if (item.type === "sticky") {
    if (!validCoordinate(item.x) || !validCoordinate(item.y) || typeof item.text !== "string" || item.text.trim().length === 0 || item.text.length > 500) return;
    cleanItem = { id: item.id, type: "sticky", x: item.x, y: item.y, text: item.text.trim(), color: item.color };
  } else if (item.type === "text") {
    if (
      !validCoordinate(item.x) ||
      !validCoordinate(item.y) ||
      typeof item.text !== "string" ||
      item.text.trim().length === 0 ||
      item.text.length > 500
    ) {
      return;
    }

    cleanItem = {
      id: item.id,
      type: "text",
      x: item.x,
      y: item.y,
      text: item.text,
      color: item.color,
    };
  } else {
    return;
  }

  const objects = getWhiteboardObjects(roomId);

// Ignore duplicate additions for the same object ID.
if (objects.some((existing) => existing.id === cleanItem.id)) {
  return;
}

objects.push(cleanItem);

try {
  await saveWhiteboardObjects(roomId);
} catch (error) {
  objects.pop();

  console.error("Unable to save whiteboard object:", error.message);

  socket.emit("room-error", {
    message: "Unable to save the whiteboard object.",
  });

  return;
}

socket.to(roomId).emit("whiteboard:object:add", {
  roomId,
  item: cleanItem,
});
});

// Synchronize the position of a movable whiteboard object.
socket.on("whiteboard:object:update", async (data) => {
  if (!data || typeof data !== "object") return;

  const { roomId, id, position } = data;

  if (
    typeof roomId !== "string" ||
    !socket.rooms.has(roomId) ||
    typeof id !== "string" ||
    !position ||
    typeof position !== "object"
  ) {
    return;
  }

  const validCoordinate = (value) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= 10000;

  if (
    !validCoordinate(position.x) ||
    !validCoordinate(position.y)
  ) {
    return;
  }

  const objects = getWhiteboardObjects(roomId);
  const item = objects.find((object) => object.id === id);

  if (
    !item ||
    (!["rect", "text", "circle", "diamond", "sticky"].includes(item.type))
  ) {
    return;
  }
const previousPosition = { x: item.x, y: item.y };

item.x = position.x;
item.y = position.y;

try {
  await saveWhiteboardObjects(roomId);
} catch (error) {
  item.x = previousPosition.x;
  item.y = previousPosition.y;

  console.error("Unable to save whiteboard movement:", error.message);

  socket.emit("room-error", {
    message: "Unable to save the whiteboard movement.",
  });

  return;
}

socket.to(roomId).emit("whiteboard:object:update", {
  roomId,
  id,
  position: {
    x: item.x,
    y: item.y,
  },
});
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
  socket.on("whiteboard:clear", async (roomId) => {
  if (
    typeof roomId !== "string" ||
    !socket.rooms.has(roomId)
  ) {
    return;
  }

  const previousObjects = getWhiteboardObjects(roomId);

  roomWhiteboardObjects.set(roomId, []);

  try {
    await saveWhiteboardObjects(roomId);
  } catch (error) {
    roomWhiteboardObjects.set(roomId, previousObjects);

    console.error("Unable to clear saved whiteboard:", error.message);

    socket.emit("room-error", {
      message: "Unable to clear the saved whiteboard.",
    });

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
        removeYjsAwareness(socket, roomId);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

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

    // Keep the collaboration server reachable so clients receive a clear
    // room error instead of an unexplained connection failure. A configured
    // database is still required before a persisted room can be joined.
    server.listen(PORT, () => {
      console.warn(
        `SyncSpace backend running without MongoDB at http://localhost:${PORT}`
      );
    });
  }
}

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}; flushing pending room documents.`);

  let shutdownFailed = false;
  for (const roomId of roomCodeSaveTimers.keys()) {
    clearTimeout(roomCodeSaveTimers.get(roomId));
    roomCodeSaveTimers.delete(roomId);
  }

  const pendingSaves = [...roomDocuments.keys()].map(async (roomId) => {
    try {
      await flushRoomDocumentSave(roomId);
    } catch (error) {
      shutdownFailed = true;
      console.error(`Unable to flush code session for room ${roomId}:`, error.message);
    }
  });
  await Promise.all(pendingSaves);

  console.log("Pending room documents flushed; closing connections.");
  server.closeAllConnections();
  await new Promise((resolve) => io.close(resolve));
  console.log("Socket.IO connections closed.");
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (shutdownFailed) process.exitCode = 1;
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
process.on("message", (message) => {
  if (message?.type === "shutdown") {
    void shutdown("IPC shutdown request");
  }
});

startServer();
