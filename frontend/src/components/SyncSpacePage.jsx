
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import socket from "../services/socket";

const DEFAULT_CODE = `// Welcome to SyncSpace

function collaborate() {
  console.log("Hello, team!");
}`;

const COLORS = ["#53C557", "#0E9488", "#23964B", "#111827", "#EF4444"];
function toYjsUpdate(update) {
  if (update instanceof Uint8Array) {
    return update;
  }

  if (update instanceof ArrayBuffer) {
    return new Uint8Array(update);
  }

  if (Array.isArray(update)) {
    if (
      update.every(
        (value) =>
          Number.isInteger(value) &&
          value >= 0 &&
          value <= 255
      )
    ) {
      return Uint8Array.from(update);
    }
  }

  if (
    update &&
    update.type === "Buffer" &&
    Array.isArray(update.data)
  ) {
    return Uint8Array.from(update.data);
  }

  return null;
}

export default function SyncSpacePage({
  onBackToLanding,
  initialRoomId = "",
}) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [activeRoom, setActiveRoom] = useState("");
  const [status, setStatus] = useState(
    socket.connected ? "Connected" : "Disconnected"
  );
  const [message, setMessage] = useState("");
  const [codeContent, setCodeContent] = useState(DEFAULT_CODE);
  const [isCodeSynced, setIsCodeSynced] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#53C557");
  const [hasDrawn, setHasDrawn] = useState(false);

  const [displayName] = useState(
    () => `User-${Math.random().toString(36).slice(2, 6)}`
  );
  const [participants, setParticipants] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState([]);
const cursorSendTimeRef = useRef(0);

  const canvasRef = useRef(null);
  const lastPointRef = useRef(null);
  const activeRoomRef = useRef("");
  const ydocRef = useRef(null);
