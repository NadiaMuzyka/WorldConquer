// src/gameHelpers.js
const { CONTINENTS_DATA } = require('./components/Constants/mapData');

// Funzione per generare il mazzo di carte Risk
const generateDeck = () => {
  const deck = [];
  for (let i = 0; i < 13; i++) {
    deck.push({ type: 'INFANTRY' });
    deck.push({ type: 'CAVALRY' });
    deck.push({ type: 'ARTILLERY' });
  }
  deck.push({ type: 'JOLLY' });
  deck.push({ type: 'JOLLY' });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

// Funzione per validare una combinazione di 3 carte e calcolare il bonus
const validateCardCombination = (cards) => {
  if (!cards || cards.length !== 3) {
    return { valid: false, bonus: 0 };
  }

  const types = cards.map(card => card.type);
  const jollyCount = types.filter(t => t === 'JOLLY').length;

  if (jollyCount === 2) {
    return { valid: false, bonus: 0 };
  }

  if (jollyCount === 1) {
    const otherTypes = types.filter(t => t !== 'JOLLY');
    if (otherTypes[0] === otherTypes[1]) {
      return { valid: true, bonus: 12 };
    }
    return { valid: false, bonus: 0 };
  }

  const infantryCount = types.filter(t => t === 'INFANTRY').length;
  const cavalryCount = types.filter(t => t === 'CAVALRY').length;
  const artilleryCount = types.filter(t => t === 'ARTILLERY').length;

  if (artilleryCount === 3) return { valid: true, bonus: 4 };
  if (infantryCount === 3) return { valid: true, bonus: 6 };
  if (cavalryCount === 3) return { valid: true, bonus: 8 };
  if (infantryCount === 1 && cavalryCount === 1 && artilleryCount === 1) return { valid: true, bonus: 10 };

  return { valid: false, bonus: 0 };
};

// Funzione per piazzare truppe casuali per un giocatore AFK
const autoPlaceTroops = (G, ctx, playerID, count) => {
  if (count <= 0) return;
  const ownedTerritories = Object.entries(G.owners)
    .filter(([id, owner]) => owner === playerID)
    .map(([id]) => id);

  if (ownedTerritories.length === 0) {
    console.warn(`⚠️ [AUTO-PLACE] Player ${playerID} non ha territori!`);
    return;
  }

  const shuffled = [...ownedTerritories];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let i = 0; i < count; i++) {
    const territoryIndex = i % shuffled.length;
    const territory = shuffled[territoryIndex];
    G.troops[territory] = (G.troops[territory] || 0) + 1;
  }
};

// Funzione helper per gestire l'uscita di un giocatore (volontaria o disconnessione)
const handlePlayerExit = (G, ctx, events, playerID, reason = 'leave') => {
  if (!G.hasLeft) G.hasLeft = {};
  if (G.hasLeft[playerID] === true) {
    console.log(`⚠️ [EXIT-SKIP] Player ${playerID} ha già abbandonato - skip duplicato`);
    return;
  }

  console.log(`🚪 [EXIT] Player ${playerID} abbandona (reason: ${reason})`);
  G.hasLeft[playerID] = true;

  if (ctx.currentPlayer === playerID) {
    console.log(`  ↳ Auto-completamento turno per player ${playerID}`);
    if (ctx.phase === 'INITIAL_REINFORCEMENT') {
      const remaining = G.reinforcementsRemaining?.[playerID] || 0;
      const toPlace = Math.min(3, remaining);
      if (toPlace > 0) {
        autoPlaceTroops(G, ctx, playerID, toPlace);
        G.reinforcementsRemaining[playerID] -= toPlace;
        console.log(`    ↳ Auto-piazzate ${toPlace} truppe`);
      }
      G.turnPlacements = [];
    } else if (ctx.phase === 'GAME') {
      const reinforcements = G.reinforcementsToPlace?.[playerID] || 0;
      if (reinforcements > 0) {
        autoPlaceTroops(G, ctx, playerID, reinforcements);
        G.reinforcementsToPlace[playerID] = 0;
        console.log(`    ↳ Auto-piazzati ${reinforcements} rinforzi`);
      }
    }

    console.log(`  ↳ Chiamata events.endTurn()`);
    events.endTurn();
  }
};

