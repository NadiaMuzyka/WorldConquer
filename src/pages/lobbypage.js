import { useNavigate } from 'react-router-dom';

// --- 1. COMPONENTE LOBBY
const LobbyPage = () => {
  const navigate = useNavigate();

  const joinMatch = (playerID, matchID) => {
    navigate(`/game/${matchID}`, { state: { playerID } });
  };

  return (
    <div className="flex flex-col items-center mt-[50px]">
      <h1 className="bg-red-500 text-white text-4xl p-4">Risiko Multiplayer Lobby</h1>
      <p>Scegli il tuo giocatore per entrare nella partita "partita-test-6"</p>
      <div className="flex gap-5 mt-4">
        <button 
          className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer text-[16px] bg-red-500 hover:bg-red-600"
          onClick={() => joinMatch("0", "partita-test-6")}
        >
          Player 1 (Rosso)
        </button>
        <button 
          className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer text-[16px] bg-blue-500 hover:bg-blue-600"
          onClick={() => joinMatch("1", "partita-test-6")}
        >
          Player 2 (Blu)
        </button>
        <button 
          className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer text-[16px] bg-green-500 hover:bg-green-600"
          onClick={() => joinMatch("2", "partita-test-6")}
        >
          Player 3 (Verde)
        </button>
      </div>
    </div>
  ); 
};

export default LobbyPage;