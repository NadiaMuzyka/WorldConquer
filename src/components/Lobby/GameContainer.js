import React from 'react';
import GameCard from './GameCard';

// Riceve "matches" (dati) e "onJoin" (funzione per entrare)
const GameContainer = ({ matches, onJoin }) => {
  return (
    <div className="flex flex-col w-full gap-8">

      {/* ---  LISTA PARTITE  --- */}
      <div>
        {/* Header con linea grigia sotto */}
        <div className="w-full border-b-2 border-[#979797] mb-6 pb-2 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
             <h2 className="font-roboto font-bold text-[28px] text-white tracking-[0.2px]">
               PARTITE DISPONIBILI
             </h2>
        </div>

        {/* Lista Card */}
        <div className="flex flex-col gap-6">
          {matches.length === 0 ? (
             <div className="text-gray-400 text-center py-10 border-2 border-dashed border-gray-600 rounded-lg">
                Nessuna partita pubblica disponibile al momento.
             </div>
          ) : (
            matches.map((match) => (
              <GameCard 
                key={match.id} 
                match={match}
                //onJoin={onJoin}
                />
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default GameContainer;