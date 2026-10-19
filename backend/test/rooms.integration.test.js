import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { io } from "socket.io-client";

const port = 5500 + Math.floor(Math.random() * 1000);
const url = `http://127.0.0.1:${port}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
let server;
const sockets = [];

function waitFor(socket, event, timeout = 1000) {
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

function expectNoEvent(socket, event, timeout = 300) {
  return new Promise((resolve, reject) => {
    const onEvent = (data) => {
      clearTimeout(timer);
      reject(new Error(`Unexpected ${event}: ${JSON.stringify(data)}`));
    };
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      resolve();
    }, timeout);
    socket.once(event, onEvent);
  });
}

async function connectToRoom(roomId) {
  const socket = io(url, { transports: ["websocket"], forceNew: true });
  sockets.push(socket);
  await waitFor(socket, "connect");
  const joined = waitFor(socket, "room-joined");
  socket.emit("join-room", roomId);
  assert.deepEqual(await joined, { roomId });
  return socket;
}

test.before(async () => {
  server = spawn(process.execPath, ["server.js"], {
    cwd: __dirname + "/..",
    env: {
      ...process.env,
      PORT: String(port),
      MONGO_URI: "",
      MONGODB_URI: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Server did not start")), 3000);
    server.stdout.on("data", (output) => {
      if (output.toString().includes("SyncSpace backend running")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.once("error", reject);
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited before starting (code ${code})`));
    });
  });
});

test.after(async () => {
  sockets.forEach((socket) => socket.disconnect());
  if (server && !server.killed) server.kill();
});

test("two users in the same room receive each other's updates", async () => {
  const firstUser = await connectToRoom("team-room");
  const secondUser = await connectToRoom("team-room");

  const codeUpdate = { roomId: "team-room", code: "const shared = true;" };
  const receivedCode = waitFor(secondUser, "code:update");
  firstUser.emit("code:update", codeUpdate);
  assert.deepEqual(await receivedCode, codeUpdate);

  const segment = {
    roomId: "team-room", x1: 10, y1: 20, x2: 30, y2: 40, color: "#2563eb",
  };
  const receivedSegment = waitFor(firstUser, "whiteboard:segment");
  secondUser.emit("whiteboard:segment", segment);
  assert.deepEqual(await receivedSegment, segment);
});

test("team-room events never reach a user in private-room", async () => {
  const teamUser = await connectToRoom("team-room");
  const privateUser = await connectToRoom("private-room");

  const noCodeLeak = expectNoEvent(privateUser, "code:update");
  const noDrawingLeak = expectNoEvent(privateUser, "whiteboard:segment");
  const noClearLeak = expectNoEvent(privateUser, "whiteboard:clear");

  teamUser.emit("code:update", { roomId: "team-room", code: "team only" });
  teamUser.emit("whiteboard:segment", {
    roomId: "team-room", x1: 1, y1: 1, x2: 2, y2: 2, color: "#16a34a",
  });
  teamUser.emit("whiteboard:clear", "team-room");

  await Promise.all([noCodeLeak, noDrawingLeak, noClearLeak]);
});
