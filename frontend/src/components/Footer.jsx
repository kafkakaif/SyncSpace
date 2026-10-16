import React from 'react';

export default function Footer({ onOpenWorkspace }) {
  return (
    <footer className="landing-footer">
      {/* Top CTA Banner */}
      <div className="footer-cta-container">
        <div className="footer-cta-card">
          <div className="cta-glow-bg"></div>
          <div className="cta-content">
            <span className="cta-pill">Get Started In Seconds</span>
            <h2 className="cta-heading">Ready to Experience Real-Time Engineering Collaboration?</h2>
            <p className="cta-sub">
              Create an isolated room and invite your teammates to test synchronous whiteboard drawing and live code editing.
            </p>
            <div className="cta-actions">
              <button className="btn-cta-launch" onClick={onOpenWorkspace}>
                <span>Launch SyncSpace Studio</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="footer-main-bar">
        <div className="footer-grid footer-grid-three">
          <div className="footer-col footer-col-brand">
            <div className="footer-brand-logo">
              <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="brand-name">Sync<span className="brand-highlight">Space</span></span>
            </div>
            <p className="footer-tagline">
              Turning separate engineering tools into one shared, real-time visual and code workspace.
            </p>
            <div className="footer-track-badge">
              Axlero Advanced MERN Engineering Track
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-link-list">
              <li><a href="#features">Core Features</a></li>
              <li><a href="#playground">Interactive Demo</a></li>
              <li><a href="#architecture">System Architecture</a></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Architecture & Engine</h4>
            <ul className="footer-link-list">
              <li><a href="#architecture">Socket.io Transport</a></li>
              <li><a href="#architecture">Yjs CRDT Engine</a></li>
              <li><a href="#architecture">Konva Canvas</a></li>
              <li><a href="#architecture">Monaco Code Editor</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p className="footer-copy">
            © 2026 SyncSpace · Developed with React 19, Socket.io, Node.js & Vite.
          </p>
          <div className="footer-extra-links">
            <button className="footer-link-btn" onClick={onOpenWorkspace}>Open Studio</button>
            <a href="#playground" className="footer-link-btn">Demo Canvas</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
