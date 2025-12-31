import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Plus } from 'lucide-react';

// Components
import FilterContainer from '../components/Lobby/FilterContainer';
import Button from '../components/UI/Button';
import Navbar from '../components/Navbar/Navbar';
import GameContainer from '../components/Lobby/GameContainer'; // Assicurati che il percorso sia giusto
import SearchBox from '../components/Lobby/SearchBox';

// Firebase & Redux
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { syncMatches } from '../store/slices/lobbySlice';

// Utils
import { getCurrentUser } from '../utils/getUser';

const LobbyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUser = useMemo(() => getCurrentUser(), []);

  // --- 1. ASCOLTA FIREBASE (Lettura Dati) ---
  useEffect(() => {
    // Ascoltiamo la collezione 'matches' in tempo reale
    const q = query(collection(db, 'matches'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesFromDB = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // Mappiamo i dati per la GameCard
        matchesFromDB.push({
          matchID: doc.id,
          id: doc.id,
          name: data.name || `PARTITA ${doc.id.slice(0, 4)}`,
          players: data.players || [],
          playersCurrent: (data.players || []).length,
          playersMax: data.playersMax || 6, // Default a 6 se manca
          gameover: data.gameover,
          status: data.status,
          isPrivate: data.isPrivate || false,
          password: data.password || null, // Serve alla GameCard per il controllo
          mode: data.mode || 'classica',
          image: data.image // Avatar dell'host o immagine custom
        });
      });

      // Salviamo in Redux
      dispatch(syncMatches(matchesFromDB));
    });

    return () => unsubscribe();
  }, [dispatch]);


  // --- 2. FILTRI (Gestiti da Redux) ---
  const { games, filters } = useSelector((state) => state.lobby);

  const filteredGames = useMemo(() => {
    return games.filter((match) => {
      const tableSize = match.playersMax;
      const [min, max] = filters.playerRange;

      // 1. Filtro Range Giocatori
      const isRangeOk = tableSize >= min && tableSize <= max;

      // 2. Filtro Stato (Nascondi partite finite)
      const isOngoing = !match.gameover;

      // 3. Filtro Ricerca (Nome o ID)
      const search = (filters.search || '').toLowerCase();
      const matchName = (match.name || '').toLowerCase();
      const isSearchOk = matchName.includes(search) || match.matchID.toLowerCase().includes(search);

      return isRangeOk && isOngoing && isSearchOk;
    });
  }, [games, filters]);


  // --- 3. NAVIGAZIONE ---
  const createMatch = () => {
    navigate('/create');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#173C55] overflow-y-auto font-roboto text-white">

      {/* NAVBAR */}
      <Navbar mode="lobby" user={currentUser} />

      {/* LAYOUT PRINCIPALE */}
      <div className="flex justify-between items-start pt-[120px] pb-10 px-6 xl:px-12 gap-8 w-full max-w-[2000px] mx-auto">

        {/* COLONNA SX: FILTRI */}
        <aside className="hidden xl:block w-[323px] shrink-0 sticky top-[120px]">
          <FilterContainer />
        </aside>

        {/* COLONNA CENTRALE: LISTA PARTITE */}
        <main className="flex-1 min-w-0">
          <GameContainer
            matches={filteredGames}
          // Nota: Non passiamo più onJoin={...} perché GameCard fa tutto da sola
          />
        </main>

        {/* COLONNA DX: SIDEBAR & CREATE */}
        <aside className="hidden xl:flex flex-col w-[323px] shrink-0 gap-5 sticky top-[120px]">

          <SearchBox />

          <div className="bg-[#1B2227] rounded-lg shadow-md p-4 flex flex-col h-[500px]">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-600 pb-2">
              <Users className="w-6 h-6 text-[#38C7D7]" />
              <span className="font-bold text-[18px]">AMICI ONLINE</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-600 rounded-lg">
              Nessun amico online
            </div>
          </div>

          <div>
            <Button
              variant="yellow"
              size="lg"
              onClick={createMatch}
              className="gap-2 uppercase w-full shadow-md"
            >
              <Plus className="w-6 h-6" /> Crea Partita
            </Button>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default LobbyPage;