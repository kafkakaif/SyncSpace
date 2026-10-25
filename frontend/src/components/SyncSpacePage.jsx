import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { toast } from "react-toastify";
import socket from "../services/socket";
import WhiteboardCanvas from "./WhiteboardCanvas";

const STARTER_CODE = {
  javascript: `function collaborate() {
  console.log("Hello from SyncSpace");
}

collaborate();`,
  typescript: `function collaborate(): void {
  console.log("Hello from SyncSpace");
}

collaborate();`,
  python: `def collaborate():
    print("Hello from SyncSpace")


if __name__ == "__main__":
    collaborate()`,
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>SyncSpace</title>
  </head>
  <body>
    <h1 id="message"></h1>
    <script>
      function collaborate() {
        document.querySelector("#message").textContent = "Hello from SyncSpace";
      }

      collaborate();
    </script>
  </body>
</html>`,
  css: `:root {
  font-family: system-ui, sans-serif;
  color: #111827;
}

.collaborate-message::after {
  content: "Hello from SyncSpace";
  display: block;
  padding: 1rem;
  border-radius: 0.5rem;
  background: #dcfce7;
}`,
  json: `{
  "function": {
    "name": "collaborate",
    "action": "log",
    "message": "Hello from SyncSpace"
  }
}`,
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello from SyncSpace" << std::endl;
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from SyncSpace");
    }
}`,
  sql: `SELECT 'Hello from SyncSpace' AS message;`,
  markdown: `# SyncSpace

## Collaboration note

Use this shared document to capture ideas and decisions.`
};

function getStarterCode(language) {
  return STARTER_CODE[language] ?? STARTER_CODE.javascript;
}

const SUPPORTED_LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "json", label: "JSON" },
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
  { id: "sql", label: "SQL" },
  { id: "markdown", label: "Markdown" },
];

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
  const [isCodeSynced, setIsCodeSynced] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [displayName] = useState(
    () => `User-${Math.random().toString(36).slice(2, 6)}`
  );
  const [participants, setParticipants] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState([]);

  const activeRoomRef = useRef("");
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const yconfigRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const remoteYjsOriginRef = useRef({});

  const bindEditorToYjs = useCallback((editorInstance, sharedYText) => {
    const editor = editorInstance || editorRef.current;
    const text = sharedYText || ytextRef.current;

    if (!editor || !text) {
      return;
    }

    const model = editor.getModel();
    if (!model || model.isDisposed()) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    try {
      bindingRef.current = new MonacoBinding(
        text,
        model,
        new Set([editor])
      );
    } catch (error) {
      console.error("Unable to bind Monaco Editor to Yjs text type:", error);
    }
  }, []);

  const initializeYjsDocument = useCallback((joinedRoomId) => {
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    ydocRef.current?.destroy();

    const doc = new Y.Doc();
    const sharedText = doc.getText("code");
    const sharedConfig = doc.getMap("config");

    ydocRef.current = doc;
    ytextRef.current = sharedText;
    yconfigRef.current = sharedConfig;

    // Synchronize language if room already has a configured language
    const roomLanguage = sharedConfig.get("language");
    if (roomLanguage && typeof roomLanguage === "string") {
      setLanguage(roomLanguage);
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model && !model.isDisposed()) {
          monacoRef.current.editor.setModelLanguage(model, roomLanguage);
        }
      }
    }

    // Observe remote language changes from collaborators
    sharedConfig.observe(() => {
      const updatedLang = sharedConfig.get("language");
      if (updatedLang && typeof updatedLang === "string") {
        setLanguage(updatedLang);
        if (editorRef.current && monacoRef.current) {
          const model = editorRef.current.getModel();
          if (model && !model.isDisposed()) {
            monacoRef.current.editor.setModelLanguage(model, updatedLang);
          }
        }
      }
    });

    if (editorRef.current) {
      bindEditorToYjs(editorRef.current, sharedText);
    }

    doc.on("update", (update, origin) => {
      if (origin === remoteYjsOriginRef.current || !socket.connected) {
        return;
      }

      socket.emit("yjs:update", {
        roomId: joinedRoomId,
        update,
      });
    });
  }, [bindEditorToYjs]);

  const destroyYjsDocument = useCallback(() => {
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    ydocRef.current?.destroy();
    ydocRef.current = null;
    ytextRef.current = null;
    yconfigRef.current = null;
    setIsCodeSynced(false);
    setLanguage("javascript");

    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model && !model.isDisposed()) {
        model.setValue(getStarterCode("javascript"));
        if (monacoRef.current) {
          monacoRef.current.editor.setModelLanguage(model, "javascript");
        }
      }
    }
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
      setIsCodeSynced(false);

      toast.success(`Connected to room #${joinedRoomId}`);

      initializeYjsDocument(joinedRoomId);
      announcePresence(joinedRoomId);
    };

    const onRoomLeft = ({ roomId: leftRoomId } = {}) => {
      if (activeRoomRef.current === leftRoomId) {
        activeRoomRef.current = "";
        setActiveRoom("");
        setParticipants([]);
        setRemoteCursors([]);
        destroyYjsDocument();
      }

      toast.info(`Left room #${leftRoomId}`);

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
          const savedLang = doc.getMap("config")?.get("language");
          if (savedLang && typeof savedLang === "string") {
            setLanguage(savedLang);
            if (editorRef.current && monacoRef.current) {
              const model = editorRef.current.getModel();
              if (model && !model.isDisposed()) {
                monacoRef.current.editor.setModelLanguage(model, savedLang);
              }
            }
          }
          if (editorRef.current && ytextRef.current && !bindingRef.current) {
            bindEditorToYjs(editorRef.current, ytextRef.current);
          }
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
  }, [bindEditorToYjs]);

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
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

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (ytextRef.current) {
      bindEditorToYjs(editor, ytextRef.current);
    }

    const model = editor.getModel();
    if (model && !model.isDisposed()) {
      monaco.editor.setModelLanguage(model, language);
    }

    editor.onDidDispose(() => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      editorRef.current = null;
      monacoRef.current = null;
    });
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);

    const starterCode = getStarterCode(newLanguage);

    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model && !model.isDisposed()) {
        monacoRef.current.editor.setModelLanguage(model, newLanguage);
      }
    }

    // Language and starter code are one shared Yjs update, so every room
    // participant sees the matching program when the language changes.
    if (activeRoom && yconfigRef.current && ytextRef.current && socket.connected) {
      ydocRef.current?.transact(() => {
        yconfigRef.current.set("language", newLanguage);
        ytextRef.current.delete(0, ytextRef.current.length);
        ytextRef.current.insert(0, starterCode);
      });
      toast.info(`Switched shared code to ${newLanguage}.`);
    } else if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model && !model.isDisposed()) {
        model.setValue(starterCode);
      }
    }
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
                <div className="code-toolbar-left">
                  <label htmlFor="editor-language-select" className="code-toolbar-label">
                    Language:
                  </label>
                  <select
                    id="editor-language-select"
                    className="editor-language-select"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    aria-label="Editor Language"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="editor-live-label">
                  {isCodeSynced ? "● Yjs synchronized" : "○ Connecting to room sync..."}
                </span>
              </div>

              <div className="editor-container-wrapper">
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  defaultValue={getStarterCode("javascript")}
                  onMount={handleEditorDidMount}
                  options={{
                    readOnly: !activeRoom || !isCodeSynced,
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    padding: { top: 12 },
                  }}
                  loading="Loading code editor..."
                />
              </div>
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
