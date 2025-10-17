// socket.js
const { createAdapter } = require('@socket.io/redis-adapter');
const { Server } = require('socket.io');
const IORedis = require('ioredis');
const jwt = require('jsonwebtoken');

let io;

function buildRedisAdapter() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const pubClient = new IORedis(url);
  const subClient = pubClient.duplicate();
  return createAdapter(pubClient, subClient);
}

// basit JWT doğrulama (handshake.query.token veya auth header)
function authenticateSocket(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      (socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');

    if (!token) return next(new Error('no token'));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    next(new Error('unauthorized'));
  }
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET','POST'] },
  });

  const adapter = buildRedisAdapter();
  if (adapter) io.adapter(adapter);

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    // oda mantığı: project:{id}
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      socket.emit('joined', { room: `project:${projectId}` });
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('ping', () => socket.emit('pong', { t: Date.now() }));
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
