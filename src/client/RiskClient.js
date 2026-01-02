import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { RiskGame } from '../game';
import { RiskBoard } from '../RiskBoard';

const RiskClient = Client({
  game: RiskGame,
  board: RiskBoard,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
  debug: true,
});

export default RiskClient;
