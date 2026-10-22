import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SignInPage({ onNavigateToSignUp, onNavigateToHome, onOpenWorkspace }) {
  const { login, loginDemo } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!formData.password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.email.trim(), formData.password);
      setSuccessMsg('Welcome back! Signed in successfully.');
      setTimeout(() => {
        if (onOpenWorkspace) onOpenWorkspace();
        else if (onNavigateToHome) onNavigateToHome();
      }, 700);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginDemo();
      setSuccessMsg('Signed in as Demo Engineer!');
      setTimeout(() => {
        if (onOpenWorkspace) onOpenWorkspace();
        else if (onNavigateToHome) onNavigateToHome();
      }, 700);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      return;
    }
    setForgotSubmitted(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotSubmitted(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="auth-page-root">
      {/* Top Navigation Bar with SyncSpace Branding */}
      <header className="auth-page-header">
        <div className="auth-header-container">
          <a
            href="#"
            className="navbar-brand"
            aria-label="SyncSpace Home"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateToHome) onNavigateToHome();
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

          <button
            type="button"
            className="btn-auth-back"
            onClick={() => {
              if (onNavigateToHome) onNavigateToHome();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Content: Centered Auth Card */}
      <main className="auth-page-main">
        <div className="auth-card" id="signin-card">
          <h1 className="auth-card-title">Welcome Back</h1>
          <p className="auth-card-subtitle">Login to your account to continue</p>

          {/* Feedback Alerts */}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert auth-alert-success" role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email Address */}
            <div className="auth-form-group">
              <label htmlFor="signin-email" className="auth-label">
                Email Address <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signin-email"
                  type="email"
                  name="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <label htmlFor="signin-password" className="auth-label">
                Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-input has-toggle"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="auth-forgot-row">
                <button
                  type="button"
                  className="auth-link-forgot"
                  onClick={() => setForgotModalOpen(true)}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="signin-submit-btn"
              type="submit"
              className="auth-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="auth-spinner-wrapper">
                  <span className="auth-spinner"></span>
                  <span>Signing In...</span>
                </div>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <p className="auth-switch-text">
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                if (onNavigateToSignUp) onNavigateToSignUp();
              }}
            >
              Create Account
            </button>
          </p>
        </div>
      </main>

      {/* Forgot Password Simple Modal Dialog */}
      {forgotModalOpen && (
        <div className="auth-modal-overlay" onClick={() => setForgotModalOpen(false)}>
          <div className="auth-forgot-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="auth-forgot-title">Reset Your Password</h2>
            <p className="auth-forgot-desc">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>

            {forgotSubmitted ? (
              <div className="auth-alert auth-alert-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Reset link sent! Please check your email inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="auth-form-group">
                  <label htmlFor="forgot-email" className="auth-label">
                    Email Address <span className="auth-required">*</span>
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="auth-input"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-modal-actions">
                  <button
                    type="button"
                    className="btn-auth-cancel"
                    onClick={() => setForgotModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="auth-btn-primary modal-action-btn">
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
