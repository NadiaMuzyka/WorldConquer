// src/game.js
const { TurnOrder, PlayerView } = require('boardgame.io/core');
const { COUNTRY_COLORS, PLAYER_COLORS } = require('./components/Constants/colors');
const { CONTINENTS_DATA } = require('./components/Constants/mapData');
const { RISK_ADJACENCY } = require('./components/Constants/adjacency');

// Funzione per assegnare obiettivi segreti ai giocatori
const assignSecretObjectives = (G, ctx) => {
  const numPlayers = ctx.numPlayers;
  
  // Calcola il numero di territori richiesti in base al numero di giocatori
  let conquerNTerritoriesCount = 12;
  let conquerNTerritoriesDescription = '';
  if (numPlayers === 3) {
    conquerNTerritoriesCount = 17;
    conquerNTerritoriesDescription = 'Conquista 17 territori a tua scelta';
  } else if (numPlayers === 4) {
    conquerNTerritoriesCount = 14;
    conquerNTerritoriesDescription = 'Conquista 14 territori a tua scelta';
  } else if (numPlayers === 5) {
    conquerNTerritoriesCount = 12;
    conquerNTerritoriesDescription = 'Conquista 12 territori a tua scelta';
  } else if (numPlayers === 6) {
    conquerNTerritoriesCount = 10;
    conquerNTerritoriesDescription = 'Conquista 10 territori a tua scelta';
  } else {
    conquerNTerritoriesDescription = 'Conquista 12 territori a tua scelta';
  }

  // Lista di tutti gli obiettivi possibili
  const allObjectives = [
    { type: 'CONQUER_CONTINENT', continent: 'NORD_AMERICA', description: 'Conquista la totalità del Nord America' },
    { type: 'CONQUER_TWO_CONTINENTS', continents: ['SUD_AMERICA', 'OCEANIA'], description: 'Conquista interamente Sud America e Oceania' },
    { type: 'CONQUER_CONTINENT_PLUS', continent: 'EUROPA', extraTerritories: 3, description: 'Conquista Europa + 3 territori a tua scelta' },
    { type: 'CONQUER_CONTINENT_PLUS', continent: 'AFRICA', extraTerritories: 3, extraContinent: 'NORD_AMERICA', description: 'Conquista Africa + 3 territori di Nord America' },
    { type: 'CONQUER_N_IN_CONTINENT', continent: 'ASIA', count: 9, description: 'Conquista 9 territori dell\'Asia' },
    { type: 'CONQUER_N_TERRITORIES', count: conquerNTerritoriesCount, description: conquerNTerritoriesDescription },
  ];
  
  // Aggiungi obiettivi di eliminazione colore (escluso il proprio)
  const colorObjectives = [
    { type: 'ELIMINATE_COLOR', color: '0', colorName: 'rosse', description: 'Distruggi interamente le armate rosse' },
    { type: 'ELIMINATE_COLOR', color: '1', colorName: 'blu', description: 'Distruggi interamente le armate blu' },
    { type: 'ELIMINATE_COLOR', color: '2', colorName: 'verdi', description: 'Distruggi interamente le armate verdi' },
  ];
  
  // Aggiungi obiettivi colore per giocatori 4, 5, 6
  if (numPlayers >= 4) {
    colorObjectives.push({ type: 'ELIMINATE_COLOR', color: '3', colorName: 'gialle', description: 'Distruggi interamente le armate gialle' });
  }
  if (numPlayers >= 5) {
    colorObjectives.push({ type: 'ELIMINATE_COLOR', color: '4', colorName: 'viola', description: 'Distruggi interamente le armate viola' });
  }
  if (numPlayers === 6) {
    colorObjectives.push({ type: 'ELIMINATE_COLOR', color: '5', colorName: 'nere', description: 'Distruggi interamente le armate nere' });
  }
  
  // Combina tutti gli obiettivi
  const availableObjectives = [...allObjectives, ...colorObjectives];
  
  // Shuffla gli obiettivi
  for (let i = availableObjectives.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableObjectives[i], availableObjectives[j]] = [availableObjectives[j], availableObjectives[i]];
  }
  
  // Assegna un obiettivo a ogni giocatore
  for (let i = 0; i < numPlayers; i++) {
    const playerId = String(i);
    // Assicurati che G.players esista e abbia la chiave playerId
    if (!G.players) G.players = {};
    if (!G.players[playerId]) G.players[playerId] = { secretObjective: null };

    // Trova un obiettivo che non sia eliminare il proprio colore
    let objective = null;
    for (let j = 0; j < availableObjectives.length; j++) {
      const obj = availableObjectives[j];
      if (obj.type === 'ELIMINATE_COLOR' && obj.color === playerId) {
        // Skip - non può eliminare se stesso
        continue;
      }
      // Assegna questo obiettivo e rimuovilo dalla lista
      objective = obj;
      availableObjectives.splice(j, 1);
      break;
    }
    G.players[playerId].secretObjective = objective;
    console.log(`🎯 [OBJECTIVE] Player ${playerId} riceve obiettivo: ${objective.description}`);
  }
};

