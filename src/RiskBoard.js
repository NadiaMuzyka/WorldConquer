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
import CardsModal from './components/UI/CardsModal';
import GameChat from './components/UI/GameChat';
import PlayerBar from './components/UI/PlayerBar';
import SetupLogAnimated from './components/UI/SetupLogAnimated';
import Card from './components/UI/Card';
import { Trophy } from 'lucide-react';
import Avatar from './components/UI/Avatar';
import Modal from './components/UI/Modal';
import Button from './components/UI/Button';
import ConnectionGuardian from './ConnectionGuardian';
import { setUserOffline } from './firebase/presence';
import { useUserPresence } from './hooks/useUserPresence';
import { getGameUser } from './utils/getUser';

export function RiskBoardContent({ bgioMatchData, isMock = false }) {
  const { ctx, G, moves, playerID, chatMessages, sendChatMessage } = useRisk();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matchId } = useParams(); // Ottieni matchID dall'URL

  // Redux: ottieni i dati del match per recuperare i giocatori (fallback su bgioMatchData se in mock)
  const matchData = useSelector((state) => state.match?.data) || bgioMatchData;

  const [showAnimationModal, setShowAnimationModal] = React.useState(false);
  const [showResultModal, setShowResultModal] = React.useState(false);
  const [showEndGameModal, setShowEndGameModal] = React.useState(false);
  const [showExitModal, setShowExitModal] = React.useState(false); // Modal uscita volontaria
  const [showCardsModal, setShowCardsModal] = React.useState(false); // Modal carte bonus

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
  // NOTA: non si può leggere winnerPlayer?.secretObjective — PlayerView.STRIP_SECRETS
  // rimuove da G.players ogni entry che non sia la propria, quindi sarebbe undefined
  // per chiunque tranne il vincitore stesso. Il backend manda già l'obiettivo completo
  // (non protetto) dentro ctx.gameover.
  const winnerObjective = ctx?.gameover?.objectiveCompleted;
  const victoryType = ctx?.gameover?.victoryType || 'objective';
  const currentStage = ctx.activePlayers?.[ctx?.currentPlayer];
  const player = matchData?.players?.[playerID];
  const avatarUrl = player?.photoURL || player?.avatar || `https://ui-avatars.com/api/?name=P${parseInt(playerID) + 1}&background=random`;
  const nickname = player?.name || `Player${parseInt(playerID) + 1}`;
  
  // Recupera l'obiettivo segreto dal G
  const secretObjective = G?.players?.[playerID]?.secretObjective?.description || null;

  // Stato per l'utente autenticato
  const [currentUser, setCurrentUser] = React.useState(null);

  // Ascolta lo stato di autenticazione (salta se mock)
  React.useEffect(() => {
    if (isMock) return;
    const user = getGameUser();
    console.log('🛡️ [AUTH] Utente recuperato:', user?.uid || 'null');
    setCurrentUser(user);
  }, [isMock]);

  // Inizializza Firebase Presence usando l'hook dedicato (disabilitato se mock)
  useUserPresence(isMock ? null : currentUser, {
    currentMatchId: matchId,
    playerID: playerID,
    username: nickname,
    photoURL: avatarUrl
  });

  // NOTA: Il vecchio sistema di heartbeat Firebase è stato rimosso.
  // Il ConnectionGuardian v2 usa isConnected nativo di boardgame.io.

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

  // Il giocatore può scambiare carte solo durante il suo stage di reinforcement
  const canExchangeCards = isMyTurn && currentStage === 'reinforcement';
  
  // Ottieni le carte del giocatore corrente (protette da PlayerView)
  const playerCards = G?.players?.[playerID]?.cards || [];

  // Mostra modali basati sullo stato G - SOLO se è il mio turno
  const showAttackDiceModal = !isGameOver && isMyTurn && G?.attackState?.from && G?.attackState?.to && !G?.attackState?.attackDiceCount;
  const showFortifyModal = !isGameOver && isMyTurn && G?.fortifyState?.from && G?.fortifyState?.to;

  // Gestione dei modal di battaglia
  React.useEffect(() => {
    const hasBattleResult = G?.battleResult !== null && G?.battleResult !== undefined;
    // isMyTurn copre solo l'attaccante: senza questo, il difensore (e chiunque altro)
    // non vede mai i dadi/l'esito e il suo territorio cambia proprietario senza spiegazione.
    const isDefender = hasBattleResult && G.battleResult.originalDefenderOwner === playerID;
    const isInvolved = isMyTurn || isDefender;

    if (isGameOver) {
      setShowAnimationModal(false);
      setShowResultModal(false);
      return;
    }

    if (isInvolved && hasBattleResult) {
      // Se c'è un battleResult, mostra prima l'animazione
      setShowAnimationModal(true);
      setShowResultModal(false);
    } else if (!hasBattleResult) {
      // Se non c'è battleResult, nascondi entrambi i modal
      setShowAnimationModal(false);
      setShowResultModal(false);
    }
  }, [isMyTurn, playerID, G?.battleResult, isGameOver]);

  // Gestione del completamento dell'animazione
  const handleAnimationComplete = () => {
    setShowAnimationModal(false);
    setShowResultModal(true);
  };

  // Gestione della chiusura del risultato
  const handleResultClose = () => {
    setShowResultModal(false);
    // Solo l'attaccante può resettare lo stato (è l'unico nello stage 'attack' —
    // per il difensore, che vede il modal in sola lettura, questa mossa verrebbe
    // comunque rifiutata dal server). Il suo modal si chiude da solo non appena
    // l'attaccante resetta G.battleResult.
    if (isMyTurn && moves?.resetAttackSelection) {
      moves.resetAttackSelection();
    }
  };

  // Gestione scambio carte
  const handleExchangeCards = (cardIndices) => {
    if (moves?.exchangeCards && canExchangeCards) {
      moves.exchangeCards(cardIndices);
      console.log('🎴 [CARDS] Scambio carte:', cardIndices);
    }
  };

  // Gestione fine partita - rileva ctx.gameover
  React.useEffect(() => {
    if (ctx?.gameover) {
      console.log('🏆 [ENDGAME] Partita terminata! Vincitore:', ctx.gameover);
      console.log('🏆 [ENDGAME] ctx.gameover data:', JSON.stringify(ctx.gameover, null, 2));
      console.log('🏆 [ENDGAME] Setting showEndGameModal to true');
      setShowEndGameModal(true);
    } else {
      console.log('ℹ️ [ENDGAME MONITOR] ctx.gameover is falsy:', ctx?.gameover);
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

      {/* CONNECTION GUARDIAN v2 - Monitora disconnessioni via isConnected nativo */}
      <ConnectionGuardian 
        ctx={ctx} 
        moves={moves} 
        playerID={playerID} 
        G={G}
        matchData={bgioMatchData}
      />

      {/* MAPPA A SCHERMO INTERO */}
      <div className="absolute inset-0 z-0">
        <ZoomableMapContainer>
          <RiskMap />
        </ZoomableMapContainer>
      </div>

      {/* BARRA SOTTO DEL GIOCATORE (Nuovo Control Panel in basso a destra) */}
        <PlayerBar 
          secretObjective={secretObjective}
          playerCards={playerCards}
          onShowCards={() => setShowCardsModal(true)}
        />

        {isSetupPhase && <SetupLogAnimated />}



          {/* MESSAGGIO ISTRUZIONI (HUD BOTTOM CENTER) */}
          {(isMyTurn || isSetupPhase) && (
            <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none origin-bottom w-[90%] md:w-auto flex justify-center scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125">
              <div className="px-6 py-2 rounded-full backdrop-blur-md bg-[#FEC417]/95 border border-white/20 shadow-[0_4px_24px_rgba(254,196,23,0.4)] text-center">
                <span className="text-sm md:text-base font-extrabold text-gray-900 tracking-wide uppercase">
                  {isSetupPhase && 'Territori iniziali assegnati. Preparati!'}
                  {isReinforcementPhase && 'Piazza le tue truppe iniziali'}
                  {isGamePhase && currentStage === 'reinforcement' &&  'Piazza truppe sui tuoi territori'}
                  {isGamePhase && currentStage === 'attack' &&  'Clicca su un tuo territorio per attaccare da lì'}
                  {isGamePhase && currentStage === 'strategicMovement' &&  'Sposta truppe tra territori adiacenti'}
                  {!isSetupPhase && !isReinforcementPhase && !isGamePhase && 'In attesa...'}
                </span>
              </div>
            </div>
          )}

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

      {/* MODALI */}
      {showAnimationModal && !isGameOver && (
        <BattleAnimationModal onComplete={handleAnimationComplete} />
      )}

      {showCardsModal && (
        <CardsModal
          onClose={() => setShowCardsModal(false)}
          playerCards={playerCards}
          onExchangeCards={handleExchangeCards}
          canExchange={canExchangeCards}
        />
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

      {/* GAME CHAT - A destra della schermata */}
      <GameChat 
        chatMessages={chatMessages || []}
        sendChatMessage={sendChatMessage}
      />

    </div>
  );
}

// Il componente principale esportato
export function RiskBoard({ G, ctx, moves, playerID, events, isLobbyFull, chatMessages, sendChatMessage, matchData }) {
  return (
    <GameProvider G={G} ctx={ctx} moves={moves} playerID={playerID} events={events} chatMessages={chatMessages} sendChatMessage={sendChatMessage}>
      <RiskBoardContent bgioMatchData={matchData} />
    </GameProvider>
  );
}

export default RiskBoard;