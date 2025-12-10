// src/Game.js
import { INVALID_MOVE } from 'boardgame.io/core';
import { RISK_ADJACENCY } from './components/Constants/adjacency';
import { COUNTRY_COLORS } from './components/Constants/colors';  


// Funzione per creare lo stato iniziale dei colori
function getInitialColors() {
  return { ...COUNTRY_COLORS };
}

// Definiamo il gioco
export const RiskGame = {
  // 'setup' definisce lo stato iniziale del gioco (il "G")
  setup: () => ({
    countryColors: getInitialColors(),
    originalColors: getInitialColors(), // Salviamo i colori originali
    selectedCountry: null, // Tiene traccia del paese selezionato
  }),

  // 'moves' definisce le azioni che i giocatori possono fare
  moves: {
    clickCountry: ({ G, playerID }, countryId) => {
      // G è lo stato del gioco. Lo modifichiamo direttamente.
      
      // Controlliamo se è un ID valido
      if (G.countryColors[countryId] === undefined) {
        return INVALID_MOVE; // Mossa non valida
      }

      // Se clicco sullo stesso paese, ripristino tutto ai colori originali
      if (G.selectedCountry === countryId) {
        // Ripristino i colori originali
        Object.keys(G.countryColors).forEach(id => {
          G.countryColors[id] = G.originalColors[id];
        });
        G.selectedCountry = null;
        return;
      }

      // Ripristino tutti i colori originali
      Object.keys(G.countryColors).forEach(id => {
        G.countryColors[id] = G.originalColors[id];
      });

      // Colora il paese cliccato di nero
      G.countryColors[countryId] = 'black';
      G.selectedCountry = countryId;

      // Colora i confinanti di bianco
      const neighbors = RISK_ADJACENCY[countryId] || [];
      neighbors.forEach(neighborId => {
        if (G.countryColors[neighborId] !== undefined) {
          G.countryColors[neighborId] = '#cccccc';
        }
      });
    },
  },
};