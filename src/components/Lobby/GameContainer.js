import React from 'react';
import GameCard from './GameCard';

// Riceve "matches" (dati) e "onJoin" (funzione per entrare)
const GameContainer = ({ matches, onJoin }) => {
  return (
    <div className="flex flex-col w-full gap-8">

      {/* --- SEZIONE 1: I TUOI BOTTONI TEST (LOGICA ORIGINALE) --- */}
      {/* Ho cambiato solo bg-white -> bg-[#1B2227] e il colore del testo per leggibilità */}
      <div className="w-full mb-8 p-6 bg-[#1B2227] rounded-lg shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">Partita Test Rapida</h2>
        <p className="text-gray-400 mb-4">Debug: Entra in "partita-test-6"</p>

        <div className="flex gap-5 flex-wrap justify-center">
          {/* Bottone Rosso */}
          <button 
            className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer bg-red-500 hover:bg-red-600 transition font-bold shadow-md"
            onClick={() => onJoin("0", "partita-test-6")}
          >
            Player 1 (Rosso)
          </button>
          
          {/* Bottone Blu */}
          <button 
            className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer bg-blue-500 hover:bg-blue-600 transition font-bold shadow-md"
            onClick={() => onJoin("1", "partita-test-6")}
          >
            Player 2 (Blu)
          </button>
          
          {/* Bottone Verde */}
          <button 
            className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer bg-green-500 hover:bg-green-600 transition font-bold shadow-md"
            onClick={() => onJoin("2", "partita-test-6")}
          >
            Player 3 (Verde)
          </button>
        </div>
      </div>


      {/* --- SEZIONE 2: LISTA PARTITE (Stile Figma) --- */}
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
              <GameCard key={match.id} match={match} />
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default GameContainer;