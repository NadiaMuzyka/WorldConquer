import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { RiskGame } from '../game';
import { RiskBoard } from '../RiskBoard';

const RiskClient = Client({
  game: RiskGame,
  board: RiskBoard,
  multiplayer: SocketIO({ server: 'https://worldconquergame.onrender.com' }),
  debug: false, // Disattiviamo il debug per la versione online
});

export default RiskClient;