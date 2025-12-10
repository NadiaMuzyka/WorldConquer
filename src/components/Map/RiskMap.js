import React from 'react';
import { Continent } from './Continent';
import { MaritimeLines } from './Lines'; 
import { CONTINENTS_DATA, MARITIME_LINES } from '../Constants/mapData'; 

export function RiskMap({ G, moves }) {
  
  const handleCountryClick = (countryId) => {
    moves.clickCountry(countryId);
  };

  return (
    <svg
      version="1.1"
      viewBox="-50 40 1150 650"
      className="w-full h-full block bg-[#b2dfee]"
    >
      {/* 1. LAYER LINEE MARITTIME (Sotto i paesi) */}
      <MaritimeLines lines={MARITIME_LINES} />

      {/* 2. LAYER CONTINENTI E PAESI (Sopra le linee) */}
      {Object.entries(CONTINENTS_DATA).map(([contName, countries]) => (
        <Continent
          key={contName}
          name={contName}
          countries={countries}
          G={G}
          onCountryClick={handleCountryClick}
        />
      ))}
    </svg>
  );
}