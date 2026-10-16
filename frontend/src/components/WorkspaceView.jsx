import React, { useState, useEffect, useRef } from 'react';
import socket from '../services/socket';

export default function WorkspaceView({ onBackToHome, initialRoomId = '' }) {
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [activeRoom, setActiveRoom] = useState(initialRoomId || '');
  const [status, setStatus] = useState(socket.connected ? 'Connected' : 'Disconnected');
  const [message, setMessage] = useState('');
  
  // Whiteboard drawing state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#8b5cf6');
  const [penWidth, setPenWidth] = useState(3);

  // Code editor state
  const [code, setCode] = useState(`// Welcome to SyncSpace Collaborative Studio
// Room: ${initialRoomId || 'Public'}

function collaborate(team, ideas) {
  console.log(\`\${team} is syncing \${ideas.length} architecture blocks...\`);
  // Full Monaco Editor arrives in Week 3 with Yjs CRDT binding
}

collaborate("Core Engineering", ["Whiteboard", "Code Sync"]);`);

  useEffect(() => {
    const onConnect = () => setStatus('Connected');
    const onDisconnect = () => setStatus('Disconnected');

    const onRoomJoined = ({ roomId }) => {
      setActiveRoom(roomId);
      setMessage(`Successfully joined room: ${roomId}`);
    };

    const onRoomLeft = ({ roomId }) => {
      setActiveRoom((current) => (current === roomId ? '' : current));
      setMessage(`Left room: ${roomId}`);
    };

    const onRoomError = ({ message }) => setMessage(message);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room-joined', onRoomJoined);
    socket.on('room-left', onRoomLeft);
    socket.on('room-error', onRoomError);

    socket.connect();

    // Auto-join if initialRoomId provided
    if (initialRoomId) {
      setTimeout(() => {
        if (socket.connected) {
          socket.emit('join-room', initialRoomId);
        }
      }, 500);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room-joined', onRoomJoined);
      socket.off('room-left', onRoomLeft);
      socket.off('room-error', onRoomError);
    };
  }, [initialRoomId]);

  // Init Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 15; x < rect.width; x += 25) {
      for (let y = 15; y < rect.height; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, rect.width, rect.height);
    // Redraw grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 15; x < rect.width; x += 25) {
      for (let y = 15; y < rect.height; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const joinRoom = () => {
    const trimmed = roomId.trim();
    if (!trimmed) {
      setMessage('Please enter a room ID.');
      return;
    }
    if (!socket.connected) {
      setMessage('Connecting to server. Please try again.');
      return;
    }
    socket.emit('join-room', trimmed);
  };

  const leaveRoom = () => {
    if (activeRoom) {
      socket.emit('leave-room', activeRoom);
    }
  };

  return (
    <div className="workspace-view-container">
      {/* Workspace Header */}
      <header className="workspace-header">
        <div className="workspace-header-left">
          <button className="btn-back-home" onClick={onBackToHome} title="Return to Landing Page">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Home</span>
          </button>
          
          <div className="workspace-brand">
            <span className="brand-logo-small">⚡</span>
            <span className="workspace-title">SyncSpace Studio</span>
          </div>

          <div className={`workspace-status-badge ${status === 'Connected' ? 'status-connected' : 'status-disconnected'}`}>
            <span className="status-dot"></span>
            <span>{status}</span>
          </div>
        </div>

        <div className="workspace-header-right">
          {activeRoom && (
            <div className="active-room-pill">
              <span className="room-label">Active Room:</span>
              <span className="room-val">{activeRoom}</span>
            </div>
          )}
          <span className="week-tag">Week 1 Foundation</span>
        </div>
      </header>

      {/* Room Controls Toolbar */}
      <section className="workspace-toolbar">
        <div className="toolbar-input-group">
          <input
            id="workspace-room-input"
            className="workspace-room-input"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID (e.g. dev-team-1)"
            maxLength={100}
          />
          <button id="workspace-join-btn" className="btn-ws-primary" onClick={joinRoom}>
            Join Room
          </button>
          <button id="workspace-leave-btn" className="btn-ws-secondary" onClick={leaveRoom} disabled={!activeRoom}>
            Leave Room
          </button>
        </div>

        {/* Preset quick room chips */}
        <div className="quick-room-chips">
          <span className="chips-hint">Quick Rooms:</span>
          {['design-sprint', 'arch-review', 'live-code'].map(r => (
            <button
              key={r}
              className="room-chip-btn"
              onClick={() => {
                setRoomId(r);
                if (socket.connected) socket.emit('join-room', r);
              }}
            >
              #{r}
            </button>
          ))}
        </div>
      </section>

      {message && (
        <div className={`workspace-alert-banner ${message.includes('Left') ? 'alert-info' : 'alert-success'}`}>
          <span className="alert-icon">ℹ️</span>
          <span>{message}</span>
        </div>
      )}

      {/* Split-Screen Studio */}
      <main className="workspace-split-studio">
        {/* Panel 01: Whiteboard Canvas */}
        <div className="ws-panel panel-canvas">
          <div className="ws-panel-header">
            <div className="ws-panel-title">
              <span className="ws-badge">01</span>
              <h2>Collaborative Whiteboard</h2>
            </div>
            <div className="ws-canvas-controls">
              <div className="palette">
                {['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                  <button
                    key={c}
                    className={`palette-color ${penColor === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setPenColor(c)}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <button className="btn-ws-sm" onClick={clearCanvas}>Clear</button>
            </div>
          </div>

          <div className="ws-canvas-stage">
            <canvas
              ref={canvasRef}
              className="ws-canvas-element"
              onMouseDown={handleStartDraw}
              onMouseMove={handleDraw}
              onMouseUp={handleStopDraw}
              onMouseLeave={handleStopDraw}
            />
            <div className="ws-canvas-footer-tip">
              <span>Interactive HTML5 Canvas · Konva & Yjs multi-cursor synchronization arriving in Week 2</span>
            </div>
          </div>
        </div>

        {/* Panel 02: Code Editor */}
        <div className="ws-panel panel-editor">
          <div className="ws-panel-header">
            <div className="ws-panel-title">
              <span className="ws-badge">02</span>
              <h2>Collaborative Code Editor</h2>
            </div>
            <div className="editor-status-chip">
              JavaScript · Monaco Ready
            </div>
          </div>

          <div className="ws-editor-body">
            <textarea
              className="ws-code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="ws-editor-footer">
            <span>Yjs text buffer & Monaco multi-user cursor decorators arriving in Week 3</span>
          </div>
        </div>
      </main>

      <footer className="workspace-footer">
        <span>SyncSpace · Advanced MERN Engineering · Week 1 Foundation</span>
      </footer>
    </div>
  );
}
