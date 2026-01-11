import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import RangeInput from './Input/RangeInput';
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
      title="Spostamento Strategico"
      size="sm"
      onClose={onClose}
      actionBar={
        <>
          <Button variant="gray" onClick={onClose}>
            Annulla
          </Button>
          <Button variant="cyan" onClick={handleConfirm}>
            Conferma Spostamento
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-gray-300">
            Da: <span className="font-bold text-white">{fromName}</span>
          </p>
          <p className="text-gray-300">
            A: <span className="font-bold text-white">{toName}</span>
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Quante truppe vuoi spostare?
          </label>
          
          <RangeInput
            min={1}
            max={maxTroops}
            value={troopCount}
            onChange={(e) => setTroopCount(parseInt(e.target.value))}
          />

          <div className="flex justify-between text-sm text-gray-400">
            <span>1 truppa</span>
            <span className="font-bold text-cyan-400">{troopCount}</span>
            <span>{maxTroops} {maxTroops === 1 ? 'truppa' : 'truppe'}</span>
          </div>

          <p className="text-xs text-gray-500 text-center mt-2">
            (Rimarranno {G.troops[fromTerritory] - troopCount} {G.troops[fromTerritory] - troopCount === 1 ? 'truppa' : 'truppe'} in {fromName})
          </p>
        </div>
      </div>
    </Modal>
  );
}
