import React from 'react';
import { Bolt, ShieldPlus, PlusCircle, Sword, Move } from 'lucide-react';

const PhaseInfo = ({ phase, stage }) => {
  // Traduci i nomi degli stage in italiano
  const getPhaseIconAndText = () => {
    if (phase === 'SETUP_INITIAL') return [<Bolt className="w-8 h-8 inline-block" key="icon" />, 'Preparazione'];
    if (phase === 'INITIAL_REINFORCEMENT') return [<ShieldPlus className="w-8 h-8 inline-block" key="icon" />, 'Rinforzo iniziale'];
    if (phase === 'GAME' && stage === 'reinforcement') return [<PlusCircle className="w-8 h-8 inline-block" key="icon" />, 'Fase di Rinforzo'];
    if (phase === 'GAME' && stage === 'attack') return [<Sword className="w-8 h-8 inline-block" key="icon" />, 'Fase di Attacco'];
    if (phase === 'GAME' && stage === 'strategicMovement') return [<Move className="w-8 h-8 inline-block" key="icon" />, 'Fase di Spostamento Strategico'];
    return null;
  };

  const iconAndText = getPhaseIconAndText();

  return (
    <div className="relative w-[647px] h-[68px] flex items-center justify-center">
      {/* Decorative Background (Simplified) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"></div>

      <div className="flex items-center gap-4 z-10 items-start" >
        <div className="font-bold text-[28px] leading-[38px] text-white tracking-[0.2px]">
          {iconAndText && (
            <span className="flex items-center gap-2">
              {iconAndText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhaseInfo;