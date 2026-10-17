import React, { useCallback, useEffect, useRef, useState } from "react";
import socket from "../services/socket";

const DEFAULT_CODE = `// Welcome to SyncSpace

function collaborate() {
  console.log("Hello, team!");
}`;

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ffffff"];

export default function SyncSpacePage({
  onBackToLanding,
  initialRoomId = "",
}) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [activeRoom, setActiveRoom] = useState("");
  const [status, setStatus] = useState(socket.connected ? "Connected" : "Disconnected");
  const [message, setMessage] = useState("");
  const [codeContent, setCodeContent] = useState(DEFAULT_CODE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#8b5cf6");
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef(null);
  const lastPointRef = useRef(null);
  const activeRoomRef = useRef("");

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const drawGrid = useCallback((ctx, width, height) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
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

  useEffect(() => {
    const onConnect = () => {
      setStatus("Connected");
      if (initialRoomId?.trim()) socket.emit("join-room", initialRoomId.trim());
    };

    const onDisconnect = () => {
      setStatus("Disconnected");
      setActiveRoom("");
      activeRoomRef.current = "";
    };

    const onRoomJoined = ({ roomId: joinedRoomId } = {}) => {
      if (typeof joinedRoomId !== "string") return;
      setActiveRoom(joinedRoomId);
      activeRoomRef.current = joinedRoomId;
      setRoomId(joinedRoomId);
      setMessage(`Successfully joined room: ${joinedRoomId}`);
      clearLocalCanvas();
      setCodeContent(DEFAULT_CODE);
    };

    const onRoomLeft = ({ roomId: leftRoomId } = {}) => {
      setActiveRoom((current) => {
        const next = current === leftRoomId ? "" : current;
        activeRoomRef.current = next;
        return next;
      });
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
  }, [initialRoomId, clearLocalCanvas]);

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
      if (clearedRoomId === activeRoomRef.current) clearLocalCanvas();
    };

    const onCodeUpdate = (data) => {
      if (
        data &&
        data.roomId === activeRoomRef.current &&
        typeof data.code === "string"
      ) {
        setCodeContent(data.code);
      }
    };

    socket.on("whiteboard:segment", onRemoteSegment);
    socket.on("whiteboard:clear", onRemoteClear);
    socket.on("code:update", onCodeUpdate);

    return () => {
      socket.off("whiteboard:segment", onRemoteSegment);
      socket.off("whiteboard:clear", onRemoteClear);
      socket.off("code:update", onCodeUpdate);
    };
  }, [clearLocalCanvas]);

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
    if (activeRoom && socket.connected) socket.emit("leave-room", activeRoom);
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
    setCodeContent(updatedCode);
    if (activeRoom && socket.connected) {
      socket.emit("code:update", { roomId: activeRoom, code: updatedCode });
    }
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
          <button className="btn-chip" type="button" onClick={() => joinQuickRoom("team-room")}>
            #team-room
          </button>
          <button className="btn-chip" type="button" onClick={() => joinQuickRoom("design-lab")}>
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

        {message && <p className="message" role="status">{message}</p>}

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
                      className={`mini-color ${strokeColor === color ? "active" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setStrokeColor(color)}
                      aria-label={`Color ${color}`}
                      title={color}
                    />
                  ))}
                </div>
                {hasDrawn && (
                  <button className="btn-mini-clear" type="button" onClick={clearCanvas}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="canvas-container-box">
              <canvas
                ref={canvasRef}
                className="synced-canvas-element"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={stopDrawing}
                style={{ touchAction: "none" }}
                aria-label="Collaborative whiteboard canvas"
              />
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
              <div className="code-toolbar">JavaScript · Collaborative Editor</div>
              <textarea
                aria-label="Collaborative code editor"
                value={codeContent}
                onChange={(event) => updateCode(event.target.value)}
                spellCheck={false}
                placeholder="Join a room and start writing code..."
                className="syncspace-code-editor"
              />
            </div>
          </div>
        </section>

        <footer>SyncSpace · Axlero · Collaborative Workspace</footer>
      </main>
    </div>
  );
}
