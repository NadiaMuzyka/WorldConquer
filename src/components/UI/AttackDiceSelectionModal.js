import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useRisk } from '../../context/GameContext';

export default function AttackDiceSelectionModal({ onClose }) {
  const { G, moves } = useRisk();
  const [selectedDice, setSelectedDice] = useState(1);

  if (!G?.attackState?.from) {
    onClose();
    return null;
  }

  const maxDice = Math.min(3, G.troops[G.attackState.from] - 1);

  const handleConfirm = () => {
    if (moves?.confirmAttackDice && moves?.executeAttack) {
      moves.confirmAttackDice(selectedDice);
      moves.executeAttack();
    }
    onClose();
  };

  return (
    <Modal
      title="Scegli con quante truppe attaccare"
      size="sm"
      onClose={onClose}
      actionBar={
        <>
          <Button variant="gray" onClick={onClose}>
            Annulla
          </Button>
          <Button variant="red" onClick={handleConfirm}>
            Conferma Attacco
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-300 text-center">
          Puoi attaccare con massimo {maxDice} {maxDice === 1 ? 'dado' : 'dadi'}
        </p>
        
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map((count) => (
            <button
              key={count}
              onClick={() => setSelectedDice(count)}
              disabled={count > maxDice}
              className={`
                w-16 h-16 rounded-xl font-bold text-xl
                transition-all duration-200
                ${count > maxDice 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
                  : selectedDice === count
                    ? 'bg-red-600 text-white shadow-lg scale-110 ring-2 ring-red-400'
                    : 'bg-gray-600 text-white hover:bg-gray-500 hover:scale-105'
                }
              `}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
