// src/game.js
const { INVALID_MOVE } = require('boardgame.io/core');
const { COUNTRY_COLORS } = require('./components/Constants/colors');

// Definiamo il gioco (CommonJS per compatibilità con server.js)
const RiskGame = {
  name: 'risk',
  // 1. SETUP: Inizializziamo truppe e proprietari vuoti
  setup: () => ({
    countryColors: { ...COUNTRY_COLORS }, // Colori estetici mappa
    troops: {},  // Mappa ID_PAESE -> NUMERO TRUPPE
    owners: {},  // Mappa ID_PAESE -> PLAYER_ID ("0", "1", "2")
  }),

  moves: {
    clickCountry: ({ G, playerID, events }, countryId) => {
      //if (!playerID) return INVALID_MOVE; // deve esistere un giocatore

      // Assicura la forma dello stato
      if (!G.troops) G.troops = {};
      if (!G.owners) G.owners = {};
      if (!G.countryColors) G.countryColors = { ...COUNTRY_COLORS };

      // ID valido?
      if (G.countryColors[countryId] === undefined) return INVALID_MOVE;

      const currentOwner = G.owners[countryId];

      // Caso 1: Terra di nessuno -> Diventa mia
      if (currentOwner === undefined) {
        G.owners[countryId] = String(playerID); // usa gli ID nativi "0","1","2"
        G.troops[countryId] = 1;
      }
      // Caso 2: È già mia -> Rinforzo
      else if (currentOwner === String(playerID)) {
        G.troops[countryId] += 1;
      }
      // Caso 3: Nemica -> mossa non valida
      else {
        return INVALID_MOVE;
      }

      events.endTurn();
    },
  },
  
  turn: {
    minMoves: 1,
    maxMoves: 1,
  }
};

module.exports = { RiskGame };