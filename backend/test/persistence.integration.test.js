import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { io } from "socket.io-client";
import * as Y from "yjs";
import "dotenv/config";
import CodeSession from "../models/CodeSession.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDirectory = `${__dirname}/..`;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const roomId = `week3-persistence-test-${randomUUID()}`;
let port;
let url;
let server;
const sockets = [];

function waitFor(socket, event, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeout);
    const onEvent = (data) => {
      clearTimeout(timer);
      resolve(data);
    };
    socket.once(event, onEvent);
  });
}

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${url}/health`)).ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Server did not start within 10 seconds");
}

async function startServer() {
  port = 6500 + Math.floor(Math.random() * 1000);
  url = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ["server.js"], {
    cwd: backendDirectory,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForServer();
}

async function stopServer() {
  sockets.splice(0).forEach((socket) => socket.disconnect());
  if (!server || server.killed) return;
  await new Promise((resolve) => {
    server.once("exit", resolve);
    server.kill();
  });
}

async function joinRoom() {
  const socket = io(url, { transports: ["websocket"], forceNew: true });
  sockets.push(socket);
  await waitFor(socket, "connect");
  const synced = waitFor(socket, "yjs:sync");
  socket.emit("join-room", roomId);
  return { socket, sync: await synced };
}

async function waitForPersistedDocument(marker) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const saved = await CodeSession.findOne({ roomId }).lean();
    if (saved?.documentState) {
      const doc = new Y.Doc();
      const persistedUpdate = Buffer.isBuffer(saved.documentState)
        ? Uint8Array.from(saved.documentState)
        : Uint8Array.from(Buffer.from(saved.documentState.buffer));
      Y.applyUpdate(doc, persistedUpdate);
      if (doc.getText("code").toString().includes(marker)) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Yjs document was not persisted to MongoDB");
}

test("MongoDB persists a Yjs room and recovers it after a backend restart", { skip: !mongoUri }, async (t) => {
  await mongoose.connect(mongoUri);
  await CodeSession.deleteOne({ roomId });
  t.after(async () => {
    await stopServer();
    await CodeSession.deleteOne({ roomId });
    await mongoose.disconnect();
  });

  await startServer();
  const { socket } = await joinRoom();
  const marker = `// persisted ${randomUUID()}`;
  const source = new Y.Doc();
  source.getText("code").insert(0, marker);
  socket.emit("yjs:update", { roomId, update: Y.encodeStateAsUpdate(source) });

  await waitForPersistedDocument(marker);

  // A refreshed browser gets a new socket and must receive the current room
  // document before it begins editing again.
  socket.disconnect();
  const { sync: refreshSync } = await joinRoom();
  const refreshed = new Y.Doc();
  Y.applyUpdate(refreshed, new Uint8Array(refreshSync.update));
  assert.ok(refreshed.getText("code").toString().includes(marker));

  await stopServer();

  await startServer();
  const { sync } = await joinRoom();
  const recovered = new Y.Doc();
  Y.applyUpdate(recovered, new Uint8Array(sync.update));
  assert.ok(recovered.getText("code").toString().includes(marker));
});
