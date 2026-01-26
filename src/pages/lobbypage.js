import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Plus } from 'lucide-react';

// Components
import FilterContainer from '../components/Lobby/FilterContainer';
import Button from '../components/UI/Button';
import Navbar from '../components/Navbar/Navbar';
import PageContainer from '../components/UI/PageContainer';
import GameContainer from '../components/Lobby/GameContainer';
import SearchBox from '../components/Lobby/SearchBox';
import LobbyLoading from './LobbyLoading';

// Firebase & Redux
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { syncMatches } from '../store/slices/lobbySlice';

// Utils
import { getGameUser } from '../utils/getUser';

const LobbyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentUser, setCurrentUser] = React.useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carica i dati utente all'avvio
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getGameUser();
        setCurrentUser(user);
      } catch (error) {
        // getGameUser già gestisce il redirect al login
      }
    };
    loadUser();
  }, []);

  // --- 1. ASCOLTA FIREBASE (Lettura Dati) ---
  useEffect(() => {
    const q = query(collection(db, 'matches'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesFromDB = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        matchesFromDB.push({
          matchID: doc.id,
          id: doc.id,
          name: data.name || `PARTITA ${doc.id.slice(0, 4)}`,
          players: data.players || [],
          playersCurrent: (data.players || []).length,
          playersMax: data.playersMax || 6,
          status: data.status,
          isPrivate: data.isPrivate || false,
          password: data.password || null,
          mode: data.mode || 'classica',
          image: data.image
        });
      });
      dispatch(syncMatches(matchesFromDB));
      setIsLoading(false); // Loading finito quando arrivano i dati
    });
    return () => unsubscribe();
  }, [dispatch]);

  // --- 2. FILTRI (Gestiti da Redux) ---
  const { games, filters } = useSelector((state) => state.lobby);

  const filteredGames = useMemo(() => {
    return games.filter((match) => {
      const tableSize = match.playersMax;
      const [min, max] = filters.playerRange;
      const isRangeOk = tableSize >= min && tableSize <= max;
      const isAvailable = match.status === 'OPEN';
      const search = (filters.search || '').toLowerCase();
      const matchName = (match.name || '').toLowerCase();
      const isSearchOk = matchName.includes(search) || match.matchID.toLowerCase().includes(search);
      
      // Filtro visibilità (public/private/all)
      let isVisibilityOk = true;
      if (filters.visibility === 'public') {
        isVisibilityOk = !match.isPrivate;
      } else if (filters.visibility === 'private') {
        isVisibilityOk = match.isPrivate;
      }
      // Se visibility === 'all', non applica filtro
      
      return isRangeOk && isAvailable && isSearchOk && isVisibilityOk;
    });
  }, [games, filters]);

  const createMatch = () => {
    navigate('/create');
  };

  if (isLoading) {
    return <LobbyLoading message="Caricamento lobby..." />;
  }

  return (
    <>
      {/* NAVBAR */}
      <Navbar mode="lobby" user={currentUser} />
      <PageContainer>
        {/* LAYOUT PRINCIPALE */}
        <div className="flex justify-between items-start pt-[90px] pb-10 px-6 xl:px-12 gap-8 w-full max-w-[2000px] mx-auto">
        {/* COLONNA SX: FILTRI */}
        <aside className="hidden xl:block w-[323px] shrink-0 sticky top-[90px]">
          <FilterContainer />
        </aside>
        {/* COLONNA CENTRALE: LISTA PARTITE */}
        <main className="flex-1 min-w-0 max-w-[1400px]">
          <GameContainer
            matches={filteredGames}
            currentUser={currentUser}
          />
        </main>
        {/* COLONNA DX: SIDEBAR & CREATE */}
        <aside className="hidden xl:flex flex-col w-[323px] shrink-0 gap-5 sticky top-[90px]">
          <SearchBox />
          <div className="bg-[#1B2227] rounded-lg shadow-md p-4 flex flex-col h-[500px]">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-600 pb-2">
              <Users className="w-6 h-6 text-white" />
              <span className="text-xl font-bold text-white">Amici Online</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-600 rounded-lg">
              Nessun amico online
            </div>
          </div>
        </aside>
      </div>
      </PageContainer>
    </>
  );
};

export default LobbyPage;