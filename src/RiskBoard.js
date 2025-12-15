import React from 'react';
// Importiamo SOLO la mappa, ignorando la cartella UI per ora
import { RiskMap } from './components/Map/RiskMap';
import { PLAYER_COLORS } from './components/Constants/colors';

export function RiskBoard({ G, ctx, moves }) {

  const currentPlayer = ctx.currentPlayer;

  const turnColor = PLAYER_COLORS[currentPlayer] || 'black';

  return (
    <div style={boardStyle}>
      <div style={infoPanelStyle}>
        <h2 style={{ margin: 0 }}>
          Turno del Giocatore: <span style={{ color: turnColor, fontSize: '1.0em' }}>{currentPlayer}</span>
        </h2>
      </div>  
      <div style={mapContainerStyle}>
        <RiskMap G={G} moves={moves} />
      </div>
    </div>
  );
}

const boardStyle = {
  width: '100%',
  height: '100%', // Si adatta all'altezza disponibile in App.js
  display: 'flex',
  flexDirection: 'column', // <--- FONDAMENTALE: Impila gli elementi verticalmente
  alignItems: 'center',    // Centra orizzontalmente
  justifyContent: 'flex-start', // Parte dall'alto
  backgroundColor: '#f0f0f0',
  padding: '10px',
  boxSizing: 'border-box'
};

const infoPanelStyle = {
  width: '100%',           // Occupa larghezza piena
  maxWidth: '1200px',      // Allineato alla larghezza della mappa
  marginBottom: '10px',    // Spazio sotto la barra
  padding: '12px 0',       // Altezza della barra
  backgroundColor: 'white',
  borderRadius: '6px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  textAlign: 'center',     // Testo centrato
  fontWeight: 'bold',
  display: 'flex',         // Per centrare il contenuto verticalmente se serve
  justifyContent: 'center',
  alignItems: 'center'
};

const mapContainerStyle = {
  width: '100%',
  maxWidth: '1200px', 
  flexGrow: 1,             // La mappa si espande per riempire lo spazio verticale rimasto
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)', 
  borderRadius: '8px',
  overflow: 'hidden', 
  backgroundColor: '#173C55',
  position: 'relative'     // Utile per posizionamenti assoluti interni futuri
};