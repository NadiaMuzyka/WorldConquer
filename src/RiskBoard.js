import React from 'react';
import { GameProvider, useRisk } from './context/GameContext';
import RiskMap from './components/Map/RiskMap';
import Navbar from './components/Navbar/Navbar';
import SetupLog from './components/UI/SetupLog';
import ReinforcementPanel from './components/UI/ReinforcementPanel';
import SetupBar from './components/UI/SetupBar';
import SetupLogAnimated from './components/UI/SetupLogAnimated';

export function RiskBoard({ G, ctx, moves, playerID, events, isLobbyFull }) {
  
  // Componente interno che usa il context
  function RiskBoardContent() {
    const { ctx } = useRisk();
    const isSetupPhase = ctx?.phase === 'SETUP_INITIAL';
  const isReinforcementPhase = ctx?.phase === 'INITIAL_REINFORCEMENT';

    
    return (
        <div className="relative w-full h-screen bg-[#173C55] overflow-hidden flex flex-col">
          
          {/* Decorazioni di sfondo (cerchi ciano) */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#38C7D7] opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#38C7D7] opacity-10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          
          {/* NAVBAR */}
          <div className="flex-shrink-0 relative z-10">
            <Navbar 
                mode="game"
                phase={ctx?.phase || "PREPARAZIONE"} 
                gameCode={ctx?.matchID || "DEBUG-123"} 
                playerTurn={ctx?.currentPlayer}
                onLeave={() => console.log("Abbandona")}
            />
          </div>

          {/* AREA DI GIOCO - Layout condizionale */}
          {/*{isSetupPhase ? (
            // Layout two-column durante SETUP_INITIAL
            <div className="flex-1 flex flex-row overflow-hidden relative z-10 max-h-[calc(100vh-82px)]">
              {/* Colonna sinistra: SetupLog - PIÙ STRETTA per dare respiro alla mappa */}
              {/* <div className="w-72 h-full bg-[#1B2227] border-r border-gray-700">
                <SetupLog />
              </div> */}
              
              {/* Colonna destra: Mappa - PIÙ SPAZIO */}
              {/*<div className="flex-1 relative flex justify-center items-center p-8">
                <RiskMap />
              </div>
            </div>
          ) : (*/}
            {/*Layout standard full-width per altre fasi*/}
            <div className="w-full flex justify-center items-center z-15 h-[calc(100vh-98px)] mt-10">
              <div className="w-full h-full flex items-center justify-center p-6">
                <RiskMap />
              </div>
              
              {/* Barra Setup con giocatori e bottone start */}
              {isSetupPhase && <SetupBar />}
              {isSetupPhase && <SetupLogAnimated />}
            </div>
          {/* )}*/}

        </div>
    );
  }
  
  return (
    <GameProvider G={G} ctx={ctx} moves={moves} playerID={playerID} events={events}>
      <RiskBoardContent />
    </GameProvider>
  );
};

export default RiskBoard;