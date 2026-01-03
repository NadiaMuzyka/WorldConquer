import React from 'react';
import { GameProvider } from './context/GameContext'; // <--- Importiamo il Provider
import RiskMap from './components/Map/RiskMap';
import Navbar from './components/Navbar/Navbar';
// Assicurati di importare gli altri componenti che usi (es. DiceBox, PhaseInfo, etc.)

export function RiskBoard(props) {
  // props contiene: G, ctx, moves, playerID, events, ecc. passati da boardgame.io
  
  return (
    // 1. AVVOLGIAMO TUTTO NEL PROVIDER
    // Passiamo tutte le props al provider così useRisk() potrà leggerle
    <GameProvider {...props}>
      
      <div className="relative w-full h-full bg-[#1B2227] overflow-hidden flex flex-col">
        
        {/* 2. NAVBAR (Ora può usare useRisk se serve) */}
        {/* Passiamo le props esplicitamente se Navbar non è stata aggiornata per usare il context */}
        <Navbar 
            mode="game" 
            G={props.G} 
            ctx={props.ctx} 
            playerID={props.playerID} 
            moves={props.moves} 
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