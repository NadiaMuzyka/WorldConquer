import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearMatchData } from './store/slices/matchSlice';
import { GameProvider, useRisk } from './context/GameContext';
import RiskMap from './components/Map/RiskMap';
import ZoomableMapContainer from './components/Map/ZoomableMapContainer';
import Navbar from './components/Navbar/Navbar';
import AttackDiceSelectionModal from './components/UI/AttackDiceSelectionModal';
import BattleAnimationModal from './components/UI/BattleAnimationModal';
import BattleResultModal from './components/UI/BattleResultModal';
import FortifyTroopsModal from './components/UI/FortifyTroopsModal';
import EndGameModal from './components/UI/EndGameModal';
import PlayerBar from './components/UI/PlayerBar';
import SetupLogAnimated from './components/UI/SetupLogAnimated';
import Card from './components/UI/Card';
import { Trophy } from 'lucide-react';
import Avatar from './components/UI/Avatar';
import Modal from './components/UI/Modal';
import Button from './components/UI/Button';
import ConnectionGuardian from './ConnectionGuardian';
import { setUserOffline, startHeartbeat } from './firebase/presence';
import { useUserPresence } from './hooks/useUserPresence';
import { getGameUser } from './utils/getUser';

function RiskBoardContent() {
  const { ctx, G, moves, playerID } = useRisk();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matchId } = useParams(); // Ottieni matchID dall'URL

  // Redux: ottieni i dati del match per recuperare i giocatori
  const matchData = useSelector((state) => state.match?.data);

  const [showAnimationModal, setShowAnimationModal] = React.useState(false);
  const [showResultModal, setShowResultModal] = React.useState(false);
  const [showEndGameModal, setShowEndGameModal] = React.useState(false);
  const [showExitModal, setShowExitModal] = React.useState(false); // Modal uscita volontaria

  const isSetupPhase = ctx?.phase === 'SETUP_INITIAL';
  const isReinforcementPhase = ctx?.phase === 'INITIAL_REINFORCEMENT';
  const isGamePhase = ctx?.phase === 'GAME';

  // Determina se la partita è finita
  const isGameOver = Boolean(ctx?.gameover);
  const rawWinnerID = ctx?.gameover?.winner ?? ctx?.gameover;
  const winnerID = rawWinnerID !== undefined && rawWinnerID !== null ? String(rawWinnerID) : undefined;
  const winnerPlayer = winnerID ? G?.players?.[winnerID] : undefined;
  const winnerName =
    winnerPlayer?.name ||
    matchData?.players?.find((p) => String(p.id) === winnerID)?.name;
  const winnerObjective = winnerPlayer?.secretObjective;
  const victoryType = ctx?.gameover?.victoryType || 'objective';
  const currentStage = ctx.activePlayers?.[ctx?.currentPlayer];
  const player = matchData?.players?.[playerID];
  const avatarUrl = player?.photoURL || player?.avatar || `https://ui-avatars.com/api/?name=P${parseInt(playerID) + 1}&background=random`;
  const nickname = player?.name || `Player${parseInt(playerID) + 1}`;
  
  // Recupera l'obiettivo segreto dal G
  const secretObjective = G?.players?.[playerID]?.secretObjective?.description || null;

  // Stato per l'utente autenticato
  const [currentUser, setCurrentUser] = React.useState(null);

  // Ascolta lo stato di autenticazione
  React.useEffect(() => {
    const user = getGameUser();
    console.log('🛡️ [AUTH] Utente recuperato:', user?.uid || 'null');
    setCurrentUser(user);
  }, []);

  // Inizializza Firebase Presence usando l'hook dedicato
  useUserPresence(currentUser, {
    currentMatchId: matchId,
    playerID: playerID,
    username: nickname,
    photoURL: avatarUrl
  });

  // Avvia heartbeat per questo giocatore
  React.useEffect(() => {
    console.log(`❤️ [RISKBOARD] useEffect heartbeat - matchId: ${matchId}, playerID: ${playerID}`);
    
    if (!matchId || playerID === undefined || playerID === null) {
      console.warn(`❤️ [RISKBOARD] ⚠️ Skip heartbeat - matchId: ${matchId}, playerID: ${playerID}`);
      return;
    }

    console.log(`❤️ [RISKBOARD] ✅ Avvio heartbeat per Player ${playerID} in match ${matchId}`);
    const stopHeartbeat = startHeartbeat(matchId, playerID);

    return () => {
      console.log(`❤️ [RISKBOARD] Cleanup heartbeat per Player ${playerID}`);
      stopHeartbeat();
    };
  }, [matchId, playerID]);

  // Redirect automatico se il giocatore ha abbandonato (dopo refresh)
  React.useEffect(() => {
    if (G?.hasLeft?.[playerID]) {
      console.log('[RISKBOARD] Giocatore ha abbandonato, redirect alla lobby');
      dispatch(clearMatchData());
      navigate('/lobby', { replace: true });
    }
  }, [G?.hasLeft, playerID, dispatch, navigate]);

  // Verifica se è il turno del giocatore corrente
  const isMyTurn = ctx?.currentPlayer === playerID;

  // Mostra modali basati sullo stato G - SOLO se è il mio turno
  const showAttackDiceModal = !isGameOver && isMyTurn && G?.attackState?.from && G?.attackState?.to && !G?.attackState?.attackDiceCount;
  const showFortifyModal = !isGameOver && isMyTurn && G?.fortifyState?.from && G?.fortifyState?.to;

  // Gestione dei modal di battaglia
  React.useEffect(() => {
    const hasBattleResult = G?.battleResult !== null && G?.battleResult !== undefined;

    if (isGameOver) {
      setShowAnimationModal(false);
      setShowResultModal(false);
      return;
    }

    if (isMyTurn && hasBattleResult) {
      // Se c'è un battleResult, mostra prima l'animazione
      setShowAnimationModal(true);
      setShowResultModal(false);
    } else if (!hasBattleResult) {
      // Se non c'è battleResult, nascondi entrambi i modal
      setShowAnimationModal(false);
      setShowResultModal(false);
    }
  }, [isMyTurn, G?.battleResult, isGameOver]);

  // Gestione del completamento dell'animazione
  const handleAnimationComplete = () => {
    setShowAnimationModal(false);
    setShowResultModal(true);
  };

  // Gestione della chiusura del risultato
  const handleResultClose = () => {
    setShowResultModal(false);
    // Reset IMMEDIATO del battleResult chiamando la mossa del server
    // Questo avviene sia per chiusura manuale che automatica
    if (moves?.resetAttackSelection) {
      moves.resetAttackSelection();
    }
  };

  // Gestione fine partita - rileva ctx.gameover
  React.useEffect(() => {
    if (ctx?.gameover) {
      console.log('🏆 [ENDGAME] Partita terminata! Vincitore:', ctx.gameover);
      setShowEndGameModal(true);
    }
  }, [ctx?.gameover]);

  // Gestione reindirizzamento dopo timeout EndGameModal
  const handleEndGameTimerComplete = () => {
    console.log('[ENDGAME] Timer completato, reindirizzamento alla lobby...');
    dispatch(clearMatchData());
    navigate('/lobby');
  };
  // Conta i territori posseduti dal giocatore
  const ownedTerritories = Object.values(G.owners || {}).filter(owner => owner === playerID).length;
  const myTerritories = Object.entries(G.owners || {}).filter(([key, owner]) => owner === playerID).map(([key]) => key);
  const totalTroops = myTerritories.reduce((sum, territory) => sum + (G.troops?.[territory] ?? 0), 0);
  
  // Listener per evento custom di back button (da GamePage)
  React.useEffect(() => {
    const handleShowExitModal = () => {
      console.log('[RISKBOARD] Evento show-exit-modal ricevuto');
      setShowExitModal(true);
    };
    
    window.addEventListener('show-exit-modal', handleShowExitModal);
    
    return () => {
      window.removeEventListener('show-exit-modal', handleShowExitModal);
    };
  }, []);
  
  // Handler per conferma uscita
  const handleConfirmExit = async () => {
    console.log('[RISKBOARD] Uscita confermata - imposto hasLeft e reindirizzo');
    
    // Imposta manualmente lo stato offline su Firebase prima di uscire
    if (currentUser?.uid) {
      console.log('🛡️ [PRESENCE] Imposto manualmente offline prima dell\'uscita');
      await setUserOffline(currentUser.uid);
    }
    
    // Chiama move leaveMatch per impostare G.hasLeft[playerID] = true
    if (moves?.leaveMatch) {
      try {
        moves.leaveMatch();
        console.log('[RISKBOARD] leaveMatch chiamato con successo');
        
        // Attendi propagazione dello stato
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('[RISKBOARD] Errore chiamata leaveMatch:', error);
      }
    } else {
      console.warn('[RISKBOARD] moves.leaveMatch non disponibile');
    }
    
    // Redirect alla lobby preservando metadata/credentials per refresh
    dispatch(clearMatchData());
    navigate('/lobby', { replace: true });
  };
  
  const handleCancelExit = () => {
    console.log('[RISKBOARD] Uscita annullata');
    setShowExitModal(false);
  };
  
  // Handler per bottone Abbandona nella Navbar
  const handleNavbarLeave = () => {
    console.log('[RISKBOARD] Bottone Abbandona cliccato dalla Navbar');
    setShowExitModal(true);
  };

  return (
    <div className="relative w-full h-screen bg-[#173C55] overflow-hidden flex flex-col">

      {/* Decorazioni di sfondo (cerchi ciano) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#38C7D7] opacity-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#38C7D7] opacity-10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* NAVBAR */}
      <div className="flex-shrink-0 relative z-10">
        <Navbar
          mode="game"
          phase={ctx?.phase || "PREPARAZIONE"}
          gameCode={ctx?.matchID || "DEBUG-123"}
          playerTurn={ctx?.currentPlayer}
          onLeave={handleNavbarLeave}
          ctx={ctx}
        />
      </div>

      {/* CONNECTION GUARDIAN - Monitora disconnessioni giocatori */}
      <ConnectionGuardian 
        ctx={ctx} 
        moves={moves} 
        playerID={playerID} 
        G={G}
        matchID={matchId}
      />

      {/*Layout standard full-width per altre fasi*/}
      <div className="w-full flex justify-center items-center z-15 h-[calc(100vh-180px)] mt-20">
        <div className="w-full h-full lg:max-w-[65%] mx-auto flex items-center justify-center p-4 mt-6">
          <ZoomableMapContainer>
            <RiskMap />
          </ZoomableMapContainer>
        </div>

        {/* BARRA SOTTO DEL GIOCATORE */}
        <PlayerBar />

        {isSetupPhase && <SetupLogAnimated />}

          {/* Card obiettivo segreto: in basso a sinistra, fuori dalla fase di setup */}
          {!isSetupPhase && secretObjective && (
            <div className="fixed left-8 bottom-3 z-30">
              <Card className="w-auto h-[98px] flex flex-col justify-center bg-[#1B2227] border-l-4 border-[#FEC417] shadow-lg py-0">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-[#FEC417]" />
                  <span className="text-lg font-bold text-[#FEC417]">IL TUO OBIETTIVO</span>
                </div>
                <div className="mt-3 text-base text-white whitespace-nowrap">{secretObjective}</div>
              </Card>
            </div>
          )}

          {/* MESSAGGIO UTENTE IN ALTO */}
          {(isMyTurn || isSetupPhase) && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30">
              <Card className="w-[420px] bg-[#FEC417] shadow-lg py-2 px-4 text-center mt-2">
                <span className="text-base font-bold text-[#1B2227]">
                  {isSetupPhase && 'Ti sono stati assegnati i seguenti territori'}
                  {isReinforcementPhase && 'Posiziona le tue truppe iniziali'}
                  {isGamePhase && currentStage === 'reinforcement' &&  'Posiziona le tue truppe di rinforzo'}
                  {isGamePhase && currentStage === 'attack' &&  'Attacca i territori avversari'}
                  {isGamePhase && currentStage === 'strategicMovement' &&  'Sposta le tue truppe'}
                  {!isSetupPhase && !isReinforcementPhase && !isGamePhase && 'In attesa...'}
                </span>
              </Card>
            </div>
          )}

          {/* CARD INFO UTENTE IN ALTO A SINISTRA */}
          <div className="fixed left-8 bottom-20 z-30">
            <Card className="w-[260px] min-h-[280px] flex flex-col items-center bg-[#1B2227] shadow-lg py-10 p-5 mb-12">
              {/* Avatar placeholder */}
              <div className="mb-2">
                <Avatar src={avatarUrl} size='md' />
              </div>
              <div className="text-white text-base font-semibold mb-1">{"@" + nickname}</div>
              <div className="flex justify-between w-full text-white text-sm mb-2 mt-5">
                <span>{totalTroops} TRUPPE TOTALI</span>
                <span>{ownedTerritories} TERRITORI</span>
              </div>
              <div className="w-full mt-3">
                  <div className="bg-[#FEC417] text-[#23282E] rounded-md py-2 px-3 text-center font-bold text-lg">
                    Carte
                  </div>
                </div>
            </Card>
          </div>

          {showEndGameModal && isGameOver && (
            <EndGameModal
              winnerID={winnerID}
              winnerName={winnerName}
              objective={winnerObjective}
              victoryType={victoryType}
              players={matchData?.players || []}
              onTimerComplete={handleEndGameTimerComplete}
            />
          )}
        </div>

      {/* MODALI */}
      {showAnimationModal && !isGameOver && (
        <BattleAnimationModal onComplete={handleAnimationComplete} />
      )}
      {showResultModal && !isGameOver && (
        <BattleResultModal onClose={handleResultClose} />
      )}
      {showAttackDiceModal && (
        <AttackDiceSelectionModal onClose={() => moves?.resetAttackSelection?.()} />
      )}
      {showFortifyModal && (
        <FortifyTroopsModal onClose={() => moves?.resetFortifySelection?.()} />
      )}
      
      {/* Modal di conferma uscita (back button) */}
      {showExitModal && (
        <Modal
          title="Abbandonare la partita?"
          size="md"
          preventClose={true}
          onClose={handleCancelExit}
          actionBar={
            <>
              <Button
                onClick={handleCancelExit}
                variant="outline"
                size="md"
                className="px-6 py-2"
              >
                Annulla
              </Button>
              <Button
                onClick={handleConfirmExit}
                variant="cyan"
                size="md"
                className="px-6 py-2 bg-red-600 hover:bg-red-700 border-0"
              >
                Esci
              </Button>
            </>
          }
        >
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              I tuoi territori rimarranno sulla mappa e il tuo turno verrà automaticamente saltato.
            </p>
            <p className="text-yellow-400 text-sm">
              ⚠️ Non potrai più rientrare in questa partita.
            </p>
          </div>
        </Modal>
      )}

    </div>
  );
}

// Il componente principale esportato
export function RiskBoard({ G, ctx, moves, playerID, events, isLobbyFull }) {
  return (
    <GameProvider G={G} ctx={ctx} moves={moves} playerID={playerID} events={events}>
      <RiskBoardContent />
    </GameProvider>
  );
}

export default RiskBoard;