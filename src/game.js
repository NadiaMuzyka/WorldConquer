// src/game.js
const { INVALID_MOVE } = require('boardgame.io/core');
const { COUNTRY_COLORS } = require('./components/Constants/colors');

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

  // Mosse Globali (disponibili se non sovrascritte o bloccate dalle fasi)
  moves: {
    clickCountry: ({ G, playerID, events }, countryId) => {
      if (!G.troops) G.troops = {};
      if (!G.owners) G.owners = {};
      if (!G.countryColors) G.countryColors = { ...COUNTRY_COLORS };

      if (G.countryColors[countryId] === undefined) return INVALID_MOVE;

      const currentOwner = G.owners[countryId];

      // Logica di conquista/rinforzo semplificata per esempio
      if (currentOwner === undefined) {
        G.owners[countryId] = String(playerID);
        G.troops[countryId] = 1;
      }
      else if (currentOwner === String(playerID)) {
        G.troops[countryId] += 1;
      }
      else {
        return INVALID_MOVE;
      }

      // Poiché hai rimosso maxMoves globale, è FONDAMENTALE chiamare endTurn()
      // esplicitamente qui se vuoi che il turno passi dopo un click.
      events.endTurn();
    },
  },
  
  // ABBIAMO RIMOSSO LA SEZIONE 'turn' GLOBALE QUI
  // Ora ogni fase gestisce le sue regole di turno.

  phases: {
    SETUP_INITIAL: {
      start: true,
      next: 'RINFORZO_INIZIALE',

      onBegin: ({ G, ctx }) => {
        console.log("🎲 [PHASE START] SETUP_INITIAL iniziata");
        
        if (!ctx || !ctx.numPlayers) {
          console.error("⚠️ ctx non disponibile in onBegin, skip distribuzione");
          return;
        }
        
        const allTerritories = Object.keys(COUNTRY_COLORS);
        
        // Fisher-Yates shuffle
        for (let i = allTerritories.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allTerritories[i], allTerritories[j]] = [allTerritories[j], allTerritories[i]];
        }
        
        G.setupAssignmentOrder = allTerritories;
        
        allTerritories.forEach((countryId, index) => {
          const playerId = String(index % ctx.numPlayers);
          G.owners[countryId] = playerId;
          G.troops[countryId] = 1;
        });
      },

      turn: {
        // Nessun limite di mosse qui (default: infinito)
        // Perfetto per gestire i click sui bottoni senza far scattare endTurn automatici
        
        activePlayers: { all: 'viewing' },
        
        stages: {
          viewing: {
            moves: {
              confirmSetupView: ({ G, ctx, playerID, events }) => {
                console.log(`👤 [MOVE] Player ${playerID} ha cliccato 'Salta Animazione'`);

                if (!G.playersReady) G.playersReady = {};
                G.playersReady[playerID] = true;

                const readyCount = Object.keys(G.playersReady).length;
                const totalPlayers = ctx.numPlayers;

                console.log(`📊 [STATUS] Pronti: ${readyCount} / ${totalPlayers}`);

                if (readyCount === totalPlayers) {
                  // L'ultimo che arriva chiude la porta e cambia fase per tutti
                  console.log("🚀 [ACTION] Tutti pronti -> events.endPhase()");
                  events.endPhase(); 
                } else {
                  // Gli altri aspettano
                  console.log("⏳ [ACTION] Attesa -> events.endStage()");
                  events.endStage();
                }
              }
            }
          }
        }
      },
    },
    
    RINFORZO_INIZIALE: {
      onBegin: ({ G, ctx }) => {
        console.log("🎲 [PHASE START] Fase RINFORZO_INIZIALE");
      },
      
      // Se in questa fase vuoi che dopo 1 mossa passi il turno,
      // ora devi specificarlo QUI, perché non c'è più il globale.
      turn: {
         minMoves: 1,
         maxMoves: 1,
      },
    },
  },
};

module.exports = { RiskGame };