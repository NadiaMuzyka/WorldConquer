import { useEffect } from 'react';
import Modal from './Modal';
import Die from './Die';
import { useRisk } from '../../context/GameContext';
import { PLAYER_COLORS } from '../Constants/colors';
import { CONTINENTS_DATA } from '../Constants/mapData';

// Helper per ottenere il nome del territorio
const getTerritoryName = (territoryId) => {
  for (const continent of Object.values(CONTINENTS_DATA)) {
    const territory = continent.find(t => t.id === territoryId);
    if (territory) return territory.name;
  }
  return territoryId;
};

// Converte i colori hex dei player ai nomi che Die.js si aspetta
const getPlayerDieColor = (playerId) => {
  const colorMap = {
    "0": "red",    // #d32f2f
    "1": "blue",   // #1976d2
    "2": "green",  // #388e3c
    "3": "yellow", // #fbc02d
    "4": "purple", // #9c27b0
    "5": "black",  // #000000
  };
  return colorMap[playerId] || "red";
};

export default function BattleAnimationModal({ onComplete }) {
  const { G, ctx } = useRisk();
  
  const battleResult = G?.battleResult;

  // Passa direttamente al modal successivo dopo 8 secondi
  useEffect(() => {
    if (battleResult) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [battleResult, onComplete]);

  if (!battleResult) return null;

  const attackerColor = PLAYER_COLORS[ctx.currentPlayer];
  // Usa il colore ORIGINALE del difensore salvato nel battleResult
  const defenderColor = PLAYER_COLORS[battleResult.originalDefenderOwner || G.owners[battleResult.toTerritory]];
  const attackerDieColor = getPlayerDieColor(ctx.currentPlayer);
  // Usa il colore ORIGINALE del difensore per i dadi
  const defenderDieColor = getPlayerDieColor(battleResult.originalDefenderOwner || G.owners[battleResult.toTerritory]);

  return (
    <Modal
      title="Lancio dei Dadi"
      size="lg"
      preventClose={true}
    >
      <div className="space-y-6">
        {/* Dadi lanciati */}
        <div className="grid grid-cols-2 gap-8 transition-all duration-500 ease-in-out">
          {/* Attaccante */}
          <div className="space-y-4 transform transition-all duration-500 ease-in-out">
            <h4 className="text-center font-bold text-xl" style={{ color: attackerColor }}>
              Attaccante
            </h4>
            <div className="flex justify-center gap-3 flex-wrap">
              {battleResult.attackerDice.map((value, idx) => (
                <div key={idx} className="transform transition-all duration-300 ease-in-out hover:scale-105">
                  <Die value={value} color={attackerDieColor} />
                </div>
              ))}
            </div>
          </div>

          {/* Difensore */}
          <div className="space-y-4 transform transition-all duration-500 ease-in-out">
            <h4 className="text-center font-bold text-xl" style={{ color: defenderColor }}>
              Difensore
            </h4>
            <div className="flex justify-center gap-3 flex-wrap">
              {battleResult.defenderDice.map((value, idx) => (
                <div key={idx} className="transform transition-all duration-300 ease-in-out hover:scale-105">
                  <Die value={value} color={defenderDieColor} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}