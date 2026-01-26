import React from 'react';
import { GiMountedKnight, GiFieldGun, GiPikeman, GiCardJoker } from 'react-icons/gi';

const RiskCard = ({ type = 'ARTILLERY', isSelected = false, onClick, className = '' }) => {
  // Mappatura tipi per retrocompatibilità
  const normalizeType = (t) => {
    const typeMap = {
      'cannone': 'ARTILLERY',
      'ARTILLERY': 'ARTILLERY',
      'alfiere': 'CAVALRY',
      'cavaliere': 'CAVALRY',
      'CAVALRY': 'CAVALRY',
      'fante': 'INFANTRY',
      'INFANTRY': 'INFANTRY',
      'jolly': 'JOLLY',
      'JOLLY': 'JOLLY'
    };
    return typeMap[t] || 'ARTILLERY';
  };
  
  const normalizedType = normalizeType(type);
  
  // Funzione per ottenere l'icona appropriata
  const getIcon = (cardType) => {
    switch (cardType) {
      case 'CAVALRY':
        return <GiMountedKnight className="w-full h-full text-gray-800" />;
      case 'ARTILLERY':
        return <GiFieldGun className="w-full h-full text-gray-800" />;
      case 'JOLLY':
        return <GiCardJoker className="w-full h-full text-gray-800" />;
      case 'INFANTRY':
      default:
        return <GiPikeman className="w-full h-full text-gray-800" />;
    }
  };

  // Ottieni l'etichetta corretta
  const getLabel = (cardType) => {
    switch (cardType) {
      case 'CAVALRY': return 'Cavaliere';
      case 'ARTILLERY': return 'Cannone';
      case 'JOLLY': return 'Jolly';
      case 'INFANTRY': return 'Fante';
      default: return cardType;
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex items-center justify-center 
        w-48 h-72 
        bg-slate-50 
        ${isSelected ? 'border-[8px] border-yellow-500' : 'border-[6px] border-slate-900'}
        rounded-xl 
        shadow-lg hover:shadow-2xl transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${className}
      `}
    >
      {/* Texture carta (opzionale, per dare effetto cartaceo) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* Contenitore Icona */}
      <div className="w-32 h-32 flex items-center justify-center">
        {getIcon(normalizedType)}
      </div>

      {/* Etichetta in basso (Opzionale, stile carte vere) */}
      <div className="absolute bottom-4 uppercase tracking-widest text-xs font-bold text-slate-500">
        {getLabel(normalizedType)}
      </div>
    </div>
  );
};

export default RiskCard;
