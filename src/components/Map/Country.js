import React from 'react';
import { Troop } from './Troop'; // Il componente per il segnalino truppe

export function Country({ 
  data,       // Dati del paese (id, path)
  color,      // Colore attuale (da G.countryColors)
  troops,     // Numero truppe (da G.troops - ipotetico)
  onClick     // Funzione handleCountryClick
}) {
  return (
    <g onClick={() => onClick(data.id)} style={{ cursor: 'pointer' }}>
      <path
        id={data.id}
        d={data.path}
        fill={color || '#ffffff'} // Default bianco se undefined
        stroke="#000000"
        strokeWidth="1"
        className="land"
        // Effetto hover semplice via CSS in React
        onMouseEnter={(e) => e.target.style.opacity = 0.8}
        onMouseLeave={(e) => e.target.style.opacity = 1}
      />
      
      {/* Visualizza le truppe se ce ne sono */}
      {troops > 0 && (
         // Nota: Per posizionare Troop serve sapere il centro del paese.
         // Per ora lo mettiamo a 0,0 ma dovrai mappare le coordinate nel mapData.js
         <Troop count={troops} x={data.cx} y={data.cy} />
      )}
    </g>
  );
}