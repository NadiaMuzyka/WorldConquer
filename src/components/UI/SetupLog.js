import React, { useState, useEffect } from 'react';
import { useRisk } from '../../context/GameContext';
import { PLAYER_COLORS } from '../Constants/colors';
import { CONTINENTS_DATA } from '../Constants/mapData';
import { Button } from './Button';

// Helper function per trovare il nome del territorio
const getTerritoryName = (countryId) => {
  for (const continent of Object.values(CONTINENTS_DATA)) {
    const territory = continent.find(t => t.id === countryId);
    if (territory) return territory.name;
  }
  return countryId; // Fallback all'ID se non trovato
};

export const SetupLog = () => {
  const { G, playerID, moves } = useRisk();
  const [visibleCount, setVisibleCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Colore del giocatore corrente
  const myColor = PLAYER_COLORS[playerID];

  // Filtra i territori assegnati al giocatore corrente
  const myTerritories = G.setupAssignmentOrder?.filter(
    countryId => G.owners[countryId] === playerID
  ) || [];

  // Animazione sequenziale: mostra un territorio ogni 500ms
  useEffect(() => {
    if (isReady || visibleCount >= myTerritories.length) return;

    const timer = setInterval(() => {
      setVisibleCount(prev => {
        if (prev >= myTerritories.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [isReady, myTerritories.length, visibleCount]);

  // Handler per il bottone
  const handleButtonClick = () => {
    // Se l'animazione non è completa, mostra tutti i territori
    if (visibleCount < myTerritories.length) {
      setVisibleCount(myTerritories.length);
    }
    
    // Conferma e invia al server
    setIsReady(true);
    if (moves && moves.confirmSetupView) {
      moves.confirmSetupView();
    }
  };

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto]">
      {/* Header con colore giocatore - FISSO in alto */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-700">
        <span className="text-base font-semibold text-white">Sei il giocatore</span>
        <div 
          className="w-6 h-6 rounded-full border-2 border-white"
          style={{ backgroundColor: myColor }}
        />
      </div>

      {/* Area messaggi SCROLLABILE - prende tutto lo spazio rimanente */}
      <div className="overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
        {myTerritories.slice(0, visibleCount).map((countryId, index) => (
          <div
            key={countryId}
            className="py-2 px-3 bg-[#2a3f4f] rounded animate-fadeInTerritory"
          >
            <span 
              className="font-semibold"
              style={{ color: myColor }}
            >
              {getTerritoryName(countryId)}
            </span>
            <span className="text-gray-300"> è tuo!</span>
          </div>
        ))}
      </div>

      {/* Container bottone FISSO in basso */}
      <div className="p-4 border-t border-gray-700">
        {!isReady ? (
          <Button 
            variant="cyan" 
            size="md"
            onClick={handleButtonClick}
            className="w-full"
          >
            {visibleCount < myTerritories.length ? 'Salta Animazione' : 'Ho Capito, Continua'}
          </Button>
        ) : (
          <div className="text-center py-4">
            <div className="text-cyan-400 font-semibold mb-2">
              In attesa degli altri giocatori...
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupLog;
