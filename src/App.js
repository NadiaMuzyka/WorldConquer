// src/App.js
import React from 'react';
import LobbyPage from './pages/lobbypage';
import GamePage from './pages/gamepage';


// --- 3. APP PRINCIPALE CON LE ROTTE ---
// In Data Mode, App.js può essere una semplice shell o vuoto, oppure puoi esportare solo le pagine.
// Esportiamo le pagine per l'uso in Routes.js
export { LobbyPage, GamePage };