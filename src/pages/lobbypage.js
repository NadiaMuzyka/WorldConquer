import React from 'react';
import { useNavigate } from 'react-router-dom';
import FilterContainer from '../components/Lobby/FilterContainer';
import Button from '../components/UI/Button';

// --- 1. COMPONENTE LOBBY
const LobbyPage = () => {
  const navigate = useNavigate();

  const joinMatch = (playerID, matchID) => {
    navigate(`/game/${matchID}`, { state: { playerID } });
  };

  return (
  <div className="min-h-screen p-8 bg-gray-100 font-roboto">  
        {/* Layout Flex: Sidebar (Filtri) a Sinistra | Contenuto a Destra */}
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">

          {/* 1. COLONNA SINISTRA: FilterContainer */}
          <div className="flex-none z-4">
            <FilterContainer />
          </div>

          {/* 2. COLONNA DESTRA: Il tuo contenuto attuale */}
          <div className="flex-1 w-full flex flex-col items-center">
            
            <h1 className="bg-red-500 text-white text-4xl p-4 rounded shadow-md">
              Risiko Multiplayer Lobby
            </h1>
            
            <p className="mt-4 text-gray-700 text-lg">
              Scegli il tuo giocatore per entrare nella partita "partita-test-6"
            </p>

            <div className="flex gap-5 mt-8 flex-wrap justify-center">
              <button 
                className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer text-[16px] bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                onClick={() => joinMatch("0", "partita-test-6")}
              >
                Player 1 (Rosso)
              </button>
              <button 
                className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer text-[16px] bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
                onClick={() => joinMatch("1", "partita-test-6")}
              >
                Player 2 (Blu)
              </button>
              <button 
                className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer text-[16px] bg-green-500 hover:bg-green-600 transition-colors shadow-sm"
                onClick={() => joinMatch("2", "partita-test-6")}
              >
                Player 3 (Verde)
              </button>
            </div>

            {/* Placeholder visivo per dove andranno le partite in futuro */}
            <div className="mt-12 w-full max-w-4xl p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400">
              [Qui verrà inserito il GameContainer con la lista delle partite]
            </div>

          </div>

        </div>
      </div>
    ); 
  };

export default LobbyPage;