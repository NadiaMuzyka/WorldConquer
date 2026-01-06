import React from 'react';
import { Troop } from './Troop';
import { PLAYER_COLORS, COUNTRY_COLORS } from '../Constants/colors';
import { useRisk } from '../../context/GameContext';

export function Country({ data, owner, troops }) {

  // Accediamo a G, ctx, playerID e moves tramite l'Hook useRisk
  const { G, ctx, playerID, moves } = useRisk();
  
  const staticMapColor = COUNTRY_COLORS[data.id] || "#cccccc";

  // Se non troviamo il colore, usiamo un fucsia acceso (#ff00ff) per evidenziare l'errore, invece del nero.
  const tankColor = (owner !== undefined && owner !== null)
    ? PLAYER_COLORS[String(owner)] || '#ff00ff' 
    : null;

  // Determina se siamo in fase di setup
  const isSetupPhase = ctx?.phase === 'SETUP_INITIAL';
  
  // Durante il setup, mostra le truppe solo se appartengono al giocatore corrente
  const shouldShowTroop = !isSetupPhase || owner === playerID;
  
  // Calcola il delay per l'animazione durante il setup
  let animationDelay = 0;
  if (isSetupPhase && shouldShowTroop && G.setupAssignmentOrder) {
    // Filtra i territori del giocatore corrente e trova l'indice
    const myTerritories = G.setupAssignmentOrder.filter(
      countryId => G.owners[countryId] === playerID
    );
    const territoryIndex = myTerritories.indexOf(data.id);
    if (territoryIndex >= 0) {
      animationDelay = territoryIndex * 500; // 500ms tra ogni territorio
    }
  }

  // Gestore del click sul paese
  const handleClick = () => {
    // Durante il setup non permettere click
    if (isSetupPhase) return;
    
    if (moves && typeof moves.clickCountry === 'function') {
      moves.clickCountry(data.id);
    }
  };

  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }}>
      <path
        id={data.id}
        d={data.path}
        fill={staticMapColor}
        stroke="#4c4c4cff"
        strokeWidth="1"
        onMouseEnter={(e) => e.target.style.fillOpacity = 0.8}
        onMouseLeave={(e) => e.target.style.fillOpacity = 1}
      />
      {troops > 0 && shouldShowTroop && (
          <Troop 
            color={tankColor} 
            count={troops} 
            x={data.cx} 
            y={data.cy}
            shouldShow={shouldShowTroop}
            animationDelay={animationDelay}
          />
      )}
    </g>
  );
}