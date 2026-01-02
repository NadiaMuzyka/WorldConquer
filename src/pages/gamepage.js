import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../firebase/firebaseConfig';
import { setMatchData, clearMatchData } from '../store/slices/matchSlice';

import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { RiskGame } from '../game';   
import { RiskBoard } from '../RiskBoard'; 
import { Users, Loader2 } from 'lucide-react';


const RiskClient = Client({
  game: RiskGame,
  board: RiskBoard,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
  debug: false,
});

const GamePage = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Leggiamo i dati match da Redux
  const { data: matchData } = useSelector((state) => state.match); 

  const playerID = location.state?.playerID; 
  const credentials = location.state?.credentials; 

  // --- ASCOLTO FIRESTORE -> REDUX ---
  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = onSnapshot(doc(db, "matches", matchId), (docSnap) => {
      if (docSnap.exists()) {
        dispatch(setMatchData(docSnap.data()));
      } else {
        navigate('/'); 
      }
    });

    return () => {
      unsubscribe();
      dispatch(clearMatchData());
    };
  }, [matchId, dispatch, navigate]);

  if (!playerID) return <div className="text-white bg-[#1B2227] h-screen p-10">Accesso negato</div>;

  // Calcoli per l'overlay
  const currentPlayers = matchData?.playersCurrent || 1;
  const maxPlayers = matchData?.playersMax || 3;
  const isWaiting = currentPlayers < maxPlayers;

  return (
    <div className="relative w-full h-screen bg-[#1B2227] overflow-hidden">
      
      {/* 1. GIOCO (Sempre montato sotto) */}
      <div className="absolute inset-0 z-0">
         <RiskClient 
            matchID={matchId} 
            playerID={playerID} 
            credentials={credentials} 
         />
      </div>

      {/* 2. OVERLAY ATTESA (Visibile solo se non siamo al completo) */}
      {isWaiting && (
        <div className="absolute inset-0 z-50 bg-[#1B2227]/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
           <div className="bg-[#173C55] p-10 rounded-2xl border border-[#38C7D7] shadow-2xl text-center max-w-lg w-full">
              <h1 className="text-3xl font-black uppercase mb-6 tracking-widest text-white">
                SALA D'ATTESA
              </h1>

              <div className="flex items-center justify-center gap-3 text-[#38C7D7] mb-8 bg-[#1B2227]/50 py-4 rounded-lg border border-gray-700">
                <Users size={28} />
                <span className="text-2xl font-bold">
                   <span className="text-white text-3xl">{currentPlayers}</span> / {maxPlayers}
                </span>
              </div>

              <div className="flex flex-col items-center gap-4">
                 <Loader2 size={48} className="text-[#38C7D7] animate-spin" />
                 <p className="text-gray-300 font-medium">In attesa degli altri giocatori...</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;