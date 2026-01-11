import React from 'react';
import { GameProvider, useRisk } from './context/GameContext';
import RiskMap from './components/Map/RiskMap';
import ZoomableMapContainer from './components/Map/ZoomableMapContainer';
import Navbar from './components/Navbar/Navbar';
import ReinforcementPanel from './components/UI/ReinforcementPanel';
import SetupBar from './components/UI/SetupBar';
import SetupLogAnimated from './components/UI/SetupLogAnimated';
import GameBar from './components/UI/GameBar';
import AttackDiceSelectionModal from './components/UI/AttackDiceSelectionModal';
import BattleResultModal from './components/UI/BattleResultModal';
import FortifyTroopsModal from './components/UI/FortifyTroopsModal';


export function RiskBoard({ G, ctx, moves, playerID, events, isLobbyFull }) {

  // Componente interno che usa il context
  function RiskBoardContent() {
    const { ctx, G, moves, playerID } = useRisk();
    const isSetupPhase = ctx?.phase === 'SETUP_INITIAL';
    const isReinforcementPhase = ctx?.phase === 'INITIAL_REINFORCEMENT';
    const isGamePhase = ctx?.phase === 'GAME';
    
    // Verifica se è il turno del giocatore corrente
    const isMyTurn = ctx?.currentPlayer === playerID;

    // Mostra modali basati sullo stato G - SOLO se è il mio turno
    const showAttackDiceModal = isMyTurn && G?.attackState?.from && G?.attackState?.to && !G?.attackState?.attackDiceCount;
    const showBattleResultModal = isMyTurn && G?.battleResult !== null && G?.battleResult !== undefined;
    const showFortifyModal = isMyTurn && G?.fortifyState?.from && G?.fortifyState?.to;

    // Debug log
    console.log('[RISKBOARD] G.attackState:', G?.attackState);
    console.log('[RISKBOARD] showAttackDiceModal:', showAttackDiceModal);
    console.log('[RISKBOARD] showBattleResultModal:', showBattleResultModal);
    console.log('[RISKBOARD] Stage corrente:', ctx?.activePlayers?.[playerID]);


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
          <div className="w-full h-full max-w-[1000px] mx-auto flex items-center justify-center p-4">
            <ZoomableMapContainer>
              <RiskMap />
            </ZoomableMapContainer>
          </div>

          {/* Barra Setup con giocatori e bottone start */}
          {isSetupPhase && <SetupBar />}
          {isSetupPhase && <SetupLogAnimated />}
          {isReinforcementPhase && (
            <div className="flex-shrink-0">
              <ReinforcementPanel />
            </div>
          )}
          {isGamePhase && <GameBar />}
        </div>

        {/* MODALI */}
        {showAttackDiceModal && (
          <AttackDiceSelectionModal onClose={() => moves?.resetAttackSelection?.()} />
        )}
        {showBattleResultModal && (
          <BattleResultModal onClose={() => {
            // Il battleResult viene resettato automaticamente quando si chiude il modal
            // Non serve fare nulla qui, il modal si chiuderà da solo dopo il timeout
          }} />
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