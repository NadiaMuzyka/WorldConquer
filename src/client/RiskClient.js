import React from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { RiskGame } from '../game';
import { RiskBoard } from '../RiskBoard';

const RiskClientBase = Client({
  game: RiskGame,
  board: RiskBoard,
  multiplayer: SocketIO({ server: 'http://localhost:8000' }),
  debug: true,
});

// Wrapper per supportare ref forwarding
const RiskClient = React.forwardRef((props, ref) => {
  return <RiskClientBase {...props} ref={ref} />;
});

export default RiskClient;
