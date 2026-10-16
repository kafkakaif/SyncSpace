import React from 'react';

const FEATURES_DATA = [
  {
    id: 'f1',
    badge: 'Real-Time Sync',
    title: 'Dual-Pane Engineering Studio',
    desc: 'Unify visual whiteboard diagramming with concurrent code editing. Stop toggling between Miro, Zoom, and VS Code during system design reviews.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 12h16M12 4v16" />
      </svg>
    ),
    color: '#8b5cf6'
  },
  {
    id: 'f2',
    badge: 'Socket.io Transport',
    title: 'Room Isolation & Presence',
    desc: 'Engineered with isolated WebSocket room channels. Room state, participant joined/left broadcasts, and drawing coordinates never leak across sessions.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: '#06b6d4'
  },
  {
    id: 'f3',
    badge: 'CRDT Core',
    title: 'Conflict-Free Yjs Synchronization',
    desc: 'Guaranteed convergence for multi-developer typing and concurrent drawing strokes. Zero overwrite bugs, sub-50ms sync, and offline reconciliation.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: '#10b981'
  },
  {
    id: 'f4',
    badge: 'Konva Canvas',
    title: 'High-Performance Whiteboard',
    desc: 'Smooth 60 FPS vector rendering with Konva.js. Draw architectural blocks, microservice dataflows, sticky notes, and freehand annotations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    color: '#f59e0b'
  },
  {
    id: 'f5',
    badge: 'Monaco Engine',
    title: 'Multiplayer Code Editor',
    desc: 'Full VS Code experience in the browser with language syntax support, code folding, bracket matching, and colored real-time multi-peer cursor flags.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    color: '#ec4899'
  },
  {
    id: 'f6',
    badge: 'MongoDB Store',
    title: 'Session Replay & Recovery',
    desc: 'Binary-safe delta document snapshots stored in MongoDB. Reconnect seamlessly after network dips or review the architectural timeline with scrub replay.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#8b5cf6'
  }
];

export default function Features() {
  return (
    <section id="features" className="features-section">
      <div className="section-header-centered">
        <div className="section-pill">Core Capabilities</div>
        <h2 className="section-title">Built for Modern Distributed Teams</h2>
        <p className="section-subtitle">
          Everything an engineering team needs to brainstorm, review pull requests, diagram infrastructure, and pair-program in real time.
        </p>
      </div>

      <div className="features-grid">
        {FEATURES_DATA.map((feat) => (
          <div key={feat.id} className="feature-card">
            <div className="feature-card-glow" style={{ background: `radial-gradient(circle at 30% 20%, ${feat.color}22, transparent 70%)` }}></div>
            <div className="feature-icon-wrapper" style={{ color: feat.color, borderColor: `${feat.color}40`, backgroundColor: `${feat.color}15` }}>
              {feat.icon}
            </div>
            <span className="feature-pill-badge" style={{ color: feat.color, backgroundColor: `${feat.color}18` }}>
              {feat.badge}
            </span>
            <h3 className="feature-title">{feat.title}</h3>
            <p className="feature-desc">{feat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
