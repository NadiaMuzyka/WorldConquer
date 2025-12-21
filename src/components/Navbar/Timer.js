import React from 'react';

export const Timer = ({ time = "00:58" }) => {
  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center">
      {/* Background Ring */}
      <div className="absolute w-[69px] h-[69px] rounded-full border-[8px] border-[#D8D8D8] box-border"></div>
      {/* Progress Ring (Static for now) */}
      <div className="absolute w-[69px] h-[69px] rounded-full border-[8px] border-[#38C7D7] border-l-transparent border-b-transparent -rotate-45 box-border"></div>
      {/* Time Text */}
      <div className="relative font-bold text-[16px] text-[#D8D8D8] z-10 font-roboto">{time}</div>
    </div>
  );
};
