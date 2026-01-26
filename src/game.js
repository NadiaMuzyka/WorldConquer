// src/game.js
const { TurnOrder, PlayerView } = require('boardgame.io/core');
const { COUNTRY_COLORS, PLAYER_COLORS } = require('./components/Constants/colors');
const { CONTINENTS_DATA } = require('./components/Constants/mapData');
const { RISK_ADJACENCY } = require('./components/Constants/adjacency');
const { PHASE_TIMEOUTS } = require('./components/Constants/timeouts');

// Helpers moved to src/gameHelpers.js
const { generateDeck, validateCardCombination, autoPlaceTroops, handlePlayerExit, assignSecretObjectives, checkVictoryCondition } = require('./gameHelpers');

const RiskGame = {
  name: 'risk',
  disableUndo: true,
  playerView: PlayerView.STRIP_SECRETS,

  // 1. SETUP: Inizializziamo truppe e proprietari vuoti
  setup: ({ ctx }) => {
    const players = {};
    const hasLeft = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      const playerId = String(i);
      players[playerId] = {
        secretObjective: null,
        cards: [], // Carte del giocatore (protette da PlayerView.STRIP_SECRETS)
      };
      hasLeft[playerId] = false; // Inizializza esplicitamente a false
    }
    
    return {
      troops: {},  // Mappa ID_PAESE -> NUMERO TRUPPE
      owners: {},  // Mappa ID_PAESE -> PLAYER_ID ("0", "1", "2")
      players,     // Oggetto segreto per player con obiettivi e carte
      hasLeft,     // Tracking giocatori che hanno abbandonato (playerID -> false/true)
      deck: generateDeck(), // Mazzo centrale di carte (41 carte)
      conqueredThisTurn: {}, // Tracking per "1 carta per turno" (playerID -> boolean)
    };
  },

  phases: {
    SETUP_INITIAL: {
      start: true,
      next: 'INITIAL_REINFORCEMENT',

      onBegin: ({ G, ctx }) => {
        console.log("🎲 [PHASE START] SETUP_INITIAL iniziata");

        G.playersReady = {}; 
        G.setupAssignmentOrder = [];
        G.turnStartTime = Date.now();
        
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
              },
              
              checkTimeout: ({ G, ctx, events }) => {
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK] SETUP_INITIAL - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.SETUP_INITIAL) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.SETUP_INITIAL/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] SETUP_INITIAL scaduto! Forzando Ready per tutti i giocatori`);
                
                // Forza Ready per tutti i giocatori non pronti
                if (!G.playersReady) G.playersReady = {};
                for (let i = 0; i < ctx.numPlayers; i++) {
                  const playerId = String(i);
                  if (!G.playersReady[playerId]) {
                    G.playersReady[playerId] = true;
                    console.log(`  ↳ Player ${playerId} forzato a Ready`);
                  }
                }
                
                events.endPhase();
              }
            }
          },
        }
      },
      
      onEnd: ({ G, ctx }) => {
        console.log("🎯 [PHASE END] SETUP_INITIAL -> Assegnazione obiettivi segreti");
        assignSecretObjectives(G, ctx);
      },
    },

    INITIAL_REINFORCEMENT: {
      next: 'GAME',

      onBegin: ({ G, ctx }) => {
        delete G.setupAssignmentOrder;
        delete G.playersReady;
        delete G.turnStartTime;
        console.log("🎲 [PHASE START] Fase INITIAL_REINFORCEMENT");

        G.reinforcementsRemaining = {};
        G.turnPlacements = [];
        
        // Calcola le truppe iniziali in base al numero di giocatori
        const totalTroops = {
          3: 15, 4: 30, 5: 25, 6: 20, //RICORDATI DI RIMETTERE 35 TRUPPE PER 3 GIOCATORI
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
        
        activePlayers: {
          currentPlayer: 'reinforcement',  // Stage per piazzare truppe
          others: 'monitoring'              // Solo checkTimeout
        },
        
        onBegin: ({ G, ctx, events }) => {
          // Reset dei piazzamenti del turno
          G.turnPlacements = [];
          G.turnStartTime = Date.now();
          console.log(`🔄 [TURN START] Player ${ctx.currentPlayer} - Truppe rimanenti: ${G.reinforcementsRemaining[ctx.currentPlayer]}`);
          console.log(`  ↳ activePlayers:`, JSON.stringify(ctx.activePlayers));
          console.log(`  ↳ hasLeft:`, JSON.stringify(G.hasLeft));

          // Auto-skip se il giocatore ha abbandonato
          if (G.hasLeft?.[ctx.currentPlayer]) {
            console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
            const remaining = G.reinforcementsRemaining[ctx.currentPlayer] || 0;
            const toPlace = Math.min(3, remaining);
            if (toPlace > 0) {
              autoPlaceTroops(G, ctx, ctx.currentPlayer, toPlace);
              G.reinforcementsRemaining[ctx.currentPlayer] -= toPlace;
              console.log(`  ↳ Auto-piazzate ${toPlace} truppe`);
            }
            events.endTurn();
            return;
          }

          // Auto-skip se il giocatore non ha più truppe da piazzare
          if (G.reinforcementsRemaining[ctx.currentPlayer] === 0) {
            console.log(`⏭️ [AUTO-SKIP] Player ${ctx.currentPlayer} ha finito i rinforzi`);
            events.endTurn();
          }
        },
        
        stages: {
          reinforcement: {
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
              
              leaveMatch: ({ G, ctx, playerID, events }) => {
                handlePlayerExit(G, ctx, events, playerID, 'leave');
              },
              
              reportPlayerDisconnected: {
                move: ({ G, ctx, events }, targetPlayerID) => {
                  console.log(`🔌 [DISCONNECT] Segnalata disconnessione di Player ${targetPlayerID}`);
                  handlePlayerExit(G, ctx, events, targetPlayerID, 'disconnect');
                },
                client: false,
              },
              
              checkTimeout: ({ G, ctx, events }) => {
                // Auto-skip immediato se giocatore ha abbandonato
                if (G.hasLeft?.[ctx.currentPlayer]) {
                  console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
                  const remaining = G.reinforcementsRemaining[ctx.currentPlayer] || 0;
                  const toPlace = Math.min(3, remaining);
                  if (toPlace > 0) {
                    autoPlaceTroops(G, ctx, ctx.currentPlayer, toPlace);
                    G.reinforcementsRemaining[ctx.currentPlayer] -= toPlace;
                  }
                  events.endTurn();
                  return;
                }
                
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK RIVAL] INITIAL_REINFORCEMENT - Player ${ctx.currentPlayer} - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.INITIAL_REINFORCEMENT) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.INITIAL_REINFORCEMENT/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] INITIAL_REINFORCEMENT scaduto per Player ${ctx.currentPlayer}!`);
                
                // Calcola quante truppe deve ancora piazzare in questo turno
                const maxTroopsThisTurn = Math.min(3, G.reinforcementsRemaining[ctx.currentPlayer] + (G.turnPlacements?.length || 0));
                const troopsToPlace = maxTroopsThisTurn - (G.turnPlacements?.length || 0);
                
                console.log(`  ↳ Truppe da piazzare questo turno: ${troopsToPlace}`);
                
                if (troopsToPlace > 0) {
                  autoPlaceTroops(G, ctx, ctx.currentPlayer, troopsToPlace);
                  
                  // Aggiorna reinforcementsRemaining
                  G.reinforcementsRemaining[ctx.currentPlayer] -= troopsToPlace;
                }
                
                events.endTurn();
              }
            }
          },
          
          monitoring: {
            moves: {
              checkTimeout: ({ G, ctx, events }) => {
                // Auto-skip immediato se giocatore ha abbandonato
                if (G.hasLeft?.[ctx.currentPlayer]) {
                  console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
                  const remaining = G.reinforcementsRemaining[ctx.currentPlayer] || 0;
                  const toPlace = Math.min(3, remaining);
                  if (toPlace > 0) {
                    autoPlaceTroops(G, ctx, ctx.currentPlayer, toPlace);
                    G.reinforcementsRemaining[ctx.currentPlayer] -= toPlace;
                  }
                  events.endTurn();
                  return;
                }
                
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK RIVAL] INITIAL_REINFORCEMENT - Player ${ctx.currentPlayer} - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.INITIAL_REINFORCEMENT) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.INITIAL_REINFORCEMENT/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] INITIAL_REINFORCEMENT scaduto per Player ${ctx.currentPlayer}!`);
                
                // Calcola quante truppe deve ancora piazzare in questo turno
                const maxTroopsThisTurn = Math.min(3, G.reinforcementsRemaining[ctx.currentPlayer] + (G.turnPlacements?.length || 0));
                const troopsToPlace = maxTroopsThisTurn - (G.turnPlacements?.length || 0);
                
                console.log(`  ↳ Truppe da piazzare questo turno: ${troopsToPlace}`);
                
                if (troopsToPlace > 0) {
                  autoPlaceTroops(G, ctx, ctx.currentPlayer, troopsToPlace);
                  
                  // Aggiorna reinforcementsRemaining
                  G.reinforcementsRemaining[ctx.currentPlayer] -= troopsToPlace;
                }
                
                events.endTurn();
              },
              
              leaveMatch: ({ G, ctx, playerID, events }) => {
                handlePlayerExit(G, ctx, events, playerID, 'leave');
              },
              
              reportPlayerDisconnected: {
                move: ({ G, ctx, events }, targetPlayerID) => {
                  console.log(`🔌 [DISCONNECT] Segnalata disconnessione di Player ${targetPlayerID}`);
                  handlePlayerExit(G, ctx, events, targetPlayerID, 'disconnect');
                },
                client: false,
              },
            }
          }
        }
      },
    },

    GAME: {
      onBegin: ({ G, ctx }) => {
        console.log("🎲 [PHASE START] Fase GAME iniziata");
        // Pulizia finale dello stato di reinforcement
        delete G.reinforcementsRemaining;
        delete G.turnPlacements;
      },

      turn: {
        order: TurnOrder.RESET,
        
        onBegin: ({ G, ctx, events }) => {
          const currentPlayer = ctx.currentPlayer;
          console.log(`🔄 [TURN START] Player ${currentPlayer} inizia il turno GAME`);
          
          // Reset stati precedenti
          G.attackState = null;
          G.fortifyState = null;
          G.battleResult = null;
          G.turnPlacements = [];
          G.turnStartTime = Date.now();
          
          // Calcola rinforzi per il giocatore corrente
          const territoriesOwned = Object.values(G.owners).filter(
            owner => owner === currentPlayer
          ).length;
          
          // Minimo 3 truppe, altrimenti territori/3 arrotondato per difetto
          let reinforcements = Math.max(3, Math.floor(territoriesOwned / 3));
          
          // Aggiungi bonus continenti
          const CONTINENT_BONUSES = {
            'NORD_AMERICA': 5,
            'SUD_AMERICA': 2,
            'EUROPA': 5,
            'AFRICA': 3,
            'ASIA': 7,
            'OCEANIA': 2
          };
          
          Object.entries(CONTINENTS_DATA).forEach(([continentName, territories]) => {
            const ownsAll = territories.every(territory => G.owners[territory.id] === currentPlayer);
            if (ownsAll) {
              const bonus = CONTINENT_BONUSES[continentName] || 0;
              reinforcements += bonus;
              console.log(`🌍 [BONUS] Player ${currentPlayer} possiede ${continentName} (+${bonus} truppe)`);
            }
          });
          
          G.reinforcementsToPlace = G.reinforcementsToPlace || {};
          G.reinforcementsToPlace[currentPlayer] = reinforcements;
          
          console.log(`🎖️ [REINFORCEMENTS] Player ${currentPlayer} riceve ${reinforcements} truppe`);
          
          // Auto-skip se il giocatore ha abbandonato
          if (G.hasLeft?.[currentPlayer]) {
            console.log(`🚪 [AUTO-SKIP LEFT] Player ${currentPlayer} ha abbandonato, skip turno completo`);
            autoPlaceTroops(G, ctx, currentPlayer, reinforcements);
            G.reinforcementsToPlace[currentPlayer] = 0;
            console.log(`  ↳ Auto-piazzate ${reinforcements} truppe`);
            events.endTurn();
            return;
          }
          
          // Setta currentPlayer in reinforcement, others in monitoringReinforcement
          events.setActivePlayers({ 
            currentPlayer: 'reinforcement',
            others: 'monitoringReinforcement'
          });
        },
        
        // Distribuisce carta se il giocatore ha conquistato territori
        onEnd: ({ G, ctx }) => {
          const currentPlayer = ctx.currentPlayer;
          
          // Controlla se il giocatore ha conquistato territori in questo turno
          if (G.conqueredThisTurn && G.conqueredThisTurn[currentPlayer]) {
            // Pesca una carta dal mazzo
            if (!G.deck || G.deck.length === 0) {
              console.log(`🃏 [CARD] Mazzo esaurito, rigenerazione...`);
              G.deck = generateDeck();
            }
            
            const card = G.deck.pop();
            if (!G.players[currentPlayer].cards) G.players[currentPlayer].cards = [];
            G.players[currentPlayer].cards.push(card);
            
            console.log(`🃏 [CARD] Player ${currentPlayer} riceve una carta ${card.type} (totale: ${G.players[currentPlayer].cards.length})`);
            
            // Reset flag conquista
            G.conqueredThisTurn[currentPlayer] = false;
          }
        },
        
        // Controlla vittoria dopo ogni mossa
        onMove: ({ G, events }) => {
          checkVictoryCondition(G, events);
        },
        
        stages: {
          reinforcement: {
            moves: {
              exchangeCards: ({ G, playerID }, cardIndices) => {
                const currentPlayer = String(playerID);
                
                // Validazioni
                if (!Array.isArray(cardIndices) || cardIndices.length !== 3) {
                  console.warn(`❌ [INVALID CARDS] Devi selezionare esattamente 3 carte`);
                  return;
                }
                
                if (!G.players[currentPlayer].cards || G.players[currentPlayer].cards.length < 3) {
                  console.warn(`❌ [INVALID CARDS] Player ${currentPlayer} non ha abbastanza carte`);
                  return;
                }
                
                // Controlla che gli indici siano validi
                const maxIndex = G.players[currentPlayer].cards.length - 1;
                if (cardIndices.some(idx => idx < 0 || idx > maxIndex)) {
                  console.warn(`❌ [INVALID CARDS] Indici carte non validi`);
                  return;
                }
                
                // Prendi le carte selezionate
                const selectedCards = cardIndices.map(idx => G.players[currentPlayer].cards[idx]);
                
                // Valida la combinazione
                const validation = validateCardCombination(selectedCards);
                if (!validation.valid) {
                  console.warn(`❌ [INVALID CARDS] Combinazione non valida`);
                  return;
                }
                
                // Rimuovi le carte usate (ordina indici in ordine decrescente per evitare problemi con splice)
                const sortedIndices = [...cardIndices].sort((a, b) => b - a);
                sortedIndices.forEach(idx => {
                  G.players[currentPlayer].cards.splice(idx, 1);
                });
                
                // Aggiungi truppe bonus ai rinforzi disponibili
                G.reinforcementsToPlace[currentPlayer] += validation.bonus;
                
                console.log(`🃏 [CARDS EXCHANGED] Player ${currentPlayer} scambia 3 carte per +${validation.bonus} truppe (totale: ${G.reinforcementsToPlace[currentPlayer]})`);
              },
              
              placeReinforcement: ({ G, playerID }, countryId) => {
                const currentPlayer = String(playerID);
                
                if (!G.turnPlacements) G.turnPlacements = [];
                
                // Validazioni
                if (G.owners[countryId] !== currentPlayer) {
                  console.warn(`❌ [INVALID] Player ${currentPlayer} non possiede ${countryId}`);
                  return;
                }
                
                if (G.reinforcementsToPlace[currentPlayer] <= 0) {
                  console.warn(`❌ [INVALID] Player ${currentPlayer} non ha truppe rimanenti`);
                  return;
                }
                
                // Piazza truppa
                G.troops[countryId] = (G.troops[countryId] || 0) + 1;
                G.reinforcementsToPlace[currentPlayer] -= 1;
                G.turnPlacements.push(countryId);
                
                console.log(`✅ [PLACE] Player ${currentPlayer} piazza truppa in ${countryId} (${G.reinforcementsToPlace[currentPlayer]} rimanenti)`);
              },
              
              removeReinforcement: ({ G, playerID }, countryId) => {
                const currentPlayer = String(playerID);
                
                if (!G.turnPlacements) G.turnPlacements = [];
                
                const index = G.turnPlacements.indexOf(countryId);
                if (index === -1) {
                  console.warn(`❌ [INVALID] ${countryId} non è stato piazzato in questo turno`);
                  return;
                }
                
                G.troops[countryId] -= 1;
                G.reinforcementsToPlace[currentPlayer] += 1;
                G.turnPlacements.splice(index, 1);
                
                console.log(`↩️ [REMOVE] Player ${currentPlayer} rimuove truppa da ${countryId}`);
              },
              
              endReinforcement: ({ G, ctx, events, playerID }) => {
                const currentPlayer = String(playerID);
                
                if (G.reinforcementsToPlace[currentPlayer] > 0) {
                  console.warn(`❌ [INVALID] Player ${currentPlayer} deve piazzare tutte le truppe`);
                  return;
                }
                
                console.log(`✅ [STAGE END] Player ${currentPlayer} passa allo stage ATTACK`);
                
                G.turnStartTime = Date.now();
                events.setActivePlayers({ 
                  currentPlayer: 'attack',
                  others: 'monitoringAttack'
                });
              },
              
              checkTimeout: ({ G, ctx, events }) => {
                // Auto-skip immediato se giocatore ha abbandonato
                if (G.hasLeft?.[ctx.currentPlayer]) {
                  console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
                  const troopsToPlace = G.reinforcementsToPlace[ctx.currentPlayer] || 0;
                  if (troopsToPlace > 0) {
                    autoPlaceTroops(G, ctx, ctx.currentPlayer, troopsToPlace);
                    G.reinforcementsToPlace[ctx.currentPlayer] = 0;
                  }
                  G.turnStartTime = Date.now();
                  events.setActivePlayers({ 
                    currentPlayer: 'attack',
                    others: 'monitoringAttack'
                  });
                  return;
                }
                
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK] GAME/reinforcement - Player ${ctx.currentPlayer} - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.GAME_REINFORCEMENT) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.GAME_REINFORCEMENT/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] REINFORCEMENT scaduto per Player ${ctx.currentPlayer}!`);
                
                const troopsToPlace = G.reinforcementsToPlace[ctx.currentPlayer] || 0;
                
                if (troopsToPlace > 0) {
                  console.log(`  ↳ Auto-piazzamento di ${troopsToPlace} truppe`);
                  autoPlaceTroops(G, ctx, ctx.currentPlayer, troopsToPlace);
                  G.reinforcementsToPlace[ctx.currentPlayer] = 0;
                }
                
                G.turnStartTime = Date.now();
                events.setActivePlayers({ all: 'attack' });
              },
            },
          },
          
          attack: {
            moves: {
              selectAttackerTerritory: ({ G, playerID }, territoryId) => {
                const currentPlayer = String(playerID);
                
                if (!G.attackState) G.attackState = { from: null, to: null, attackDiceCount: null };
                
                if (G.owners[territoryId] !== currentPlayer) {
                  console.warn(`❌ [INVALID] Player ${currentPlayer} non possiede ${territoryId}`);
                  return;
                }
                
                if (G.troops[territoryId] < 2) {
                  console.warn(`❌ [INVALID] Territorio ${territoryId} ha meno di 2 truppe`);
                  return;
                }
                
                G.attackState.from = territoryId;
                console.log(`⚔️ [ATTACK] Player ${currentPlayer} seleziona attaccante: ${territoryId}`);
              },
              
              selectDefenderTerritory: ({ G, playerID }, territoryId) => {
                const currentPlayer = String(playerID);
                
                if (!G.attackState || !G.attackState.from) {
                  console.warn(`❌ [INVALID] Nessun territorio attaccante selezionato`);
                  return;
                }
                
                if (!RISK_ADJACENCY[G.attackState.from].includes(territoryId)) {
                  console.warn(`❌ [INVALID] ${territoryId} non è adiacente a ${G.attackState.from}`);
                  return;
                }
                
                if (G.owners[territoryId] === currentPlayer) {
                  console.warn(`❌ [INVALID] Non puoi attaccare un tuo territorio`);
                  return;
                }
                
                G.attackState.to = territoryId;
                console.log(`🎯 [ATTACK] Player ${currentPlayer} seleziona bersaglio: ${territoryId}`);
              },
              
              confirmAttackDice: ({ G, playerID }, diceCount) => {
                const currentPlayer = String(playerID);
                
                if (!G.attackState || !G.attackState.from) {
                  console.warn(`❌ [INVALID] Nessun attacco in corso`);
                  return;
                }
                
                const maxDice = Math.min(3, G.troops[G.attackState.from] - 1);
                if (diceCount > maxDice || diceCount < 1) {
                  console.warn(`❌ [INVALID] Puoi usare da 1 a ${maxDice} dadi`);
                  return;
                }
                
                G.attackState.attackDiceCount = diceCount;
                console.log(`🎲 [ATTACK] Player ${currentPlayer} attacca con ${diceCount} dadi`);
              },
              
              executeAttack: {
                move: ({ G, ctx, random }) => {
                  if (!G.attackState || !G.attackState.from || !G.attackState.to || !G.attackState.attackDiceCount) {
                    console.warn(`❌ [INVALID] Stato attacco incompleto`);
                    return;
                  }
                  
                  const from = G.attackState.from;
                  const to = G.attackState.to;
                  const attackDiceCount = G.attackState.attackDiceCount;
                  
                  // Lancia dadi attaccante
                  const attackerRolls = Array.from({ length: attackDiceCount }, () => random.D6()).sort((a, b) => b - a);
                  
                  // Lancia dadi difensore (max 3, o quante truppe ha)
                  const defenderDiceCount = Math.min(G.troops[to], 3);
                  const defenderRolls = Array.from({ length: defenderDiceCount }, () => random.D6()).sort((a, b) => b - a);
                  
                  console.log(`🎲 [DICE] Attaccante: ${attackerRolls.join(', ')} | Difensore: ${defenderRolls.join(', ')}`);
                  
                  // Confronta dadi
                  let attackerLosses = 0;
                  let defenderLosses = 0;
                  const comparisons = Math.min(attackerRolls.length, defenderRolls.length);
                  
                  for (let i = 0; i < comparisons; i++) {
                    if (attackerRolls[i] > defenderRolls[i]) {
                      defenderLosses++;
                    } else {
                      // Pareggio = difensore vince
                      attackerLosses++;
                    }
                  }
                  
                  // Applica perdite
                  G.troops[from] -= attackerLosses;
                  G.troops[to] -= defenderLosses;
                  
                  let conquered = false;
                  // Salva il colore originale del difensore PRIMA della conquista
                  const originalDefenderOwner = G.owners[to];
                  
                  // Conquista territorio se difensore a 0 truppe
                  if (G.troops[to] === 0) {
                    conquered = true;
                    G.owners[to] = ctx.currentPlayer;
                    // Sposta truppe dell'attacco
                    G.troops[to] = attackDiceCount;
                    G.troops[from] -= attackDiceCount;
                    console.log(`🏴 [CONQUERED] Player ${ctx.currentPlayer} conquista ${to}!`);
                    
                    // Marca che il giocatore ha conquistato in questo turno (per carta bonus)
                    if (!G.conqueredThisTurn) G.conqueredThisTurn = {};
                    G.conqueredThisTurn[ctx.currentPlayer] = true;
                  }
                  
                  // Salva risultato con il colore ORIGINALE del difensore
                  G.battleResult = {
                    attackerDice: attackerRolls,
                    defenderDice: defenderRolls,
                    attackerLosses,
                    defenderLosses,
                    conquered,
                    fromTerritory: from,
                    toTerritory: to,
                    originalDefenderOwner: originalDefenderOwner // Colore originale del difensore
                  };
                  
                  // Reset solo il target, mantieni from per attacchi consecutivi
                  G.attackState.to = null;
                  G.attackState.attackDiceCount = null;
                  
                  console.log(`⚔️ [BATTLE] Attaccante perde ${attackerLosses}, Difensore perde ${defenderLosses}`);
                },
                client: false,
              },
              
              resetAttackSelection: ({ G }) => {
                G.attackState = { from: null, to: null, attackDiceCount: null };
                G.battleResult = null;
                console.log(`🔄 [RESET] Selezione attacco resettata`);
              },
              
              endAttackStage: ({ G, events }) => {
                G.attackState = null;
                G.battleResult = null;
                console.log(`✅ [STAGE END] Passaggio a STRATEGIC_MOVEMENT`);
                G.turnStartTime = Date.now();
                events.setActivePlayers({ 
                  currentPlayer: 'strategicMovement',
                  others: 'monitoringStrategicMovement'
                });
              },
              
              checkTimeout: ({ G, ctx, events }) => {
                // Auto-skip immediato se giocatore ha abbandonato
                if (G.hasLeft?.[ctx.currentPlayer]) {
                  console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
                  G.attackState = null;
                  G.battleResult = null;
                  G.turnStartTime = Date.now();
                  events.setActivePlayers({ 
                    currentPlayer: 'strategicMovement',
                    others: 'monitoringStrategicMovement'
                  });
                  return;
                }
                
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK] GAME/attack - Player ${ctx.currentPlayer} - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.GAME_ATTACK) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.GAME_ATTACK/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] ATTACK scaduto per Player ${ctx.currentPlayer}!`);
                console.log(`  ↳ Skip fase attacco`);
                G.attackState = null;
                G.battleResult = null;
                
                G.turnStartTime = Date.now();
                events.setActivePlayers({ 
                  currentPlayer: 'strategicMovement',
                  others: 'monitoringStrategicMovement'
                });
              },
              
              leaveMatch: ({ G, ctx, playerID, events }) => {
                handlePlayerExit(G, ctx, events, playerID, 'leave');
              },
              
              reportPlayerDisconnected: {
                move: ({ G, ctx, events }, targetPlayerID) => {
                  console.log(`🔌 [DISCONNECT] Segnalata disconnessione di Player ${targetPlayerID}`);
                  handlePlayerExit(G, ctx, events, targetPlayerID, 'disconnect');
                },
                client: false,
              },
            },
          },
          
          strategicMovement: {
            moves: {
              selectFortifyFrom: ({ G, playerID }, territoryId) => {
                const currentPlayer = String(playerID);
                
                if (!G.fortifyState) G.fortifyState = { from: null, to: null };
                
                if (G.owners[territoryId] !== currentPlayer) {
                  console.warn(`❌ [INVALID] Player ${currentPlayer} non possiede ${territoryId}`);
                  return;
                }
                
                if (G.troops[territoryId] < 2) {
                  console.warn(`❌ [INVALID] Territorio ${territoryId} ha meno di 2 truppe`);
                  return;
                }
                
                G.fortifyState.from = territoryId;
                console.log(`🚚 [FORTIFY] Player ${currentPlayer} seleziona origine: ${territoryId}`);
              },
              
              selectFortifyTo: ({ G, playerID }, territoryId) => {
                const currentPlayer = String(playerID);
                
                if (!G.fortifyState || !G.fortifyState.from) {
                  console.warn(`❌ [INVALID] Nessun territorio origine selezionato`);
                  return;
                }
                
                if (!RISK_ADJACENCY[G.fortifyState.from].includes(territoryId)) {
                  console.warn(`❌ [INVALID] ${territoryId} non è adiacente a ${G.fortifyState.from}`);
                  return;
                }
                
                if (G.owners[territoryId] !== currentPlayer) {
                  console.warn(`❌ [INVALID] Non possiedi ${territoryId}`);
                  return;
                }
                
                G.fortifyState.to = territoryId;
                console.log(`📍 [FORTIFY] Player ${currentPlayer} seleziona destinazione: ${territoryId}`);
              },
              
              executeFortify: ({ G, events }, troopCount) => {
                if (!G.fortifyState || !G.fortifyState.from || !G.fortifyState.to) {
                  console.warn(`❌ [INVALID] Fortify incompleto`);
                  return;
                }
                
                const from = G.fortifyState.from;
                const to = G.fortifyState.to;
                
                if (troopCount < 1) {
                  console.warn(`❌ [INVALID] Devi spostare almeno 1 truppa`);
                  return;
                }
                
                if (G.troops[from] - troopCount < 1) {
                  console.warn(`❌ [INVALID] Devi lasciare almeno 1 truppa in ${from}`);
                  return;
                }
                
                // Esegui spostamento
                G.troops[from] -= troopCount;
                G.troops[to] += troopCount;
                
                console.log(`✅ [FORTIFY] Spostato ${troopCount} truppe da ${from} a ${to}`);
                
                // Reset e termina turno
                G.fortifyState = null;
                events.endTurn();
              },
              
              skipFortify: ({ G, events }) => {
                console.log(`⏭️ [SKIP] Fortify saltato, turno terminato`);
                G.fortifyState = null;
                events.endTurn();
              },
              
              resetFortifySelection: ({ G }) => {
                G.fortifyState = { from: null, to: null };
                console.log(`🔄 [RESET] Selezione fortify resettata`);
              },
              
              checkTimeout: ({ G, ctx, events }) => {
                // Auto-skip immediato se giocatore ha abbandonato
                if (G.hasLeft?.[ctx.currentPlayer]) {
                  console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
                  G.fortifyState = null;
                  events.endTurn();
                  return;
                }
                
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK] GAME/strategicMovement - Player ${ctx.currentPlayer} - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.GAME_STRATEGIC_MOVEMENT) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.GAME_STRATEGIC_MOVEMENT/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] STRATEGIC_MOVEMENT scaduto per Player ${ctx.currentPlayer}!`);
                console.log(`  ↳ Skip spostamento strategico`);
                G.fortifyState = null;
                
                events.endTurn();
              },
              
              leaveMatch: ({ G, ctx, playerID, events }) => {
                handlePlayerExit(G, ctx, events, playerID, 'leave');
              },
              
              reportPlayerDisconnected: {
                move: ({ G, ctx, events }, targetPlayerID) => {
                  console.log(`🔌 [DISCONNECT] Segnalata disconnessione di Player ${targetPlayerID}`);
                  handlePlayerExit(G, ctx, events, targetPlayerID, 'disconnect');
                },
                client: false,
              },
            },
          },
          
          // ===== STAGE PARALLELI PER RIVALI (SOLO CHECKTIMEOUT) =====
          
          monitoringReinforcement: {
            moves: {
              checkTimeout: ({ G, ctx, events }) => {
                // Auto-skip immediato se giocatore ha abbandonato
                if (G.hasLeft?.[ctx.currentPlayer]) {
                  console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
                  const troopsToPlace = G.reinforcementsToPlace[ctx.currentPlayer] || 0;
                  if (troopsToPlace > 0) {
                    autoPlaceTroops(G, ctx, ctx.currentPlayer, troopsToPlace);
                    G.reinforcementsToPlace[ctx.currentPlayer] = 0;
                  }
                  G.turnStartTime = Date.now();
                  events.setActivePlayers({ 
                    currentPlayer: 'attack',
                    others: 'monitoringAttack'
                  });
                  return;
                }
                
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK RIVAL] GAME/reinforcement - Player ${ctx.currentPlayer} - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.GAME_REINFORCEMENT) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.GAME_REINFORCEMENT/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] REINFORCEMENT scaduto per Player ${ctx.currentPlayer}!`);
                
                const troopsToPlace = G.reinforcementsToPlace[ctx.currentPlayer] || 0;
                
                if (troopsToPlace > 0) {
                  console.log(`  ↳ Auto-piazzamento di ${troopsToPlace} truppe`);
                  autoPlaceTroops(G, ctx, ctx.currentPlayer, troopsToPlace);
                  G.reinforcementsToPlace[ctx.currentPlayer] = 0;
                }
                
                G.turnStartTime = Date.now();
                events.setActivePlayers({ 
                  currentPlayer: 'attack',
                  others: 'monitoringAttack'
                });
              },
              
              leaveMatch: ({ G, ctx, playerID, events }) => {
                handlePlayerExit(G, ctx, events, playerID, 'leave');
              },
              
              reportPlayerDisconnected: {
                move: ({ G, ctx, events }, targetPlayerID) => {
                  console.log(`🔌 [DISCONNECT] Segnalata disconnessione di Player ${targetPlayerID}`);
                  handlePlayerExit(G, ctx, events, targetPlayerID, 'disconnect');
                },
                client: false,
              },
            },
          },
          
          monitoringAttack: {
            moves: {
              checkTimeout: ({ G, ctx, events }) => {
                // Auto-skip immediato se giocatore ha abbandonato
                if (G.hasLeft?.[ctx.currentPlayer]) {
                  console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
                  G.attackState = null;
                  G.battleResult = null;
                  G.turnStartTime = Date.now();
                  events.setActivePlayers({ 
                    currentPlayer: 'strategicMovement',
                    others: 'monitoringStrategicMovement'
                  });
                  return;
                }
                
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK RIVAL] GAME/attack - Player ${ctx.currentPlayer} - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.GAME_ATTACK) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.GAME_ATTACK/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] ATTACK scaduto per Player ${ctx.currentPlayer}!`);
                console.log(`  ↳ Skip fase attacco`);
                G.attackState = null;
                G.battleResult = null;
                
                G.turnStartTime = Date.now();
                events.setActivePlayers({ 
                  currentPlayer: 'strategicMovement',
                  others: 'monitoringStrategicMovement'
                });
              },
              
              leaveMatch: ({ G, ctx, playerID, events }) => {
                handlePlayerExit(G, ctx, events, playerID, 'leave');
              },
              
              reportPlayerDisconnected: {
                move: ({ G, ctx, events }, targetPlayerID) => {
                  console.log(`🔌 [DISCONNECT] Segnalata disconnessione di Player ${targetPlayerID}`);
                  handlePlayerExit(G, ctx, events, targetPlayerID, 'disconnect');
                },
                client: false,
              },
            },
          },
          
          monitoringStrategicMovement: {
            moves: {
              checkTimeout: ({ G, ctx, events }) => {
                // Auto-skip immediato se giocatore ha abbandonato
                if (G.hasLeft?.[ctx.currentPlayer]) {
                  console.log(`🚪 [AUTO-SKIP LEFT] Player ${ctx.currentPlayer} ha abbandonato`);
                  G.fortifyState = null;
                  events.endTurn();
                  return;
                }
                
                const elapsed = Date.now() - (G.turnStartTime || Date.now());
                console.log(`⏱️ [TIMEOUT CHECK RIVAL] GAME/strategicMovement - Player ${ctx.currentPlayer} - Elapsed: ${Math.floor(elapsed/1000)}s`);
                
                if (elapsed < PHASE_TIMEOUTS.GAME_STRATEGIC_MOVEMENT) {
                  console.log(`⏱️ [TIMEOUT] Tempo non scaduto (${Math.floor(elapsed/1000)}s / ${PHASE_TIMEOUTS.GAME_STRATEGIC_MOVEMENT/1000}s)`);
                  return;
                }
                
                console.log(`⏰ [TIMEOUT] STRATEGIC_MOVEMENT scaduto per Player ${ctx.currentPlayer}!`);
                console.log(`  ↳ Skip spostamento strategico`);
                G.fortifyState = null;
                
                events.endTurn();
              },
              
              leaveMatch: ({ G, ctx, playerID, events }) => {
                handlePlayerExit(G, ctx, events, playerID, 'leave');
              },
              
              reportPlayerDisconnected: {
                move: ({ G, ctx, events }, targetPlayerID) => {
                  console.log(`🔌 [DISCONNECT] Segnalata disconnessione di Player ${targetPlayerID}`);
                  handlePlayerExit(G, ctx, events, targetPlayerID, 'disconnect');
                },
                client: false,
              },
            },
          },
        },
      },
    },
  },
};

module.exports = { RiskGame };