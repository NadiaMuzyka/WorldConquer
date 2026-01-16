import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
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

export default function BattleResultModal({ onClose }) {
  const { G, ctx, playerID } = useRisk();
  const [showResults, setShowResults] = useState(false);
  
  const battleResult = G?.battleResult;

  // Usa useCallback per stabilizzare handleClose
  const handleClose = useCallback(() => {
    setShowResults(false);
    if (onClose) onClose();
  }, [onClose]);

  // Mostra i risultati con una leggera animazione
  useEffect(() => {
    if (battleResult) {
      const timer = setTimeout(() => setShowResults(true), 300);
      return () => clearTimeout(timer);
    }
  }, [battleResult]);

  // Auto-chiusura dopo 20 secondi (più tempo per leggere)
  useEffect(() => {
    if (battleResult && showResults) {
      const timer = setTimeout(() => {
        handleClose();
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [battleResult, showResults, handleClose]);

  if (!battleResult) return null;

  const attackerColor = PLAYER_COLORS[ctx.currentPlayer];
  // Usa il colore ORIGINALE del difensore salvato nel battleResult
  const defenderColor = PLAYER_COLORS[battleResult.originalDefenderOwner || G.owners[battleResult.toTerritory]];
  const attackerDieColor = getPlayerDieColor(ctx.currentPlayer);
  // Usa il colore ORIGINALE del difensore per i dadi
  const defenderDieColor = getPlayerDieColor(battleResult.originalDefenderOwner || G.owners[battleResult.toTerritory]);
  const fromName = getTerritoryName(battleResult.fromTerritory);
  const toName = getTerritoryName(battleResult.toTerritory);

  // Prepara dadi ordinati per fase 2 e 3
  const attackerSorted = [...battleResult.attackerDice].sort((a, b) => b - a);
  const defenderSorted = [...battleResult.defenderDice].sort((a, b) => b - a);
  const comparisons = Math.min(attackerSorted.length, defenderSorted.length);

  // Determina vincitori per ogni coppia
  const winners = [];
  for (let i = 0; i < comparisons; i++) {
    if (attackerSorted[i] > defenderSorted[i]) {
      winners.push('attacker');
    } else {
      winners.push('defender');
    }
  }

  return (
    <Modal
      title="Risultato della Battaglia"
      size="lg"
      preventClose={false}
      onClose={handleClose}
      actionBar={
        <Button variant="cyan" onClick={handleClose}>
          Chiudi
        </Button>
      }
    >
      <div className={`space-y-6 transition-all duration-500 ease-in-out ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Confronti con evidenziazione vincitori */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-200 mb-4">Esito del Confronto</h3>
          </div>
          
          {Array.from({ length: comparisons }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-center gap-8">
              <div className={`transition-all duration-700 ease-in-out transform ${
                winners[idx] === 'attacker' 
                  ? 'ring-4 ring-yellow-400 rounded-lg shadow-2xl shadow-yellow-400/50 scale-105' 
                  : 'scale-95 opacity-75'
              }`}>
                <Die value={attackerSorted[idx]} color={attackerDieColor} />
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-400">VS</span>
                {winners[idx] === 'attacker' ? (
                  <span className="text-yellow-400 text-xs font-bold mt-1">ATT</span>
                ) : (
                  <span className="text-yellow-400 text-xs font-bold mt-1">DIF</span>
                )}
              </div>
              
              <div className={`transition-all duration-700 ease-in-out transform ${
                winners[idx] === 'defender' 
                  ? 'ring-4 ring-yellow-400 rounded-lg shadow-2xl shadow-yellow-400/50 scale-105' 
                  : 'scale-95 opacity-75'
              }`}>
                <Die value={defenderSorted[idx]} color={defenderDieColor} />
              </div>
            </div>
          ))}
        </div>

        {/* Risultato finale */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg text-center space-y-3 transform transition-all duration-500 ease-in-out">
          {battleResult.conquered ? (
            <div className="space-y-3">
              <p className="text-2xl font-bold text-yellow-400">
                🏆 Territorio Conquistato!
              </p>
              <p className="text-lg text-gray-200">
                <span style={{ color: attackerColor }} className="font-bold">
                  {ctx.currentPlayer === playerID ? 'Hai' : `Player ${ctx.currentPlayer} ha`}
                </span>
                {' '}conquistato{' '}
                <span className="font-bold text-cyan-300">{toName}</span>
              </p>
              <div className="text-sm text-gray-400">
                <p>Da: <span className="text-cyan-200">{fromName}</span></p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xl font-bold text-orange-400">⚔️ Battaglia Completata</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-red-900/30 rounded-lg">
                  <p className="text-red-300 font-bold">Perdite Attaccante</p>
                  <p className="text-2xl font-bold text-red-400">
                    {battleResult.attackerLosses}
                  </p>
                </div>
                <div className="p-3 bg-red-900/30 rounded-lg">
                  <p className="text-red-300 font-bold">Perdite Difensore</p>
                  <p className="text-2xl font-bold text-red-400">
                    {battleResult.defenderLosses}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-3">
                <p><span className="text-cyan-200">{toName}</span> rimane sotto controllo del difensore</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}