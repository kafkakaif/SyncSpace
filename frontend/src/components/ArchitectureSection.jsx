import React, { useState } from 'react';

const ARCH_LAYERS = [
  {
    id: 'frontend',
    name: 'Frontend Client Layer',
    badge: 'React 19 + Vite',
    tagline: 'Split-Screen Canvas & Code Studio',
    details: [
      'React-Konva high-efficiency HTML5 canvas rendering vector strokes at 60 FPS',
      'Monaco Editor embedded with language syntax parsers & multiplayer cursor decorators',
      'Socket.io Client managing persistent bidirectional WebSocket connections',
      'Local state buffering for zero-lag optimistic UI updates'
    ],
    tech: ['React 19', 'Vite 8', 'Socket.io-client', 'Konva.js', 'Monaco Editor'],
    accent: '#8b5cf6'
  },
  {
    id: 'gateway',
    name: 'Real-Time Transport Gateway',
    badge: 'Node.js + Express + Socket.io',
    tagline: 'Isolated WebSocket Room Routing',
    details: [
      'Socket.io Rooms namespace: room-based pub/sub message propagation',
      'Strict input validation & error dispatch preventing injection or invalid room IDs',
      'Automatic client reconnection, ping/pong heartbeats, and peer disconnection tracking',
      'CORS-protected HTTP API & Health-check endpoints'
    ],
    tech: ['Node.js', 'Express', 'Socket.io', 'CORS', 'Dotenv'],
    accent: '#06b6d4'
  },
  {
    id: 'crdt',
    name: 'Synchronization & Awareness Engine',
    badge: 'Yjs CRDT',
    tagline: 'Conflict-Free Document State Convergence',
    details: [
      'Mathematically proven CRDT (Conflict-free Replicated Data Types)',
      'Sub-50ms peer-to-peer sync with binary encoded delta updates',
      'Awareness protocol tracking remote cursor positions, selections, and user tags',
      'Deterministic convergence: any order of received edits results in identical state'
    ],
    tech: ['Yjs', 'y-websocket', 'y-monaco', 'Binary Delta Encoders'],
    accent: '#10b981'
  },
  {
    id: 'storage',
    name: 'Persistence & Recovery Store',
    badge: 'MongoDB Database',
    tagline: 'Session History & State Restoration',
    details: [
      'Document snapshots stored in binary-safe BSON format for instant hydration',
      'Room session metadata: timestamps, active participants, invite tokens',
      'Timeline audit trail enabling historical rewind and session replay',
      'Resilient crash recovery restoring active canvases upon server reboot'
    ],
    tech: ['MongoDB', 'Mongoose', 'BSON Binary Buffer', 'JWT Auth'],
    accent: '#f59e0b'
  }
];

export default function ArchitectureSection() {
  const [selectedLayerId, setSelectedLayerId] = useState('frontend');
  const activeLayer = ARCH_LAYERS.find(l => l.id === selectedLayerId) || ARCH_LAYERS[0];

  return (
    <section id="architecture" className="architecture-section">
      <div className="section-header-centered">
        <div className="section-pill">System Architecture</div>
        <h2 className="section-title">Engineered for Low-Latency Resilience</h2>
        <p className="section-subtitle">
          Explore the multi-tier real-time pipeline powering SyncSpace. Click any layer below to inspect its protocols and guarantees.
        </p>
      </div>

      <div className="architecture-container">
        {/* Left: Interactive Diagram Pipeline */}
        <div className="architecture-diagram">
          {ARCH_LAYERS.map((layer, index) => {
            const isSelected = layer.id === selectedLayerId;
            return (
              <React.Fragment key={layer.id}>
                <div
                  className={`arch-layer-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedLayerId(layer.id)}
                  style={{
                    borderColor: isSelected ? layer.accent : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isSelected ? `0 0 25px ${layer.accent}33` : 'none'
                  }}
                >
                  <div className="arch-layer-header">
                    <span className="arch-step-badge" style={{ backgroundColor: `${layer.accent}22`, color: layer.accent }}>
                      0{index + 1}
                    </span>
                    <span className="arch-pill-badge">{layer.badge}</span>
                  </div>
                  <h4 className="arch-layer-name">{layer.name}</h4>
                  <p className="arch-layer-sub">{layer.tagline}</p>
                </div>

                {index < ARCH_LAYERS.length - 1 && (
                  <div className="arch-connector">
                    <div className="connector-line"></div>
                    <div className="connector-pulse"></div>
                    <span className="connector-label">
                      {index === 0 ? 'WebSocket / Socket.io Events' : index === 1 ? 'CRDT Binary Deltas' : 'BSON Persistence'}
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Detailed Deep Dive Pane */}
        <div className="architecture-details-panel">
          <div className="details-header" style={{ borderLeftColor: activeLayer.accent }}>
            <span className="details-eyebrow" style={{ color: activeLayer.accent }}>Deep Dive Analysis</span>
            <h3 className="details-title">{activeLayer.name}</h3>
            <p className="details-tagline">{activeLayer.tagline}</p>
          </div>

          <div className="details-content-block">
            <h4 className="content-heading">Engineering Highlights & Guarantees:</h4>
            <ul className="details-list">
              {activeLayer.details.map((item, idx) => (
                <li key={idx} className="details-list-item">
                  <span className="check-bullet" style={{ color: activeLayer.accent }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="tech-chips-block">
            <h4 className="content-heading">Core Technologies:</h4>
            <div className="chips-container">
              {activeLayer.tech.map((t, idx) => (
                <span key={idx} className="tech-chip" style={{ borderColor: `${activeLayer.accent}44` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
