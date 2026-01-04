// src/game.js
const { INVALID_MOVE, ActivePlayers } = require('boardgame.io/core');
const { COUNTRY_COLORS } = require('./components/Constants/colors');

// Definiamo il gioco (CommonJS per compatibilità con server.js)
const RiskGame = {
  name: 'risk',
  disableUndo: true,  
  // 1. SETUP: Inizializziamo truppe e proprietari vuoti
  setup: () => ({
    troops: {},  // Mappa ID_PAESE -> NUMERO TRUPPE
    owners: {},  // Mappa ID_PAESE -> PLAYER_ID ("0", "1", "2")
    setupAssignmentOrder: [], // Array di countryId in ordine di assegnazione
    playersReady: {}, // Mappa PLAYER_ID -> boolean
  }),

  moves: {
    // Conferma che il giocatore ha visto il setup
    confirmSetupView: ({ G, playerID }) => {
      if (!G.playersReady) G.playersReady = {};
      G.playersReady[playerID] = true;
    },
    clickCountry: ({ G, playerID, events }, countryId) => {
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
  },

  phases: {
    SETUP_INITIAL: {
      start: true,
      // CORREZIONE QUI: Sintassi ({ G, ctx })
      onBegin: ({ G, ctx }) => {
        console.log("🎲 Fase SETUP_INITIAL iniziata");
        // console.log("DEBUG ctx:", ctx); // Decommenta se serve debug
        
        // Controllo di sicurezza
        if (!ctx || !ctx.numPlayers) {
          console.error("⚠️ ctx non disponibile in onBegin, skip distribuzione");
          return;
        }
        
        // Ottieni tutti i territori
        const allTerritories = Object.keys(COUNTRY_COLORS);
        
        // Fisher-Yates shuffle
        for (let i = allTerritories.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allTerritories[i], allTerritories[j]] = [allTerritories[j], allTerritories[i]];
        }
        
        // Salva ordine shufflato
        G.setupAssignmentOrder = allTerritories;
        
        // Distribuisci territori round-robin
        allTerritories.forEach((countryId, index) => {
          const playerId = String(index % ctx.numPlayers);
          G.owners[countryId] = playerId;
          G.troops[countryId] = 1;
        });
      },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
      // CORREZIONE ANCHE QUI: ({ G, ctx }) per evitare crash su ctx.numPlayers
      endIf: ({ G, ctx }) => {
        // Controllo di sicurezza
        if (!G.playersReady || typeof G.playersReady !== 'object') {
          return false;
        }
        return Object.keys(G.playersReady).length === ctx.numPlayers;
      },
      next: 'RINFORZO_INIZIALE',
    },
    
    RINFORZO_INIZIALE: {
      // CORREZIONE ANCHE QUI per coerenza
      onBegin: ({ G, ctx }) => {
        console.log("🎲 Fase RINFORZO_INIZIALE - Coming soon!");
      },
    },
  },
};

module.exports = { RiskGame };