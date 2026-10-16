import React, { useState } from 'react';

const RANDOM_ROOMS = [
  'infra-sprint-9',
  'api-design-core',
  'frontend-guild',
  'sys-arch-alpha',
  'sync-session-42',
  'distributed-team',
  'quantum-relay'
];

export default function Hero({ onJoinRoom }) {
  const [roomIdInput, setRoomIdInput] = useState('design-room-1');

  const generateRandomRoom = () => {
    const randomName = RANDOM_ROOMS[Math.floor(Math.random() * RANDOM_ROOMS.length)];
    const uniqueNumber = Math.floor(100 + Math.random() * 900);
    setRoomIdInput(`${randomName}-${uniqueNumber}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomIdInput.trim()) {
      onJoinRoom(roomIdInput.trim());
    }
  };

  return (
    <section className="hero-section">
      {/* Background radial spotlights */}
      <div className="hero-glow-blob hero-glow-purple"></div>
      <div className="hero-glow-blob hero-glow-cyan"></div>

      <div className="hero-content">
        {/* Release Pill */}
        <div className="hero-badge-wrapper">
          <div className="hero-pill-badge">
            <span className="pulse-indicator"></span>
            <span className="badge-text">Week 1 Foundation Active</span>
            <span className="badge-divider">·</span>
            <span className="badge-sub">Bi-directional Socket.io Rooms</span>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="hero-title">
          Where Architecture Meets Code. <br />
          <span className="hero-gradient-text">In Real Time.</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Eliminate disjointed meetings and static screenshots. SyncSpace unites an interactive 
          whiteboard and collaborative code editor into a single synchronized studio for distributed engineering teams.
        </p>

        {/* Quick Launch Control Card */}
        <div className="hero-launch-card">
          <form className="hero-launch-form" onSubmit={handleSubmit}>
            <div className="room-input-container">
              <span className="room-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                </svg>
              </span>
              <input
                id="hero-room-input"
                type="text"
                className="room-text-input"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="Enter Room ID (e.g. system-design)"
                maxLength={60}
              />
              <button
                type="button"
                className="btn-random-room"
                onClick={generateRandomRoom}
                title="Generate Random Room Name"
              >
                🎲 Random
              </button>
            </div>

            <button type="submit" id="hero-join-submit-btn" className="btn-hero-launch">
              <span>Launch Studio Room</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>

          <div className="hero-quick-tips">
            <span>✨ Share room ID with your teammates to sync across browser windows instantly.</span>
          </div>
        </div>

        {/* Key Metrics / Highlights */}
        <div className="hero-metrics-grid">
          <div className="metric-item">
            <span className="metric-value">&lt; 50ms</span>
            <span className="metric-label">Socket Event Latency</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-value">Zero Collisions</span>
            <span className="metric-label">Yjs CRDT Conflict Resolver</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-value">Isolated</span>
            <span className="metric-label">Multi-Tenant Room Security</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-value">Dual-Pane</span>
            <span className="metric-label">Canvas & Monaco Synced</span>
          </div>
        </div>
      </div>
    </section>
  );
}
