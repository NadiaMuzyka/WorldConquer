import React from 'react';
import { Country } from './Country';
import { useRisk } from '../../context/GameContext';

export function Continent({ name, countries, onCountryClick }) {
  const { G } = useRisk();
  const owners = G && G.owners ? G.owners : {};
  const troops = G && G.troops ? G.troops : {};

  return (
    <g id={`continent-${name}`}>
      {countries.map((countryData) => (
        <Country
          key={countryData.id}
          data={countryData}
          owner={owners[countryData.id] ?? null}
          troops={troops[countryData.id] ?? 0}
          onClick={onCountryClick}
        />
      ))}
    </g>
  );
}