// Funzione per controllare se un giocatore ha raggiunto il suo obiettivo
const checkVictoryCondition = (G, events) => {
  if (!G.players) return false;
  
  for (const [playerID, playerData] of Object.entries(G.players)) {
    if (!playerData.secretObjective) continue;
    
    const objective = playerData.secretObjective;
    let objectiveMet = false;
    
    switch (objective.type) {
      case 'CONQUER_CONTINENT': {
        const continent = CONTINENTS_DATA[objective.continent];
        if (continent) {
          objectiveMet = continent.every(territory => G.owners[territory.id] === playerID);
        }
        break;
      }
      
      case 'CONQUER_TWO_CONTINENTS': {
        const [cont1, cont2] = objective.continents;
        const ownsCont1 = CONTINENTS_DATA[cont1]?.every(t => G.owners[t.id] === playerID);
        const ownsCont2 = CONTINENTS_DATA[cont2]?.every(t => G.owners[t.id] === playerID);
        objectiveMet = ownsCont1 && ownsCont2;
        break;
      }
      
      case 'CONQUER_CONTINENT_PLUS': {
        const continent = CONTINENTS_DATA[objective.continent];
        const ownsContinent = continent?.every(t => G.owners[t.id] === playerID);
        
        if (ownsContinent) {
          if (objective.extraContinent) {
            const extraTerritories = CONTINENTS_DATA[objective.extraContinent]?.filter(
              t => G.owners[t.id] === playerID
            ).length || 0;
            objectiveMet = extraTerritories >= objective.extraTerritories;
          } else {
            const totalTerritories = Object.values(G.owners).filter(
              owner => owner === playerID
            ).length;
            const continentSize = continent.length;
            objectiveMet = totalTerritories >= continentSize + objective.extraTerritories;
          }
        }
        break;
      }
      
      case 'CONQUER_N_IN_CONTINENT': {
        const continent = CONTINENTS_DATA[objective.continent];
        const ownedCount = continent?.filter(t => G.owners[t.id] === playerID).length || 0;
        objectiveMet = ownedCount >= objective.count;
        break;
      }
      
      case 'CONQUER_N_TERRITORIES': {
        const ownedCount = Object.values(G.owners).filter(owner => owner === playerID).length;
        objectiveMet = ownedCount >= objective.count;
        break;
      }
      
      case 'ELIMINATE_COLOR': {
        const colorExists = Object.values(G.owners).some(owner => owner === objective.color);
        objectiveMet = !colorExists;
        break;
      }
    }
    
    if (objectiveMet) {
      console.log(`🏆 [VICTORY] Player ${playerID} ha completato il suo obiettivo!`);
      events.endGame({ winner: playerID });
      return true;
    }
  }
  
  return false;
};

const RiskGame = {
  name: 'risk',
  disableUndo: true,
  playerView: PlayerView.STRIP_SECRETS,

  // 1. SETUP: Inizializziamo truppe e proprietari vuoti
  setup: ({ ctx }) => {
    const players = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      players[String(i)] = {
        secretObjective: null,
      };
    }
    
    return {
      troops: {},  // Mappa ID_PAESE -> NUMERO TRUPPE
      owners: {},  // Mappa ID_PAESE -> PLAYER_ID ("0", "1", "2")
      players,     // Oggetto segreto per player con obiettivi
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
          
          events.setActivePlayers({ currentPlayer: 'reinforcement' });

          console.log(`🎮 [STAGE] Player ${currentPlayer} entra in stage REINFORCEMENT`);
        },
        
        // Controlla vittoria dopo ogni mossa
        onMove: ({ G, events }) => {
          checkVictoryCondition(G, events);
        },
        
        stages: {
          reinforcement: {
            moves: {
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
                
                events.setActivePlayers({ currentPlayer: 'attack' })
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
                events.setActivePlayers({ currentPlayer: 'strategicMovement' });
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
            },
          },
        },
      },
    },
  },
};

module.exports = { RiskGame };
