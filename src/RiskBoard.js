import React from 'react';
import { GameProvider, useRisk } from './context/GameContext'; // <--- Importiamo il Provider e hook
import RiskMap from './components/Map/RiskMap';
import Navbar from './components/Navbar/Navbar';
import SetupLog from './components/UI/SetupLog';

export function RiskBoard({ G, ctx, moves, playerID, events, isLobbyFull }) {
  
  return (
    // 1. AVVOLGIAMO TUTTO NEL PROVIDER
    // Passiamo tutte le props al provider così useRisk() potrà leggerle
    <GameProvider G={G} ctx={ctx} moves={moves} playerID={playerID} events={events}>
      <RiskBoardContent />
    </GameProvider>
  );
};

// Componente interno che usa il context
function RiskBoardContent() {
  const { ctx } = useRisk();
  const isSetupPhase = ctx?.phase === 'SETUP_INITIAL';

  
  return (
      <div className="relative w-full h-full bg-[#1B2227] overflow-hidden flex flex-col">
        
        {/* NAVBAR */}
        <div className="flex-shrink-0">
          <Navbar 
              mode="game"
              phase={ctx?.phase || "PREPARAZIONE"} 
              gameCode={ctx?.matchID || "DEBUG-123"} 
              playerTurn={ctx?.currentPlayer}
              onLeave={() => console.log("Abbandona")}
          />
        </div>

        {/* AREA DI GIOCO - Layout condizionale */}
        {isSetupPhase ? (
          // Layout two-column durante SETUP_INITIAL
          <div className="flex-1 flex flex-row overflow-hidden pt-2">
            {/* Colonna sinistra: SetupLog - PIÙ STRETTA per dare respiro alla mappa */}
            <div className="w-72 h-full bg-[#1B2227] border-r border-gray-700">
              <SetupLog />
            </div>
            
            {/* Colonna destra: Mappa - PIÙ SPAZIO */}
            <div className="flex-1 relative flex justify-center items-center">
              <RiskMap />
            </div>
          </div>
        ) : (
          // Layout standard full-width per altre fasi
          <div className="flex-1 relative flex justify-center items-center pt-6">
            <RiskMap />
          </div>
        )}

      </div>
  );
}

export default RiskBoard;