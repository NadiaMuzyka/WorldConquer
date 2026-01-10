import React from 'react';
import { Continent } from './Continent';
import { MaritimeLines } from './Lines'; 
import { CONTINENTS_DATA, MARITIME_LINES } from '../Constants/mapData'; 


export default function RiskMap(props) {
  // accetta props per passare width/height se serve
  return (
    <svg
      version="1.1"
      viewBox="-20 50 1100 650"
      preserveAspectRatio="xMidYMid meet"
      className="w-auto h-full max-w-full drop-shadow-2xl block"
      //style={{ width: '100%', height: '100%', display: 'block', ...props.style }}
      {...props}
    >
      {/* 1. LAYER LINEE MARITTIME (Sotto i paesi) */}
      <MaritimeLines lines={MARITIME_LINES} />
      {/* 2. LAYER CONTINENTI E PAESI (Sopra le linee) */}
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
