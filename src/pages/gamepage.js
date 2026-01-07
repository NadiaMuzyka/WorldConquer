import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { subscribeToMatch, clearMatchData } from '../store/slices/matchSlice';
import RiskClient from '../client/RiskClient';

const GamePage = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // LEGGI DATI MATCH DA REDUX
  const { data: matchData } = useSelector((state) => state.match || { data: null }); 

  const playerID = location.state?.playerID; 
  const credentials = location.state?.credentials; 

  // Inizializza Redux con i dati passati da WaitingPage (evita race condition)
  useEffect(() => {
    if (location.state?.matchData) {
      // I dati iniziali sono già in Redux tramite WaitingPage
      console.log('[GAMEPAGE] Dati iniziali ricevuti da location.state');
    }
  }, [location.state]);

  // ASCOLTO FIRESTORE -> REDUX (centralizzato)
  useEffect(() => {
    if (!matchId) return;

    console.log(`[GAMEPAGE] Sottoscrizione Redux per match ${matchId}`);
    const unsubscribe = dispatch(subscribeToMatch(matchId));

    return () => {
      console.log(`[GAMEPAGE] Cleanup sottoscrizione match ${matchId}`);
      unsubscribe();
      dispatch(clearMatchData());
    };
  }, [matchId, dispatch]);

  // Se non ci sono credenziali, torna alla lobby
  if (!playerID || !credentials) {
    console.error('[GAMEPAGE] Credenziali mancanti:', { playerID, credentials: credentials ? 'OK' : 'MANCANTI' });
    return (
      <div className="text-white bg-[#1B2227] h-screen p-10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accesso Negato</h1>
          <p className="text-gray-400 mb-6">Credenziali mancanti. Torna alla lobby per unirti a una partita.</p>
          <button 
            onClick={() => navigate('/lobby')}
            className="px-6 py-3 bg-[#38C7D7] text-white rounded-lg font-bold hover:bg-[#2a9fb0]"
          >
            Torna alla Lobby
          </button>
        </div>
      </div>
    );
  }

  console.log(`[GAMEPAGE] Montaggio RiskClient - Player ${playerID}, Match ${matchId}`);

  return (
    <div className="relative w-full h-screen bg-[#1B2227] overflow-y-auto">
      <RiskClient 
        matchID={matchId} 
        playerID={playerID} 
        credentials={credentials}
      />
    </div>
  );
};

export default GamePage;