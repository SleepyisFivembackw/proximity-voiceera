import React, { useState } from "react";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [robloxName, setRobloxName] = useState("");
  const [robloxId, setRobloxId] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (robloxName && robloxId) {
      setLoggedIn(true);
    }
  };

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
      ) : (
        <div className="voice-connected">
          <span className="dot" /> Voice connected
        </div>
      )}
    </div>
  );
}

export default App;
