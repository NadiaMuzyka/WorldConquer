import React, { useEffect, useState } from 'react'; // Aggiunto useState
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db, auth } from '../firebase/firebaseConfig'; // <--- Importa auth diretto
import { setMatchData, clearMatchData } from '../store/slices/matchSlice';
import RiskClient from '../client/RiskClient'; 
import { Users, Loader2 } from 'lucide-react'; 

const GamePage = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 1. LEGGI DATI MATCH DA REDUX (Questo ora funziona grazie al fix nello store)
  const { data: matchData } = useSelector((state) => state.match || { data: null }); 
  
  // 2. RECUPERA UTENTE (Senza Redux Auth)
  const [user, setUser] = useState(auth.currentUser);

  // Ascolta auth change nel caso l'utente logghi al volo (opzionale ma sicuro)
  useEffect(() => {
     const unsub = auth.onAuthStateChanged((u) => setUser(u));
     return () => unsub();
  }, []);

  const playerID = location.state?.playerID; 
  const credentials = location.state?.credentials; 

  // --- ASCOLTO FIRESTORE -> REDUX ---
  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = onSnapshot(doc(db, "matches", matchId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // FIX SERIALIZZAZIONE DATA
        if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
            data.createdAt = data.createdAt.toMillis();
        }
        
        dispatch(setMatchData(data));
      } else {
        console.warn("Partita non trovata");
        navigate('/'); 
      }
    });

    return () => {
      unsubscribe();
      dispatch(clearMatchData());
    };
  }, [matchId, dispatch, navigate]);

  // Se non c'è playerID, torna indietro
  if (!playerID) return <div className="text-white bg-[#1B2227] h-screen p-10 flex items-center justify-center">Accesso negato: Nessun PlayerID.</div>;

  // Calcoli Overlay
  const currentPlayers = matchData?.playersCurrent || 1;
  const maxPlayers = matchData?.playersMax || 3;
  const isWaiting = currentPlayers < maxPlayers;
  const isPlaying = matchData?.status === 'PLAYING';
  
  // Mostra overlay se non è ancora PLAYING E se non tutti i giocatori sono connessi
  const shouldShowOverlay = !isPlaying && isWaiting;
  
  // Testo dinamico dell'overlay
  const overlayText = currentPlayers === maxPlayers 
    ? "Tutti connessi, inizializzazione partita..." 
    : "In attesa degli altri giocatori..."; 

  return (
    <div className="relative w-full h-screen bg-[#1B2227] overflow-hidden">
      
      {/* GIOCO */}
      <div className="absolute inset-0 z-0">
         <RiskClient 
            matchID={matchId} 
            playerID={playerID} 
            credentials={credentials}
            isLobbyFull={!isWaiting} 
         />
      </div>

      {/* OVERLAY ATTESA */}
      {shouldShowOverlay && (
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
              
              {user && (
                 <p className="text-sm text-gray-400 mb-4">
                    Sei loggato come: <span className="text-[#38C7D7]">{user.displayName || user.email}</span>
                 </p>
              )}

              <div className="flex flex-col items-center gap-4">
                 <Loader2 size={48} className="text-[#38C7D7] animate-spin" />
                 <p className="text-gray-300 font-medium">{overlayText}</p>
                 <p className="text-xs text-gray-500">ID Partita: {matchId}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;