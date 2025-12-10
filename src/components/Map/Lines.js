import React from 'react';

export function MaritimeLines({ lines }) {
  return (
    <g className="pointer-events-none opacity-50">
      {lines.map((line) => (
        <path
          key={line.id}
          d={line.d}
          fill="none"
          stroke="#ffffffff"
          strokeWidth="2"
          // Stroke dasharray 4,4 crea il tratteggio
          strokeDasharray="4,4" 
          className="stroke-black"
        />
      ))}
    </g>
  );
}