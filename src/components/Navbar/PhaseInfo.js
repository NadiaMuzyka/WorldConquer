import React from 'react';

const PhaseInfo = ({ phase, icon }) => {
  return (
    <div className="relative w-[647px] h-[68px] flex items-center justify-center">
      {/* Decorative Background (Simplified) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"></div>
      
      <div className="flex items-center gap-4 z-10">
        <div className="w-[54px] h-[54px] flex items-center justify-center text-[40px] text-[#38C7D7]">
          {icon}
        </div>
        <div className="font-bold text-[32px] leading-[38px] text-white uppercase tracking-[0.2px] font-roboto">
          {phase}
        </div>
      </div>
    </div>
  );
};

export default PhaseInfo;