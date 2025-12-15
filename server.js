// server.js
const { Server, Origins } = require('boardgame.io/server');
const { RiskGame } = require('./src/game'); 

const server = Server({
  games: [RiskGame],
  origins: [Origins.LOCALHOST], // Accetta connessioni da localhost:3000
});

server.run(8000, () => {
  console.log("🚀 SERVER RISIKO ATTIVO sulla porta 8000");
});