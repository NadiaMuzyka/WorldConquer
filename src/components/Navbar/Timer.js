import React from 'react';
import { Clock } from 'lucide-react';

const Timer = ({ time = "00:58" }) => {
  return (
    // Figma: Timer position absolute width 72px...
    // Qui usiamo relative perché sarà la Navbar a posizionarlo
    <div className="relative w-[72px] h-[72px] flex items-center justify-center">
      
      {/* Cerchio Sfondo (#D8D8D8) */}
      <div className="absolute inset-0 rounded-full border-[8px] border-[#D8D8D8] box-border"></div>
      
      {/* Cerchio Progresso (#38C7D7) - Simulato statico o dinamico */}
      {/* Usiamo border-l-transparent border-b-transparent per simulare il caricamento */}
      <div className="absolute inset-0 rounded-full border-[8px] border-[#38C7D7] border-l-transparent border-b-transparent -rotate-45 box-border"></div>
      
      {/* Testo 00:58 */}
      <div className="relative z-10 font-roboto font-bold text-[16px] text-[#D8D8D8] tracking-[0.2px] flex items-center gap-1">
        {time}
      </div>
    </div>
  );
};

export default Timer;