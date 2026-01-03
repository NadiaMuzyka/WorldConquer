import React from 'react';

const PIP_POSITIONS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// Configurazione dei colori per ogni armata
// Definiamo background, bordo, ombra e colore del pallino (pip)
const COLOR_VARIANTS = {
  red: {
    base: 'bg-red-600 border-red-800 shadow-red-900/50',
    pip: 'bg-white'
  },
  blue: {
    base: 'bg-blue-600 border-blue-800 shadow-blue-900/50',
    pip: 'bg-white'
  },
  yellow: {
    // Il giallo è chiaro, quindi usiamo un bordo ambra scuro e pallini neri per contrasto
    base: 'bg-yellow-400 border-yellow-600 shadow-yellow-700/50',
    pip: 'bg-black' 
  },
  green: {
    base: 'bg-green-600 border-green-800 shadow-green-900/50',
    pip: 'bg-white'
  },
  black: {
    base: 'bg-slate-900 border-slate-700 shadow-black/60',
    pip: 'bg-white'
  },
  purple: {
    base: 'bg-purple-600 border-purple-800 shadow-purple-900/50',
    pip: 'bg-white'
  },
};

const Die = ({ value, color = 'red' }) => { // Default rosso se manca il colore
  // Recupera le classi giuste, o usa il rosso come fallback se il colore non esiste
  const theme = COLOR_VARIANTS[color.toLowerCase()] || COLOR_VARIANTS.red;
  
  const activePips = PIP_POSITIONS[value] || [];

  return (
    <div
      className={`
        relative w-16 h-16 sm:w-20 sm:h-20 
        rounded-xl border-b-4 border-r-2 
        shadow-lg flex items-center justify-center p-2
        transition-transform transform hover:-translate-y-1
        ${theme.base} 
      `}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full">
        {[...Array(9)].map((_, index) => (
          <div key={index} className="flex items-center justify-center">
            {activePips.includes(index) && (
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm ${theme.pip}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Die;