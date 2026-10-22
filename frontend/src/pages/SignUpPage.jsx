import { useState } from 'react';
import { useAuth } from '../context/useAuth';

export default function SignUpPage({ onNavigateToSignIn, onNavigateToHome, onOpenWorkspace }) {
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  // Password strength calculation
  const calculateStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strengthScore = calculateStrength(formData.password);
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const strengthColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#059669'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccessMsg('Account created successfully! Welcome to SyncSpace.');
      setTimeout(() => {
        if (onOpenWorkspace) onOpenWorkspace();
        else if (onNavigateToHome) onNavigateToHome();
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="auth-card" id="signup-card">
          <h1 className="auth-card-title">Create Account</h1>
          <p className="auth-card-subtitle">Create your account to get started</p>

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
            {/* Full Name */}
            <div className="auth-form-group">
              <label htmlFor="signup-name" className="auth-label">
                Full Name <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  className="auth-input"
                  placeholder="e.g. Sarah Connor"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="auth-form-group">
              <label htmlFor="signup-email" className="auth-label">
                Email Address <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-email"
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
              <label htmlFor="signup-password" className="auth-label">
                Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-input has-toggle"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

              {/* Password strength meter */}
              {formData.password && (
                <div className="auth-strength-meter">
                  <div className="auth-strength-bars">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="auth-strength-segment"
                        style={{
                          backgroundColor:
                            index < strengthScore ? strengthColors[strengthScore] : '#e5e7eb',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="auth-strength-label"
                    style={{ color: strengthColors[strengthScore] }}
                  >
                    {strengthLabels[strengthScore]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="auth-form-group">
              <label htmlFor="signup-confirm-password" className="auth-label">
                Confirm Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="auth-input has-toggle"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
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
            </div>

            {/* Submit Button */}
            <button
              id="signup-submit-btn"
              type="submit"
              className="auth-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="auth-spinner-wrapper">
                  <span className="auth-spinner"></span>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <p className="auth-switch-text">
            Already have an account?{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                if (onNavigateToSignIn) onNavigateToSignIn();
              }}
            >
              Login
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
