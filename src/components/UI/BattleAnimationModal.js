import React, { useState, useEffect } from 'react';
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
  const [dicePhase, setDicePhase] = useState(1);
  
  const battleResult = G?.battleResult;

  // Fase 1 -> Fase 2 dopo 2 secondi
  useEffect(() => {
    if (battleResult && dicePhase === 1) {
      const timer = setTimeout(() => setDicePhase(2), 2000);
      return () => clearTimeout(timer);
    }
  }, [dicePhase, battleResult]);

  // Fase 2 -> Completamento dopo 1.5 secondi
  useEffect(() => {
    if (battleResult && dicePhase === 2) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [dicePhase, battleResult, onComplete]);

  if (!battleResult) return null;

  const attackerColor = PLAYER_COLORS[ctx.currentPlayer];
  // Usa il colore ORIGINALE del difensore salvato nel battleResult
  const defenderColor = PLAYER_COLORS[battleResult.originalDefenderOwner || G.owners[battleResult.toTerritory]];
  const attackerDieColor = getPlayerDieColor(ctx.currentPlayer);
  // Usa il colore ORIGINALE del difensore per i dadi
  const defenderDieColor = getPlayerDieColor(battleResult.originalDefenderOwner || G.owners[battleResult.toTerritory]);

  // Prepara dadi ordinati per fase 2
  const attackerSorted = [...battleResult.attackerDice].sort((a, b) => b - a);
  const defenderSorted = [...battleResult.defenderDice].sort((a, b) => b - a);
  const comparisons = Math.min(attackerSorted.length, defenderSorted.length);

  return (
    <Modal
      title="Lancio dei Dadi"
      size="lg"
      preventClose={true}
    >
      <div className="space-y-6">
        {/* Fase 1: Dadi non ordinati */}
        {dicePhase === 1 && (
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
        )}

        {/* Fase 2: Dadi ordinati e confrontati */}
        {dicePhase === 2 && (
          <div className="space-y-6 transition-all duration-700 ease-in-out animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-200 mb-4">Confronto</h3>
            </div>
            
            {/* Confronti affiancati */}
            {Array.from({ length: comparisons }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-center gap-8 transform transition-all duration-500 ease-in-out">
                <div className="transform transition-all duration-300 ease-in-out hover:scale-105">
                  <Die value={attackerSorted[idx]} color={attackerDieColor} />
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-gray-400 animate-pulse">VS</span>
                  <div className="text-xs text-gray-500 mt-1">#{idx + 1}</div>
                </div>
                
                <div className="transform transition-all duration-300 ease-in-out hover:scale-105">
                  <Die value={defenderSorted[idx]} color={defenderDieColor} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.7s ease-in-out;
        }
      `}</style>
    </Modal>
  );
}