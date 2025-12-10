import React from 'react';

export function Troop({ count, x, y }) {
  if (!x || !y) return null; // Se non abbiamo coordinate, non renderizziamo
  
  return (
    <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none' }}>
      {/* Cerchio di sfondo */}
      <circle r="12" fill="white" stroke="black" strokeWidth="1" />
      {/* Numero truppe */}
      <text 
        textAnchor="middle" 
        dy=".3em" 
        fontSize="12px" 
        fontWeight="bold"
      >
        {count}
      </text>
      {/* Icona carro armato opzionale */}
    </g>
  );
}