const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// W pamięci lista graczy online
let onlinePlayers = [];

// Endpoint do odbierania listy graczy z Roblox
app.post('/api/players', (req, res) => {
  if (Array.isArray(req.body.players)) {
    onlinePlayers = req.body.players;
    res.json({ status: 'ok', count: onlinePlayers.length });
  } else {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Endpoint do sprawdzania czy gracz jest online
app.get('/api/isOnline', (req, res) => {
  const { userId, username } = req.query;
  const found = onlinePlayers.find(
    p => (userId && String(p.userId) === String(userId)) || (username && p.username === username)
  );
  res.json({ online: !!found });
});

// Endpoint do pobrania wszystkich online
app.get('/api/players', (req, res) => {
  res.json({ players: onlinePlayers });
});

// --- SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Mapa userId -> socketId
const userSockets = new Map();

io.on('connection', (socket) => {
  let userId = null;

  socket.on('join-voice', (data) => {
    userId = data.userId;
    userSockets.set(userId, socket.id);
    socket.broadcast.emit('user-joined', { userId });
  });

  socket.on('signal', (data) => {
    const targetSocketId = userSockets.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('signal', {
        fromUserId: userId,
        signal: data.signal
      });
    }
  });

  socket.on('disconnect', () => {
    if (userId) {
      userSockets.delete(userId);
      socket.broadcast.emit('user-left', { userId });
    }
  });
});

server.listen(PORT, () => {
  console.log(`API + Socket.io listening on port ${PORT}`);
});
