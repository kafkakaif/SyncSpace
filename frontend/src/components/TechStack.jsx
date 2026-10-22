import { useState } from 'react';

const TECH_ITEMS = [
  { name: 'React 19', role: 'Component UI & State', tag: 'Frontend', logo: '⚛️' },
  { name: 'Vite 8', role: 'Instant HMR & Bundling', tag: 'Tooling', logo: '⚡' },
  { name: 'Socket.io', role: 'WebSocket Transport & Rooms', tag: 'Real-Time', logo: '🔌' },
  { name: 'Node.js & Express', role: 'API Server & Sockets Host', tag: 'Backend', logo: '🟢' },
  { name: 'Yjs CRDT', role: 'State Convergence & Cursors', tag: 'Sync Engine', logo: '🧩' },
  { name: 'Konva.js', role: '60 FPS 2D Canvas Drawing', tag: 'Whiteboard', logo: '🎨' },
  { name: 'Monaco Editor', role: 'Multiplayer Code Editor', tag: 'Code', logo: '💻' },
  { name: 'MongoDB', role: 'BSON Snapshot Document Store', tag: 'Database', logo: '🍃' }
];

export default function TechStack() {
  const [pingResult, setPingResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const testBackendHealth = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('http://localhost:5000/health');
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setPingResult({
          success: true,
          status: res.status,
          latency: `${latency}ms`,
          data
        });
      } else {
        setPingResult({
          success: false,
          status: res.status,
          latency: `${latency}ms`,
          error: `HTTP ${res.status}: Unexpected response`
        });
      }
    } catch {
      setPingResult({
        success: false,
        status: 'Offline',
        latency: 'N/A',
        error: 'Backend is not running on port 5000. Start with: cd backend && npm run dev'
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <section id="tech-stack" className="tech-stack-section">
      <div className="section-header-centered">
        <div className="section-pill">Technology Stack</div>
        <h2 className="section-title">Industry-Grade Architecture</h2>
        <p className="section-subtitle">
          Built with an enterprise-ready tech stack designed specifically for distributed, real-time collaboration.
        </p>
      </div>

      <div className="tech-grid">
        {TECH_ITEMS.map((item, idx) => (
          <div key={idx} className="tech-item-card">
            <div className="tech-item-top">
              <span className="tech-logo">{item.logo}</span>
              <span className="tech-tag">{item.tag}</span>
            </div>
            <h4 className="tech-name">{item.name}</h4>
            <p className="tech-role">{item.role}</p>
          </div>
        ))}
      </div>

      {/* Live Backend Diagnostic Console */}
      <div className="system-health-console">
        <div className="console-header">
          <div className="console-title">
            <span className="terminal-dot red"></span>
            <span className="terminal-dot yellow"></span>
            <span className="terminal-dot green"></span>
            <span className="console-heading-text">Live Server Health Probe (http://localhost:5000/health)</span>
          </div>
          <button 
            className="btn-ping-probe" 
            onClick={testBackendHealth}
            disabled={isPinging}
          >
            {isPinging ? 'Pinging...' : '⚡ Probe Health Endpoint'}
          </button>
        </div>

        <div className="console-body">
          {pingResult ? (
            <div className="probe-result">
              <div className="probe-row">
                <span className="probe-label">Status:</span>
                <span className={`probe-val ${pingResult.success ? 'val-success' : 'val-error'}`}>
                  {pingResult.success ? `● 200 OK (${pingResult.latency})` : `▲ ${pingResult.status}`}
                </span>
              </div>
              <div className="probe-row">
                <span className="probe-label">Response:</span>
                <pre className="probe-json">
                  {JSON.stringify(pingResult.data || { error: pingResult.error }, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="console-placeholder-text">
              Click &quot;Probe Health Endpoint&quot; to test your local Express backend server connection and latency in real time.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
