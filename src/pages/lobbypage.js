import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Plus, Filter } from 'lucide-react';

// Components
import FilterContainer from '../components/Lobby/FilterContainer';
import Button from '../components/UI/Button';
import Navbar from '../components/Navbar/Navbar';
import PageContainer from '../components/UI/PageContainer';
import GameContainer from '../components/Lobby/GameContainer';
import SearchBox from '../components/Lobby/SearchBox';
import LobbyLoading from './LobbyLoading';
import BottomDrawer from '../components/UI/BottomDrawer';

// Firebase & Redux
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { syncMatches } from '../store/slices/lobbySlice';

// Utils
import { getGameUser } from '../utils/getUser';

const LobbyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser, status: userStatus } = useSelector(state => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Redirigi se non loggato e non in caricamento
  useEffect(() => {
    if (userStatus === 'unauthenticated') {
      navigate('/login');
    }
  }, [userStatus, navigate]);

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

  if (isLoading || userStatus === 'loading') {
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
        <main className="flex-1 min-w-0 max-w-[1400px] flex flex-col">
          <div className="flex xl:hidden justify-start items-center mb-4">
            <Button 
              variant="outline" 
              onClick={() => setIsMobileFiltersOpen(true)}
              className="gap-2 bg-[#1B2227] border-gray-600 text-white"
            >
              <Filter size={18} />
              Filtri
            </Button>
          </div>
          <SearchBox />
          <GameContainer
            matches={filteredGames}
            currentUser={currentUser}
          />
        </main>
        
      </div>
      </PageContainer>
      
      <BottomDrawer
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        title="Filtri Partita"
      >
        <FilterContainer />
      </BottomDrawer>
    </>
  );
};

export default LobbyPage;