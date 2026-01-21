import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { RiskGame } from '../game';
import { RiskBoard } from '../RiskBoard';

const RiskClient = Client({
  game: RiskGame,
  board: RiskBoard,
  // Configura l'indirizzo del server per ricevere gli eventi 'sync' e 'update' in tempo reale
  multiplayer: SocketIO({ server: 'http://localhost:8000' }),
  debug: true,
});

export default RiskClient;