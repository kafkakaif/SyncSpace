import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { io } from "socket.io-client";

const port = 7600 + Math.floor(Math.random() * 1000);
const url = `http://127.0.0.1:${port}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
let server;

function waitFor(socket, event, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeout);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${url}/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Server did not start in degraded database mode");
}

test("configured but unavailable MongoDB produces a useful room error", async (t) => {
  server = spawn(process.execPath, ["server.js"], {
    cwd: `${__dirname}/..`,
    env: {
      ...process.env,
      PORT: String(port),
      MONGO_URI: "mongodb://127.0.0.1:1/syncspace-unavailable-test?serverSelectionTimeoutMS=500",
      MONGODB_URI: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => server?.kill());

  await waitForServer();
  const socket = io(url, { transports: ["websocket"], forceNew: true });
  t.after(() => socket.disconnect());
  await waitFor(socket, "connect");
  const roomError = waitFor(socket, "room-error");
  socket.emit("join-room", "database-unavailable-room");

  const result = await roomError;
  assert.match(result.message, /unable to load the saved code session/i);
});
