
export default function ThreeSteps({ onOpenWorkspace, onNavigateToSignUp }) {
  const steps = [
    {
      number: '1',
      title: 'Create your account',
      desc: 'Register in under a minute and sign in securely with your email.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      actionText: 'Sign Up Free',
      action: () => {
        if (onNavigateToSignUp) onNavigateToSignUp();
      },
    },
    {
      number: '2',
      title: 'Set up a workspace',
      desc: 'Create a workspace, add boards and invite your teammates.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M9 21V9" />
        </svg>
      ),
      actionText: 'Instant Setup',
      action: () => {
        if (onOpenWorkspace) onOpenWorkspace();
      },
    },
    {
      number: '3',
      title: 'Collaborate live',
      desc: 'Move cards, chat and share updates. Everyone sees changes in real time.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      actionText: 'Launch Now',
      action: () => {
        if (onOpenWorkspace) onOpenWorkspace();
      },
    },
  ];

  return (
    <section id="how-it-works" className="three-steps-section">
      <div className="section-header-centered">
        <div className="section-pill">How It Works</div>
        <h2 className="section-title">Up and running in three steps</h2>
        <p className="section-subtitle">
          No complex setup. Create an account and start collaborating right away.
        </p>
      </div>

      <div className="three-steps-container">
        {/* Connecting Line for desktop */}
        <div className="three-steps-track" aria-hidden="true" />

        <div className="three-steps-grid">
          {steps.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-badge-wrapper">
                <div className="step-number-badge">{step.number}</div>
                <div className="step-icon-badge">{step.icon}</div>
              </div>

              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>

              <button
                type="button"
                className="step-action-btn"
                onClick={step.action}
              >
                <span>{step.actionText}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
