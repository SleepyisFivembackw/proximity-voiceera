import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [robloxName, setRobloxName] = useState("");
  const [robloxId, setRobloxId] = useState("");
  const [micAccess, setMicAccess] = useState(null);

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
        </div>
      )}
    </div>
  );
}

export default App;