const ytextRef = useRef(null);
const remoteYjsOriginRef = useRef({});
const initializeYjsDocument = useCallback((joinedRoomId) => {
  ydocRef.current?.destroy();

  const doc = new Y.Doc();
  const sharedText = doc.getText("code");

  ydocRef.current = doc;
  ytextRef.current = sharedText;

  sharedText.observe(() => {
    setCodeContent(sharedText.toString());
  });

  doc.on("update", (update, origin) => {
    if (origin === remoteYjsOriginRef.current) {
      return;
    }

    if (!socket.connected) {
      return;
    }

    socket.emit("yjs:update", {
      roomId: joinedRoomId,
      update,
    });
  });
}, []);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const drawGrid = useCallback((ctx, width, height) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";

    for (let x = 15; x < width; x += 25) {
      for (let y = 15; y < height; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const clearLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawGrid(ctx, rect.width, rect.height);
    setHasDrawn(false);
  }, [drawGrid]);



const announcePresence = useCallback((joinedRoomId, cursor = null) => {
  if (!joinedRoomId || !socket.connected) return;

  const payload = {
    roomId: joinedRoomId,
    name: displayName,
    cursor,
  };


  socket.emit("awareness:update", payload);
}, [displayName]);



  useEffect(() => {
    const onConnect = () => {
      setStatus("Connected");

      if (initialRoomId?.trim()) {
        socket.emit("join-room", initialRoomId.trim());
      }
    };

    const onDisconnect = () => {
      setStatus("Disconnected");
      setActiveRoom("");
      activeRoomRef.current = "";
      setParticipants([]);
      setRemoteCursors([]);
      ydocRef.current?.destroy();
ydocRef.current = null;
ytextRef.current = null;
setIsCodeSynced(false);
    };

    const onRoomJoined = ({ roomId: joinedRoomId } = {}) => {
      if (typeof joinedRoomId !== "string") return;

      activeRoomRef.current = joinedRoomId;
      setActiveRoom(joinedRoomId);
      setRoomId(joinedRoomId);
      setMessage(`Successfully joined room: ${joinedRoomId}`);
      setParticipants([]);
      setRemoteCursors([]);
      clearLocalCanvas();
      setCodeContent("");
setIsCodeSynced(false);

initializeYjsDocument(joinedRoomId);
announcePresence(joinedRoomId);
    };

    const onRoomLeft = ({ roomId: leftRoomId } = {}) => {
      if (activeRoomRef.current === leftRoomId) {
        activeRoomRef.current = "";
        setActiveRoom("");
        setParticipants([]);
        setRemoteCursors([]);
      }

      setMessage(`Left room: ${leftRoomId}`);
      clearLocalCanvas();
    };

    const onRoomError = ({ message: errorMessage } = {}) => {
      setMessage(errorMessage || "Unable to join that room.");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room-joined", onRoomJoined);
    socket.on("room-left", onRoomLeft);
    socket.on("room-error", onRoomError);

    if (!socket.connected) {
      socket.connect();
    } else if (initialRoomId?.trim()) {
      socket.emit("join-room", initialRoomId.trim());
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room-joined", onRoomJoined);
      socket.off("room-left", onRoomLeft);
      socket.off("room-error", onRoomError);
    };
  }, [
  initialRoomId,
  clearLocalCanvas,
  announcePresence,
  initializeYjsDocument,
]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid(ctx, rect.width, rect.height);
  }, [drawGrid]);

  useEffect(() => {
    const onRemoteSegment = (data) => {
      if (!data || data.roomId !== activeRoomRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.beginPath();
      ctx.moveTo(data.x1, data.y1);
      ctx.lineTo(data.x2, data.y2);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      setHasDrawn(true);
    };

    const onRemoteClear = (clearedRoomId) => {
      if (clearedRoomId === activeRoomRef.current) {
        clearLocalCanvas();
      }
    };

    const applyYjsUpdate = (data, initialSync = false) => {
  if (!data || data.roomId !== activeRoomRef.current) {
    return;
  }

  const doc = ydocRef.current;
  const update = toYjsUpdate(data.update);

  if (!doc || !update) {
    return;
  }

  try {
    Y.applyUpdate(doc, update, remoteYjsOriginRef.current);

    if (initialSync) {
      setIsCodeSynced(true);
    }
  } catch {
    setMessage("Unable to synchronize the shared code document.");
  }
};

const onYjsSync = (data) => {
  applyYjsUpdate(data, true);
};

const onYjsUpdate = (data) => {
  applyYjsUpdate(data);
};

    const onAwarenessChanged = (data) => {
      if (!data || data.roomId !== activeRoomRef.current) return;

  const nextParticipants = Array.isArray(data.participants)
    ? data.participants
    : [];

  setParticipants(nextParticipants);

  const nextRemoteCursors = nextParticipants.filter(
  (participant) =>
    participant.socketId !== socket.id &&
    participant.cursor &&
    Number.isFinite(participant.cursor.x) &&
    Number.isFinite(participant.cursor.y)
);


setRemoteCursors(nextRemoteCursors);
};

    socket.on("whiteboard:segment", onRemoteSegment);
    socket.on("whiteboard:clear", onRemoteClear);
    socket.on("yjs:sync", onYjsSync);
socket.on("yjs:update", onYjsUpdate);
    socket.on("awareness:changed", onAwarenessChanged);

    return () => {
      socket.off("whiteboard:segment", onRemoteSegment);
      socket.off("whiteboard:clear", onRemoteClear);
      socket.off("yjs:sync", onYjsSync);
socket.off("yjs:update", onYjsUpdate);
      socket.off("awareness:changed", onAwarenessChanged);
    };
  }, [clearLocalCanvas]);


const handleCanvasPointerMove = (event) => {
  if (!activeRoom || !socket.connected) return;

  const now = Date.now();
  if (now - cursorSendTimeRef.current < 50) return;
  cursorSendTimeRef.current = now;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();

  const cursor = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };


  announcePresence(activeRoom, cursor);
};


  const startDrawing = (event) => {
    if (!activeRoom || !socket.connected) {
      setMessage("Join a room before drawing collaboratively.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    lastPointRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    setIsDrawing(true);
    setHasDrawn(true);
    setMessage("");
    canvas.setPointerCapture?.(event.pointerId);
  };

  const draw = (event) => {
    if (!isDrawing || !activeRoom || !socket.connected) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const currentPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const previousPoint = lastPointRef.current;

    if (!previousPoint) {
      lastPointRef.current = currentPoint;
      return;
    }

    const segment = {
      roomId: activeRoom,
      x1: previousPoint.x,
      y1: previousPoint.y,
      x2: currentPoint.x,
      y2: currentPoint.y,
      color: strokeColor,
    };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    socket.emit("whiteboard:segment", segment);
    lastPointRef.current = currentPoint;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

const handleCanvasPointerLeave = () => {
  stopDrawing();
};


  const clearCanvas = () => {
    clearLocalCanvas();

    if (activeRoom && socket.connected) {
      socket.emit("whiteboard:clear", activeRoom);
    }
  };

  const joinRoom = () => {
    const trimmedRoomId = roomId.trim();

    if (!trimmedRoomId) {
      setMessage("Please enter a room ID.");
      return;
    }

    if (!socket.connected) {
      setMessage("Connecting to server. Please try again.");
      return;
    }

    socket.emit("join-room", trimmedRoomId);
  };

  const leaveRoom = () => {
    if (activeRoom && socket.connected) {
      socket.emit("leave-room", activeRoom);
    }
  };

  const joinQuickRoom = (quickRoomId) => {
    setRoomId(quickRoomId);

    if (!socket.connected) {
      setMessage("Connecting to server. Please try again.");
      return;
    }

    socket.emit("join-room", quickRoomId);
  };
const updateCode = (updatedCode) => {
  const doc = ydocRef.current;
  const sharedText = ytextRef.current;

  if (
    !activeRoom ||
    !socket.connected ||
    !isCodeSynced ||
    !doc ||
    !sharedText
  ) {
    return;
  }

  const currentCode = sharedText.toString();

  if (currentCode === updatedCode) {
    return;
  }

  // Find the unchanged beginning of the text.
  let prefix = 0;

  while (
    prefix < currentCode.length &&
    prefix < updatedCode.length &&
    currentCode[prefix] === updatedCode[prefix]
  ) {
    prefix++;
  }

  // Find the unchanged ending of the text.
  let oldEnd = currentCode.length;
  let newEnd = updatedCode.length;

  while (
    oldEnd > prefix &&
    newEnd > prefix &&
    currentCode[oldEnd - 1] === updatedCode[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  // Apply only the changed section to the shared Yjs text.
  doc.transact(() => {
    const deleteLength = oldEnd - prefix;

    if (deleteLength > 0) {
      sharedText.delete(prefix, deleteLength);
    }

    const insertedText = updatedCode.slice(prefix, newEnd);

    if (insertedText.length > 0) {
      sharedText.insert(prefix, insertedText);
    }
  });
};


  return (
    <div className="syncspace-page-wrapper">
      <nav className="syncspace-top-nav">
        <button
          id="btn-return-landing"
          className="btn-back-landing"
          onClick={onBackToLanding}
          type="button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>← Back to Landing Page</span>
        </button>

        <div className="nav-center-info">
          <span className="room-status-indicator">
            {activeRoom ? `Connected Room: ${activeRoom}` : "No Room Joined"}
          </span>
        </div>

        <div className="nav-quick-actions">
          <button
            className="btn-chip"
            type="button"
            onClick={() => joinQuickRoom("team-room")}
          >
            #team-room
          </button>
          <button
            className="btn-chip"
            type="button"
            onClick={() => joinQuickRoom("design-lab")}
          >
            #design-lab
          </button>
        </div>
      </nav>

      <main className="app">
        <header className="topbar">
          <div>
            <h1>SyncSpace</h1>
            <p>Real-time collaborative workspace</p>
          </div>

          <span className={`status ${status === "Connected" ? "online" : ""}`}>
            ● {status}
          </span>
        </header>

        <section className="room-controls">
          <input
            id="syncspace-room-input"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Enter a room ID, e.g. team-room"
            maxLength={100}
            aria-label="Room ID"
          />

          <button id="syncspace-join-btn" type="button" onClick={joinRoom}>
            Join Room
          </button>

          <button
            id="syncspace-leave-btn"
            className="secondary"
            type="button"
            onClick={leaveRoom}
            disabled={!activeRoom}
          >
            Leave Room
          </button>

          <span className="active-room">
            {activeRoom ? `Room: ${activeRoom}` : "No room joined"}
          </span>
        </section>

        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}

        {activeRoom && (
          <section
            className="panel"
            aria-label="Room participants"
            style={{ marginBottom: "16px", padding: "16px" }}
          >
            <h2 style={{ marginTop: 0 }}>
              Participants ({participants.length})
            </h2>

            {participants.length > 0 ? (
              <ul
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {participants.map((participant) => (
                  <li
                    key={participant.socketId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "20px",
                      background: "rgba(83, 197, 87, 0.12)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#53C557",
                      }}
                    />
                    {participant.name}
                    {participant.socketId === socket.id ? " (You)" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginBottom: 0 }}>
                Waiting for participants to connect...
              </p>
            )}
          </section>
        )}

        <section className="workspace">
          <div className="panel">
            <div className="panel-heading">
              <div className="panel-heading-left">
                <span>01</span>
                <h2>Whiteboard</h2>
              </div>

              <div className="panel-tools">
                <div className="color-picker-mini">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`mini-color ${
                        strokeColor === color ? "active" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setStrokeColor(color)}
                      aria-label={`Color ${color}`}
                      title={color}
                    />
                  ))}
                </div>

                {hasDrawn && (
                  <button
                    className="btn-mini-clear"
                    type="button"
                    onClick={clearCanvas}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>


<div className="canvas-container-box" style={{ position: "relative" }}>
  <canvas
    ref={canvasRef}
    className="synced-canvas-element"
    onPointerDown={startDrawing}
    onPointerMove={(event) => {
      handleCanvasPointerMove(event);
      draw(event);
    }}
    onPointerUp={stopDrawing}
    onPointerCancel={stopDrawing}
    onPointerLeave={handleCanvasPointerLeave}
    style={{ touchAction: "none", cursor: "default" }}
    aria-label="Collaborative whiteboard canvas"
  />

  {remoteCursors.map((participant, index) => {
    const cursor = participant.cursor;
    if (!cursor) return null;

    const color = COLORS[index % COLORS.length];

    return (
      <div
        key={participant.socketId}
        style={{
          position: "absolute",
          left: cursor.x,
          top: cursor.y,
          zIndex: 9999,
pointerEvents: "none",
transform: "translate(-2px, -2px)",
        }}
      >
        <svg
          width="18"
          height="22"
          viewBox="0 0 18 22"
          aria-hidden="true"
        >
          <path
            d="M1 1 L1 17 L5.5 12.5 L9 20 L12 18.5 L9 11 L16 11 Z"
            fill={color}
            stroke="#ffffff"
            strokeWidth="1.2"
          />
        </svg>

        <span
          style={{
            display: "inline-block",
            marginLeft: "4px",
            padding: "3px 6px",
            borderRadius: "4px",
            background: color,
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {participant.name}
        </span>
      </div>
    );
  })}

  <div className="placeholder">
    <span className="placeholder-icon">✏️</span>
    <h3>Collaborative Canvas</h3>
    <p>Join a room, then click and drag to draw with your team.</p>
  </div>
</div>

          </div>

          <div className="panel">
            <div className="panel-heading">
              <span>02</span>
              <h2>Code Editor</h2>
            </div>

            <div className="code-placeholder">
              <div className="code-toolbar">
                <span>JavaScript</span>
                <span className="editor-live-label">Room sync</span>
              </div>

              <textarea
                aria-label="Collaborative code editor"
                value={codeContent}
                onChange={(event) => updateCode(event.target.value)}
                spellCheck={false}
                disabled={!activeRoom || !isCodeSynced}
                placeholder="Join a room and start writing code..."
                className="syncspace-code-editor"
              />
            </div>
          </div>
        </section>

        <footer>
          SyncSpace <span aria-hidden="true">·</span> Collaborative workspace
        </footer>
      </main>
    </div>
  );
}
