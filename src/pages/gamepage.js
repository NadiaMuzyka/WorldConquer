import React, { useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import GameModule from '../game';
import { RiskBoard } from '../RiskBoard';

const { RiskGame } = GameModule;
// --- 2. COMPONENTE PARTITA (Il Client di Boardgame.io) ---
const GamePage = () => {
  // Leggiamo il matchID dalla URL (es: /lobby/partita123 -> matchID = "partita123")
  const { matchID } = useParams();
  const { state } = useLocation();
  
  // Recuperiamo il playerID passato dalla lobby; fallback "0" per evitare undefined
  const playerID = state?.playerID ?? "0";

  // Configurazione del Client
  const RiskClient = useMemo(() => Client({
      game: RiskGame,
      board: RiskBoard,
      numPlayers: 3,
      multiplayer: SocketIO({ server: 'localhost:8000' }),
      debug: true, 
    }), []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ padding: '10px', background: '#333', color: 'white', textAlign: 'center' }}>
          Player: <strong>{playerID}</strong>   Partita: <strong>{matchID}</strong>
      </div>
      <RiskClient matchID={matchID} playerID={playerID} />
    </div>
  );
};

export default GamePage;