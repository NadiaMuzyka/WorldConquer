import React, { useState, useEffect } from 'react';
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

export default function BattleResultModal({ onClose }) {
  // 1. CHIAMATA A TUTTI GLI HOOK (Sempre in alto)
  const { G, ctx, playerID } = useRisk();
  const [dicePhase, setDicePhase] = useState(1);
  
  const battleResult = G?.battleResult;

  // Definisci handleClose qui perché serve nell'useEffect
  const handleClose = () => {
    setDicePhase(1);
    if (onClose) onClose();
  };

  // Fase 1 -> Fase 2 dopo 2 secondi
  useEffect(() => {
    if (battleResult && dicePhase === 1) {
      const timer = setTimeout(() => setDicePhase(2), 2000);
      return () => clearTimeout(timer);
    }
  }, [dicePhase, battleResult]);

  // Fase 2 -> Fase 3 dopo 1 secondo
  useEffect(() => {
    if (battleResult && dicePhase === 2) {
      const timer = setTimeout(() => setDicePhase(3), 1000);
      return () => clearTimeout(timer);
    }
  }, [dicePhase, battleResult]);

  // Auto-chiusura dopo 5 secondi in fase 3
  useEffect(() => {
    if (battleResult && dicePhase === 3) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dicePhase, battleResult]);

  // 2. CONDIZIONE DI USCITA (Solo dopo che tutti gli hook sono stati dichiarati)
  if (!battleResult) return null;

  // 3. CALCOLO VARIABILI (Sicuro perché battleResult esiste qui)
  const attackerColor = PLAYER_COLORS[ctx.currentPlayer];
  const defenderColor = PLAYER_COLORS[G.owners[battleResult.toTerritory]];
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

  // 4. RENDER JSX
  return (
    <Modal
      title="Lancio dei Dadi"
      size="lg"
      preventClose={true}
      actionBar={
        dicePhase === 3 && (
          <Button variant="cyan" onClick={handleClose}>
            Chiudi
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Fase 1: Dadi non ordinati */}
        {dicePhase === 1 && (
          <div className="grid grid-cols-2 gap-8">
            {/* Attaccante */}
            <div className="space-y-3">
              <h4 className="text-center font-bold" style={{ color: attackerColor }}>
                Attaccante
              </h4>
              <div className="flex justify-center gap-2 flex-wrap">
                {battleResult.attackerDice.map((value, idx) => (
                  <Die key={idx} value={value} color={ctx.currentPlayer} />
                ))}
              </div>
            </div>

            {/* Difensore */}
            <div className="space-y-3">
              <h4 className="text-center font-bold" style={{ color: defenderColor }}>
                Difensore
              </h4>
              <div className="flex justify-center gap-2 flex-wrap">
                {battleResult.defenderDice.map((value, idx) => (
                  <Die key={idx} value={value} color={G.owners[battleResult.toTerritory]} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fase 2 e 3: Dadi ordinati e confrontati */}
        {(dicePhase === 2 || dicePhase === 3) && (
          <div className="space-y-4">
            {/* Confronti affiancati */}
            {Array.from({ length: comparisons }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-center gap-6">
                <div className={`transition-all duration-300 ${
                  dicePhase === 3 && winners[idx] === 'attacker' 
                    ? 'ring-4 ring-yellow-400 rounded-lg shadow-lg shadow-yellow-400/50' 
                    : ''
                }`}>
                  <Die value={attackerSorted[idx]} color={ctx.currentPlayer} />
                </div>
                
                <span className="text-2xl font-bold text-gray-400">VS</span>
                
                <div className={`transition-all duration-300 ${
                  dicePhase === 3 && winners[idx] === 'defender' 
                    ? 'ring-4 ring-yellow-400 rounded-lg shadow-lg shadow-yellow-400/50' 
                    : ''
                }`}>
                  <Die value={defenderSorted[idx]} color={G.owners[battleResult.toTerritory]} />
                </div>
              </div>
            ))}

            {/* Fase 3: Risultato testuale */}
            {dicePhase === 3 && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg text-center space-y-2">
                {battleResult.conquered ? (
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-yellow-400">
                      🏴 Territorio Conquistato!
                    </p>
                    <p className="text-gray-300">
                      <span style={{ color: attackerColor }} className="font-bold">
                        {ctx.currentPlayer === playerID ? 'Hai' : `Player ${ctx.currentPlayer} ha`}
                      </span>
                      {' '}conquistato <span className="font-bold">{toName}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-lg font-bold">Esito della Battaglia</p>
                    <p className="text-gray-300">
                      Difensore perde <span className="text-red-400 font-bold">{battleResult.defenderLosses}</span> {battleResult.defenderLosses === 1 ? 'truppa' : 'truppe'}
                    </p>
                    <p className="text-gray-300">
                      Attaccante perde <span className="text-red-400 font-bold">{battleResult.attackerLosses}</span> {battleResult.attackerLosses === 1 ? 'truppa' : 'truppe'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}