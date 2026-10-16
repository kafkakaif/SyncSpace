import React, { useState, useEffect, useRef } from 'react';
import socket from '../services/socket';

export default function SyncSpacePage({ onBackToLanding, initialRoomId = '' }) {
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [activeRoom, setActiveRoom] = useState(initialRoomId || '');
  const [status, setStatus] = useState(socket.connected ? 'Connected' : 'Disconnected');
  const [message, setMessage] = useState('');

  // Interactive Whiteboard Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#8b5cf6');
  const [hasDrawn, setHasDrawn] = useState(false);

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

    // Auto-join initial room if passed
    if (initialRoomId) {
      setTimeout(() => {
        if (socket.connected) {
          socket.emit('join-room', initialRoomId);
        }
      }, 300);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room-joined', onRoomJoined);
      socket.off('room-left', onRoomLeft);
      socket.off('room-error', onRoomError);
    };
  }, [initialRoomId]);

  // Setup interactive canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial dot grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let x = 15; x < rect.width; x += 25) {
      for (let y = 15; y < rect.height; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    setIsDrawing(true);
    setHasDrawn(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);

    // Redraw grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let x = 15; x < rect.width; x += 25) {
      for (let y = 15; y < rect.height; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const joinRoom = () => {
    const trimmedRoomId = roomId.trim();

    if (!trimmedRoomId) {
      setMessage('Please enter a room ID.');
      return;
    }

    if (!socket.connected) {
      setMessage('Connecting to server. Please try again.');
      return;
    }

    socket.emit('join-room', trimmedRoomId);
  };

  const leaveRoom = () => {
    if (activeRoom) {
      socket.emit('leave-room', activeRoom);
    }
  };

  return (
    <div className="syncspace-page-wrapper">
      {/* Top Navigation bar returning to Landing Page */}
      <nav className="syncspace-top-nav">
        <button 
          id="btn-return-landing" 
          className="btn-back-landing" 
          onClick={onBackToLanding}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>← Back to Landing Page</span>
        </button>

        <div className="nav-center-info">
          <span className="room-status-indicator">
            {activeRoom ? `Connected Room: ${activeRoom}` : 'No Room Joined'}
          </span>
        </div>

        <div className="nav-quick-actions">
          <button 
            className="btn-chip"
            onClick={() => {
              setRoomId('team-room');
              if (socket.connected) socket.emit('join-room', 'team-room');
            }}
          >
            #team-room
          </button>
          <button 
            className="btn-chip"
            onClick={() => {
              setRoomId('design-lab');
              if (socket.connected) socket.emit('join-room', 'design-lab');
            }}
          >
            #design-lab
          </button>
        </div>
      </nav>

      {/* Main Workspace (Week 1 Foundation) */}
      <main className="app">
        <header className="topbar">
          <div>
            <h1>SyncSpace</h1>
            <p>Real-time collaborative workspace</p>
          </div>
          <span className={`status ${socket.connected ? 'online' : ''}`}>
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
          <button id="syncspace-join-btn" onClick={joinRoom}>Join Room</button>
          <button id="syncspace-leave-btn" className="secondary" onClick={leaveRoom} disabled={!activeRoom}>
            Leave Room
          </button>
          <span className="active-room">
            {activeRoom ? `Room: ${activeRoom}` : 'No room joined'}
          </span>
        </section>

        {message && <p className="message">{message}</p>}

        <section className="workspace">
          {/* Panel 01: Whiteboard Canvas */}
          <div className="panel">
            <div className="panel-heading">
              <div className="panel-heading-left">
                <span>01</span>
                <h2>Whiteboard</h2>
              </div>
              <div className="panel-tools">
                <div className="color-picker-mini">
                  {['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                    <button
                      key={c}
                      className={`mini-color ${strokeColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setStrokeColor(c)}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
                {hasDrawn && (
                  <button className="btn-mini-clear" onClick={clearCanvas}>Clear</button>
                )}
              </div>
            </div>

            <div className="canvas-container-box">
              <canvas
                ref={canvasRef}
                className="synced-canvas-element"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="placeholder">
                <span className="placeholder-icon">✏️</span>
                <h3>Collaborative Canvas</h3>
                <p>Drawing tools will be added in Week 2. (Click & drag above to test drawing!)</p>
              </div>
            </div>
          </div>

          {/* Panel 02: Code Editor */}
          <div className="panel">
            <div className="panel-heading">
              <span>02</span>
              <h2>Code Editor</h2>
            </div>
            <div className="code-placeholder">
              <div className="code-toolbar">JavaScript · Preview</div>
              <pre>
                <code>{`// Welcome to SyncSpace
// Room: ${activeRoom || 'None (Join a room above)'}

function collaborate() {
  // Monaco Editor arrives in Week 3
  console.log("Real-time collaborative code synchronization active");
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        <footer>SyncSpace · Axlero · Week 1</footer>
      </main>
    </div>
  );
}
