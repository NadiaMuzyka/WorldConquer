// src/game.js
const { INVALID_MOVE, ActivePlayers } = require('boardgame.io/core');
const { COUNTRY_COLORS } = require('./components/Constants/colors');

// Definiamo il gioco (CommonJS per compatibilità con server.js)
const RiskGame = {
  name: 'risk',
  disableUndo: true,  
  // 1. SETUP: Inizializziamo truppe e proprietari vuoti
  setup: () => ({
    isGameStarted: false, // Diventa true quando l'ultimo giocatore entra
    troops: {},  // Mappa ID_PAESE -> NUMERO TRUPPE
    owners: {},  // Mappa ID_PAESE -> PLAYER_ID ("0", "1", "2")
    setupAssignmentOrder: [], // Array di countryId in ordine di assegnazione
    playersReady: {}, // Mappa PLAYER_ID -> boolean
  }),

  moves: {
    // Move per far partire il gioco quando tutti i giocatori sono connessi
    startGamePhase: ({ G, events }) => {
      if (!G.isGameStarted) {
        G.isGameStarted = true;
        events.setPhase('SETUP_INITIAL');
      }
    },
    
    // Conferma che il giocatore ha visto il setup
    confirmSetupView: ({ G, playerID }) => {
      if (!G.playersReady) G.playersReady = {};
      G.playersReady[playerID] = true;
    },
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
  },

  phases: {
    WAITING: {
      start: true,
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
      moves: {
        startGamePhase: ({ G, events }) => {
          if (!G.isGameStarted) {
            G.isGameStarted = true;
            events.setPhase('SETUP_INITIAL');
          }
        },
      },
    },
    
    SETUP_INITIAL: {
      onBegin: (G, ctx) => {
        console.log("🎲 Fase SETUP_INITIAL iniziata");
        
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
        
        // Inizializza stato ready
        G.playersReady = {};
      },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
      endIf: (G, ctx) => {
        return Object.keys(G.playersReady).length === ctx.numPlayers;
      },
      next: 'RINFORZO_INIZIALE',
    },
    
    RINFORZO_INIZIALE: {
      // Placeholder per fase futura
      onBegin: (G, ctx) => {
        console.log("🎲 Fase RINFORZO_INIZIALE - Coming soon!");
      },
    },
  },
};

module.exports = { RiskGame };