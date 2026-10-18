import React, { useState, useRef, useEffect } from 'react';

const CODE_SNIPPETS = {
  'server.js': `// SyncSpace Socket.io Gateway
const io = new Server(server, {
  cors: { origin: ["http://localhost:3000", "http://localhost:5173"] }
});

io.on("connection", (socket) => {
  // Join isolated room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.emit("room-joined", { roomId });
    socket.to(roomId).emit("user-entered", { id: socket.id });
    console.log(\`\${socket.id} joined \${roomId}\`);
  });

  // Relay whiteboard draw vectors
  socket.on("draw-stroke", ({ roomId, stroke }) => {
    socket.to(roomId).emit("remote-stroke", stroke);
  });
});`,
  'crdt-sync.ts': `import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export const initSyncDoc = (roomId: string) => {
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(
    'ws://localhost:5000/yjs',
    roomId,
    ydoc
  );

  const sharedCode = ydoc.getText('monaco-buffer');
  const sharedCanvas = ydoc.getArray('shapes');

  // Awareness (multi-cursor positions)
  provider.awareness.setLocalStateField('user', {
    name: 'DevLead',
    color: '#8b5cf6'
  });

  return { ydoc, provider, sharedCode, sharedCanvas };
};`,
  'whiteboard.jsx': `// Konva Canvas Collaboration Hook
import { Stage, Layer, Line, Rect } from 'react-konva';

export function SyncCanvas({ strokes, onDrawEnd }) {
  return (
    <Stage width={600} height={400}>
      <Layer>
        {strokes.map((stroke, i) => (
          <Line
            key={i}
            points={stroke.points}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            tension={0.5}
            lineCap="round"
          />
        ))}
      </Layer>
    </Stage>
  );
}`
};

