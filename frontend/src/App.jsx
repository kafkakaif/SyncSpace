
import { useEffect, useState } from "react";
import socket from "./services/socket";
import "./App.css";

function App() {
  const [roomId, setRoomId] = useState("");
  const [activeRoom, setActiveRoom] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onConnect = () => setStatus("Connected");
    const onDisconnect = () => setStatus("Disconnected");

    const onRoomJoined = ({ roomId }) => {
      setActiveRoom(roomId);
      setMessage(`Successfully joined room: ${roomId}`);
    };

    const onRoomLeft = ({ roomId }) => {
      setActiveRoom((current) =>
        current === roomId ? "" : current
      );
      setMessage(`Left room: ${roomId}`);
    };

    const onRoomError = ({ message }) => setMessage(message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room-joined", onRoomJoined);
    socket.on("room-left", onRoomLeft);
    socket.on("room-error", onRoomError);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room-joined", onRoomJoined);
      socket.off("room-left", onRoomLeft);
      socket.off("room-error", onRoomError);
      socket.disconnect();
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
    if (activeRoom) {
      socket.emit("leave-room", activeRoom);
    }
  };

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>SyncSpace</h1>
          <p>Real-time collaborative workspace</p>
        </div>
        <span className={`status ${socket.connected ? "online" : ""}`}>
          ● {status}
        </span>
      </header>

      <section className="room-controls">
        <input
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
          placeholder="Enter a room ID, e.g. team-room"
          maxLength={100}
          aria-label="Room ID"
        />
        <button onClick={joinRoom}>Join Room</button>
        <button className="secondary" onClick={leaveRoom}>
          Leave Room
        </button>
        <span className="active-room">
          {activeRoom ? `Room: ${activeRoom}` : "No room joined"}
        </span>
      </section>

      {message && <p className="message">{message}</p>}

      <section className="workspace">
        <div className="panel">
          <div className="panel-heading">
            <span>01</span>
            <h2>Whiteboard</h2>
          </div>
          <div className="placeholder">
            <span className="placeholder-icon">✏️</span>
            <h3>Collaborative Canvas</h3>
            <p>Drawing tools will be added in Week 2.</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <span>02</span>
            <h2>Code Editor</h2>
          </div>
          <div className="code-placeholder">
            <div className="code-toolbar">JavaScript · Preview</div>
            <pre>
              <code>{`// Welcome to SyncSpace\n\nfunction collaborate() {\n  // Monaco Editor arrives in Week 3\n}`}</code>
            </pre>
          </div>
        </div>
      </section>

      <footer>SyncSpace · Axlero · Week 1</footer>
    </main>
  );
}

export default App;
