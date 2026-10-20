# SyncSpace Backend

The SyncSpace backend provides the Express health endpoint and Socket.IO server used for real-time collaboration.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`, then provide your MongoDB connection string:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<url-encoded-password>@<cluster>.mongodb.net/syncspace?retryWrites=true&w=majority
```

`MONGODB_URI` is also supported as an alternative variable name. Keep the real `.env` file private; it is ignored by Git.

## Run the server

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The backend runs on `http://localhost:5000` by default. Check its status at:

```text
GET /health
```

## Socket.IO events

| Event | Direction | Purpose |
| --- | --- | --- |
| `join-room` | client to server | Join a room; automatically leaves the user's previous room. |
| `leave-room` | client to server | Leave a room. |
| `code:update` | both | Share a code update with other users in the same room. |
| `whiteboard:segment` | both | Share a whiteboard drawing segment with room members. |
| `whiteboard:clear` | both | Clear the whiteboard for other users in the same room. |

The server validates room membership before relaying collaboration events, so updates cannot be sent to a room the sender has not joined.

## Week 2 shared-document sync

The backend uses a Socket.IO transport with Yjs. Each collaboration room owns one in-memory `Y.Doc`; updates and awareness data are only relayed to sockets that belong to that room.

| Event | Direction | Purpose |
| --- | --- | --- |
| `yjs:sync-request` | client to server | Request the current room document state. |
| `yjs:sync` | server to client | Receive a binary Yjs state update for the active room. |
| `yjs:update` | both | Apply and relay a binary Yjs document update to room peers. |
| `awareness:update` | client to server | Publish a display name and optional cursor coordinates. |
| `awareness:changed` | server to client | Receive the current room participant list and cursor metadata. |

Awareness entries are removed when a user leaves, switches rooms, or disconnects.

## Tests

```bash
npm test
```

The integration suite starts the server and verifies that two users in one room receive each other's updates, while users in different rooms remain isolated.
