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
const checkVictoryCondition = (G, events, ctx) => {
  if (!G.players) return false;
  
  // VITTORIA LAST MAN STANDING: Se rimane solo 1 giocatore attivo, vince
  if (ctx && ctx.numPlayers > 1 && ctx.hasLeft) {
    const activePlayers = [];
    for (let i = 0; i < ctx.numPlayers; i++) {
      const pid = String(i);
      if (!ctx.hasLeft[pid]) {
        activePlayers.push(pid);
      }
    }
    
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      console.log(`🏆 [LAST MAN STANDING] Player ${winner} vince - unico giocatore rimasto!`);
      events.endGame({ winner });
      return true;
    }
  }
  
  for (const [playerID, playerData] of Object.entries(G.players)) {
    if (!playerData.secretObjective) continue;
    // Skip giocatori che hanno abbandonato
    if (ctx.hasLeft && ctx.hasLeft[playerID]) continue;
    
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

  // Plugin per aggiungere hasLeft al ctx
  plugins: [
    {
      name: 'player-leave-tracker',
      setup: ({ ctx }) => {
        // Inizializza hasLeft per ogni player nel ctx
        const hasLeft = {};
        for (let i = 0; i < ctx.numPlayers; i++) {
          hasLeft[String(i)] = false;
        }
        return { hasLeft };
      },
    },
  ],

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
        order: TurnOrder.SKIP, // Salta chi ha hasLeft: true nel ctx

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
          3: 15, 4: 30, 5: 25, 6: 20,
        };

        const troopsPerPlayer = totalTroops[ctx.numPlayers] || 20;

        G.reinforcementsRemaining = {};
        for (let i = 0; i < ctx.numPlayers; i++) {
          const playerId = String(i);
          const territoriesOwned = Object.values(G.owners).filter(
            owner => owner === playerId
          ).length;

          G.reinforcementsRemaining[playerId] = troopsPerPlayer - territoriesOwned;
        }

        G.turnPlacements = [];
      },

      endIf: ({ G }) => {
        if (!G.reinforcementsRemaining) return false;

        const allDone = Object.values(G.reinforcementsRemaining).every(
          remaining => remaining === 0
        );
        return allDone;
      },

      onEnd: ({ G }) => {
        console.log("🎲 [PHASE TRANSITION] INITIAL_REINFORCEMENT -> GAME");
        delete G.turnPlacements;
      },

      turn: {
        order: TurnOrder.SKIP, // Salta chi ha hasLeft: true nel ctx
        
        onBegin: ({ G, ctx, events }) => {
          const currentPlayer = ctx.currentPlayer;

          // Check Last Man Standing
          if (checkVictoryCondition(G, events, ctx)) return;

          G.turnPlacements = [];
          
          if (G.reinforcementsRemaining[currentPlayer] === 0) {
            events.endTurn();
          }
        },
      },

      moves: {
        placeReinforcement: ({ G, ctx, playerID }, countryId) => {
          const currentPlayer = String(playerID);
          if (!G.turnPlacements) G.turnPlacements = [];
          if (G.owners[countryId] !== currentPlayer) return;
          if (G.reinforcementsRemaining[currentPlayer] <= 0) return;

          const maxTroopsThisTurn = Math.min(3, G.reinforcementsRemaining[currentPlayer] + G.turnPlacements.length);
          if (G.turnPlacements.length >= maxTroopsThisTurn) return;

          G.troops[countryId] = (G.troops[countryId] || 0) + 1;
          G.reinforcementsRemaining[currentPlayer] -= 1;
          G.turnPlacements.push(countryId);
        },

        removeReinforcement: ({ G, ctx, playerID }, countryId) => {
          const currentPlayer = String(playerID);
          if (!G.turnPlacements) G.turnPlacements = [];
          const index = G.turnPlacements.indexOf(countryId);
          if (index === -1) return;

          G.troops[countryId] -= 1;
          G.reinforcementsRemaining[currentPlayer] += 1;
          G.turnPlacements.splice(index, 1);
        },

        endPlayerTurn: ({ G, ctx, events, playerID }) => {
          const currentPlayer = String(playerID);
          if (!G.turnPlacements) G.turnPlacements = [];
          const maxTroopsThisTurn = Math.min(3, G.reinforcementsRemaining[currentPlayer] + G.turnPlacements.length);
          if (G.turnPlacements.length < maxTroopsThisTurn) return;
          events.endTurn();
        },
      },
    },

    GAME: {
      onBegin: ({ G, ctx }) => {
        console.log("🎲 [PHASE START] Fase GAME iniziata");
        delete G.reinforcementsRemaining;
        delete G.turnPlacements;
      },

      turn: {
        order: TurnOrder.SKIP, // Salta chi ha hasLeft: true nel ctx
        
        onBegin: ({ G, ctx, events }) => {
          // Check Last Man Standing
          if (checkVictoryCondition(G, events, ctx)) return;

          const currentPlayer = ctx.currentPlayer;
          
          G.attackState = null;
          G.fortifyState = null;
          G.battleResult = null;
          G.turnPlacements = [];
          
          const territoriesOwned = Object.values(G.owners).filter(
            owner => owner === currentPlayer
          ).length;
          
          let reinforcements = Math.max(3, Math.floor(territoriesOwned / 3));
          
          const CONTINENT_BONUSES = {
            'NORD_AMERICA': 5, 'SUD_AMERICA': 2, 'EUROPA': 5,
            'AFRICA': 3, 'ASIA': 7, 'OCEANIA': 2
          };
          
          Object.entries(CONTINENTS_DATA).forEach(([continentName, territories]) => {
            const ownsAll = territories.every(territory => G.owners[territory.id] === currentPlayer);
            if (ownsAll) {
              reinforcements += CONTINENT_BONUSES[continentName] || 0;
            }
          });
          
          G.reinforcementsToPlace = G.reinforcementsToPlace || {};
          G.reinforcementsToPlace[currentPlayer] = reinforcements;
          
          events.setActivePlayers({ currentPlayer: 'reinforcement' });
        },
        
        onMove: ({ G, events, ctx }) => {
          checkVictoryCondition(G, events, ctx);
        },
        
        stages: {
          reinforcement: {
            moves: {
              placeReinforcement: ({ G, playerID }, countryId) => {
                const currentPlayer = String(playerID);
                if (!G.turnPlacements) G.turnPlacements = [];
                if (G.owners[countryId] !== currentPlayer) return;
                if (G.reinforcementsToPlace[currentPlayer] <= 0) return;
                
                G.troops[countryId] = (G.troops[countryId] || 0) + 1;
                G.reinforcementsToPlace[currentPlayer] -= 1;
                G.turnPlacements.push(countryId);
              },
              
              removeReinforcement: ({ G, playerID }, countryId) => {
                const currentPlayer = String(playerID);
                if (!G.turnPlacements) G.turnPlacements = [];
                const index = G.turnPlacements.indexOf(countryId);
                if (index === -1) return;
                
                G.troops[countryId] -= 1;
                G.reinforcementsToPlace[currentPlayer] += 1;
                G.turnPlacements.splice(index, 1);
              },
              
              endReinforcement: ({ G, ctx, events, playerID }) => {
                const currentPlayer = String(playerID);
                if (G.reinforcementsToPlace[currentPlayer] > 0) return;
                events.setActivePlayers({ currentPlayer: 'attack' })
              },
            },
          },
          
          attack: {
            moves: {
              selectAttackerTerritory: ({ G, playerID }, territoryId) => {
                const currentPlayer = String(playerID);
                if (!G.attackState) G.attackState = { from: null, to: null, attackDiceCount: null };
                if (G.owners[territoryId] !== currentPlayer) return;
                if (G.troops[territoryId] < 2) return;
                G.attackState.from = territoryId;
              },
              
              selectDefenderTerritory: ({ G, playerID }, territoryId) => {
                const currentPlayer = String(playerID);
                if (!G.attackState || !G.attackState.from) return;
                if (!RISK_ADJACENCY[G.attackState.from].includes(territoryId)) return;
                if (G.owners[territoryId] === currentPlayer) return;
                G.attackState.to = territoryId;
              },
              
              confirmAttackDice: ({ G, playerID }, diceCount) => {
                if (!G.attackState || !G.attackState.from) return;
                const maxDice = Math.min(3, G.troops[G.attackState.from] - 1);
                if (diceCount > maxDice || diceCount < 1) return;
                G.attackState.attackDiceCount = diceCount;
              },
              
              executeAttack: {
                move: ({ G, ctx, random }) => {
                  if (!G.attackState || !G.attackState.from || !G.attackState.to || !G.attackState.attackDiceCount) return;
                  
                  const from = G.attackState.from;
                  const to = G.attackState.to;
                  const attackDiceCount = G.attackState.attackDiceCount;
                  
                  const attackerRolls = Array.from({ length: attackDiceCount }, () => random.D6()).sort((a, b) => b - a);
                  const defenderDiceCount = Math.min(G.troops[to], 3);
                  const defenderRolls = Array.from({ length: defenderDiceCount }, () => random.D6()).sort((a, b) => b - a);
                  
                  let attackerLosses = 0;
                  let defenderLosses = 0;
                  const comparisons = Math.min(attackerRolls.length, defenderRolls.length);
                  
                  for (let i = 0; i < comparisons; i++) {
                    if (attackerRolls[i] > defenderRolls[i]) defenderLosses++;
                    else attackerLosses++;
                  }
                  
                  G.troops[from] -= attackerLosses;
                  G.troops[to] -= defenderLosses;
                  
                  let conquered = false;
                  const originalDefenderOwner = G.owners[to];
                  
                  if (G.troops[to] === 0) {
                    conquered = true;
                    G.owners[to] = ctx.currentPlayer;
                    G.troops[to] = attackDiceCount;
                    G.troops[from] -= attackDiceCount;
                  }
                  
                  G.battleResult = {
                    attackerDice: attackerRolls,
                    defenderDice: defenderRolls,
                    attackerLosses,
                    defenderLosses,
                    conquered,
                    fromTerritory: from,
                    toTerritory: to,
                    originalDefenderOwner: originalDefenderOwner
                  };
                  
                  G.attackState.to = null;
                  G.attackState.attackDiceCount = null;
                },
                client: false,
              },
              
              resetAttackSelection: ({ G }) => {
                G.attackState = { from: null, to: null, attackDiceCount: null };
                G.battleResult = null;
              },
              
              endAttackStage: ({ G, events }) => {
                G.attackState = null;
                G.battleResult = null;
                events.setActivePlayers({ currentPlayer: 'strategicMovement' });
              },
            },
          },
          
          strategicMovement: {
            moves: {
              selectFortifyFrom: ({ G, playerID }, territoryId) => {
                const currentPlayer = String(playerID);
                if (!G.fortifyState) G.fortifyState = { from: null, to: null };
                if (G.owners[territoryId] !== currentPlayer) return;
                if (G.troops[territoryId] < 2) return;
                G.fortifyState.from = territoryId;
              },
              
              selectFortifyTo: ({ G, playerID }, territoryId) => {
                const currentPlayer = String(playerID);
                if (!G.fortifyState || !G.fortifyState.from) return;
                if (!RISK_ADJACENCY[G.fortifyState.from].includes(territoryId)) return;
                if (G.owners[territoryId] !== currentPlayer) return;
                G.fortifyState.to = territoryId;
              },
              
              executeFortify: ({ G, events }, troopCount) => {
                if (!G.fortifyState || !G.fortifyState.from || !G.fortifyState.to) return;
                const from = G.fortifyState.from;
                const to = G.fortifyState.to;
                if (troopCount < 1 || G.troops[from] - troopCount < 1) return;
                
                G.troops[from] -= troopCount;
                G.troops[to] += troopCount;
                G.fortifyState = null;
                events.endTurn();
              },
              
              skipFortify: ({ G, events }) => {
                G.fortifyState = null;
                events.endTurn();
              },
              
              resetFortifySelection: ({ G }) => {
                G.fortifyState = { from: null, to: null };
              },
            },
          },
        },
      },
    },
  },
};

module.exports = { RiskGame };