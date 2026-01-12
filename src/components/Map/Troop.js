import React from 'react';
import { useRisk } from '../../context/GameContext';

export const Troop = ({ color, count, x, y, shouldShow = true, animationDelay = 0, countryId }) => {
  const { G, ctx, playerID, moves } = useRisk();
  
  // Se non deve essere mostrato, non renderizzare nulla
  if (!shouldShow || !color) return null;

  // Controlla se questa truppa è stata piazzata nel turno corrente
  const isReinforcementPhase = ctx?.phase === 'INITIAL_REINFORCEMENT';
  const isGameReinforcementStage = ctx?.phase === 'GAME' && ctx?.activePlayers?.[playerID] === 'reinforcement';
  const isPlacedThisTurn = (isReinforcementPhase || isGameReinforcementStage) && 
                          G?.turnPlacements && 
                          G.turnPlacements.includes(countryId);
  
  // Calcolo per centrare il carroarmato: 
  // L'SVG è 40x40, quindi sottraiamo 20 alle coordinate X e Y per centrarlo
  const position = `translate(${x - 20}, ${y - 20})`;

  // Colore di default se manca
  const tankColor = color || "#999"; 
  const strokeColor = "#333";
  
  // Handler per il bottone minus
  const handleRemove = (e) => {
    e.stopPropagation(); // Previeni la propagazione al Country
    if (moves && typeof moves.removeReinforcement === 'function') {
      moves.removeReinforcement(countryId);
    }
  };

  return (
    <g 
      transform={position} 
      style={{ 
        pointerEvents: isPlacedThisTurn ? 'auto' : 'none'
      }}
    >
      {/* Glow effect se piazzato in questo turno */}
      {isPlacedThisTurn && (
        <circle 
          cx="20" 
          cy="20" 
          r="22" 
          fill="none" 
          stroke="#FFD700"
          strokeWidth="2"
          opacity="0.7"
          style={{
            filter: 'drop-shadow(0 0 4px #FFD700)'
          }}
        />
      )}
      
      {/* Corpo del Carroarmato */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M10 10.75C10 9.75544 10.4425 8.80161 11.2302 8.09835C12.0178 7.39509 13.0861 7 14.2 7H16.342C17.7044 6.99965 19.0373 7.35428 20.1772 8.02039C21.3172 8.6865 22.2146 9.63514 22.7596 10.75H28.2C28.5713 10.75 28.9274 10.8817 29.19 11.1161C29.4525 11.3505 29.6 11.6685 29.6 12C29.6 12.3315 29.4525 12.6495 29.19 12.8839C28.9274 13.1183 28.5713 13.25 28.2 13.25H23.4148L23.8138 15.75H24.7C26.3709 15.75 27.9733 16.3426 29.1548 17.3975C30.3363 18.4524 31 19.8832 31 21.375C31 22.8668 30.3363 24.2976 29.1548 25.3525C27.9733 26.4074 26.3709 27 24.7 27H9.3C7.62914 27 6.02671 26.4074 4.84523 25.3525C3.66375 24.2976 3 22.8668 3 21.375C3 19.8832 3.66375 18.4524 4.84523 17.3975C6.02671 16.3426 7.62914 15.75 9.3 15.75H10V10.75Z" 
        fill={tankColor} 
      />
      
      {/* Dettagli bordo */}
      <path 
        d="M16.3418 6L16.6289 6.00488C18.0632 6.05114 19.4646 6.44608 20.6816 7.15723C21.7892 7.8044 22.7077 8.69387 23.3496 9.75H28.2002C28.8024 9.75005 29.4 9.96256 29.8564 10.3701C30.3165 10.781 30.5996 11.3644 30.5996 12C30.5996 12.6356 30.3165 13.219 29.8564 13.6299C29.4 14.0374 28.8024 14.25 28.2002 14.25H24.5869L24.667 14.75H24.7002C26.6018 14.75 28.445 15.4235 29.8203 16.6514C31.1995 17.8828 32 19.579 32 21.375C32 23.171 31.1995 24.8672 29.8203 26.0986C28.445 27.3265 26.6018 28 24.7002 28H9.2998C7.39825 28 5.55505 27.3265 4.17969 26.0986C2.80053 24.8672 2 23.171 2 21.375C2 19.579 2.80053 17.8828 4.17969 16.6514C5.48263 15.4882 7.20545 14.8228 9 14.7559V10.75C9 9.45129 9.57913 8.2323 10.5645 7.35254C11.5461 6.47616 12.8554 6 14.2002 6H16.3418Z" 
        stroke={strokeColor} 
        strokeWidth="2"
        fill = "none"
      />
      
      {/* Numero Armate */}
      <text 
        x="17" 
        y="21" 
        fontSize="12" 
        fontWeight="bold" 
        fontFamily="Arial" 
        fill="white"
        textAnchor="middle" 
        dominantBaseline="central"
        style={{ textShadow: '1px 1px 2px black' }}
      >
        {count}
      </text>
      
      {/* Bottone Minus - visibile solo se piazzato in questo turno */}
      {isPlacedThisTurn && (
        <g 
          onClick={handleRemove}
          style={{ cursor: 'pointer' }}
          transform="translate(28, 28)"
        >
          {/* Cerchio di sfondo */}
          <circle 
            cx="0" 
            cy="0" 
            r="8" 
            fill="#ff4444"
            stroke="white"
            strokeWidth="1.5"
          />
          {/* Icona minus */}
          <line 
            x1="-4" 
            y1="0" 
            x2="4" 
            y2="0" 
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};

export default Troop;