// Funzione per assegnare obiettivi segreti ai giocatori
const assignSecretObjectives = (G, ctx) => {
  const numPlayers = ctx.numPlayers;
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

  const allObjectives = [
    { type: 'CONQUER_CONTINENT', continent: 'NORD_AMERICA', description: 'Conquista la totalità del Nord America' },
    { type: 'CONQUER_TWO_CONTINENTS', continents: ['SUD_AMERICA', 'OCEANIA'], description: 'Conquista interamente Sud America e Oceania' },
    { type: 'CONQUER_CONTINENT_PLUS', continent: 'EUROPA', extraTerritories: 3, description: 'Conquista Europa + 3 territori a tua scelta' },
    { type: 'CONQUER_CONTINENT_PLUS', continent: 'AFRICA', extraTerritories: 3, extraContinent: 'NORD_AMERICA', description: 'Conquista Africa + 3 territori di Nord America' },
    { type: 'CONQUER_N_IN_CONTINENT', continent: 'ASIA', count: 9, description: 'Conquista 9 territori dell\'Asia' },
    { type: 'CONQUER_N_TERRITORIES', count: conquerNTerritoriesCount, description: conquerNTerritoriesDescription },
  ];

  const colorObjectives = [
    { type: 'ELIMINATE_COLOR', color: '0', colorName: 'rosse', description: 'Distruggi interamente le armate rosse' },
    { type: 'ELIMINATE_COLOR', color: '1', colorName: 'blu', description: 'Distruggi interamente le armate blu' },
    { type: 'ELIMINATE_COLOR', color: '2', colorName: 'verdi', description: 'Distruggi interamente le armate verdi' },
  ];

  if (numPlayers >= 4) {
    colorObjectives.push({ type: 'ELIMINATE_COLOR', color: '3', colorName: 'gialle', description: 'Distruggi interamente le armate gialle' });
  }
  if (numPlayers >= 5) {
    colorObjectives.push({ type: 'ELIMINATE_COLOR', color: '4', colorName: 'viola', description: 'Distruggi interamente le armate viola' });
  }
  if (numPlayers === 6) {
    colorObjectives.push({ type: 'ELIMINATE_COLOR', color: '5', colorName: 'nere', description: 'Distruggi interamente le armate nere' });
  }

  const availableObjectives = [...allObjectives, ...colorObjectives];

  for (let i = availableObjectives.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableObjectives[i], availableObjectives[j]] = [availableObjectives[j], availableObjectives[i]];
  }

  for (let i = 0; i < numPlayers; i++) {
    const playerId = String(i);
    if (!G.players) G.players = {};
    if (!G.players[playerId]) G.players[playerId] = { secretObjective: null };

    let objective = null;
    for (let j = 0; j < availableObjectives.length; j++) {
      const obj = availableObjectives[j];
      if (obj.type === 'ELIMINATE_COLOR' && obj.color === playerId) continue;
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

  const totalPlayers = Object.keys(G.players).length;
  const abandonedCount = Object.values(G.hasLeft || {}).filter(left => left === true).length;

  if (abandonedCount === totalPlayers - 1) {
    const lastPlayerStanding = Object.keys(G.hasLeft).find(playerID => !G.hasLeft[playerID]);
    console.log(`🏁 [GAME END] Last Man Standing: Player ${lastPlayerStanding}`);
    events.endGame({ 
      winner: lastPlayerStanding, 
      victoryType: 'lastManStanding',
      reason: 'Tutti gli avversari hanno abbandonato'
    });
    return true;
  }

  for (const [playerID, playerData] of Object.entries(G.players)) {
    if (G.hasLeft?.[playerID]) continue;
    if (!playerData.secretObjective) continue;

    const objective = playerData.secretObjective;
    let objectiveMet = false;

    switch (objective.type) {
      case 'CONQUER_CONTINENT': {
        const continent = CONTINENTS_DATA[objective.continent];
        if (continent) objectiveMet = continent.every(territory => G.owners[territory.id] === playerID);
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
      events.endGame({ 
        winner: playerID, 
        victoryType: 'objective',
        objectiveCompleted: objective 
      });
      return true;
    }
  }

  return false;
};

module.exports = {
  generateDeck,
  validateCardCombination,
  autoPlaceTroops,
  handlePlayerExit,
  assignSecretObjectives,
  checkVictoryCondition,
};
