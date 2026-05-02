import React, { useState, useEffect, useRef } from 'react';
import { useRisk } from '../../context/GameContext';
import { PHASE_TIMEOUTS } from '../Constants/timeouts';

const Timer = () => {
  const { G, ctx, moves, playerID } = useRisk();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [duration, setDuration] = useState(0);
  const timeoutCalledRef = useRef(false);
  
  useEffect(() => {
    // Reset della guardia ad ogni cambio di turno/stage
    timeoutCalledRef.current = false;
    
    // Determina la durata del timeout in base allo stage del CURRENTPLAYER (non il mio)
    let currentDuration = 0;
    const currentPlayerStage = ctx?.activePlayers?.[ctx?.currentPlayer];
    
    if (ctx?.phase === 'SETUP_INITIAL') {
      currentDuration = PHASE_TIMEOUTS.SETUP_INITIAL;
    } else if (ctx?.phase === 'INITIAL_REINFORCEMENT') {
      currentDuration = PHASE_TIMEOUTS.INITIAL_REINFORCEMENT;
    } else if (ctx?.phase === 'GAME') {
      // Usa lo stage del currentPlayer, non il mio (i rivali sono in monitoring*)
      if (currentPlayerStage === 'reinforcement') {
        currentDuration = PHASE_TIMEOUTS.GAME_REINFORCEMENT;
      } else if (currentPlayerStage === 'attack') {
        currentDuration = PHASE_TIMEOUTS.GAME_ATTACK;
      } else if (currentPlayerStage === 'strategicMovement') {
        currentDuration = PHASE_TIMEOUTS.GAME_STRATEGIC_MOVEMENT;
      }
    }
    
    setDuration(currentDuration);
    
    // Calcola il tempo rimanente
    const calculateTimeRemaining = () => {
      if (!G?.turnStartTime || currentDuration === 0) {
        return currentDuration / 1000; // Ritorna durata completa se non c'è timestamp
      }
      
      const elapsed = Date.now() - G.turnStartTime;
      const remaining = Math.max(0, currentDuration - elapsed);
      return Math.ceil(remaining / 1000); // Arrotonda per eccesso in secondi
    };
    
    setTimeRemaining(calculateTimeRemaining());
    
    // Aggiorna ogni secondo
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // Quando il tempo scade, CHIUNQUE può chiamare checkTimeout
      // (sia il currentPlayer dal suo stage, sia i rivali dal monitoring)
      // Il server accetterà la mossa perché viene dallo stage corretto del chiamante
      if (remaining === 0 && moves?.checkTimeout && !timeoutCalledRef.current) {
        timeoutCalledRef.current = true;
        const isRival = ctx?.currentPlayer !== playerID;
        console.log(`⏰ [TIMER] Tempo scaduto! Player ${playerID} chiama checkTimeout (${isRival ? 'come rivale' : 'come currentPlayer'})`);
        moves.checkTimeout();
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [G?.turnStartTime, ctx?.phase, ctx?.activePlayers, ctx?.currentPlayer, playerID, moves]);
  
  // Formato M:SS
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`;
  
  // Warning rosso sotto 10 secondi
  const isWarning = timeRemaining < 10 && timeRemaining > 0;
  
  return (
    <div className="flex items-center justify-center h-[72px]">
      {/* Timer numerico grande senza cerchio */}
      <div className={`font-roboto font-bold text-[32px] tracking-wide transition-colors duration-300 ${
        isWarning ? 'text-[#EF4444] animate-pulse' : 'text-[#38C7D7]'
      }`}>
        {timeDisplay}
      </div>
    </div>
  );
};

export default Timer;