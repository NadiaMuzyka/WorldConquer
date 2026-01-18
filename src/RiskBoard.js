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
import Modal from './components/UI/Modal';
import Button from './components/UI/Button';

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
  
  // Recupera l'obiettivo segreto dal G
  const secretObjective = G?.players?.[playerID]?.secretObjective?.description || null;

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
    console.log('[RISKBOARD] Uscita confermata - chiamo BoardGame.io leave');
    
    // Ottieni matchID da useParams
    if (!matchId) {
      console.error('[RISKBOARD] MatchID non trovato in URL');
      dispatch(clearMatchData());
      navigate('/lobby', { replace: true });
      return;
    }
    
    console.log(`[RISKBOARD] MatchID da URL: ${matchId}`);
    
    try {
      // Recupera credentials da sessionStorage (salvate da WaitingPage)
      const credentialsKey = `credentials_${matchId}_${playerID}`;
      const credentials = sessionStorage.getItem(credentialsKey);
      
      if (!credentials) {
        console.warn('[RISKBOARD] Credentials non trovate in sessionStorage');
      }
      
      console.log(`[RISKBOARD] Chiamata leave per match ${matchId}, player ${playerID}`);
      
      // Usa l'endpoint nativo di BoardGame.io per leave
      const response = await fetch(`http://localhost:8000/games/risk/${matchId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerID: playerID,
          credentials: credentials || 'fallback-credentials',
        }),
      });
      
      if (!response.ok) {
        console.error('[RISKBOARD] Errore leave:', await response.text());
      } else {
        console.log('[RISKBOARD] Leave completato con successo');
        // Rimuovi credentials dopo leave
        sessionStorage.removeItem(credentialsKey);
      }
      
    } catch (error) {
      console.error('[RISKBOARD] Errore chiamata leave:', error);
    }
    
    // Cleanup e naviga alla lobby
    dispatch(clearMatchData());
    navigate('/lobby', { replace: true });
  };
  
  // Handler per annullare uscita
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

      {/*Layout standard full-width per altre fasi*/}
      <div className="w-full flex justify-center items-center z-15 h-[calc(100vh-180px)] mt-16">
        <div className="w-full h-full lg:max-w-[65%] mx-auto flex items-center justify-center p-4">
          <ZoomableMapContainer>
            <RiskMap />
          </ZoomableMapContainer>
        </div>

        {/* BARRA SOTTO DEL GIOCATORE */}
        <PlayerBar />

        {isSetupPhase && <SetupLogAnimated />}

        {/* Card obiettivo segreto: in basso a sinistra, fuori dalla fase di setup */}
        {!isSetupPhase && secretObjective && (
          <div className="fixed left-8 bottom-6 z-30">
            <Card className="w-[320px] h-[98px] flex flex-col justify-center bg-[#1B2227] border-l-4 border-yellow-400 shadow-lg py-1">
              <div className="flex items-center gap-3">
                <span className="text-3xl text-yellow-400">🏆</span>
                <span className="text-lg font-bold text-yellow-400">IL TUO OBIETTIVO</span>
              </div>
              <div className="mt-1 text-base text-white">{secretObjective}</div>
            </Card>
          </div>
        )}

        {showEndGameModal && isGameOver && (
          <EndGameModal
            winnerID={winnerID}
            winnerName={winnerName}
            objective={winnerObjective}
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
              Se esci dalla partita, verrai sostituito da un Bot AI.
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
};

export default RiskBoard;