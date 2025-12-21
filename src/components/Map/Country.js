import React from 'react';
import { Troop } from './Troop';
import { PLAYER_COLORS, COUNTRY_COLORS } from '../Constants/colors';

export function Country({ data, owner, troops, onClick }) {
  const staticMapColor = COUNTRY_COLORS[data.id] || "#cccccc";

  // Se non troviamo il colore, usiamo un fucsia acceso (#ff00ff) per evidenziare l'errore, invece del nero.
  const tankColor = (owner !== undefined && owner !== null)
    ? PLAYER_COLORS[String(owner)] || '#ff00ff' 
    : null;

  return (
    <g onClick={() => onClick(data.id)} style={{ cursor: 'pointer' }}>
      <path
        id={data.id}
        d={data.path}
        fill={staticMapColor}
        stroke="#4c4c4cff"
        strokeWidth="1"
        onMouseEnter={(e) => e.target.style.fillOpacity = 0.8}
        onMouseLeave={(e) => e.target.style.fillOpacity = 1}
      />
      {troops > 0 && (
          <Troop 
            color={tankColor} 
            count={troops} 
            x={data.cx || 0} 
            y={data.cy || 0} 
          />
      )}
    </g>
  );
}