export default function InteractivePlayground({ onLaunchRoom }) {
  // Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#8b5cf6');
  const [brushWidth, setBrushWidth] = useState(3);
  const [drawnCount, setDrawnCount] = useState(0);

  // Code Editor State
  const [activeTab, setActiveTab] = useState('server.js');
  const [codeContent, setCodeContent] = useState(CODE_SNIPPETS['server.js']);
  const [consoleOutput, setConsoleOutput] = useState('System ready. Try editing code or drawing on the canvas!');
  const [isRunning, setIsRunning] = useState(false);

  // Initialize and handle Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial canvas illustration
    drawInitialDemo(ctx, rect.width, rect.height);
  }, []);

  const drawInitialDemo = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);

    // Grid dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 15; x < w; x += 25) {
      for (let y = 15; y < h; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Architecture diagram demo box: "API Gateway"
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 40, 130, 60);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.fillRect(30, 40, 130, 60);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚡ API Gateway', 42, 65);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(':5000 / Socket.io', 42, 82);

    // Arrow to Service
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.moveTo(160, 70);
    ctx.lineTo(220, 70);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(215, 65);
    ctx.lineTo(225, 70);
    ctx.lineTo(215, 75);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Box: "Yjs CRDT Engine"
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(230, 40, 140, 60);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fillRect(230, 40, 140, 60);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🔄 Yjs CRDT Engine', 242, 65);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('Sync & Awareness', 242, 82);

    // Arrow to Database
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.moveTo(300, 100);
    ctx.lineTo(300, 160);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(295, 155);
    ctx.lineTo(300, 165);
    ctx.lineTo(305, 155);
    ctx.fillStyle = '#10b981';
    ctx.fill();

    // Cylinder: "MongoDB"
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeRect(235, 170, 130, 50);
    ctx.fillRect(235, 170, 130, 50);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('💾 MongoDB Store', 248, 195);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('Doc Snapshots', 248, 210);
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setDrawnCount(prev => prev + 1);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    drawInitialDemo(ctx, rect.width, rect.height);
    setDrawnCount(0);
  };

  const handleTabChange = (filename) => {
    setActiveTab(filename);
    setCodeContent(CODE_SNIPPETS[filename]);
    setConsoleOutput(`Showing the ${filename} example snippet. This preview is not connected to a live room.`);
  };

  const runCodeSimulation = () => {
    setIsRunning(true);
    setConsoleOutput('Preview only: open a studio room to test real-time room synchronization.');
    setTimeout(() => setIsRunning(false), 350);
  };

  return (
    <section id="playground" className="playground-section">
      <div className="section-header-centered">
        <div className="section-pill">Interactive Demo</div>
        <h2 className="section-title">A shared workspace for ideas and code</h2>
        <p className="section-subtitle">
          This is an interactive local preview of the workspace. Sketch on the canvas or edit sample code; open a studio room to test connected collaboration.
        </p>
      </div>

      <div className="playground-container">
        {/* Top Control Bar with mock presence */}
        <div className="playground-topbar">
          <div className="studio-tabs">
            <span className="room-indicator">
              <span className="live-dot"></span>
              Preview room: <strong>#sprint-planning-alpha</strong>
            </span>
            <span className="connection-speed">Interactive preview</span>
          </div>

          <div className="active-collaborators">
            <div className="avatar-chip avatar-alex" title="Sample participant">
              <span className="avatar-initials">AL</span>
              <span className="avatar-name">Alex</span>
            </div>
            <div className="avatar-chip avatar-sarah" title="Teammate preview">
              <span className="avatar-initials">SR</span>
              <span className="avatar-name">Teammate preview</span>
            </div>
            <div className="avatar-chip avatar-you" title="You in preview">
              <span className="avatar-initials">YOU</span>
            </div>
            <button 
              className="btn-enter-live-room"
              onClick={() => onLaunchRoom('sprint-planning-alpha')}
            >
              Enter Live Room
            </button>
          </div>
        </div>

        {/* Split Studio Body */}
        <div className="studio-grid">
          {/* Left Canvas Studio */}
          <div className="studio-panel panel-whiteboard">
            <div className="panel-header-bar">
              <div className="panel-title-group">
                <span className="panel-badge">01</span>
                <h3>Collaborative Canvas</h3>
              </div>
              <div className="canvas-tools">
                <div className="color-swatches">
                  {['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                    <button
                      key={c}
                      className={`color-dot ${brushColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setBrushColor(c)}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
                <button className="btn-canvas-action" onClick={clearCanvas}>
                  Reset
                </button>
              </div>
            </div>

            <div className="canvas-viewport-wrapper">
              <canvas
                ref={canvasRef}
                className="interactive-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />

              {/* Floating simulated remote cursor */}
              <div className="simulated-cursor cursor-sarah">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#06b6d4">
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>
                <span className="cursor-label" style={{ backgroundColor: '#06b6d4' }}>
                  Teammate preview
                </span>
              </div>

              <div className="canvas-hint">
                ✏️ Click & drag to draw on this live interactive canvas!
              </div>
            </div>
          </div>

          {/* Right Monaco Code Studio */}
          <div className="studio-panel panel-editor">
            <div className="panel-header-bar">
              <div className="editor-file-tabs">
                {Object.keys(CODE_SNIPPETS).map(fn => (
                  <button
                    key={fn}
                    className={`editor-tab ${activeTab === fn ? 'active' : ''}`}
                    onClick={() => handleTabChange(fn)}
                  >
                    <span className="tab-icon">{fn.endsWith('.ts') ? 'TS' : fn.endsWith('.jsx') ? '⚛' : 'JS'}</span>
                    {fn}
                  </button>
                ))}
              </div>
              <button 
                className={`btn-run-code ${isRunning ? 'running' : ''}`}
                onClick={runCodeSimulation}
              >
                {isRunning ? 'Broadcasting...' : '▶ Run preview'}
              </button>
            </div>

            <div className="code-editor-viewport">
              {/* Simulated remote cursor in code */}
              <div className="code-remote-cursor">
                <span className="remote-cursor-line" style={{ borderColor: '#8b5cf6' }}></span>
                <span className="remote-cursor-tag" style={{ backgroundColor: '#8b5cf6' }}>
                  Sample editor
                </span>
              </div>

              <textarea
                className="code-textarea"
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* Console output bar */}
            <div className="editor-console-drawer">
              <span className="console-prompt">&gt;</span>
              <span className="console-text">{consoleOutput}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
