import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import NumberSpinner from './NumberSpinner';
import { useRisk } from '../../context/GameContext';
import { CONTINENTS_DATA } from '../Constants/mapData';

// Helper per ottenere il nome del territorio
const getTerritoryName = (territoryId) => {
  for (const continent of Object.values(CONTINENTS_DATA)) {
    const territory = continent.find(t => t.id === territoryId);
    if (territory) return territory.name;
  }
  return territoryId;
};

export default function FortifyTroopsModal({ onClose }) {
  const { G, moves } = useRisk();
  const [troopCount, setTroopCount] = useState(1);

  if (!G?.fortifyState?.from || !G?.fortifyState?.to) {
    onClose();
    return null;
  }

  const fromTerritory = G.fortifyState.from;
  const toTerritory = G.fortifyState.to;
  const maxTroops = G.troops[fromTerritory] - 1; // Deve lasciare almeno 1 truppa

  const fromName = getTerritoryName(fromTerritory);
  const toName = getTerritoryName(toTerritory);

  const handleConfirm = () => {
    if (moves?.executeFortify) {
      moves.executeFortify(troopCount);
    }
    onClose();
  };

  return (
    <Modal
      title="🚚 Spostamento Strategico"
      size="sm"
      onClose={onClose}
      actionBar={
        <div className="flex gap-3 w-full">
          <Button variant="gray" onClick={onClose} className="flex-1">
            Annulla
          </Button>
          <Button variant="cyan" onClick={handleConfirm} className="flex-1">
            Conferma
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Riquadro territorii */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Da:</span>
            <span className="font-bold text-white text-lg">{fromName}</span>
          </div>
          
          <div className="flex justify-center">
            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">A:</span>
            <span className="font-bold text-white text-lg">{toName}</span>
          </div>
        </div>

        {/* Sezione selezione truppe */}
        <div className="space-y-4">
          <NumberSpinner
            label="Quante truppe vuoi spostare?"
            min={1}
            max={maxTroops}
            value={troopCount}
            onChange={setTroopCount}
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>Min: 1</span>
            <span>Max: {maxTroops}</span>
          </div>

          {/* Info residue */}
          <div className="bg-gray-900/50 rounded-lg p-3 text-center border border-gray-700/30">
            <p className="text-xs text-gray-400">
              Rimarranno <span className="font-bold text-gray-200">{G.troops[fromTerritory] - troopCount}</span> {G.troops[fromTerritory] - troopCount === 1 ? 'truppa' : 'truppe'} in {fromName}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
