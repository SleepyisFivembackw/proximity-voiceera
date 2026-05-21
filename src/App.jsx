

  // --- Dynamiczne zarządzanie peerami na podstawie proximity i ptt ---
  useEffect(() => {
    if (!loggedIn || !micAccess || !stream) return;
    // Dla każdego gracza w zasięgu i z ptt: true
    inRange.forEach((p) => {
      if (p.ptt && !peersRef.current[p.userId] && String(p.userId) !== String(robloxId)) {
        createPeer(p.userId, true);
      }
    });
    // Usuwaj peer jeśli gracz wyszedł z zasięgu lub wyłączył ptt
    Object.keys(peersRef.current).forEach((userId) => {
      const player = players.find(p => String(p.userId) === String(userId));
      if (!player || !player.ptt || !inRange.some(p => String(p.userId) === String(userId))) {
        peersRef.current[userId]?.destroy();
        delete peersRef.current[userId];
        setPeers((prev) => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      }
    });
    // eslint-disable-next-line
  }, [players, inRange, micAccess, stream, loggedIn]);
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import "./App.css";

function distance(a, b) {
  if (!a || !b) return Infinity;
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

const SOCKET_URL = "https://proximity-voiceeraapi.onrender.com";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [robloxName, setRobloxName] = useState("");
  const [robloxId, setRobloxId] = useState("");
  const [micAccess, setMicAccess] = useState(null);
  const [players, setPlayers] = useState([]);
  const [peers, setPeers] = useState({});
  const [stream, setStream] = useState(null);
  const socketRef = useRef();
  const peersRef = useRef({});
  const audioRefs = useRef({});

  const handleLogin = (e) => {
    e.preventDefault();
    if (robloxName && robloxId) {
      setLoggedIn(true);
    }
  };

  useEffect(() => {
    if (loggedIn && micAccess === null) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((s) => {
          setMicAccess(true);
          setStream(s);
        })
        .catch(() => setMicAccess(false));
    }
  }, [loggedIn, micAccess]);

  // Pobieranie listy graczy z backendu
  // Socket.io + WebRTC logic
  useEffect(() => {
    if (loggedIn && micAccess && stream && robloxId) {
      socketRef.current = io(SOCKET_URL);
      socketRef.current.emit("join-voice", { userId: robloxId });

      socketRef.current.on("user-joined", ({ userId }) => {
        // Initiate peer connection if in range
        if (!peersRef.current[userId] && userId !== String(robloxId)) {
          createPeer(userId, true);
        }
      });

      socketRef.current.on("signal", ({ fromUserId, signal }) => {
        if (!peersRef.current[fromUserId]) {
          createPeer(fromUserId, false);
        }
        peersRef.current[fromUserId]?.signal(signal);
      });

      socketRef.current.on("user-left", ({ userId }) => {
        if (peersRef.current[userId]) {
          peersRef.current[userId].destroy();
          delete peersRef.current[userId];
          setPeers((prev) => {
            const copy = { ...prev };
            delete copy[userId];
            return copy;
          });
        }
      });
    }
    // Cleanup
    return () => {
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      if (socketRef.current) socketRef.current.disconnect();
    };
    // eslint-disable-next-line
  }, [loggedIn, micAccess, stream, robloxId]);

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

  // Peer connection logic
  function createPeer(userId, initiator) {
    if (!stream) return;
    const peer = new Peer({ initiator, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { targetUserId: userId, signal });
    });
    peer.on("stream", (remoteStream) => {
      setPeers((prev) => ({ ...prev, [userId]: remoteStream }));
    });
    peer.on("close", () => {
      setPeers((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });
    peersRef.current[userId] = peer;
  }

  // Znajdź siebie na liście graczy
  const me = players.find(p => String(p.userId) === String(robloxId));
  // Lista graczy w zasięgu voice (niezależnie od ptt)
  const inRange = players.filter(p =>
    p.position && me && distance(me.position, p.position) <= 43 && String(p.userId) !== String(robloxId)
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
          {/* Odtwarzanie dźwięku od graczy z aktywnym PTT */}
          {Object.entries(peers).map(([userId, remoteStream]) => {
            // znajdź gracza po userId
            const player = players.find(p => String(p.userId) === String(userId));
            // tylko jeśli gracz jest w zasięgu i ma ptt: true
            if (!player || !player.ptt || !inRange.some(p => String(p.userId) === String(userId))) return null;
            return (
              <audio
                key={userId}
                ref={el => { if (el) el.srcObject = remoteStream; }}
                autoPlay
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
