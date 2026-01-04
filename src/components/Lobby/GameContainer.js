import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Gamepad2 } from 'lucide-react';
import GameCard from './GameCard';
import Button from '../UI/Button';

//Parte centrale della lobby, che mostra le partite disponibili
const GameContainer = ({ matches }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full gap-8">

      {/* ---  LISTA PARTITE  --- */}
      <div>
        {/* Header con linea grigia sotto */}
        <div className="w-full border-b-2 border-[#979797] mb-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-7 h-7 text-white" />
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
              Partite Disponibili
            </h2>
          </div>
          <Button
            variant="yellow"
            size="md"
            onClick={() => navigate('/create')}
            className="gap-2 shadow-md"
          >
            <Plus className="w-5 h-5" /> Crea Partita
          </Button>
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
              />
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default GameContainer;