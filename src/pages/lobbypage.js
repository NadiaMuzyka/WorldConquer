import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Plus } from 'lucide-react'; // Search è gestito dentro SearchBox

// Components
import FilterContainer from '../components/Lobby/FilterContainer';
import Button from '../components/UI/Button';
import Navbar from '../components/Navbar/Navbar';
import GameContainer from '../components/Lobby/GameContainer';
import SearchBox from '../components/UI/SearchBox';

// Firebase & Redux
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { syncMatches } from '../store/slices/lobbySlice';

const LobbyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- 1. ASCOLTA FIREBASE ---
  useEffect(() => {
    const q = query(collection(db, 'matches'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesFromDB = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        matchesFromDB.push({
          matchID: doc.id,
          id: doc.id,
          name: data.name || `PARTITA ${doc.id.slice(0,4)}`, 
          players: data.players || [],
          playersCurrent: (data.players || []).filter(p => p.name).length, 
          playersMax: (data.players || []).length, 
          gameover: data.ctx?.gameover,
          image: data.mapImage || null 
        });
      });
      dispatch(syncMatches(matchesFromDB));
    });

    return () => unsubscribe();
  }, [dispatch]);


  // --- 2. FILTRI ---
  const { games, filters } = useSelector((state) => state.lobby);

  const filteredGames = useMemo(() => {
    return games.filter((match) => {
      const numPlayers = match.players.length;
      const [min, max] = filters.playerRange;
      const isRangeOk = numPlayers >= min && numPlayers <= max;
      const isOngoing = !match.gameover;
      return isRangeOk && isOngoing;
    });
  }, [games, filters]);


  // --- 3. NAVIGAZIONE ---
  const joinMatch = (playerID, matchID) => {
    navigate(`/game/${matchID}`, { state: { playerID } });
  };

  const createMatch = () => {
    console.log("Crea nuova partita...");
  };

  const currentUser = { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" };

  return (
    <div className="relative min-h-screen w-full bg-[#173C55] overflow-y-auto font-roboto text-white">
      
      {/* NAVBAR */}
      <Navbar mode="lobby" user={currentUser} />

      {/* CONTENITORE PRINCIPALE (MODIFICATO)
         - max-w-[1920px]: Permette di allargarsi molto su schermi grandi.
         - justify-between: Spinge le colonne laterali agli estremi.
         - px-8 lg:px-12: Aumenta il padding laterale per non attaccare i filtri al bordo schermo.
      */}
      <div className="flex justify-between items-start pt-[120px] pb-10 px-6 xl:px-12 gap-8 w-full max-w-[2000px] mx-auto">

        {/* --- COLONNA 1: FILTRI (25% circa, Width Fissa) --- */}
        <aside className="hidden xl:block w-[323px] shrink-0 sticky top-[120px]">
          <FilterContainer />
        </aside>


        {/* --- COLONNA 2: LISTA PARTITE (Centrale Espandibile) --- 
            - max-w-5xl: Aumentato drasticamente rispetto ai 636px di prima (ora arriva fino a ~1024px).
            - mx-auto: Si centra nello spazio disponibile tra le due sidebars.
        */}
        <main className="flex-1 min-w-0">
          <GameContainer 
            matches={filteredGames} 
            onJoin={joinMatch} 
          />
        </main>


        {/* --- COLONNA 3: SOCIAL & AZIONI (25% circa, Width Fissa) --- */}
        <aside className="hidden xl:flex flex-col w-[323px] shrink-0 gap-5 sticky top-[120px]">
          
          {/* 1. CERCA */}
          <SearchBox />

          {/* 2. LISTA AMICI (Altezza Ragionevole) 
              - Rimosso h-[calc(100vh...)] che stirava troppo.
              - Messo h-[500px] fisso (o min-h) per dare sostanza senza esagerare.
          */}
          <div className="bg-[#1B2227] rounded-lg shadow-[0px_4px_4px_rgba(0,0,0,0.25)] p-4 flex flex-col h-[500px]">
             <div className="flex items-center gap-2 mb-4 border-b border-gray-600 pb-2">
                <Users className="w-6 h-6 text-[#38C7D7]" />
                <span className="font-bold text-[18px]">AMICI ONLINE</span>
             </div>
             
             {/* Area scrollabile se ci sono troppi amici */}
             <div className="flex-1 overflow-y-auto border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                Nessun amico online
             </div>
          </div>

          {/* 3. BOTTONE CREA PARTITA */}
          <div>
             <Button
               variant="yellow"
               size="lg"
               onClick={createMatch}
               className="gap-2 uppercase shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
             >
                <Plus className="w-6 h-6" />
                Crea Partita
             </Button>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default LobbyPage;