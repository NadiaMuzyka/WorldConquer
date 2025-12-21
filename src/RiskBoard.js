import React from 'react';
import { RiskMap } from './components/Map/RiskMap';
import { Navbar } from './components/Navbar/Navbar';

export function RiskBoard({ G, ctx, moves }) {
  const currentPlayer = ctx.currentPlayer;

  return (
    <div className="w-full h-full flex flex-col bg-[#173C55] overflow-hidden">
      <Navbar 
        phase={ctx.phase || "PREPARAZIONE"} 
        gameCode={ctx.matchID || "DEBUG-123"} 
        playerTurn={currentPlayer}
        onLeave={() => console.log("Abbandona")}
      />
      <div className="w-full flex-grow relative bg-[#173C55] flex justify-center items-center">
        <RiskMap G={G} moves={moves} />
      </div>
    </div>
  );
}