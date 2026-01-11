import React, { useMemo } from 'react';
import { Continent } from './Continent';
import { MaritimeLines } from './Lines'; 
import { CONTINENTS_DATA, MARITIME_LINES } from '../Constants/mapData'; 
import { RISK_ADJACENCY } from '../Constants/adjacency';
import { useRisk } from '../../context/GameContext';

export default function RiskMap(props) {
  const { G, ctx, playerID } = useRisk();
  
  // Calcola territori evidenziati durante l'attacco
  const highlightedTerritories = useMemo(() => {
    const highlighted = new Set();
    
    // Durante la fase di attacco
    if (ctx?.phase === 'GAME' && ctx?.activePlayers?.[playerID] === 'attack' && G?.attackState?.from) {
      highlighted.add(G.attackState.from);
      
      // Evidenzia territori nemici adiacenti
      const adjacentCountries = RISK_ADJACENCY[G.attackState.from] || [];
      adjacentCountries.forEach(countryId => {
        const owner = G?.owners?.[countryId];
        if (owner !== undefined && owner !== playerID) {
          highlighted.add(countryId);
        }
      });
    }
    
    // Durante lo spostamento strategico
    if (ctx?.phase === 'GAME' && ctx?.activePlayers?.[playerID] === 'strategicMovement' && G?.fortifyState?.from) {
      highlighted.add(G.fortifyState.from);
      
      // Evidenzia territori propri adiacenti
      const adjacentCountries = RISK_ADJACENCY[G.fortifyState.from] || [];
      adjacentCountries.forEach(countryId => {
        const owner = G?.owners?.[countryId];
        if (owner === playerID) {
          highlighted.add(countryId);
        }
      });
    }
    
    return highlighted;
  }, [ctx, playerID, G?.attackState?.from, G?.fortifyState?.from, G?.owners]);
  
  // Renderizza linee di attacco
  const attackLines = useMemo(() => {
    if (ctx?.phase !== 'GAME' || ctx?.activePlayers?.[playerID] !== 'attack' || !G?.attackState?.from) {
      return null;
    }
    
    const lines = [];
    const adjacentCountries = RISK_ADJACENCY[G.attackState.from] || [];
    
    // Trova coordinate del territorio attaccante
    let attackerCoords = null;
    for (const [contName, countries] of Object.entries(CONTINENTS_DATA)) {
      const country = countries.find(c => c.id === G.attackState.from);
      if (country) {
        attackerCoords = { x: country.troopX, y: country.troopY };
        break;
      }
    }
    
    if (!attackerCoords) return null;
    
    adjacentCountries.forEach(countryId => {
      const owner = G?.owners?.[countryId];
      if (owner !== undefined && owner !== playerID) {
        // Trova coordinate del territorio difensore
        for (const [contName, countries] of Object.entries(CONTINENTS_DATA)) {
          const country = countries.find(c => c.id === countryId);
          if (country) {
            lines.push({
              x1: attackerCoords.x,
              y1: attackerCoords.y,
              x2: country.troopX,
              y2: country.troopY,
            });
            break;
          }
        }
      }
    });
    
    return lines;
  }, [ctx, playerID, G?.attackState?.from, G?.owners]);
  
  return (
    <svg
      version="1.1"
      viewBox="-20 50 1100 650"
      preserveAspectRatio="xMidYMid meet"
      className="w-auto h-full max-w-full drop-shadow-2xl block"
      //style={{ width: '100%', height: '100%', display: 'block', ...props.style }}
      {...props}
    >
      {/* Definizione filtri per glow effect */}
      <defs>
        <filter id="attackGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="fortifyGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* 1. LAYER LINEE MARITTIME (Sotto i paesi) */}
      <MaritimeLines lines={MARITIME_LINES} />
      
      {/* 2. LAYER LINEE DI ATTACCO */}
      {attackLines && attackLines.map((line, idx) => (
        <line
          key={`attack-line-${idx}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.6"
          className="pointer-events-none"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="10"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </line>
      ))}
      
      {/* 3. LAYER CONTINENTI E PAESI (Sopra le linee) */}
      {Object.entries(CONTINENTS_DATA).map(([contName, countries]) => (
        <Continent
          key={contName}
          name={contName}
          countries={countries}
        />
      ))}
    </svg>
  );
}
