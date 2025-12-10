import React from 'react';
import { Country } from './Country';

export function Continent({ name, countries, G, onCountryClick }) {
  return (
    <g id={`continent-${name}`}>
      {countries.map((countryData) => (
        <Country
          key={countryData.id}
          data={countryData}
          // Recuperiamo il colore dallo stato G di boardgame.io
          color={G.countryColors[countryData.id]}
          // Recuperiamo le truppe (ipotizzando tu abbia G.troops)
          troops={G.troops ? G.troops[countryData.id] : 0}
          onClick={onCountryClick}
        />
      ))}
    </g>
  );
}