import { useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All Capabilities' },
  { id: 'canvas', label: 'Canvas & Whiteboard' },
  { id: 'code', label: 'Code & CRDT' },
  { id: 'infra', label: 'Real-Time & Security' },
];

const FEATURES_DATA = [
  {
    id: 'whiteboard',
    category: 'canvas',
    badge: 'Vector Canvas Engine',
    status: 'React-Konva Active',
    title: 'Interactive Whiteboard',
    metric: '4 Vector Tools · Freehand, Shapes & Text',
    desc: 'Hardware-accelerated vector canvas powered by React-Konva. Sketch system architectures with freehand drawing, geometric rectangles, and inline text notes, with full element selection and drag-and-drop repositioning.',
    tech: ['React-Konva', 'HTML5 Canvas', 'Drag & Drop', 'Vector Geometry'],
    color: '#53C557',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    actionText: 'Launch Canvas Studio',
  },
  {
    id: 'crdt',
    category: 'code',
    badge: 'Conflict-Free Sync',
    status: 'Yjs CRDT Engine',
    title: 'Collaborative Code Editor',
    metric: '0 Merge Conflicts · Y.Text State Vectors',
    desc: 'High-concurrency code editing backed by Yjs Conflict-Free Replicated Data Types (CRDTs). Multiple developers can edit simultaneously with state vectors merging keystrokes deterministically without overwriting each other.',
    tech: ['Yjs CRDT', 'Shared Y.Text', 'Monaco Ready', 'State Vectors'],
    color: '#0E9488',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" strokeLinecap="round" />
      </svg>
    ),
    actionText: 'Test Code Editor',
  },
  {
    id: 'transport',
    category: 'infra',
    badge: 'Low-Latency Relay',
    status: 'Sub-50ms Transport',
    title: 'Socket.IO Real-Time Gateway',
    metric: 'Room-Scoped Channels · Event Stream',
    desc: 'High-speed WebSocket event pipeline relaying drawing strokes, cursor coordinates, and code updates across peers. Features dedicated room scoping and automatic reconnect resilience with zero polling overhead.',
    tech: ['Socket.IO', 'WebSockets', 'Room Channels', 'Sub-50ms Relay'],
    color: '#10B981',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    actionText: 'View Gateway Flow',
  },
  {
    id: 'presence',
    category: 'canvas',
    badge: 'Spatial Telemetry',
    status: 'Live Awareness',
    title: 'Presence & Remote Cursors',
    metric: 'Live Coordinates · Color-Coded Peers',
    desc: 'Track where teammates are pointing, sketching, or typing in real time. Remote cursor coordinates are broadcast dynamically with distinct collaborator color tags and online user rosters for seamless awareness.',
    tech: ['Remote Cursors', 'Spatial Awareness', 'Color Tags', 'Peer Roster'],
    color: '#23964B',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l7 18 3-7 7-3L3 3z" />
        <circle cx="18" cy="6" r="3" strokeWidth="1.5" />
      </svg>
    ),
    actionText: 'Try Multi-User Demo',
  },
  {
    id: 'persistence',
    category: 'infra',
    badge: 'Cloud Persistence',
    status: 'MongoDB State Store',
    title: 'Serialized Room Persistence',
    metric: 'Async Queue · WhiteboardState Schema',
    desc: 'Whiteboard drawings and session state are persisted to MongoDB through serialized write queues. Rooms survive page reloads and disconnects, ensuring architectural sketches and workspace data are never lost.',
    tech: ['MongoDB', 'Mongoose Schema', 'Write Queues', 'State Recovery'],
    color: '#059669',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    actionText: 'Inspect Schema',
  },
  {
    id: 'security',
    category: 'infra',
    badge: 'Access Control',
    status: 'JWT & Room Isolation',
    title: 'Isolated Rooms & Auth',
    metric: 'Encrypted Tokens · URL-Based Join',
    desc: 'Strict room isolation guarantees that event broadcasts remain strictly within your room. Token-based JWT authentication secures user accounts and enables instantaneous shareable join links for quick team onboarding.',
    tech: ['JWT Authentication', 'Room Isolation', 'Bcrypt Security', 'Shareable Links'],
    color: '#163A24',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    actionText: 'Create Secure Room',
  },
];

