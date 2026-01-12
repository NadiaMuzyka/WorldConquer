import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { joinGameWithRetry, leaveMatch } from '../client/lobbyClient';
import { enterMatch } from '../store/slices/lobbySlice';
import { subscribeToMatch, clearMatchData } from '../store/slices/matchSlice';
import { Users, Loader2, Check, Crown, Play } from 'lucide-react';

import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import PageContainer from '../components/UI/PageContainer';

const WaitingPage = () => {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const playerID = location.state?.playerID;
  
  // Ref per evitare doppi join
  const hasJoinedRef = useRef(sessionStorage.getItem(`joined_${matchId}_${playerID}`) === 'true');
  const startedJoinRef = useRef(false);

  // ✨ LEGGI MATCH DATA DA REDUX (centralizzato)
  const matchData = useSelector(state => state.match.data);
  
  const [credentials, setCredentials] = useState(null);
  const [isJoining, setIsJoining] = useState(!hasJoinedRef.current);
  const [joinError, setJoinError] = useState(null);
  
  // Stato per gestire il caricamento dell'avvio manuale
  const [isStarting, setIsStarting] = useState(false);

  // 1. ASCOLTO FIRESTORE (centralizzato via Redux)
  useEffect(() => {
    if (!matchId) return;
    
    console.log(`[WAITING] Sottoscrizione Redux per match ${matchId}`);
    const unsubscribe = dispatch(subscribeToMatch(matchId));
    
    return () => {
      console.log(`[WAITING] Cleanup sottoscrizione match ${matchId}`);
      unsubscribe();
      dispatch(clearMatchData());
    };
  }, [matchId, dispatch]);
  
  // 1b. Reindirizza se match non trovato
  useEffect(() => {
    if (matchData === null) return; // Ancora in caricamento
    // Se matchData è undefined significa che Firestore ha ritornato "non esiste"
    // (gestito dall'error handler in subscribeToMatch)
  }, [matchData, navigate]);

  // 2. LOGICA DI JOIN (Sempre necessaria per ottenere le credenziali)
  useEffect(() => {
    if (!playerID || !matchId) { navigate('/lobby'); return; }
    if (startedJoinRef.current || hasJoinedRef.current) {
        if (hasJoinedRef.current) setIsJoining(false);
        return;
    }

    startedJoinRef.current = true;

    const performJoin = async () => {
      try {
        setIsJoining(true);
        const currentUser = location.state?.currentUser;
        if (!currentUser) throw new Error('Dati utente mancanti');

        const { playerCredentials } = await joinGameWithRetry(
            matchId, 
            playerID, 
            currentUser.name, 
            currentUser.avatar
        );
        
        hasJoinedRef.current = true;
        sessionStorage.setItem(`joined_${matchId}_${playerID}`, 'true');
        setCredentials(playerCredentials);
        dispatch(enterMatch(matchId));
      } catch (error) {
        console.error('Errore Join:', error);
        setJoinError(error.message);
        startedJoinRef.current = false;
      } finally {
        setIsJoining(false);
      }
    };
    performJoin();
  }, [playerID, matchId, location.state, navigate, dispatch]);

  // 3. CLEANUP quando il giocatore esce o chiude la tab
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // Solo se siamo ancora in attesa (non durante la partita)
      if (matchData?.status === 'OPEN' && credentials && playerID) {
        try {
          // Usa navigator.sendBeacon per garantire che la richiesta venga inviata
          const leaveUrl = `/games/risk/${matchId}/leave`;
          const payload = JSON.stringify({
            playerID: String(playerID),
            credentials: credentials
          });
          
          navigator.sendBeacon(leaveUrl, new Blob([payload], { type: 'application/json' }));
          
          // Pulisci session storage
          sessionStorage.removeItem(`joined_${matchId}_${playerID}`);
        } catch (error) {
          console.error('[WAITING] Errore during leave:', error);
        }
      }
    };
    
    // Ascolta beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [matchData, credentials, playerID, matchId]);

  // 4. NAVIGAZIONE AUTOMATICA (Scatta SOLO quando lo stato diventa PLAYING)
  useEffect(() => {
    // Naviga solo se lo stato è PLAYING e abbiamo le credenziali pronte
    if (matchData?.status === 'PLAYING' && credentials) {
        
        // Serializza i dati per evitare errori di passaggio stato
        const serializedData = { ...matchData };
        if (serializedData.createdAt?.toMillis) {
            serializedData.createdAt = serializedData.createdAt.toMillis();
        }

        navigate(`/game/${matchId}`, {
            state: {
                playerID: String(playerID),
                credentials: credentials,
                matchData: serializedData
            },
            replace: true
        });
    }
  }, [matchData, credentials, matchId, playerID, navigate]);


  // 4. FUNZIONE AVVIO MANUALE (Solo per HOST)
  const handleStartGame = async () => {
    try {
        setIsStarting(true);
        // Aggiorna lo stato su Firestore -> questo attiverà l'useEffect #3 per TUTTI i client
        await updateDoc(doc(db, 'matches', matchId), { 
            status: 'PLAYING' 
        });
    } catch (error) {
        console.error("Errore avvio partita:", error);
        setIsStarting(false);
    }
  };

  // 5. FUNZIONE ABBANDONO PARTITA (Bottone "Abbandona")
  const handleLeaveMatch = async () => {
    if (!matchId || !playerID || !credentials) return;
    
    try {
      console.log('🚪 Player leaving match:', matchId);
      await leaveMatch(matchId, playerID, credentials);
      console.log('✅ Left match successfully');
      
      // Pulisci sessionStorage
      sessionStorage.removeItem(`joined_${matchId}_${playerID}`);
      
      // Naviga alla lobby
      navigate('/lobby');
    } catch (error) {
      console.error('❌ Error leaving match:', error);
      // Naviga comunque alla lobby
      navigate('/lobby');
    }
  };


  // --- RENDER ---

  if (joinError) return <ErrorView error={joinError} navigate={navigate} />;
  if (isJoining && !credentials) return <LoadingView message="Ingresso in partita..." />;
  if (!matchData) return <LoadingView />;

  const currentPlayers = matchData.playersCurrent || 0;
  const maxPlayers = matchData.playersMax || 6;
  const players = matchData.players || [];
  
  // Determina se l'utente corrente è l'host
  // Assumiamo che playerID corrisponda all'ID nell'array players o che l'host sia flaggato
  const isHost = players.find(p => String(p.id) === String(playerID))?.isHost;
  const canStart = isHost && currentPlayers === maxPlayers;

  return (
    <PageContainer className="font-roboto bg-[#173C55]">
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card padding="lg" className="max-w-2xl w-full border border-[#38C7D7]/30">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
              Sala d'Attesa
            </h1>
            <p className="text-gray-400 text-lg">{matchData.name}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 font-semibold">Giocatori</span>
              <span className="text-[#38C7D7] font-bold text-xl">
                {currentPlayers}/{maxPlayers}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#38C7D7] to-[#2a9fb0] h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(currentPlayers / maxPlayers) * 100}%` }}
              />
            </div>
          </div>

          {/* Lista Giocatori */}
          <div className="space-y-3 mb-8">
            {players.map((player, index) => (
              <div key={player.id || index} className="flex items-center gap-4 bg-[#2A3439] p-4 rounded-lg border border-gray-700">
                <img src={player.avatar} alt={player.name} className="w-14 h-14 rounded-full border-2 border-[#38C7D7]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-lg">{player.name}</span>
                    {player.isHost && <Crown className="w-5 h-5 text-yellow-400" />}
                  </div>
                  <span className="text-gray-400 text-sm">Giocatore {parseInt(player.id) + 1}</span>
                </div>
                <Check className="w-6 h-6 text-green-400" />
              </div>
            ))}
            {/* Posti vuoti */}
            {Array.from({ length: maxPlayers - currentPlayers }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center gap-4 bg-[#1a2228] p-4 rounded-lg border-2 border-dashed border-gray-700 opacity-50">
                 <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                   <Users className="w-7 h-7 text-gray-500" />
                 </div>
                 <span className="text-gray-500 font-semibold">In attesa...</span>
              </div>
            ))}
          </div>

          {/* AREA AZIONI HOST / STATUS */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            {matchData.status === 'PLAYING' ? (
               <div className="text-center text-green-400 font-bold animate-pulse">
                  Partita avviata! Ingresso in corso...
               </div>
            ) : (
                <>
                    {/* SEI L'HOST E STANZA PIENA -> MOSTRA BOTTONE */}
                    {canStart ? (
                        <Button 
                            variant="primary" 
                            size="lg" 
                            className="w-full py-4 text-xl font-black shadow-lg shadow-[#38C7D7]/20 hover:shadow-[#38C7D7]/40"
                            onClick={handleStartGame}
                            disabled={isStarting}
                        >
                            {isStarting ? (
                                <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Avvio...</>
                            ) : (
                                <><Play className="w-6 h-6 mr-2 fill-current" /> INIZIA PARTITA</>
                            )}
                        </Button>
                    ) : (
                        /* NON HOST O STANZA NON PIENA */
                        <div className="text-center p-4 bg-[#1a2228] rounded-lg border border-gray-700">
                            {currentPlayers < maxPlayers ? (
                                <p className="text-gray-400">In attesa che la stanza si riempia...</p>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 text-[#38C7D7] animate-spin" />
                                    <p className="text-[#38C7D7] font-bold">In attesa che l'Host avvii la partita...</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
          </div>

          {/* BOTTONE ABBANDONA - Sempre visibile */}
          <div className="mt-4">
            <Button 
              variant="secondary" 
              size="md" 
              className="w-full" 
              onClick={handleLeaveMatch}
            >
              Abbandona Partita
            </Button>
          </div>
          
        </Card>
      </div>
    </PageContainer>
  );
};

// Componenti di utility per pulire il codice principale
const ErrorView = ({ error, navigate }) => (
  <PageContainer className="font-roboto">
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card padding="lg" className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Errore</h1>
        <p className="text-gray-300 mb-6">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/lobby')} className="w-full">Torna alla Lobby</Button>
      </Card>
    </div>
  </PageContainer>
);

const LoadingView = ({ message = "Caricamento..." }) => (
  <PageContainer className="font-roboto">
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#38C7D7] animate-spin mx-auto mb-4" />
          <p className="text-white">{message}</p>
      </div>
    </div>
  </PageContainer>
);

export default WaitingPage;