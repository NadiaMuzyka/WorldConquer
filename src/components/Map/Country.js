import React from 'react';
import { Troop } from './Troop';
import { PLAYER_COLORS, COUNTRY_COLORS } from '../Constants/colors';
import { useRisk } from '../../context/GameContext';
import { useSetupVisibleCountries } from './useSetupVisibleCountries';
import { RISK_ADJACENCY } from '../Constants/adjacency';

export function Country({ data, owner, troops }) {
  
  // Accediamo a G, ctx, playerID e moves tramite l'Hook useRisk
  const { G, ctx, playerID, moves } = useRisk();
  
  // Calcola se questo territorio deve essere evidenziato e con quale colore
  const highlightStyle = React.useMemo(() => {
    // Durante la fase di attacco
    if (ctx?.phase === 'GAME' && ctx?.activePlayers?.[playerID] === 'attack') {
      const attackFrom = G?.attackState?.from;
      if (!attackFrom) return null;
      
      // Territorio attaccante = bordo oro
      if (data.id === attackFrom) {
        return { color: '#FFD700', width: '3', filter: 'url(#attackGlow)' }; // Oro
      }
      
      // Territori nemici adiacenti = bordo rosso
      const adjacentCountries = RISK_ADJACENCY[attackFrom] || [];
      if (adjacentCountries.includes(data.id) && owner !== playerID) {
        return { color: '#FF0000', width: '3', filter: 'url(#attackGlow)' }; // Rosso
      }
    }
    
    // Durante lo spostamento strategico
    if (ctx?.phase === 'GAME' && ctx?.activePlayers?.[playerID] === 'strategicMovement') {
      const fortifyFrom = G?.fortifyState?.from;
      if (!fortifyFrom) return null;
      
      // Territorio origine = bordo oro
      if (data.id === fortifyFrom) {
        return { color: '#FFD700', width: '3', filter: 'url(#attackGlow)' }; // Oro
      }
      
      // Territori propri adiacenti = bordo blu
      const adjacentCountries = RISK_ADJACENCY[fortifyFrom] || [];
      if (adjacentCountries.includes(data.id) && owner === playerID) {
        return { color: '#38C7D7', width: '3', filter: 'url(#attackGlow)' }; // Ciano/Blu
      }
    }
    
    return null;
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
              const from = G.fortifyState.from;
              const adjacentCountries = RISK_ADJACENCY[from] || [];
              // Se clicchi su un territorio adiacente e valido come destinazione
              if (adjacentCountries.includes(data.id) && owner === playerID && moves?.selectFortifyTo) {
                moves.selectFortifyTo(data.id);
                return;
              }
              // Se clicchi di nuovo sull'origine o su un altro tuo territorio non adiacente, cambia origine
              if (owner === playerID && troops >= 2 && moves?.selectFortifyFrom) {
                moves.selectFortifyFrom(data.id);
              }
              // Click su territorio nemico: ignora
            }
            return;
          }
    }
  };

  // Effetto scurito ai territori non propri durante il proprio turno di rinforzo iniziale
  const isMyTurn = (ctx?.phase === 'INITIAL_REINFORCEMENT' || ctx?.activePlayers?.[playerID] === 'reinforcement' || ctx?.activePlayers?.[playerID] === 'attack' || ctx?.activePlayers?.[playerID] === 'strategicMovement') && ctx?.currentPlayer === playerID;
  const isMine = owner === playerID;
  const darken = !highlightStyle &&((isMyTurn && !isMine) || ((ctx?.activePlayers?.[playerID] === 'attack' || ctx?.activePlayers?.[playerID] === 'strategicMovement') && troops < 2 && isMine));

  return (
    <g onClick={handleClick} style={{ cursor: darken ? 'not-allowed' : 'pointer' }}>
      <path
        id={data.id}
        d={data.path}
        fill={staticMapColor}
        stroke={highlightStyle ? highlightStyle.color : "#4c4c4cff"}
        strokeWidth={highlightStyle ? highlightStyle.width : "1"}
        filter={highlightStyle ? highlightStyle.filter : "none"}
        fillOpacity={highlightStyle ? 0.8 : 1}
        className={`transition-all duration-300${darken ? ' filter brightness-50 opacity-60' : ''}`}
        style={highlightStyle && highlightStyle.filter ? { filter: highlightStyle.filter } : undefined}
        onMouseEnter={(e) => e.target.style.fillOpacity = 0.8}
        onMouseLeave={(e) => e.target.style.fillOpacity = highlightStyle ? 0.8 : 1}
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