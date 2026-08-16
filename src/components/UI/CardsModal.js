import React, { useState, useMemo } from 'react';
import RiskCard from './RiskCard';
import Button from './Button';
import { GiMountedKnight, GiFieldGun, GiPikeman, GiCardJoker } from 'react-icons/gi';
import { X, Sparkles } from 'lucide-react';

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
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
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
  const CardIcon = ({ type, size = 'text-2xl' }) => {
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
    <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto">
      {/* Sfondo semitrasparente leggero per continuare a vedere la mappa sopra */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer compatto a comparsa dal basso */}
      <div className="relative w-full max-h-[75vh] bg-[#0b1622]/85 backdrop-blur-2xl border-t border-white/20 rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 z-10">
        
        {/* Header Drawer */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-extrabold text-white tracking-wide">
              Le Tue Carte ({playerCards.length})
            </h3>
            {validation.valid && (
              <span className="px-3 py-1 rounded-full bg-[#FEC417] text-gray-900 font-extrabold text-xs flex items-center gap-1 shadow-md animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                {validation.message}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={validation.valid && canExchange ? 'yellow' : 'outline'}
              onClick={handleExchange}
              disabled={!validation.valid || !canExchange}
              className={`h-9 px-5 text-xs font-bold uppercase rounded-xl transition-all ${
                validation.valid && canExchange 
                  ? '!bg-[#FEC417] !text-gray-900 shadow-[0_0_15px_rgba(254,196,23,0.5)]' 
                  : 'opacity-50 cursor-not-allowed border-white/20 text-gray-400'
              }`}
            >
              Scambia Carte
            </Button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body contenuto */}
        <div className="p-6 overflow-y-auto flex flex-col md:flex-row gap-6 max-h-[calc(75vh-80px)]">
          {/* Sezione Carte possedute (Orizzontale / Grid) */}
          <div className="flex-1 flex flex-col">
            {playerCards.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-base bg-white/5 rounded-2xl border border-white/10">
                Non hai ancora carte. Conquista almeno un territorio per riceverne una a fine turno!
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-start items-center">
                {playerCards.map((card, index) => (
                  <div key={index} className="transition-transform duration-200 hover:scale-105">
                    <RiskCard
                      type={card.type}
                      isSelected={selectedIndices.includes(index)}
                      onClick={() => handleCardClick(index)}
                    />
                  </div>
                ))}
              </div>
            )}

            {playerCards.length >= 3 && !(validation.valid && canExchange) && (
              <p className="mt-3 text-xs text-yellow-400/80 italic">
                * {!validation.valid
                  ? validation.message
                  : "Puoi effettuare lo scambio solo all'inizio della tua fase di rinforzo."}
              </p>
            )}
          </div>

          {/* Legenda Combinazioni (Compatta) */}
          <div className="w-full md:w-80 bg-black/40 rounded-2xl p-4 border border-white/10 flex flex-col gap-2 flex-shrink-0">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1 text-center">
              Combinazioni Valide
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-gray-200">
                  <CardIcon type="ARTILLERY" /> + <CardIcon type="ARTILLERY" /> + <CardIcon type="ARTILLERY" />
                </div>
                <span className="text-[#FEC417] font-bold text-sm">+4 truppe</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-gray-200">
                  <CardIcon type="INFANTRY" /> + <CardIcon type="INFANTRY" /> + <CardIcon type="INFANTRY" />
                </div>
                <span className="text-[#FEC417] font-bold text-sm">+6 truppe</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-gray-200">
                  <CardIcon type="CAVALRY" /> + <CardIcon type="CAVALRY" /> + <CardIcon type="CAVALRY" />
                </div>
                <span className="text-[#FEC417] font-bold text-sm">+8 truppe</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-gray-200">
                  <CardIcon type="INFANTRY" /> + <CardIcon type="CAVALRY" /> + <CardIcon type="ARTILLERY" />
                </div>
                <span className="text-[#FEC417] font-bold text-sm">+10 truppe</span>
              </div>

              <div className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 text-gray-200">
                  <CardIcon type="JOLLY" /> + <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">2x uguali</span>
                </div>
                <span className="text-[#FEC417] font-bold text-sm">+12 truppe</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CardsModal;