const SUITE_METRICS = [
  { label: 'Conflict-Free Merging', value: '0 Conflicts', hint: 'Yjs CRDT consensus engine' },
  { label: 'Event Transport Latency', value: '< 50ms', hint: 'Room-scoped Socket.IO stream' },
  { label: 'Whiteboard Vector Tools', value: '4 Tools', hint: 'Pen, Rect, Text & Selection' },
  { label: 'Session Persistence', value: 'MongoDB', hint: 'Serialized state write queue' },
];

export default function Features({ onOpenWorkspace }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFeatures =
    selectedCategory === 'all'
      ? FEATURES_DATA
      : FEATURES_DATA.filter((feat) => feat.category === selectedCategory);

  const handleAction = (featId) => {
    if (featId === 'transport' || featId === 'persistence') {
      const archElem = document.getElementById('architecture');
      if (archElem) {
        archElem.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (featId === 'presence') {
      const demoElem = document.getElementById('playground');
      if (demoElem) {
        demoElem.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (onOpenWorkspace) {
      onOpenWorkspace();
    }
  };

  return (
    <section id="features" className="features-section">
      <div className="section-header-centered">
        <div className="section-pill">Core Features · Workspace Suite</div>
        <h2 className="section-title">Engineered for Distributed Engineering Teams</h2>
        <p className="section-subtitle">
          A cohesive, full-stack collaboration platform combining real-time canvas sketching, conflict-free
          concurrent coding, and persistent rooms built for high-velocity software engineering.
        </p>

        {/* Category Filter Pills */}
        <div className="features-filter-bar" role="tablist" aria-label="Feature categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat.id}
              className={`filter-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.label}</span>
              <span className="filter-pill-count">
                {cat.id === 'all'
                  ? FEATURES_DATA.length
                  : FEATURES_DATA.filter((f) => f.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="features-grid">
        {filteredFeatures.map((feat) => (
          <div key={feat.id} className="feature-card">
            <div
              className="feature-card-glow"
              style={{
                background: `radial-gradient(circle at 30% 20%, ${feat.color}22, transparent 70%)`,
              }}
            />

            {/* Top Bar: Pill Badge & Status Dot */}
            <div className="feature-card-header">
              <span
                className="feature-pill-badge"
                style={{ color: feat.color, backgroundColor: `${feat.color}15`, borderColor: `${feat.color}35` }}
              >
                {feat.badge}
              </span>
              <div className="feature-status-tag" style={{ color: feat.color }}>
                <span className="status-dot-pulse" style={{ backgroundColor: feat.color }} />
                <span>{feat.status}</span>
              </div>
            </div>

            {/* Icon Wrapper */}
            <div
              className="feature-icon-wrapper"
              style={{
                color: feat.color,
                borderColor: `${feat.color}40`,
                backgroundColor: `${feat.color}15`,
              }}
            >
              {feat.icon}
            </div>

            {/* Title & Technical Metric */}
            <h3 className="feature-title">{feat.title}</h3>
            <div className="feature-metric-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{feat.metric}</span>
            </div>

            {/* Description */}
            <p className="feature-desc">{feat.desc}</p>

            {/* Tech Tags Row */}
            <div className="feature-tech-tags">
              {feat.tech.map((t, idx) => (
                <span key={idx} className="tech-tag-chip">
                  {t}
                </span>
              ))}
            </div>

            {/* Card Action Link */}
            <div className="feature-card-footer">
              <button
                type="button"
                className="feature-action-link"
                style={{ color: feat.color }}
                onClick={() => handleAction(feat.id)}
              >
                <span>{feat.actionText}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Engineering Suite Metrics Banner */}
      <div className="features-metrics-summary">
        <div className="metrics-summary-grid">
          {SUITE_METRICS.map((m, idx) => (
            <div key={idx} className="metrics-summary-item">
              <div className="metrics-summary-val">{m.value}</div>
              <div className="metrics-summary-label">{m.label}</div>
              <div className="metrics-summary-hint">{m.hint}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
