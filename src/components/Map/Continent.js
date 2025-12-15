import React from 'react';
import { Country } from './Country';

export function Continent({ name, countries, G, onCountryClick }) {
  return (
    <g id={`continent-${name}`}>
      {countries.map((countryData) => (
        <Country
          key={countryData.id}
          data={countryData}
          // Nota: l'owner può essere "0" (player 0) quindi non usiamo controlli truthy
          owner={G.owners ? G.owners[countryData.id] : null}
          troops={G.troops ? (G.troops[countryData.id] || 0) : 0}
          onClick={onCountryClick}
        />
      ))}
    </g>
  );
}