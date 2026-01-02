import React from 'react';
import { RiskMap } from './components/Map/RiskMap';
import { Navbar } from './components/Navbar/Navbar';
import { GameProvider } from './context/GameContext';

export function RiskBoard({ G, ctx, moves, playerID, events }) {
  return (
    <GameProvider G={G} ctx={ctx} moves={moves} playerID={playerID} events={events}>
      <div className="w-full h-full flex flex-col bg-[#173C55] overflow-hidden">
        <Navbar 
          phase={ctx?.phase || "PREPARAZIONE"} 
          gameCode={ctx?.matchID || "DEBUG-123"} 
          playerTurn={ctx?.currentPlayer}
          onLeave={() => console.log("Abbandona")}
        />
        <div className="w-full flex-grow relative bg-[#173C55] flex justify-center items-center">
          <RiskMap/>
        </div>
      </div>
    </GameProvider>
  );
}
//NOTA: se una componente figlia di RiskBoard (es. RiskMap) ha bisogno di accedere a G, ctx, moves, playerID, events,
//      può farlo tramite l'Hook useRisk() definito in src/context/GameContext.js