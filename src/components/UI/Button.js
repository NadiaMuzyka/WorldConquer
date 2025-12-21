import React from 'react';

export const Button = ({ children, onClick, className }) => {
  return (
    <button 
      onClick={onClick}
      className={`bg-[#38C7D7] rounded-[25px] border-none px-6 py-2 text-[#192832] font-bold text-[16px] leading-[19px] tracking-[0.2px] cursor-pointer flex items-center justify-center gap-2.5 h-[34px] min-w-[149px] ${className || ''}`}
    >
      {children}
    </button>
  );
};
