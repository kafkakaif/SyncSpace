 <div align="center">

# SyncSpace — Real-Time Collaborative Whiteboard & Code Editor

![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
![Backend](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs&logoColor=white)
![Real-Time](https://img.shields.io/badge/Real--Time-Socket.io-010101?logo=socketdotio&logoColor=white)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![Status](https://img.shields.io/badge/Status-In%20Development-orange)

**Turning separate engineering tools into one shared, real-time workspace.**

</div>

---

## 📌 Overview

**SyncSpace** is a real-time collaboration platform where multiple users can work together in a shared workspace. The planned application combines an interactive whiteboard and a code editor so distributed engineering teams can sketch ideas, discuss system architecture, and edit code in one place.

This project is being developed as part of **Axlero's Advanced MERN Stack Engineering** project track.

## 🎯 Problem Statement

Traditional web applications mainly follow a request/response model. Collaborative tools must also handle simultaneous user actions, room isolation, low-latency updates, conflicting edits, and session recovery. Without a shared synchronization strategy, users may see delayed or overwritten changes.

## 💡 Proposed Solution

SyncSpace will bring together:

- **Real-time communication:** Socket.io for bidirectional client/server events and room membership.
- **Conflict-free collaboration:** Yjs to synchronize shared document state and awareness.
- **Interactive whiteboard:** Konva.js / React-Konva for drawing shapes, lines, and text.
- **Collaborative code editor:** Monaco Editor with a Yjs binding for shared code editing.
- **Persistence:** MongoDB for saved session/document state and related metadata.
- **Access control:** JWT authentication and invitation-based room authorization.
- **Session replay:** A history/replay experience for reviewing how a session evolved.

> The project is under active development. Features listed in the roadmap are planned capabilities and should not be considered complete until implemented and tested.

## 🧱 Technology Stack

| Area | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | Workspace UI and user interaction |
| Styling | CSS | Responsive split-screen layout |
| Client communication | Socket.io Client | Connect the React app to the server |
| Backend | Node.js + Express | HTTP APIs and application logic |
| Real-time transport | Socket.io | Connections, room events and event delivery |
| Shared state | Yjs | Concurrent document synchronization and awareness |
| Whiteboard | Konva.js / React-Konva | Canvas drawing tools |
| Code editor | Monaco Editor | Code editing experience |
| Database | MongoDB | Persist session data and document state |
| Authentication | JWT | Authenticate users and protect invited rooms |

## 🏗️ Architecture

```text
                    ┌───────────────────────────┐
                    │       React Frontend      │
                    │                           │
                    │  Whiteboard  │ Code Editor│
                    │  (Konva)     │ (Monaco)   │
                    └─────────────┬─────────────┘
                                  │
                         Socket.io / HTTP
                                  │
                    ┌─────────────▼─────────────┐
                    │    Node.js + Express      │
                    │                           │
                    │ Socket.io Rooms + Yjs     │
                    │ Auth + Session APIs       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │          MongoDB          │
                    │ Saved state and metadata  │
                    └───────────────────────────┘
```

## 📂 Repository Structure

```text
SyncSpace/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

As the project grows, backend modules such as socket handlers, routes, models, and persistence services can be added without mixing frontend and backend responsibilities.

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (included with Node.js)
- [Git](https://git-scm.com/)
- Visual Studio Code or another code editor

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd SyncSpace
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the URL of your team's GitHub repository.

### 2. Install and run the backend

Open a terminal:

```bash
cd backend
npm install
npm run dev
```

The backend is expected to run at `http://localhost:5000` when configured with the default port.

Check the health endpoint at:

```text
http://localhost:5000/health
```

Expected response after the health endpoint is implemented:

```json
{
  "status": "success",
  "message": "SyncSpace backend is running!"
}
```

### 3. Install and run the frontend

Open a **second terminal** from the repository root:

```bash
cd frontend
npm install
npm install socket.io-client
npm run dev
```

Vite normally serves the application at `http://localhost:5173`. Use the URL printed in your terminal if it differs.

## 🗓️ Four-Week Development Roadmap

### Week 1 — Foundation and Rooms

**Backend**
- Set up Express and Socket.io on a shared HTTP server.
- Add a health-check endpoint.
- Implement room create/join/leave events and basic validation.
- Keep room membership isolated.

**Frontend**
- Create the React/Vite application.
- Build a split-screen workspace with a whiteboard panel on the left and a code panel on the right.
- Add room controls and connection status.
- Connect to the backend with Socket.io Client.

**Week 1 acceptance criteria**
- Frontend and backend start independently.
- Two browser tabs can join the same room.
- A separate room remains isolated.
- Connection and room errors are visible to the user.

### Week 2 — Yjs Awareness and Whiteboard

- Integrate Yjs and a compatible synchronization/awareness provider.
- Display participant names and remote cursor positions.
- Add Konva drawing tools: freehand lines, rectangles, and text.
- Synchronize whiteboard state between users.
- Run the mid-project synchronization audit.

### Week 3 — Persistence and Collaborative Code

- Connect MongoDB and define session metadata.
- Save and restore Yjs document state using a consistent binary-safe strategy.
- Integrate Monaco Editor with a Yjs shared text type.
- Test simultaneous edits, reconnects, refreshes, and backend restarts.

### Week 4 — Security, Replay, and Release

- Add JWT authentication.
- Enforce invitation-based room access on the server.
- Design and implement a session history/replay feature.
- Add loading, error, reconnect, and responsive UI states.
- Complete security checks, end-to-end tests, deployment preparation, and documentation.

## 🧪 Testing Strategy

- **Room isolation:** Users in one room must not receive another room's collaboration events.
- **Connection handling:** Show clear connected, disconnected, and reconnecting states.
- **Concurrent editing:** Shared document updates should converge across clients.
- **Persistence:** Saved session state should be recoverable after refresh and server restart.
- **Authorization:** Users without an invitation must be rejected by the backend.
- **End-to-end demo:** Validate the complete flow using at least two browser sessions.

## 👥 Team Collaboration Guidelines

1. Keep frontend and backend code in their respective folders.
2. Agree on Socket.io event names and payloads before implementing them on both sides.
3. Create feature branches and use pull requests for review.
4. Never commit `.env` files, secrets, access tokens, or credentials.
5. Test the integrated application before marking a task complete.
6. Update this README when commands, architecture, or implemented features change.

Suggested branch names:

```text
feature/frontend-workspace
feature/socket-rooms
feature/yjs-sync
feature/whiteboard
feature/monaco-editor
feature/auth-and-invites
```

## 🔐 Environment Variables

Keep local secrets and environment-specific settings in `.env` files excluded from Git. Use an `.env.example` file to document required variable names with placeholder values.

Example backend configuration:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=your_local_or_hosted_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
```

Only configure variables when the corresponding feature is implemented. Never commit real credentials to GitHub.

## 📈 Project Status

**Current milestone:** Week 1 — foundation and room infrastructure.

Update this section as the team completes and tests each milestone. Mark a feature complete only after it works in the integrated application.

## 🤝 Contributing

Team members should:

1. Pull the latest changes before starting work.
2. Create a branch for each task.
3. Keep commits focused and descriptive.
4. Test changes locally.
5. Open a pull request and request review before merging.

## 📄 License

No license has been selected yet. Add a `LICENSE` file before presenting this repository as open source.

---

<div align="center">

**SyncSpace — One workspace. Shared ideas. Synchronized work.**

Built by the Axlero project team.

</div>
