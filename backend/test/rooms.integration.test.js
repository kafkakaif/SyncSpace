import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { io } from "socket.io-client";
import * as Y from "yjs";

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

function waitForParticipant(socket, roomId, name) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("awareness:changed", onAwarenessChanged);
      reject(new Error(`Timed out waiting for ${name}'s awareness state`));
    }, 1000);
    const onAwarenessChanged = (data) => {
      if (
        data.roomId === roomId &&
        data.participants.some((participant) => participant.name === name)
      ) {
        clearTimeout(timer);
        socket.off("awareness:changed", onAwarenessChanged);
        resolve(data);
      }
    };
    socket.on("awareness:changed", onAwarenessChanged);
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

async function waitForServer() {
  const deadline = Date.now() + 8000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // The server has not bound its port yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("Server did not start within 8 seconds");
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
    stdio: "inherit",
  });

  await waitForServer();
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

test("creating a room acknowledges success and joins its creator", async () => {
  const creator = io(url, { transports: ["websocket"], forceNew: true });
  sockets.push(creator);
  await waitFor(creator, "connect");

  const created = waitFor(creator, "room-created");
  const joined = waitFor(creator, "room-joined");
  const acknowledged = new Promise((resolve) => {
    creator.emit("create-room", "new-team-room", resolve);
  });

  assert.deepEqual(await created, { roomId: "new-team-room" });
  assert.deepEqual(await joined, { roomId: "new-team-room" });
  assert.deepEqual(await acknowledged, { ok: true, roomId: "new-team-room" });
});

test("room members receive shared Yjs updates and awareness", async () => {
  const editor = await connectToRoom("shared-document-room");
  const collaborator = await connectToRoom("shared-document-room");

  const sourceDocument = new Y.Doc();
  sourceDocument.getText("canvas").insert(0, "shared rectangle");
  const receivedUpdate = waitFor(collaborator, "yjs:update");
  editor.emit("yjs:update", {
    roomId: "shared-document-room",
    update: Y.encodeStateAsUpdate(sourceDocument),
  });

  const update = await receivedUpdate;
  const replicaDocument = new Y.Doc();
  Y.applyUpdate(replicaDocument, update.update);
  assert.equal(replicaDocument.getText("canvas").toString(), "shared rectangle");

  const awareness = waitForParticipant(collaborator, "shared-document-room", "Asha");
  editor.emit("awareness:update", {
    roomId: "shared-document-room",
    name: "Asha",
    cursor: { x: 120, y: 80 },
  });
  const awarenessData = await awareness;

assert.equal(awarenessData.participants.length, 2);

assert.ok(
  awarenessData.participants.some(
    (participant) =>
      participant.name === "Asha" &&
      participant.cursor?.x === 120 &&
      participant.cursor?.y === 80
  ),
  "Asha should appear with the correct cursor coordinates"
);
});

test("team-room events never reach a user in private-room", async () => {
  const teamUser = await connectToRoom("team-room");
  const privateUser = await connectToRoom("private-room");

  const noCodeLeak = expectNoEvent(privateUser, "code:update");
  const noDrawingLeak = expectNoEvent(privateUser, "whiteboard:segment");
  const noClearLeak = expectNoEvent(privateUser, "whiteboard:clear");
  const noDocumentLeak = expectNoEvent(privateUser, "yjs:update");

  teamUser.emit("code:update", { roomId: "team-room", code: "team only" });
  teamUser.emit("whiteboard:segment", {
    roomId: "team-room", x1: 1, y1: 1, x2: 2, y2: 2, color: "#16a34a",
  });
  teamUser.emit("whiteboard:clear", "team-room");
  teamUser.emit("yjs:update", {
    roomId: "team-room",
    update: Y.encodeStateAsUpdate(new Y.Doc()),
  });

  await Promise.all([noCodeLeak, noDrawingLeak, noClearLeak, noDocumentLeak]);
});

test("whiteboard objects synchronize between users in the same room", async () => {
  const firstUser = await connectToRoom("whiteboard-sync-room");
  const secondUser = await connectToRoom("whiteboard-sync-room");

  const item = {
    id: "rect-test-1",
    type: "rect",
    x: 10,
    y: 20,
    width: 100,
    height: 60,
    color: "#2563eb",
  };

  const receivedAdd = waitFor(secondUser, "whiteboard:object:add");

  firstUser.emit("whiteboard:object:add", {
    roomId: "whiteboard-sync-room",
    item,
  });

  assert.deepEqual(await receivedAdd, {
    roomId: "whiteboard-sync-room",
    item,
  });

  const receivedUpdate = waitFor(secondUser, "whiteboard:object:update");

  firstUser.emit("whiteboard:object:update", {
    roomId: "whiteboard-sync-room",
    id: item.id,
    position: { x: 50, y: 70 },
  });

  assert.deepEqual(await receivedUpdate, {
    roomId: "whiteboard-sync-room",
    id: item.id,
    position: { x: 50, y: 70 },
  });
});


test("clearing a whiteboard notifies everyone in the same room", async () => {
  const roomId = "clear-test-room";

  const firstUser = await connectToRoom(roomId);
  const secondUser = await connectToRoom(roomId);

  const cleared = waitFor(secondUser, "whiteboard:clear");

  firstUser.emit("whiteboard:clear", roomId);

  await cleared;
});


test("whiteboard object events do not leak across rooms", async () => {
  const teamUser = await connectToRoom("whiteboard-team-room");
  const privateUser = await connectToRoom("whiteboard-private-room");

  const noAddLeak = expectNoEvent(privateUser, "whiteboard:object:add");
  const noUpdateLeak = expectNoEvent(privateUser, "whiteboard:object:update");

  teamUser.emit("whiteboard:object:add", {
    roomId: "whiteboard-team-room",
    item: {
      id: "team-rect-1",
      type: "rect",
      x: 10,
      y: 20,
      width: 50,
      height: 40,
      color: "#16a34a",
    },
  });

  teamUser.emit("whiteboard:object:update", {
    roomId: "whiteboard-team-room",
    id: "team-rect-1",
    position: { x: 30, y: 40 },
  });

  await Promise.all([noAddLeak, noUpdateLeak]);
});



test("clearing a whiteboard does not affect another room", async () => {
  const teamRoom = "clear-isolation-team";
  const privateRoom = "clear-isolation-private";

  const teamUser = await connectToRoom(teamRoom);
  const privateUser = await connectToRoom(privateRoom);

  const noClearLeak = expectNoEvent(
    privateUser,
    "whiteboard:clear"
  );

  teamUser.emit("whiteboard:clear", teamRoom);

  await noClearLeak;
});
