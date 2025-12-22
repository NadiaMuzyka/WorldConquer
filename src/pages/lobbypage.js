import React, { useEffect, useMemo } from 'react'; // <--- Import useMemo
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import FilterContainer from '../components/Lobby/FilterContainer';
import Button from '../components/UI/Button';

// Firebase & Redux
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { syncMatches } from '../store/slices/lobbySlice';

const LobbyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- 1. ASCOLTA FIREBASE (Real-Time) ---
  useEffect(() => {
    const q = query(collection(db, 'matches'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesFromDB = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        matchesFromDB.push({
          matchID: doc.id,
          players: data.players || [],
          gameover: data.ctx?.gameover
        });
      });
      // Spedisce a Redux
      dispatch(syncMatches(matchesFromDB));
    });

    return () => unsubscribe();
  }, [dispatch]);


  // --- 2. RECUPERA DATI E FILTRA (Con Memoization) ---
  const { games, filters } = useSelector((state) => state.lobby);

  // useMemo: Ricalcola "filteredGames" SOLO se "games" o "filters" cambiano.
  const filteredGames = useMemo(() => {
    return games.filter((match) => {
      const numPlayers = match.players.length;
      const [min, max] = filters.playerRange;
      
      // Regole filtro
      const isRangeOk = numPlayers >= min && numPlayers <= max;
      const isOngoing = !match.gameover;
      
      // Opzionale: Nascondi la partita di test dalla lista dinamica se vuoi
      // const isNotTest = match.matchID !== 'partita-test-6';

      return isRangeOk && isOngoing;
    });
  }, [games, filters]); // <--- Dipendenze dell'ottimizzazione


  // --- 3. NAVIGAZIONE ---
  const joinMatch = (playerID, matchID) => {
    navigate(`/game/${matchID}`, { state: { playerID } });
  };

  return (
  <div className="min-h-screen p-8 bg-gray-100 font-roboto">  
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">

          {/* COLONNA SINISTRA */}
          <div className="flex-none z-4">
            <FilterContainer />
          </div>

          {/* COLONNA CENTRALE */}
          <div className="flex-1 w-full flex flex-col items-center">
            
            <h1 className="bg-red-500 text-white text-4xl p-4 rounded shadow-md">
              Risiko Multiplayer Lobby
            </h1>
            
            {/* SEZIONE 1: I TUOI BOTTONI TEST (FISSI) */}
            <div className="w-full max-w-4xl mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-4 text-gray-700">Partita Test Rapida</h2>
                <p className="text-gray-600 mb-4">Debug: Entra in "partita-test-6"</p>

                <div className="flex gap-5 flex-wrap justify-center">
                  <button 
                    className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer bg-red-500 hover:bg-red-600 transition"
                    onClick={() => joinMatch("0", "partita-test-6")}
                  >
                    Player 1 (Rosso)
                  </button>
                  <button 
                    className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer bg-blue-500 hover:bg-blue-600 transition"
                    onClick={() => joinMatch("1", "partita-test-6")}
                  >
                    Player 2 (Blu)
                  </button>
                  <button 
                    className="px-[30px] py-[15px] text-white border-none rounded-[5px] cursor-pointer bg-green-500 hover:bg-green-600 transition"
                    onClick={() => joinMatch("2", "partita-test-6")}
                  >
                    Player 3 (Verde)
                  </button>
                </div>
            </div>

            {/* SEZIONE 2: LISTA DINAMICA (DAL DB) */}
            <div className="w-full max-w-4xl mt-12">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                    Partite Pubbliche ({filteredGames.length})
                </h2>

                {filteredGames.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400">
                        Nessuna partita attiva trovata con questi filtri.
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {filteredGames.map((match) => (
                            <div key={match.matchID} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all">
                                
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-xl text-gray-800">Partita: {match.matchID}</h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                        {match.players.length} Posti
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {match.players.map((p, index) => {
                                        const isOccupied = p.name !== undefined;
                                        if (isOccupied) {
                                            return (
                                                <div key={index} className="px-4 py-2 bg-gray-100 text-gray-500 rounded cursor-not-allowed text-sm border font-medium">
                                                    👤 {p.name}
                                                </div>
                                            );
                                        }
                                        return (
                                            <button 
                                                key={index}
                                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm font-bold shadow-sm"
                                                onClick={() => joinMatch(String(index), match.matchID)}
                                            >
                                                Entra Posto {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

          </div>

          {/* COLONNA DESTRA */}
          <div className="flex-none z-4">
            <Button variant={"yellow"}>CREA NUOVA PARTITA</Button>
          </div>
        </div>
      </div>
    ); 
  };

export default LobbyPage;