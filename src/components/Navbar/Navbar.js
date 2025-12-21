import React from 'react';
import { Timer } from './Timer';
import { PhaseInfo } from './PhaseInfo';
import { Button } from '../UI/Button';

const FlagIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width="40" 
    height="40" 
    fill="currentColor"
  >
    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
  </svg>
);

export const Navbar = ({ phase = "PREPARAZIONE", onLeave, gameCode, playerTurn }) => {
  return (
    <div className="w-full h-[102px] bg-[#1c1c1c]/80 shadow-md flex items-center justify-between px-5 box-border relative z-[100]">
      <div className="flex items-center w-[200px]">
        <Timer />
      </div>
      
      <div className="flex items-center justify-center flex-1">
        {/* Passing the flag icon as requested */}
        <PhaseInfo phase={phase} icon={<FlagIcon />} />
      </div>

      <div className="flex flex-col items-end justify-center w-[200px] gap-2">
        <Button onClick={onLeave}>
          ABBANDONA <span className="text-[18px]">➜</span>
        </Button>
        
        {/* Debug Info */}
        <div className="text-[#ccc] text-[10px] font-mono">
          <span>Code: {gameCode}</span>
          <span> | </span>
          <span>Turn: {playerTurn}</span>
        </div>
      </div>
    </div>
  );
};
