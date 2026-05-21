const express = require('express');
const cors = require('cors');
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

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
