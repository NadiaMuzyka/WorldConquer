import React from 'react';
// import Button from './Button'; // Se usi il tuo componente Button, passagli le classi CSS sotto

const GameCard = ({ match }) => {
  // Destrutturazione props (adatta ai nomi reali delle tue variabili)
  const { id, name, players, maxPlayers, image } = match; 

  return (
    <div className="relative w-full h-auto min-h-[103px] bg-[#1B2227] rounded-[8px] shadow-[0px_4px_10px_rgba(0,0,0,0.3)] p-4 flex flex-row items-center justify-between transition hover:bg-[#232c33]">
      
      {/* Lato Sinistro: Immagine e Info */}
      <div className="flex items-center gap-5">
        
        {/* Immagine Partita (Cerchio Grande con bordo colorato - es. Rosso come Figma) */}
        <div className="relative w-[72px] h-[72px] shrink-0">
            <img 
              src={image || "/api/placeholder/72/72"} 
              alt="Game" 
              className="w-full h-full rounded-full object-cover border-4 border-[#F00A0A]" 
            />
        </div>

        <div className="flex flex-col gap-1">
          {/* Nome Partita */}
          <h3 className="font-roboto font-bold text-[24px] text-white tracking-[0.2px] leading-tight">
            {name || `PARTITA ${id}`}
          </h3>
          
          {/* Riga Player / Avversari */}
          <div className="flex items-center gap-3 mt-1">
            {/* Avatar sovrapposti (stile Figma) */}
            <div className="flex -space-x-2">
               {/* Logica per mostrare avatar giocatori */}
               {[1,2].map((p, index) => (
                 <div key={index} className={`w-[24px] h-[24px] rounded-full border-2 ${index === 0 ? 'border-[#FEC417]' : 'border-[#27CA40]'} bg-gray-500`}></div>
               ))}
               <div className="w-[24px] h-[24px] rounded-full border-2 border-[#979797] bg-gray-600/50"></div>
            </div>
            
            {/* Counter Giocatori */}
            <span className="font-roboto font-bold text-[16px] text-[#D9D9D9]">
              {players}/{maxPlayers}
            </span>
          </div>
        </div>
      </div>

      {/* Lato Destro: ID e Bottone */}
      <div className="flex flex-col items-end gap-2 md:gap-0 md:flex-row md:items-center">
        
        {/* ID Partita (stile #941941) */}
        <div className="hidden md:flex flex-col items-end mr-6">
            <span className="text-[#D8D8D8] font-bold text-[16px]">#{id}</span>
            {/* Lineetta decorativa */}
            <div className="w-6 border-t-2 border-[#D8D8D8] mt-1 opacity-60"></div>
        </div>

        {/* Bottone Partecipa (Stile Figma Pillola Ciano) */}
        <button 
          className="bg-[#38C7D7] hover:bg-[#2dbdc0] text-[#192832] font-roboto font-bold text-[20px] px-8 py-2 rounded-[25px] flex items-center gap-2 shadow-md transition-transform active:scale-95"
          onClick={() => console.log("Join Game", id)}
        >
          PARTECIPA
          {/* Icona Freccia (opzionale come da Figma) */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

    </div>
  );
};

export default GameCard;