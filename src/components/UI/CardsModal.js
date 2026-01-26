import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import RiskCard from './RiskCard';
import { Button } from './Button';
import { GiMountedKnight, GiFieldGun, GiPikeman, GiCardJoker } from 'react-icons/gi';

const CardsModal = ({ 
  onClose, 
  playerCards = [], 
  onExchangeCards, 
  canExchange = false // true solo se è reinforcement stage del giocatore attivo
}) => {
  const [selectedIndices, setSelectedIndices] = useState([]);

  // Gestisce la selezione/deselezione delle carte
  const handleCardClick = (index) => {
    if (selectedIndices.includes(index)) {
      // Deseleziona
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      // Seleziona solo se non abbiamo già 3 carte
      if (selectedIndices.length < 3) {
        setSelectedIndices([...selectedIndices, index]);
      }
    }
  };

  // Valida la combinazione di carte selezionate
  const validation = useMemo(() => {
    if (selectedIndices.length !== 3) {
      return { valid: false, bonus: 0, message: 'Seleziona 3 carte' };
    }

    const selectedCards = selectedIndices.map(idx => playerCards[idx]);
    const types = selectedCards.map(card => card.type);
    const jollyCount = types.filter(t => t === 'JOLLY').length;

    // Caso 1: 2 jolly + altra carta = NON VALIDO
    if (jollyCount === 2) {
      return { valid: false, bonus: 0, message: 'Combinazione non valida' };
    }

    // Caso 2: 1 jolly + 2 carte uguali = 12 truppe
    if (jollyCount === 1) {
      const otherTypes = types.filter(t => t !== 'JOLLY');
      if (otherTypes[0] === otherTypes[1]) {
        return { valid: true, bonus: 12, message: '+12 truppe' };
      }
      return { valid: false, bonus: 0, message: 'Jolly richiede 2 carte uguali' };
    }

    // Caso 3: 3 carte senza jolly
    const infantryCount = types.filter(t => t === 'INFANTRY').length;
    const cavalryCount = types.filter(t => t === 'CAVALRY').length;
    const artilleryCount = types.filter(t => t === 'ARTILLERY').length;

    if (artilleryCount === 3) {
      return { valid: true, bonus: 4, message: '+4 truppe' };
    }
    if (infantryCount === 3) {
      return { valid: true, bonus: 6, message: '+6 truppe' };
    }
    if (cavalryCount === 3) {
      return { valid: true, bonus: 8, message: '+8 truppe' };
    }
    if (infantryCount === 1 && cavalryCount === 1 && artilleryCount === 1) {
      return { valid: true, bonus: 10, message: '+10 truppe' };
    }

    return { valid: false, bonus: 0, message: 'Combinazione non valida' };
  }, [selectedIndices, playerCards]);

  // Gestisce lo scambio delle carte
  const handleExchange = () => {
    if (validation.valid && canExchange) {
      onExchangeCards(selectedIndices);
      setSelectedIndices([]);
      onClose();
    }
  };

  // Icone per la legenda
  const CardIcon = ({ type, size = 'text-4xl' }) => {
    const iconProps = { className: size };
    switch (type) {
      case 'INFANTRY':
        return <GiPikeman {...iconProps} />;
      case 'CAVALRY':
        return <GiMountedKnight {...iconProps} />;
      case 'ARTILLERY':
        return <GiFieldGun {...iconProps} />;
      case 'JOLLY':
        return <GiCardJoker {...iconProps} />;
      default:
        return <span>?</span>;
    }
  };

  return (
    <Modal
      title="Le Tue Carte"
      size="full"
      onClose={onClose}
      actionBar={
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {validation.message}
          </span>
          <Button
            variant={validation.valid && canExchange ? 'cyan' : 'gray'}
            onClick={handleExchange}
            disabled={!validation.valid || !canExchange}
            size="md"
          >
            Scambia Carte
          </Button>
          <Button variant="outline" onClick={onClose} size="md">
            Chiudi
          </Button>
        </div>
      }
    >
      <div className="flex gap-8 h-full">
        {/* SEZIONE SINISTRA: Carte del giocatore (50%) */}
        <div className="w-1/2 flex flex-col">
          <h3 className="text-2xl font-bold text-white mb-6">
            Carte Possedute ({playerCards.length})
          </h3>
          
          {playerCards.length === 0 ? (
            <div className="flex items-center justify-center flex-1 text-gray-400 text-lg">
              Non hai ancora carte. Conquista un territorio per riceverne una!
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto pr-4">
              {playerCards.map((card, index) => (
                <div key={index} className="flex justify-center">
                  <RiskCard
                    type={card.type}
                    isSelected={selectedIndices.includes(index)}
                    onClick={() => handleCardClick(index)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEZIONE DESTRA: Legenda (50%) */}
        <div className="w-1/2 bg-slate-800/50 rounded-lg p-8 border border-slate-700 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            Combinazioni Valide
          </h3>
          
          <div className="space-y-5">
            {/* 3 Cannoni */}
            <div className="flex items-center justify-between bg-slate-700/80 p-5 rounded-lg hover:bg-slate-700 transition">
              <div className="flex items-center gap-3">
                <CardIcon type="ARTILLERY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <CardIcon type="ARTILLERY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <CardIcon type="ARTILLERY" size="text-5xl" />
              </div>
              <span className="text-yellow-400 font-bold text-5xl">+4</span>
            </div>

            {/* 3 Fanti */}
            <div className="flex items-center justify-between bg-slate-700/80 p-5 rounded-lg hover:bg-slate-700 transition">
              <div className="flex items-center gap-3">
                <CardIcon type="INFANTRY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <CardIcon type="INFANTRY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <CardIcon type="INFANTRY" size="text-5xl" />
              </div>
              <span className="text-yellow-400 font-bold text-5xl">+6</span>
            </div>

            {/* 3 Cavalieri */}
            <div className="flex items-center justify-between bg-slate-700/80 p-5 rounded-lg hover:bg-slate-700 transition">
              <div className="flex items-center gap-3">
                <CardIcon type="CAVALRY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <CardIcon type="CAVALRY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <CardIcon type="CAVALRY" size="text-5xl" />
              </div>
              <span className="text-yellow-400 font-bold text-5xl">+8</span>
            </div>

            {/* Tris Misto */}
            <div className="flex items-center justify-between bg-slate-700/80 p-5 rounded-lg hover:bg-slate-700 transition">
              <div className="flex items-center gap-3">
                <CardIcon type="INFANTRY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <CardIcon type="CAVALRY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <CardIcon type="ARTILLERY" size="text-5xl" />
              </div>
              <span className="text-yellow-400 font-bold text-5xl">+10</span>
            </div>

            {/* Jolly + 2 Uguali */}
            <div className="flex items-center justify-between bg-slate-700/80 p-5 rounded-lg hover:bg-slate-700 transition">
              <div className="flex items-center gap-3">
                <CardIcon type="JOLLY" size="text-5xl" />
                <span className="text-white text-2xl font-bold">+</span>
                <div className="flex items-center gap-1">
                  <span className="text-white text-sm font-bold bg-slate-600 px-2 py-1 rounded">2x carte uguali</span>
                </div>
              </div>
              <span className="text-yellow-400 font-bold text-5xl">+12</span>
            </div>
          </div>

          {!canExchange && (
            <div className="mt-8 bg-yellow-900/30 border border-yellow-700 rounded p-4 text-sm text-yellow-300">
              ⚠️ Puoi scambiare carte solo durante la tua fase di rinforzo
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CardsModal;
