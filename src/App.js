// src/App.js
import React from 'react';
import { Client } from 'boardgame.io/react';
import { RiskGame } from './game';       // La nostra logica
import { RiskBoard } from './RiskBoard'; // La nostra vista

const RiskClient = Client({
  game: RiskGame,
  board: RiskBoard,
  debug: true, // Utilissimo! Mostra lo stato G sulla destra
});

const App = () => <RiskClient />;

export default App;