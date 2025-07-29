# Integration: Socket.IO

This document outlines how pagespace integrates with Socket.IO for real-time communication.

## Architecture Overview

pagespace uses a dedicated, standalone Socket.IO server for handling real-time, event-based communication. This server runs as a separate Node.js process, distinct from the main Next.js web application. This separation ensures that long-lived, stateful socket connections do not interfere with the stateless, serverless-first nature of the Next.js application.

-   **Realtime Server (`apps/realtime`):** A standalone Node.js application responsible for managing all WebSocket connections, authentication, and event broadcasting.
-   **Web Client (`apps/web`):** The main Next.js application connects to the realtime server as a client to send and receive live updates.
-   **Backend-to-Realtime Communication:** When a backend API route in the Next.js app needs to trigger a real-time event, it makes an HTTP POST request to a special `/api/broadcast` endpoint on the realtime server. The realtime server then broadcasts the message to the appropriate clients.

## Server-Side Implementation (`apps/realtime`)

The entire server-side logic is contained within [`apps/realtime/src/index.ts`](apps/realtime/src/index.ts:1).

### 1. Server Initialization

The server is a standard Node.js HTTP server with Socket.IO attached. The CORS configuration is set to allow connections from our web application's URL, which is defined by the `CORS_ORIGIN` environment variable.

```typescript
// apps/realtime/src/index.ts
const httpServer = createServer(requestListener);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});
```

### 2. Authentication Middleware

Connections are authenticated using a custom middleware. The client is expected to send a JWT (`accessToken`) in the `socket.handshake.auth` payload.

The middleware performs the following checks:
1.  Decodes the token using the shared `@pagespace/lib` utility.
2.  Verifies the user exists in the database.
3.  Checks the `tokenVersion` to ensure the token hasn't been invalidated by a password change or logout.

If authentication is successful, the user's ID is attached to the `socket.data` object for use in subsequent events.

```typescript
// apps/realtime/src/index.ts
io.use(async (socket: AuthSocket, next) => {
  const { token } = socket.handshake.auth;
  // ... authentication logic ...
  socket.data.user = { id: user.id };
  next();
});
```

### 3. Channel & Event Handling

-   **`join_channel`:** After connecting, the client must emit a `join_channel` event with a `pageId`. The server verifies that the authenticated user has at least read access to that page before adding the socket to the corresponding room (named after the `pageId`). This ensures users only receive events for pages they are authorized to view.
-   **`disconnect`:** Standard event for logging when a user disconnects.

### 4. Broadcast Endpoint (`/api/broadcast`)

To allow the main Next.js backend to trigger events, the realtime server exposes a simple HTTP endpoint. The backend can send a POST request with a `channelId`, `event` name, and `payload`. The realtime server then broadcasts this payload to all clients in the specified channel.

This is primarily used for the `new_message` event in channels.

## Client-Side Implementation (`apps/web`)

The primary client-side implementation can be found in the [`ChannelView.tsx`](apps/web/src/components/layout/middle-content/page-views/channel/ChannelView.tsx:1) component.

### 1. Establishing a Connection

The client connects to the realtime server using the URL from the `NEXT_PUBLIC_REALTIME_URL` environment variable. It retrieves the `accessToken` from the browser's cookies and sends it in the `auth` payload for the authentication middleware.

```typescript
// apps/web/src/components/layout/middle-content/page-views/channel/ChannelView.tsx
useEffect(() => {
  if (!user) return;

  const socketUrl = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:3001';
  const socket = io(socketUrl, {
    auth: {
      token: document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1],
    },
  });
  socketRef.current = socket;
  // ...
}, [page.id, user]);
```

### 2. Joining Channels and Handling Events

Once connected, the client immediately emits the `join_channel` event. It then sets up a listener for the `new_message` event to receive and display new messages in real-time.

```typescript
// apps/web/src/components/layout/middle-content/page-views/channel/ChannelView.tsx
socket.emit('join_channel', page.id);

const handleNewMessage = (message: MessageWithUser) => {
  setMessages((prev) => [...prev, message]);
};

socket.on('new_message', handleNewMessage);
```

## Event Reference

| Event Name      | Direction           | Description                                                                                             |
| --------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| `join_channel`  | Client → Server     | Requests to join a specific page's room. The server validates permissions before allowing the join.     |
| `new_message`   | Server → Client     | Broadcasts a new message to all clients in a specific channel room.                                     |

## Environment Variables

To run the real-time system locally, ensure the following variables are set:

-   **Realtime Server Environment Variables:**
    -   `CORS_ORIGIN`: The full URL of the web client (e.g., `http://localhost:3000`). In Docker Compose, this is set to `${NEXT_PUBLIC_REALTIME_URL}`.
    -   `PORT`: The port for the realtime server to run on (e.g., `3001`).
-   **Web Client Environment Variables:**
    -   `NEXT_PUBLIC_REALTIME_URL`: The full URL of the realtime server (e.g., `http://localhost:3001`).