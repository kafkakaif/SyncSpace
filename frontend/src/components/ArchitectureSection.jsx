import React, { useState } from 'react';

const ARCH_LAYERS = [
  {
    id: 'frontend',
    name: 'Frontend Client Layer',
    badge: 'React + Vite',
    tagline: 'Canvas and code editor interface',
    details: [
      'React components render the landing page and collaboration workspace',
      'Native HTML canvas handles local and incoming freehand drawing segments',
      'A lightweight textarea provides the current shared code editing experience',
      'Socket.IO client sends and receives room-scoped collaboration events'
    ],
    tech: ['React', 'Vite', 'HTML Canvas', 'Socket.IO Client'],
    accent: '#53C557'
  },
  {
    id: 'gateway',
    name: 'Real-Time Transport Gateway',
    badge: 'Node.js + Express + Socket.IO',
    tagline: 'Room-scoped event delivery',
    details: [
      'Socket.IO rooms route drawing and code updates to connected peers',
      'Room IDs are validated before joining',
      'HTTP health endpoint reports that the backend is running',
      'CORS is configured for local frontend development origins'
    ],
    tech: ['Node.js', 'Express', 'Socket.IO', 'CORS', 'Dotenv'],
    accent: '#0E9488'
  },
  {
    id: 'crdt',
    name: 'Collaboration Improvements',
    badge: 'Planned next',
    tagline: 'Conflict-free editing and presence',
    details: [
      'Yjs can provide shared document structures for concurrent edits',
      'Awareness can represent collaborator presence and cursor positions',
      'The current code editor broadcasts full text updates and can overwrite simultaneous edits',
      'These capabilities should be integrated and tested before being advertised as available'
    ],
    tech: ['Planned: Yjs', 'Planned: Awareness', 'Planned: Monaco binding'],
    accent: '#23964B'
  },
  {
    id: 'storage',
    name: 'Persistence & Recovery',
    badge: 'Planned next',
    tagline: 'Save and restore shared work',
    details: [
      'Database persistence is not connected in the current implementation',
      'A future store could save shared code and drawing state per room',
      'Room access control and user authentication still need implementation',
      'Saved snapshots could enable recovery after refresh or server restart'
    ],
    tech: ['Planned: MongoDB', 'Planned: Mongoose', 'Planned: Authentication'],
    accent: '#10B981'
  }
];

export default function ArchitectureSection() {
  const [selectedLayerId, setSelectedLayerId] = useState('frontend');
  const activeLayer = ARCH_LAYERS.find(l => l.id === selectedLayerId) || ARCH_LAYERS[0];

  return (
    <section id="architecture" className="architecture-section">
      <div className="section-header-centered">
        <div className="section-pill">System Architecture</div>
        <h2 className="section-title">A clear path from UI to collaboration</h2>
        <p className="section-subtitle">
          Explore the current frontend and Socket.IO backend, plus planned improvements for conflict-free editing and persistence.
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
                    borderColor: isSelected ? layer.accent : '#e8efe9',
                    boxShadow: isSelected ? `0 8px 25px ${layer.accent}25` : 'none'
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
                      {index === 0 ? 'Socket.IO events' : index === 1 ? 'Planned: Yjs' : 'Planned: persistence'}
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
            <h4 className="content-heading">Current implementation and roadmap:</h4>
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
