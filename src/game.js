// src/game.js
const { TurnOrder } = require('boardgame.io/core');
const { COUNTRY_COLORS } = require('./components/Constants/colors');

const RiskGame = {
  name: 'risk',
  disableUndo: true,

  // 1. SETUP: Inizializziamo truppe e proprietari vuoti
  setup: () => ({
    troops: {},  // Mappa ID_PAESE -> NUMERO TRUPPE
    owners: {},  // Mappa ID_PAESE -> PLAYER_ID ("0", "1", "2")
  }),

  phases: {
    SETUP_INITIAL: {
      start: true,
      next: 'INITIAL_REINFORCEMENT',

      onBegin: ({ G, ctx }) => {
        console.log("🎲 [PHASE START] SETUP_INITIAL iniziata");

        G.playersReady = {}; 
        G.setupAssignmentOrder = [];
        
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

    INITIAL_REINFORCEMENT: {
      next: 'GAME',

      onBegin: ({ G, ctx }) => {
        delete G.setupAssignmentOrder;
        delete G.playersReady;
        console.log("🎲 [PHASE START] Fase INITIAL_REINFORCEMENT");

        G.reinforcementsRemaining = {};
        G.turnPlacements = [];
        
        // Calcola le truppe iniziali in base al numero di giocatori
        const totalTroops = {
          3: 35, 4: 30, 5: 25, 6: 20,
        };

        const troopsPerPlayer = totalTroops[ctx.numPlayers] || 20;

        // Inizializza i rinforzi rimanenti per ogni giocatore
        // Sottrai 1 per ogni territorio già posseduto (piazzato in SETUP_INITIAL)
        G.reinforcementsRemaining = {};
        for (let i = 0; i < ctx.numPlayers; i++) {
          const playerId = String(i);
          // Conta i territori posseduti dal giocatore
          const territoriesOwned = Object.values(G.owners).filter(
            owner => owner === playerId
          ).length;

          G.reinforcementsRemaining[playerId] = troopsPerPlayer - territoriesOwned;
        }

        G.turnPlacements = [];
        console.log("📊 [REINFORCEMENTS] Truppe rimanenti:", G.reinforcementsRemaining);
      },

      // La fase finisce quando tutti i giocatori hanno 0 truppe rimanenti
      endIf: ({ G }) => {
        // Verifica che reinforcementsRemaining sia stato inizializzato
        if (!G.reinforcementsRemaining) return false;

        const allDone = Object.values(G.reinforcementsRemaining).every(
          remaining => remaining === 0
        );
        if (allDone) {
          console.log("✅ [PHASE END] Tutti i giocatori hanno completato i rinforzi");
        }
        return allDone;
      },

      onEnd: ({ G }) => {
        console.log("🎲 [PHASE TRANSITION] INITIAL_REINFORCEMENT -> GAME");
        // Pulizia dello stato temporaneo
        delete G.turnPlacements;
      },

      turn: {
        order: TurnOrder.RESET, // Resetta l'ordine dei turni all'inizio della fase
        
        onBegin: ({ G, ctx, events }) => {
          // Reset dei piazzamenti del turno
          G.turnPlacements = [];
          console.log(`🔄 [TURN START] Player ${ctx.currentPlayer} - Truppe rimanenti: ${G.reinforcementsRemaining[ctx.currentPlayer]}`);

          // Auto-skip se il giocatore non ha più truppe da piazzare
          if (G.reinforcementsRemaining[ctx.currentPlayer] === 0) {
            console.log(`⏭️ [AUTO-SKIP] Player ${ctx.currentPlayer} ha finito i rinforzi`);
            events.endTurn();
          }
        },
      },

      moves: {
        placeReinforcement: ({ G, ctx, playerID }, countryId) => {
          const currentPlayer = String(playerID);

          // Inizializza turnPlacements se non esiste
          if (!G.turnPlacements) {
            G.turnPlacements = [];
          }

          // Validazione 1: Il territorio deve appartenere al giocatore
          if (G.owners[countryId] !== currentPlayer) {
            console.warn(`❌ [INVALID] Player ${currentPlayer} non possiede ${countryId}`);
            return;
          }

          // Validazione 2: Il giocatore deve avere truppe rimanenti
          if (G.reinforcementsRemaining[currentPlayer] <= 0) {
            console.warn(`❌ [INVALID] Player ${currentPlayer} non ha truppe rimanenti`);
            return;
          }

          // Validazione 3: Limite di 3 truppe per turno (o meno se ne rimangono meno)
          const maxTroopsThisTurn = Math.min(3, G.reinforcementsRemaining[currentPlayer] + G.turnPlacements.length);
          if (G.turnPlacements.length >= maxTroopsThisTurn) {
            console.warn(`❌ [INVALID] Player ${currentPlayer} ha già piazzato ${G.turnPlacements.length}/${maxTroopsThisTurn} truppe questo turno`);
            return;
          }

          // Aggiungi la truppa
          G.troops[countryId] = (G.troops[countryId] || 0) + 1;
          G.reinforcementsRemaining[currentPlayer] -= 1;
          G.turnPlacements.push(countryId);

          console.log(`✅ [PLACE] Player ${currentPlayer} piazza truppa in ${countryId} (${G.turnPlacements.length}/${maxTroopsThisTurn} questo turno, ${G.reinforcementsRemaining[currentPlayer]} rimanenti)`);
        },

        removeReinforcement: ({ G, ctx, playerID }, countryId) => {
          const currentPlayer = String(playerID);

          // Inizializza turnPlacements se non esiste
          if (!G.turnPlacements) {
            G.turnPlacements = [];
          }

          // Validazione: Il territorio deve essere nei piazzamenti di questo turno
          const index = G.turnPlacements.indexOf(countryId);
          if (index === -1) {
            console.warn(`❌ [INVALID] ${countryId} non è stato piazzato in questo turno`);
            return;
          }

          // Rimuovi la truppa
          G.troops[countryId] -= 1;
          G.reinforcementsRemaining[currentPlayer] += 1;
          G.turnPlacements.splice(index, 1);

          console.log(`↩️ [REMOVE] Player ${currentPlayer} rimuove truppa da ${countryId} (${G.turnPlacements.length} piazzate questo turno, ${G.reinforcementsRemaining[currentPlayer]} rimanenti)`);
        },

        endPlayerTurn: ({ G, ctx, events, playerID }) => {
          const currentPlayer = String(playerID);

          // Inizializza turnPlacements se non esiste
          if (!G.turnPlacements) {
            G.turnPlacements = [];
          }

          const maxTroopsThisTurn = Math.min(3, G.reinforcementsRemaining[currentPlayer] + G.turnPlacements.length);

          // Validazione: Deve aver piazzato tutte le truppe del turno
          if (G.turnPlacements.length < maxTroopsThisTurn) {
            console.warn(`❌ [INVALID] Player ${currentPlayer} deve piazzare ${maxTroopsThisTurn} truppe (ne ha piazzate ${G.turnPlacements.length})`);
            return;
          }

          console.log(`✅ [END TURN] Player ${currentPlayer} passa il turno`);
          events.endTurn();
        },
      },
    },

    GAME: {
      onBegin: ({ G, ctx }) => {
        console.log("🎲 [PHASE START] Fase GAME iniziata");
        // Pulizia finale dello stato di reinforcement
        delete G.reinforcementsRemaining;
      },

      turn: {
        minMoves: 1,
        maxMoves: 1,
      },

      // Placeholder: implementeremo le fasi di gioco in seguito
    },
  },
};

module.exports = { RiskGame };