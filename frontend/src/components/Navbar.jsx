import React, { useState, useEffect } from 'react';

export default function Navbar({ onOpenWorkspace }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="#" className="navbar-brand" aria-label="SyncSpace Home">
          <div className="brand-logo-glow">
            <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="brand-name">Sync<span className="brand-highlight">Space</span></span>
        </a>

        {/* Desktop Nav Links */}
        <nav className="nav-links" aria-label="Main Navigation">
          <a href="#features" className="nav-link">Features</a>
          <a href="#playground" className="nav-link">Live Demo</a>
          <a href="#architecture" className="nav-link">Architecture</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          <button 
            id="nav-launch-btn"
            className="btn-launch-primary"
            onClick={() => onOpenWorkspace()}
          >
            <span>Open SyncSpace</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          {/* Mobile hamburger button */}
          <button 
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            <span className={`bar ${mobileMenuOpen ? 'open-1' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open-2' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open-3' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#playground" onClick={() => setMobileMenuOpen(false)}>Live Demo</a>
          <a href="#architecture" onClick={() => setMobileMenuOpen(false)}>Architecture</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <div className="mobile-menu-footer">
            <button 
              className="btn-launch-primary full-width"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWorkspace();
              }}
            >
              Open SyncSpace Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
