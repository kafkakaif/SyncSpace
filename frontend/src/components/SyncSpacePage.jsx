import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import socket from "../services/socket";
import WhiteboardCanvas from "./WhiteboardCanvas";

const DEFAULT_CODE = `// Welcome to SyncSpace

function collaborate() {
  console.log("Hello, team!");
}`;

function toYjsUpdate(update) {
  if (update instanceof Uint8Array) {
    return update;
  }

  if (update instanceof ArrayBuffer) {
    return new Uint8Array(update);
  }

  if (
    Array.isArray(update) &&
    update.every(
      (value) =>
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 255
    )
  ) {
    return Uint8Array.from(update);
  }

  if (
    update &&
    update.type === "Buffer" &&
    Array.isArray(update.data)
  ) {
    return Uint8Array.from(update.data);
  }

  return null;
}

export default function SyncSpacePage({
  onBackToLanding,
  initialRoomId = "",
}) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [activeRoom, setActiveRoom] = useState("");
  const [status, setStatus] = useState(
    socket.connected ? "Connected" : "Disconnected"
  );
  const [message, setMessage] = useState("");
  const [codeContent, setCodeContent] = useState(DEFAULT_CODE);
  const [isCodeSynced, setIsCodeSynced] = useState(false);
  const [displayName] = useState(
    () => `User-${Math.random().toString(36).slice(2, 6)}`
  );
  const [participants, setParticipants] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState([]);

  const activeRoomRef = useRef("");
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const remoteYjsOriginRef = useRef({});

  const initializeYjsDocument = useCallback((joinedRoomId) => {
    ydocRef.current?.destroy();

    const doc = new Y.Doc();
    const sharedText = doc.getText("code");

    ydocRef.current = doc;
    ytextRef.current = sharedText;

    sharedText.observe(() => {
      setCodeContent(sharedText.toString());
    });

    doc.on("update", (update, origin) => {
      if (origin === remoteYjsOriginRef.current || !socket.connected) {
        return;
      }

      socket.emit("yjs:update", {
        roomId: joinedRoomId,
        update,
      });
    });
  }, []);

  const destroyYjsDocument = useCallback(() => {
    ydocRef.current?.destroy();
    ydocRef.current = null;
    ytextRef.current = null;
    setIsCodeSynced(false);
  }, []);

  const announcePresence = useCallback(
    (joinedRoomId, cursor = null) => {
      if (!joinedRoomId || !socket.connected) return;

      socket.emit("awareness:update", {
        roomId: joinedRoomId,
        name: displayName,
        cursor,
      });
    },
    [displayName]
  );

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    
const onConnect = () => {
  setStatus("Connected");

  const savedRoomId =
    localStorage.getItem("syncspace:lastRoomId");

  const roomToJoin =
    initialRoomId?.trim() ||
    savedRoomId ||
    activeRoomRef.current;

  if (roomToJoin) {
    socket.emit("join-room", roomToJoin);
  }
};


    
const onDisconnect = () => {
  setStatus("Disconnected");

  // Keep the active room ID so we can reconnect.
  // Do not clear the room or destroy the Yjs document here.
};


    const onRoomJoined = ({ roomId: joinedRoomId } = {}) => {
      if (typeof joinedRoomId !== "string") return;
      localStorage.setItem("syncspace:lastRoomId", joinedRoomId);

      activeRoomRef.current = joinedRoomId;
      setActiveRoom(joinedRoomId);
      setRoomId(joinedRoomId);
      setMessage(`Successfully joined room: ${joinedRoomId}`);
      setParticipants([]);
      setRemoteCursors([]);
      setCodeContent("");
      setIsCodeSynced(false);

      initializeYjsDocument(joinedRoomId);
      announcePresence(joinedRoomId);
    };

    const onRoomLeft = ({ roomId: leftRoomId } = {}) => {
      if (activeRoomRef.current === leftRoomId) {
        activeRoomRef.current = "";
        setActiveRoom("");
        setParticipants([]);
        setRemoteCursors([]);
        setCodeContent(DEFAULT_CODE);
        destroyYjsDocument();
      }

      setMessage(`Left room: ${leftRoomId}`);
    };

    const onRoomError = ({ message: errorMessage } = {}) => {
      setMessage(errorMessage || "Unable to join that room.");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room-joined", onRoomJoined);
    socket.on("room-left", onRoomLeft);
    socket.on("room-error", onRoomError);

    if (!socket.connected) {
      socket.connect();
    } else if (initialRoomId?.trim()) {
      socket.emit("join-room", initialRoomId.trim());
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room-joined", onRoomJoined);
      socket.off("room-left", onRoomLeft);
      socket.off("room-error", onRoomError);
    };
  }, [
    initialRoomId,
    announcePresence,
    destroyYjsDocument,
    initializeYjsDocument,
  ]);

  useEffect(() => {
    const applyYjsUpdate = (data, initialSync = false) => {
      if (!data || data.roomId !== activeRoomRef.current) return;

      const doc = ydocRef.current;
      const update = toYjsUpdate(data.update);

      if (!doc || !update) return;

      try {
        Y.applyUpdate(doc, update, remoteYjsOriginRef.current);

        if (initialSync) {
          setIsCodeSynced(true);
        }
      } catch {
        setMessage("Unable to synchronize the shared code document.");
      }
    };

    const onYjsSync = (data) => applyYjsUpdate(data, true);
    const onYjsUpdate = (data) => applyYjsUpdate(data);

    const onAwarenessChanged = (data) => {
      if (!data || data.roomId !== activeRoomRef.current) return;

      const nextParticipants = Array.isArray(data.participants)
        ? data.participants
        : [];

      setParticipants(nextParticipants);
      setRemoteCursors(
        nextParticipants.filter(
          (participant) =>
            participant.socketId !== socket.id &&
            participant.cursor &&
            Number.isFinite(participant.cursor.x) &&
            Number.isFinite(participant.cursor.y)
        )
      );
    };

    socket.on("yjs:sync", onYjsSync);
    socket.on("yjs:update", onYjsUpdate);
    socket.on("awareness:changed", onAwarenessChanged);

    return () => {
      socket.off("yjs:sync", onYjsSync);
      socket.off("yjs:update", onYjsUpdate);
      socket.off("awareness:changed", onAwarenessChanged);
    };
  }, []);

  useEffect(() => {
    return () => {
      ydocRef.current?.destroy();
      ydocRef.current = null;
      ytextRef.current = null;
    };
  }, []);

  const joinRoom = () => {
    const trimmedRoomId = roomId.trim();

    if (!trimmedRoomId) {
      setMessage("Please enter a room ID.");
      return;
    }

    if (!socket.connected) {
      setMessage("Connecting to server. Please try again.");
      return;
    }

    socket.emit("join-room", trimmedRoomId);
  };

  const leaveRoom = () => {
    if (activeRoom && socket.connected) {
      socket.emit("leave-room", activeRoom);
    }
  };

  const joinQuickRoom = (quickRoomId) => {
    setRoomId(quickRoomId);

    if (!socket.connected) {
      setMessage("Connecting to server. Please try again.");
      return;
    }

    socket.emit("join-room", quickRoomId);
  };

  const updateCode = (updatedCode) => {
    const doc = ydocRef.current;
    const sharedText = ytextRef.current;

    if (
      !activeRoom ||
      !socket.connected ||
      !isCodeSynced ||
      !doc ||
      !sharedText
    ) {
      return;
    }

    const currentCode = sharedText.toString();
    if (currentCode === updatedCode) return;

    let prefix = 0;
    while (
      prefix < currentCode.length &&
      prefix < updatedCode.length &&
      currentCode[prefix] === updatedCode[prefix]
    ) {
      prefix++;
    }

    let oldEnd = currentCode.length;
    let newEnd = updatedCode.length;

    while (
      oldEnd > prefix &&
      newEnd > prefix &&
      currentCode[oldEnd - 1] === updatedCode[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }

    doc.transact(() => {
      const deleteLength = oldEnd - prefix;
      if (deleteLength > 0) {
        sharedText.delete(prefix, deleteLength);
      }

      const insertedText = updatedCode.slice(prefix, newEnd);
      if (insertedText.length > 0) {
        sharedText.insert(prefix, insertedText);
      }
    });
  };

  return (
    <div className="syncspace-page-wrapper">
      <nav className="syncspace-top-nav">
        <button
          id="btn-return-landing"
          className="btn-back-landing"
          onClick={onBackToLanding}
          type="button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>← Back to Landing Page</span>
        </button>

        <div className="nav-center-info">
          <span className="room-status-indicator">
            {activeRoom ? `Connected Room: ${activeRoom}` : "No Room Joined"}
          </span>
        </div>

        <div className="nav-quick-actions">
          <button
            className="btn-chip"
            type="button"
            onClick={() => joinQuickRoom("team-room")}
          >
            #team-room
          </button>
          <button
            className="btn-chip"
            type="button"
            onClick={() => joinQuickRoom("design-lab")}
          >
            #design-lab
          </button>
        </div>
      </nav>

      <main className="app">
        <header className="topbar">
          <div>
            <h1>SyncSpace</h1>
            <p>Real-time collaborative workspace</p>
          </div>

          <span className={`status ${status === "Connected" ? "online" : ""}`}>
            ● {status}
          </span>
        </header>

        <section className="room-controls">
          <input
            id="syncspace-room-input"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Enter a room ID, e.g. team-room"
            maxLength={100}
            aria-label="Room ID"
          />

          <button id="syncspace-join-btn" type="button" onClick={joinRoom}>
            Join Room
          </button>

          <button
            id="syncspace-leave-btn"
            className="secondary"
            type="button"
            onClick={leaveRoom}
            disabled={!activeRoom}
          >
            Leave Room
          </button>

          <span className="active-room">
            {activeRoom ? `Room: ${activeRoom}` : "No room joined"}
          </span>
        </section>

        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}

        {activeRoom && (
          <section
            className="panel"
            aria-label="Room participants"
            style={{ marginBottom: "16px", padding: "16px" }}
          >
            <h2 style={{ marginTop: 0 }}>
              Participants ({participants.length})
            </h2>

            {participants.length > 0 ? (
              <ul
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {participants.map((participant) => (
                  <li
                    key={participant.socketId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "20px",
                      background: "rgba(83, 197, 87, 0.12)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#53C557",
                      }}
                    />
                    {participant.name}
                    {participant.socketId === socket.id ? " (You)" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ marginBottom: 0 }}>
                Waiting for participants to connect...
              </p>
            )}
          </section>
        )}

        <section className="workspace">
          <div className="panel">
            <div className="panel-heading">
              <div className="panel-heading-left">
                <span>01</span>
                <h2>Whiteboard</h2>
              </div>
            </div>

            <WhiteboardCanvas
              roomId={activeRoom}
              remoteCursors={remoteCursors}
              onCursorMove={(cursor) => announcePresence(activeRoom, cursor)}
              onError={setMessage}
            />
          </div>

          <div className="panel">
            <div className="panel-heading">
              <span>02</span>
              <h2>Code Editor</h2>
            </div>

            <div className="code-placeholder">
              <div className="code-toolbar">
                <span>JavaScript</span>
                <span className="editor-live-label">
                  {isCodeSynced ? "Yjs synchronized" : "Connecting to room sync..."}
                </span>
              </div>

              <textarea
                aria-label="Collaborative code editor"
                value={codeContent}
                onChange={(event) => updateCode(event.target.value)}
                spellCheck={false}
                disabled={!activeRoom || !isCodeSynced}
                placeholder="Join a room and start writing code..."
                className="syncspace-code-editor"
              />
            </div>
          </div>
        </section>

        <footer>
          SyncSpace <span aria-hidden="true">·</span> Collaborative workspace
        </footer>
      </main>
    </div>
  );
}
