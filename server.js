// server.js (VERSIONE CORRETTA - RAM ONLY)
const { Server, Origins } = require('boardgame.io/server');
const { RiskGame } = require('./src/game'); 

const server = Server({
  // 1. Carichiamo il gioco
  games: [RiskGame],

  // 2. ABILITIAMO CORS (Fondamentale per far parlare React porta 3000 con Server porta 8000)
  origins: [Origins.LOCALHOST], 
  
  // 3. NESSUN DATABASE (db: ...)
  // Il server userà la RAM. Veloce, zero conflitti con la Lobby.
});

server.run(8000, () => {
  console.log("🚀 SERVER RISIKO (RAM) ATTIVO sulla porta 8000");
});