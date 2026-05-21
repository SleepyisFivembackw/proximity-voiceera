import React, { useState, useEffect } from "react";
import "./App.css";

function distance(a, b) {
  if (!a || !b) return Infinity;
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [robloxName, setRobloxName] = useState("");
  const [robloxId, setRobloxId] = useState("");
  const [micAccess, setMicAccess] = useState(null);
  const [players, setPlayers] = useState([]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (robloxName && robloxId) {
      setLoggedIn(true);
    }
  };

  useEffect(() => {
    if (loggedIn && micAccess === null) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => setMicAccess(true))
        .catch(() => setMicAccess(false));
    }
  }, [loggedIn, micAccess]);

  // Pobieranie listy graczy z backendu
  useEffect(() => {
    if (loggedIn) {
      const interval = setInterval(() => {
        fetch('https://proximity-voiceeraapi.onrender.com/api/players')
          .then(res => res.json())
          .then(data => setPlayers(data.players || []));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loggedIn]);

  // Znajdź siebie na liście graczy
  const me = players.find(p => String(p.userId) === String(robloxId));
  // Lista graczy w zasięgu voice
  const inRange = players.filter(p =>
    p.ptt && p.position && me && distance(me.position, p.position) <= 43 && String(p.userId) !== String(robloxId)
  );

  return (
    <div className="container">
      {!loggedIn ? (
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Login Roblox</h2>
          <input
            type="text"
            placeholder="Nazwa Roblox"
            value={robloxName}
            onChange={(e) => setRobloxName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="ID Roblox"
            value={robloxId}
            onChange={(e) => setRobloxId(e.target.value)}
            required
          />
          <button type="submit">Zaloguj się</button>
        </form>
      ) : micAccess === null ? (
        <div className="voice-connected">Proszę zezwolić na dostęp do mikrofonu...</div>
      ) : micAccess === false ? (
        <div className="voice-connected" style={{color: 'red'}}>Brak dostępu do mikrofonu!</div>
      ) : (
        <div className="voice-connected">
          <span className="dot" /> Voice connected
          <div style={{marginTop: 16}}>
            <b>Gracze w zasięgu voice (≤ 43 studs):</b>
            <ul>
              {inRange.length === 0 && <li>Brak graczy w zasięgu</li>}
              {inRange.map(p => (
                <li key={p.userId}>{p.username} (ID: {p.userId})</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
