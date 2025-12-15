// src/App.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { RiskGame } from './game';  
import { RiskBoard } from './RiskBoard'; // La tua board grafica

// --- 1. COMPONENTE LOBBY
const LobbyPage = () => {
  const navigate = useNavigate();

  const joinMatch = (playerID, matchID) => {
    navigate(`/game/${matchID}`, { state: { playerID } });
  };

  const styles = {
    lobbyContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' },
    buttonGroup: { display: 'flex', gap: '20px' },
    btn: { padding: '15px 30px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }
  };

  return (
    <div style={styles.lobbyContainer}>
      <h1>Risiko Multiplayer Lobby</h1>
      <p>Scegli il tuo giocatore per entrare nella partita "partita-test-6"</p>
      <div style={styles.buttonGroup}>
        <button style={{...styles.btn, background: 'red'}} onClick={() => joinMatch("0", "partita-test-6")}>
          Player 1 (Rosso)
        </button>
        <button style={{...styles.btn, background: 'blue'}} onClick={() => joinMatch("1", "partita-test-6")}>
          Player 2 (Blu)
        </button>
        <button style={{...styles.btn, background: 'green'}} onClick={() => joinMatch("2", "partita-test-6")}>
          Player 3 (Verde)
        </button>
      </div>
    </div>
  ); 
};

// --- 2. COMPONENTE PARTITA (Il Client di Boardgame.io) ---
const GamePage = () => {
  // Leggiamo il matchID dalla URL (es: /lobby/partita123 -> matchID = "partita123")
  const { matchID } = useParams();
  
  // Recuperiamo il playerID (in questo esempio semplice lo passo via navigazione o lo fisso per test)
  // In un'app reale, useresti un contesto o localStorage.
  // Qui per semplicità assumiamo che se manca ti rimanda alla home o usa "0" di default per test.
  const [playerID] = useState("0"); 

  // Configurazione del Client
  const RiskClient = Client({
    game: RiskGame,
    board: RiskBoard,
    numPlayers: 3,
    multiplayer: SocketIO({ server: 'localhost:8000' }),
    debug: true, 
  });

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ padding: '10px', background: '#333', color: 'white', textAlign: 'center' }}>
         Partita URL: <strong>{matchID}</strong>
      </div>
      <RiskClient matchID={matchID} playerID={playerID} />
    </div>
  );
};

// --- 3. APP PRINCIPALE CON LE ROTTE ---
// In Data Mode, App.js può essere una semplice shell o vuoto, oppure puoi esportare solo le pagine.
// Esportiamo le pagine per l'uso in Routes.js
export { LobbyPage, GamePage };