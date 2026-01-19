import React from 'react';

const PhaseInfo = ({ phase, icon, stage }) => {
  // Traduci i nomi degli stage in italiano
  const stageNames = {
    'reinforcement': 'Rinforzo',
    'attack': 'Attacco',
    'strategicMovement': 'Spostamento',
    'INITIAL_REINFORCEMENT': 'Rinforzo iniziale'
  };

  const stageName = stage ? stageNames[stage] || stage : null;

  return (
    <div className="relative w-[647px] h-[68px] flex items-center justify-center">
      {/* Decorative Background (Simplified) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"></div>
      
      <div className="flex items-center gap-4 z-10">
        <div className="w-[54px] h-[54px] flex items-center justify-center text-[40px] text-[#38C7D7]">
          {icon}
        </div>
        <div className="flex flex-col items-start">
          <div className="font-bold text-[20px] leading-[38px] text-white tracking-[0.2px]">
            {phase == 'SETUP_INITIAL' ? 'Preparazione' : null}
            {phase == 'INITIAL_REINFORCEMENT' ? 'Rinforzo iniziale' : null}
            {console.log('PhaseInfo render - phase:', phase, 'stage:', stage)}
            {phase === 'GAME' && stage == 'reinforcement' ? 'Fase di Rinforzo' : null}
            {phase === 'GAME' && stage == 'attack' ? 'Fase di Attacco' : null}
            {phase === 'GAME' && stage == 'strategicMovement' ? 'Fase di Spostamento Strategico' : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseInfo;