import React from 'react';
import { Troop } from './Troop';
import { PLAYER_COLORS, COUNTRY_COLORS } from '../Constants/colors';
import { useRisk } from '../../context/GameContext';
import { useSetupVisibleCountries } from './useSetupVisibleCountries';
import { RISK_ADJACENCY } from '../Constants/adjacency';

export function Country({ data, owner, troops }) {
  
  // Accediamo a G, ctx, playerID e moves tramite l'Hook useRisk
  const { G, ctx, playerID, moves } = useRisk();
  
  // Calcola se questo territorio deve essere evidenziato
  const isHighlighted = React.useMemo(() => {
    // Durante la fase di attacco
    if (ctx?.phase === 'GAME' && ctx?.activePlayers?.[playerID] === 'attack') {
      const attackFrom = G?.attackState?.from;
      if (!attackFrom) return false;
      
      // Evidenzia il territorio attaccante
      if (data.id === attackFrom) return true;
      
      // Evidenzia territori nemici adiacenti
      const adjacentCountries = RISK_ADJACENCY[attackFrom] || [];
      if (adjacentCountries.includes(data.id) && owner !== playerID) {
        return true;
      }
    }
    
    // Durante lo spostamento strategico
    if (ctx?.phase === 'GAME' && ctx?.activePlayers?.[playerID] === 'strategicMovement') {
      const fortifyFrom = G?.fortifyState?.from;
      if (!fortifyFrom) return false;
      
      // Evidenzia il territorio origine
      if (data.id === fortifyFrom) return true;
      
      // Evidenzia territori propri adiacenti
      const adjacentCountries = RISK_ADJACENCY[fortifyFrom] || [];
      if (adjacentCountries.includes(data.id) && owner === playerID) {
        return true;
      }
    }
    
    return false;
  }, [ctx, playerID, G?.attackState?.from, G?.fortifyState?.from, data.id, owner]);
  
  const staticMapColor = COUNTRY_COLORS[data.id] || "#cccccc";

  // Se non troviamo il colore, usiamo un fucsia acceso (#ff00ff) per evidenziare l'errore, invece del nero.
  const tankColor = (owner !== undefined && owner !== null)
    ? PLAYER_COLORS[String(owner)] || '#ff00ff' 
    : null;

  // Determina se siamo in fase di setup
  const isSetupPhase = ctx?.phase === 'SETUP_INITIAL';
  const isReinforcementPhase = ctx?.phase === 'INITIAL_REINFORCEMENT';
  const isGamePhase = ctx?.phase === 'GAME';
  
  // Durante il setup, mostra le truppe solo se appartengono al giocatore corrente
  const visibleCountries = useSetupVisibleCountries();
  const shouldShowTroop = !isSetupPhase || (owner === playerID && visibleCountries && visibleCountries.has(data.id));
  
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
    
    // Durante INITIAL_REINFORCEMENT usa placeReinforcement
    if (isReinforcementPhase) {
      // Solo se il territorio appartiene al giocatore corrente
      if (owner === playerID && moves && typeof moves.placeReinforcement === 'function') {
        moves.placeReinforcement(data.id);
      }
      return;
    }
    
    // Durante la fase GAME, gestisci gli stage
    if (isGamePhase && ctx.activePlayers) {
      const currentStage = ctx.activePlayers[playerID];
      
      // REINFORCEMENT stage
      if (currentStage === 'reinforcement') {
        if (owner === playerID && moves?.placeReinforcement) {
          moves.placeReinforcement(data.id);
        }
        return;
      }
      
      // ATTACK stage
      if (currentStage === 'attack') {
        // Se non c'è attaccante selezionato, questo click seleziona l'attaccante
        if (!G?.attackState?.from) {
          if (owner === playerID && troops >= 2 && moves?.selectAttackerTerritory) {
            moves.selectAttackerTerritory(data.id);
          }
        } else {
          // C'è già un attaccante selezionato
          if (owner === playerID) {
            // Click su un proprio territorio = cambia attaccante
            if (troops >= 2 && moves?.selectAttackerTerritory) {
              moves.selectAttackerTerritory(data.id);
            }
          } else {
            // Click su territorio nemico = seleziona difensore
            if (moves?.selectDefenderTerritory) {
              moves.selectDefenderTerritory(data.id);
            }
          }
        }
        return;
      }
      
      // STRATEGIC_MOVEMENT stage
      if (currentStage === 'strategicMovement') {
        if (!G?.fortifyState?.from) {
          // Seleziona territorio da cui spostare
          if (owner === playerID && troops >= 2 && moves?.selectFortifyFrom) {
            moves.selectFortifyFrom(data.id);
          }
        } else {
          // Seleziona destinazione
          if (owner === playerID && moves?.selectFortifyTo) {
            moves.selectFortifyTo(data.id);
          }
        }
        return;
      }
    }
  };

  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }}>
      <path
        id={data.id}
        d={data.path}
        fill={staticMapColor}
        stroke={isHighlighted ? "#38C7D7" : "#4c4c4cff"}
        strokeWidth={isHighlighted ? "3" : "1"}
        filter={isHighlighted ? "url(#attackGlow)" : "none"}
        fillOpacity={isHighlighted ? 0.8 : 1}
        onMouseEnter={(e) => e.target.style.fillOpacity = 0.8}
        onMouseLeave={(e) => e.target.style.fillOpacity = isHighlighted ? 0.8 : 1}
      />
      {troops > 0 && shouldShowTroop && (
          <Troop 
            color={tankColor} 
            count={troops} 
            x={data.cx} 
            y={data.cy}
            shouldShow={shouldShowTroop}
            animationDelay={animationDelay}
            countryId={data.id}
          />
      )}
    </g>
  );
}