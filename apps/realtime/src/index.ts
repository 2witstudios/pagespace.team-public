import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server, Socket } from 'socket.io';
import { getUserAccessLevel, decodeToken } from '@pagespace/lib';
import * as dotenv from 'dotenv';
import { db, eq } from '@pagespace/db';
import { users } from '@pagespace/db/src/schema/auth';

dotenv.config();

const requestListener = (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'POST' && req.url === '/api/broadcast') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { channelId, event, payload } = JSON.parse(body);
                if (channelId && event && payload) {
                    io.to(channelId).emit(event, payload);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid broadcast payload' }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
};

const httpServer = createServer(requestListener);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
});

interface AuthSocket extends Socket {
  data: {
    user?: {
      id: string;
    };
  };
}

io.use(async (socket: AuthSocket, next) => {
  const { token } = socket.handshake.auth;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }

  const decoded = await decodeToken(token);
  if (!decoded) {
    return next(new Error('Authentication error: Invalid token.'));
  }

  try {
    const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
        columns: {
            id: true,
            tokenVersion: true,
        },
    });

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return next(new Error('Authentication error: Invalid token version.'));
    }

    socket.data.user = { id: user.id };
    next();
  } catch (error) {
    console.error('Error during authentication:', error);
    return next(new Error('Authentication error: Server failed.'));
  }
});

io.on('connection', (socket: AuthSocket) => {
  console.log('A user connected:', socket.id);
  const user = socket.data.user;

  socket.on('join_channel', async (pageId: string) => {
    if (!user?.id) return;

    try {
      const accessLevel = await getUserAccessLevel(user.id, pageId);
      if (accessLevel) {
        socket.join(pageId);
        console.log(`User ${user.id} joined channel ${pageId}`);
      } else {
        console.log(`User ${user.id} denied access to channel ${pageId}`);
        socket.disconnect();
      }
    } catch (error) {
      console.error(`Error joining channel ${pageId}:`, error);
      socket.disconnect();
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`> Socket.IO server ready on http://localhost:${PORT}`);
});