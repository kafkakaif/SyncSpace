import React, { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'How does SyncSpace resolve simultaneous conflicting edits without overwriting?',
    a: 'The current editor broadcasts code updates to others in the same room. It does not yet use Yjs, so simultaneous edits can overwrite each other. Conflict-free editing is a planned improvement.'
  },
  {
    q: 'Can two or more browser tabs join the same room right now in Week 1?',
    a: 'Yes. Open the app in two browser tabs, enter the same room ID, and join. Drawing strokes, clear events, and code updates are shared with other connected users in that room.'
  },
  {
    q: 'How does room isolation work on the backend?',
    a: 'The backend uses Socket.IO rooms and broadcasts drawing and code events to other sockets in the selected room. Keep room IDs private when you only want invited teammates to use a room; authentication and invite permissions are not implemented yet.'
  },
  {
    q: 'What happens if a user temporarily loses internet connection?',
    a: 'The Socket.IO client is configured to attempt reconnection. The current version does not persist a document history or restore missed drawing and code changes automatically, so work may need to be shared again after reconnecting.'
  },
  {
    q: 'Why combine the whiteboard and code editor into one screen?',
    a: 'Traditional engineering discussions suffer from fragmentation: diagrams live in one tab (Miro/Excalidraw), code lives in VS Code or GitHub, and discussions happen over Zoom. SyncSpace keeps architecture sketches and code implementations visually adjacent, so teams can discuss system design and verify the code side-by-side.'
  }
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggleFAQ = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <section id="faq" className="faq-section">
      <div className="section-header-centered">
        <div className="section-pill">Frequently Asked Questions</div>
        <h2 className="section-title">Everything You Need to Know</h2>
        <p className="section-subtitle">
          Got questions about our real-time synchronization, room isolation, or architecture? We have answers.
        </p>
      </div>

      <div className="faq-accordion">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
              <button 
                className="faq-question-btn"
                onClick={() => toggleFAQ(idx)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
                id={`faq-question-${idx}`}
              >
                <span className="faq-question-text">{item.q}</span>
                <span className="faq-toggle-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    {isOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                    )}
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div 
                  id={`faq-answer-${idx}`} 
                  className="faq-answer-pane"
                  role="region"
                  aria-labelledby={`faq-question-${idx}`}
                >
                  <p className="faq-answer-text">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
