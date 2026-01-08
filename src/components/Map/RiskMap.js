import React from 'react';
import { Continent } from './Continent';
import { MaritimeLines } from './Lines'; 
import { CONTINENTS_DATA, MARITIME_LINES } from '../Constants/mapData'; 


export default function RiskMap() {
  return (
    <svg
      version="1.1"
      viewBox="-50 50 1150 650"
      preserveAspectRatio="xMidYMid meet"
      className="drop-shadow-2xl"
      style={{ 
        width: '95%',
        height: '95%',
        display: 'block'
      }}
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
