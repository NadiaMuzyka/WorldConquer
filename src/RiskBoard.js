import React from 'react';
import { useNavigate } from 'react-router-dom';
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


export function RiskBoard({ G, ctx, moves, playerID, events, isLobbyFull }) {

  // Componente interno che usa il context
  function RiskBoardContent() {
    const { ctx, G, moves, playerID } = useRisk();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Redux: ottieni i dati del match per recuperare i giocatori
    const matchData = useSelector((state) => state.match?.data);
    
    const [showAnimationModal, setShowAnimationModal] = React.useState(false);
    const [showResultModal, setShowResultModal] = React.useState(false);
    const [showEndGameModal, setShowEndGameModal] = React.useState(false);
    
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
            onLeave={() => console.log("Abbandona")}
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


      </div>
    );
  }

  return (
    <GameProvider G={G} ctx={ctx} moves={moves} playerID={playerID} events={events}>
      <RiskBoardContent />
    </GameProvider>
  );
};

export default RiskBoard;