import React from 'react';

export function MaritimeLines({ lines }) {
  return (
    <g className="pointer-events-none">
      {lines.map((line) => (
        <path
          key={line.id}
          d={line.d}
          className="fill-none stroke-white stroke-[4px] [stroke-dasharray:4,4] opacity-70"
        />
      ))}
    </g>
  );
}