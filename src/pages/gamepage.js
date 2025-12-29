import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore'; // <--- USIAMO onSnapshot
import { db } from '../firebase/firebaseConfig';
import { getCurrentUser } from '../utils/getUser';

// BOARDGAME.IO
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { RiskGame } from '../game';   
import { RiskBoard } from '../RiskBoard'; 

// Client Setup
const RiskClient = Client({
  game: RiskGame,
  board: RiskBoard,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
  debug: true,
});

const GamePage = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // const currentUser = getCurrentUser(); // Se servisse per controlli futuri

  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recupero dati dalla navigazione (passati da GameCard/CreateMatch)
  const playerID = location.state?.playerID; 
  const credentials = location.state?.credentials; 

  // --- ASCOLTO TEMPO REALE (FIX SINCRONIZZAZIONE) ---
  useEffect(() => {
    if (!matchId) return;

    // Riferimento al documento della partita
    const docRef = doc(db, "matches", matchId);

    // Attiviamo il listener
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        console.warn("Partita cancellata o inesistente");
        navigate('/'); // Se l'host cancella la partita, torniamo tutti alla lobby
        return;
      }

      const data = docSnap.data();
      setMatchData(data); // Aggiorna lo stato ogni volta che il DB cambia!
      setLoading(false);
      
      // Opzionale: Se vuoi fare un log per vedere gli aggiornamenti
      // console.log("Aggiornamento giocatori:", data.players.length);
    }, (error) => {
       console.error("Errore ascolto partita:", error);
       // Gestisci l'errore o naviga via
    });

    // Importante: spegni l'ascolto quando esci dalla pagina
    return () => unsubscribe();
  }, [matchId, navigate]);


  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white bg-[#1B2227]">Caricamento...</div>;
  }

  // Calcoli basati sui dati sempre aggiornati
  const currentPlayers = matchData?.players?.length || 0;
  const maxPlayers = matchData?.playersMax || 6;
  const isWaiting = currentPlayers < maxPlayers;

  return (
    <div className="relative w-full h-screen bg-[#1B2227] overflow-hidden">
      
      {/* 1. GIOCO (Boardgame.io) */}
      <div className="w-full h-full">
        <RiskClient 
            matchID={matchId} 
            playerID={playerID} 
            credentials={credentials} 
        />
      </div>

      {/* 2. OVERLAY ATTESA */}
      {/* Questo ora sparirà automaticamente appena isWaiting diventa false! */}
      {isWaiting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-500">
           
           <div className="bg-[#173C55] p-8 rounded-xl border border-[#38C7D7] text-center shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
              <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">In Attesa</h2>
              <p className="text-[#38C7D7] text-xl font-bold mb-6">
                 Giocatori {currentPlayers} / {maxPlayers}
              </p>
              
              <div className="flex justify-center gap-4 mb-8 flex-wrap">
                 {/* Avatar Presenti */}
                 {matchData.players.map((p, i) => (
                    <div key={i} className="flex flex-col items-center animate-in slide-in-from-bottom-2 fade-in duration-500">
                       <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full border-2 border-white mb-1 shadow-lg"/>
                       <span className="text-xs text-white font-bold">{p.name}</span>
                    </div>
                 ))}
                 
                 {/* Slot Vuoti */}
                 {[...Array(maxPlayers - currentPlayers)].map((_, i) => (
                    <div key={`empty-${i}`} className="flex flex-col items-center opacity-50">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-500 bg-gray-800/50 flex items-center justify-center">
                           <span className="text-gray-500 text-xs">?</span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">...</span>
                    </div>
                 ))}
              </div>
              
              <div className="text-gray-400 text-sm animate-pulse mb-6">
                 La partita inizierà automaticamente...
              </div>

              <button 
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition shadow-lg hover:shadow-red-500/20"
              >
                Abbandona
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;