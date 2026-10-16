import React from 'react';

const ROADMAP_STEPS = [
  {
    week: 'Week 1',
    status: 'COMPLETED & LIVE',
    statusType: 'live',
    title: 'Foundation & Isolated Rooms',
    description: 'Shared Express & Socket.io server, health-check endpoint, room create/join/leave event validation, and dual split-screen workspace shell.',
    deliverables: [
      'Independent frontend & backend services',
      'Socket.io room isolation & multi-client join/leave events',
      'Live server connection indicators & error alerts',
      'Two-pane studio foundation'
    ],
    accent: '#10b981'
  },
  {
    week: 'Week 2',
    status: 'IN PROGRESS',
    statusType: 'current',
    title: 'Yjs Awareness & Whiteboard Canvas',
    description: 'Real-time multi-peer cursor positioning, participant presence badges, and Konva.js vector drawing tools with synchronized state.',
    deliverables: [
      'Yjs awareness provider with user name & color tagging',
      'Konva freehand lines, rectangles, system nodes, and text',
      'Remote cursor trail rendering across peer screens',
      'Mid-project synchronization latency audit'
    ],
    accent: '#8b5cf6'
  },
  {
    week: 'Week 3',
    status: 'UPCOMING',
    statusType: 'planned',
    title: 'MongoDB Persistence & Monaco Editor',
    description: 'Full Monaco code editor binding via Yjs text types, alongside MongoDB binary-safe document snapshot storage for instant session recovery.',
    deliverables: [
      'Monaco Editor with multi-cursor collaborative editing',
      'MongoDB session metadata & binary snapshot persistence',
      'Disconnection resilience & auto-reconnect reconciliation',
      'Simultaneous multi-user merge stress tests'
    ],
    accent: '#06b6d4'
  },
  {
    week: 'Week 4',
    status: 'PLANNED',
    statusType: 'planned',
    title: 'JWT Auth, Session Replay & Polish',
    description: 'Secure invited rooms via JWT authentication, architectural timeline scrub replay, and end-to-end multi-region synchronization benchmarks.',
    deliverables: [
      'JWT user authentication & protected room invites',
      'Session time-travel replay scrubber',
      'Export system architecture drawings to PNG / SVG / JSON',
      'Production deployment pipeline'
    ],
    accent: '#f59e0b'
  }
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="roadmap-section">
      <div className="section-header-centered">
        <div className="section-pill">Development Roadmap</div>
        <h2 className="section-title">The 4-Week Engineering Sprint</h2>
        <p className="section-subtitle">
          Track our progress as we advance from foundational room isolation to production-grade real-time collaboration.
        </p>
      </div>

      <div className="roadmap-timeline">
        {ROADMAP_STEPS.map((step, idx) => (
          <div key={idx} className={`roadmap-step-card ${step.statusType}`}>
            <div className="roadmap-step-header">
              <span className="step-week-tag" style={{ color: step.accent, borderColor: `${step.accent}55` }}>
                {step.week}
              </span>
              <span className={`step-status-badge badge-${step.statusType}`}>
                {step.status === 'COMPLETED & LIVE' && <span className="status-dot-pulse"></span>}
                {step.status}
              </span>
            </div>

            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.description}</p>

            <div className="step-deliverables-box">
              <h4 className="deliverables-heading">Milestone Deliverables:</h4>
              <ul className="deliverables-list">
                {step.deliverables.map((item, dIdx) => (
                  <li key={dIdx}>
                    <span className="deliverable-check" style={{ color: step.accent }}>
                      {step.statusType === 'live' ? '✓' : '•'}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
