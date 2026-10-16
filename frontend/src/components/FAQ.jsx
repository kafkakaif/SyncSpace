import React, { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'How does SyncSpace resolve simultaneous conflicting edits without overwriting?',
    a: 'SyncSpace utilizes Yjs, a high-performance Conflict-free Replicated Data Type (CRDT) engine. Instead of relying on a centralized lock or naive last-write-wins timestamps, edits are tracked as deterministic operations. When multiple developers type or draw at the same moment, the operations automatically converge on all screens identically without race conditions.'
  },
  {
    q: 'Can two or more browser tabs join the same room right now in Week 1?',
    a: 'Yes! Open http://localhost:3000 in two separate browser windows or tabs, enter the same room ID (for example, "team-arch"), and click Join Room. The server will isolate your room and broadcast peer connection updates between them.'
  },
  {
    q: 'How does room isolation work on the backend?',
    a: 'On the server side, Express and Socket.io maintain isolated room rooms using socket.join(roomId). Messages emitted with socket.to(roomId) only propagate to sockets currently in that room. Sockets in room "alpha" will never receive drawing strokes, cursors, or code modifications from room "beta".'
  },
  {
    q: 'What happens if a user temporarily loses internet connection?',
    a: 'The Socket.io client automatically attempts reconnection with exponential backoff. Once re-established, the client syncs with the room document, pulling down any missing binary deltas to restore the latest canvas and code states.'
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
              >
                <span className="faq-question-text">{item.q}</span>
                <span className="faq-toggle-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                    )}
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="faq-answer-pane">
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
