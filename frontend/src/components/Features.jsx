import React from 'react';

const FEATURES_DATA = [
  {
    id: 'kanban',
    badge: 'Task Management',
    title: 'Kanban Boards',
    desc: 'Organise work into boards, lists and cards. Move cards with drag and drop to update task status in real time across the whole team.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="5" height="18" rx="1.5" />
        <rect x="10.5" y="3" width="5" height="12" rx="1.5" />
        <rect x="18" y="3" width="5" height="15" rx="1.5" />
      </svg>
    ),
    color: '#53C557',
  },
  {
    id: 'chat',
    badge: 'Instant Messaging',
    title: 'Workspace Chat',
    desc: 'Talk with your team inside the workspace. Messages are delivered instantly over WebSockets with zero lag and persistent history.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: '#0E9488',
  },
  {
    id: 'docs',
    badge: 'Live Editor',
    title: 'Shared Documents',
    desc: 'Keep notes, specs and files next to your tasks so context never gets lost. Edit concurrently with conflict-free CRDT synchronization.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: '#23964B',
  },
  {
    id: 'notifications',
    badge: 'Real-Time Alerts',
    title: 'Live Notifications',
    desc: 'Get alerted about assignments, comments and changes without refreshing the page. Stay in flow with instant ambient updates.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    color: '#10B981',
  },
  {
    id: 'team',
    badge: 'Role Management',
    title: 'Team Management',
    desc: 'Invite members to a workspace and manage who can see and edit each board. Seamless permission controls for growing organizations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: '#059669',
  },
  {
    id: 'timeline',
    badge: 'Full Audit Trail',
    title: 'Activity Timeline',
    desc: 'Track who changed what and when, with a clear history of every workspace action. Review previous versions and restore confidence.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    color: '#14B8A6',
  },
];

export default function Features() {
  return (
    <section id="features" className="features-section">
      <div className="section-header-centered">
        <div className="section-pill">Workspace Suite</div>
        <h2 className="section-title">Everything your team needs</h2>
        <p className="section-subtitle">
          Simple tools that work together, so you spend less time switching apps and more time shipping.
        </p>
      </div>

      <div className="features-grid">
        {FEATURES_DATA.map((feat) => (
          <div key={feat.id} className="feature-card">
            <div
              className="feature-card-glow"
              style={{
                background: `radial-gradient(circle at 30% 20%, ${feat.color}22, transparent 70%)`,
              }}
            ></div>
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
            <span
              className="feature-pill-badge"
              style={{ color: feat.color, backgroundColor: `${feat.color}18` }}
            >
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
