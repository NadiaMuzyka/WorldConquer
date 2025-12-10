import React from 'react';
// Importiamo SOLO la mappa, ignorando la cartella UI per ora
import { RiskMap } from './components/Map/RiskMap';

export function RiskBoard({ G, moves }) {
  return (
    <div style={boardStyle}>
      {/* Contenitore che limita la larghezza massima per non far esplodere 
         l'SVG su schermi ultrawide, ma lo mantiene responsive.
      */}
      <div style={mapContainerStyle}>
        <RiskMap G={G} moves={moves} />
      </div>
    </div>
  );
}

// Stili CSS-in-JS semplici per centrare la mappa nello schermo
const boardStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f0f0f0', // Un grigio chiaro neutro per lo sfondo pagina
  padding: '20px',
  boxSizing: 'border-box'
};

const mapContainerStyle = {
  width: '100%',
  maxWidth: '1200px', // Larghezza massima ragionevole per il tabellone
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)', // Un po' di ombra per staccarla dal fondo
  borderRadius: '8px',
  overflow: 'hidden', // Per i bordi arrotondati
  backgroundColor: '#173C55' // Colore oceano di base (matcha con l'SVG)
};