import React, { useEffect } from 'react';
import { GameProvider } from './context/GameContext'; // <--- Importiamo il Provider
import RiskMap from './components/Map/RiskMap';
import Navbar from './components/Navbar/Navbar';
// Assicurati di importare gli altri componenti che usi (es. DiceBox, PhaseInfo, etc.)

export function RiskBoard({ G, ctx, moves, playerID, events, isLobbyFull }) {
  
  // AUTO-START: Se la lobby è piena e sono l'host, avvio la partita
  useEffect(() => {
    if (isLobbyFull && !G.isGameStarted && playerID === '0') {
        console.log("🚀 Lobby piena: Avvio partita...");
        moves.startMatch();
    }
  }, [isLobbyFull, G.isGameStarted, playerID, moves]);

  return (
    // 1. AVVOLGIAMO TUTTO NEL PROVIDER
    // Passiamo tutte le props al provider così useRisk() potrà leggerle
    <GameProvider G={G} ctx={ctx} moves={moves} playerID={playerID} events={events}>
      
      <div className="relative w-full h-full bg-[#1B2227] overflow-hidden flex flex-col">
        
        {/* 2. NAVBAR (Ora può usare useRisk se serve) */}
        {/* Passiamo le props esplicitamente se Navbar non è stata aggiornata per usare il context */}
        <Navbar 
            phase={ctx?.phase || "PREPARAZIONE"} 
            gameCode={ctx?.matchID || "DEBUG-123"} 
            playerTurn={ctx?.currentPlayer}
            onLeave={() => console.log("Abbandona")}
        />

        {/* 3. AREA DI GIOCO */}
        <div className="flex-1 relative flex justify-center items-center">
            {/* RiskMap ora funzionerà perché è dentro GameProvider */}
            <RiskMap />
        </div>

      </div>

    </GameProvider>
  );
};

export default RiskBoard;