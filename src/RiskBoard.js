// src/RiskBoard.js
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux'; // <--- REDUX
import { RiskMap } from './components/Map/RiskMap';
import Navbar from './components/Navbar/Navbar'; 

export function RiskBoard({ G, ctx, moves, playerID }) {
  const currentPlayer = ctx.currentPlayer;
  const isHost = playerID === "0";
  const isStarted = G.isGameStarted;

  // 1. LEGGIAMO DA REDUX (Global State)
  const { data: matchData } = useSelector((state) => state.match);
  
  const currentPlayers = matchData?.playersCurrent || 1;
  const maxPlayers = ctx.numPlayers;

  // 2. AUTO-START (Identico a prima, ma usa i dati Redux)
  useEffect(() => {
    if (isHost && !isStarted && currentPlayers >= maxPlayers) {
      console.log("🚀 Stanza piena (Redux conferma)! Avvio...");
      moves.startMatch();
    }
  }, [currentPlayers, maxPlayers, isHost, isStarted, moves]);

  // 3. RENDER
  return (
    <div className="w-full h-full flex flex-col bg-[#173C55] overflow-hidden relative">
      <Navbar 
        phase={ctx.phase || "PREPARAZIONE"} 
        gameCode={ctx.matchID || "..."} 
        playerTurn={currentPlayer}
        onLeave={() => window.location.href = "/"}
        mode="game"
      />
      
      <div className="w-full flex-grow relative bg-[#173C55] flex justify-center items-center">
        <RiskMap G={G} moves={moves} />
      </div>
    </div>
  );
}