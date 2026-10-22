import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  onOpenWorkspace,
  onNavigateToSignIn,
  onNavigateToSignUp,
  onNavigateToHome,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    toast.info('Signed out successfully.');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a
          href="#"
          className="navbar-brand"
          aria-label="SyncSpace Home"
          onClick={(e) => {
            if (onNavigateToHome) {
              e.preventDefault();
              onNavigateToHome();
            }
          }}
        >
          <div className="brand-logo-glow">
            <svg
              className="brand-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
          </div>
          <span className="brand-name">
            Sync<span className="brand-highlight">Space</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <nav className="nav-links" aria-label="Main Navigation">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#playground" className="nav-link">Live Demo</a>
          <a href="#architecture" className="nav-link">Architecture</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-user-wrapper" ref={userMenuRef}>
              <button
                type="button"
                className="nav-user-pill"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="nav-user-avatar">
                  {user?.avatar || getInitials(user?.name)}
                </div>
                <span className="nav-user-name">{user?.name}</span>
                <svg
                  className={`nav-user-chevron ${userMenuOpen ? 'open' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="nav-user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar">
                      {user?.avatar || getInitials(user?.name)}
                    </div>
                    <div className="user-dropdown-info">
                      <div className="user-dropdown-name">{user?.name}</div>
                      <div className="user-dropdown-email">{user?.email}</div>
                    </div>
                  </div>

                  <div className="user-dropdown-divider" />

                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenWorkspace();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>Launch Workspace</span>
                  </button>

                  <button
                    type="button"
                    className="user-dropdown-item item-danger"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <button
                type="button"
                id="nav-signin-btn"
                className="btn-nav-signin"
                onClick={() => {
                  if (onNavigateToSignIn) onNavigateToSignIn();
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                id="nav-signup-btn"
                className="btn-nav-signup"
                onClick={() => {
                  if (onNavigateToSignUp) onNavigateToSignUp();
                }}
              >
                Sign Up
              </button>
            </div>
          )}

          <button
            id="nav-launch-btn"
            type="button"
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
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#playground" onClick={() => setMobileMenuOpen(false)}>Live Demo</a>
          <a href="#architecture" onClick={() => setMobileMenuOpen(false)}>Architecture</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>

          <div className="mobile-menu-footer">
            {isAuthenticated ? (
              <div className="mobile-user-card">
                <div className="mobile-user-details">
                  <div className="nav-user-avatar">
                    {user?.avatar || getInitials(user?.name)}
                  </div>
                  <div>
                    <div className="user-dropdown-name">{user?.name}</div>
                    <div className="user-dropdown-email">{user?.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-mobile-signout"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-auth-actions">
                <button
                  type="button"
                  className="btn-mobile-signin"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateToSignIn) onNavigateToSignIn();
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn-mobile-signup"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateToSignUp) onNavigateToSignUp();
                  }}
                >
                  Create Account
                </button>
              </div>
            )}

            <button
              type="button"
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
