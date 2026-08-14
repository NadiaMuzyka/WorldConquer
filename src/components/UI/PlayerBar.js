import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRisk } from '../../context/GameContext';
import { PLAYER_COLORS } from '../Constants/colors';
import Button from './Button';
import { skipAnimation } from '../../store/slices/setupAnimationSlice';
import Avatar from './Avatar';
import { ArrowRight, Trophy } from 'lucide-react';

export default function PlayerBar({ secretObjective, playerCards = [], onShowCards }) {
    const { G, ctx, moves, playerID } = useRisk();
    const dispatch = useDispatch();
    const matchData = useSelector((state) => state.match?.data);

    const players = Array.from({ length: ctx.numPlayers }, (_, i) => String(i));
    const isReady = G.playersReady?.[playerID];
    const allReady = players.every(id => G.playersReady?.[id]);

    // Setup animation state
    const setupFinished = useSelector(state => state.setupAnimation.finished);
    const visibleCount = useSelector(state => state.setupAnimation.visibleCount);
    
    // Territori assegnati a me (per skipAnimation)
    const myTerritories = G.setupAssignmentOrder?.filter(
        countryId => G.owners[countryId] === playerID
    ) || [];
    
    const isAnimating = !setupFinished;

    // Fasi
    const phase = ctx?.phase;
    const isSetup = phase === 'SETUP_INITIAL';
    const isInitialReinforcement = phase === 'INITIAL_REINFORCEMENT';
    const isMyTurn = ctx?.currentPlayer === playerID;
    const currentPlayer = ctx.currentPlayer;
    const currentStage = ctx.activePlayers?.[ctx?.currentPlayer];

    // Reinforcement logic (usata anche in SetupBar e ReinforcementPanel)
    // Reinforcement logic (usata anche in SetupBar e ReinforcementPanel)
    const myReinforcements = G.reinforcementsRemaining?.[playerID] || 0;
    const turnPlacements = G.turnPlacements?.length || 0;
    // For INITIAL_REINFORCEMENT phase, logic must match ReinforcementPanel
    let maxTroopsThisTurn = 0;
    if (isInitialReinforcement) {
        // Only use myReinforcements if it's my turn, else 0 for safety
        const troopsForLogic = isMyTurn ? myReinforcements : 0;
        maxTroopsThisTurn = Math.min(3, troopsForLogic + turnPlacements);
    } else {
        maxTroopsThisTurn = Math.min(3, myReinforcements + turnPlacements);
    }
    const canEndTurn = isMyTurn && turnPlacements === maxTroopsThisTurn;

    // REINFORCEMENT: Mostra bottone solo se è il mio turno e ho truppe da piazzare
    const reinforcementsLeft = G.reinforcementsToPlace?.[currentPlayer] || 0;
    const canEndReinforcement = isMyTurn && reinforcementsLeft === 0;

    const handleButtonClick = () => {
        if (isInitialReinforcement && isMyTurn && canEndTurn && moves && typeof moves.endPlayerTurn === 'function') {
            moves.endPlayerTurn();
        } else if (currentStage === 'reinforcement' && moves?.endReinforcement) {
            moves.endReinforcement();
        } else if (currentStage === 'attack' && moves?.endAttackStage) {
            moves.endAttackStage();
        } else if (currentStage === 'strategicMovement' && moves?.skipFortify) {
            moves.skipFortify();
        }
    };

    
    // Testi e stati del bottone per ogni stage
    let buttonText = '';
    let showButton = false;
    let buttonEnabled = false;

    if (currentStage === 'reinforcement') {
        if (isMyTurn) {
            showButton = true;
            buttonEnabled = canEndReinforcement;
            buttonText = reinforcementsLeft > 0 
                ? `${reinforcementsLeft} TRUPPE DA POSIZIONARE` 
                : 'CONFERMA RINFORZI';
        }
    } else if (isInitialReinforcement) {
        if (isMyTurn) {
            showButton = true;
            buttonEnabled = canEndTurn;
            buttonText = canEndTurn
                ? 'Conferma Fine Turno'
                : `Piazza ancora ${maxTroopsThisTurn - turnPlacements}`;
        }
    } else if (currentStage === 'attack') {
        if (isMyTurn) {
            showButton = true;
            buttonEnabled = true;
            buttonText = 'TERMINA ATTACCO';
        }
    } else if (currentStage === 'strategicMovement') {
        if (isMyTurn) {
            showButton = true;
            buttonEnabled = true;
            buttonText = 'TERMINA TURNO';
        }
    }

    // Handler per "Avanti"
    const handleStartGame = () => {
        if (moves && moves.confirmSetupView) {
            moves.confirmSetupView();
        }
    };

    // Handler per "Salta animazione"
    const handleSkipAnimation = () => {
        dispatch(skipAnimation(myTerritories.length));
    };

    // Handler per fine turno rinforzo
    const handleEndTurn = () => {
        if (canEndTurn && moves && typeof moves.endPlayerTurn === 'function') {
            moves.endPlayerTurn();
        }
    };

    return (
        <div
            className="fixed left-4 bottom-4 md:left-6 md:bottom-6 lg:left-8 lg:bottom-8 z-20 flex flex-col items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-[#0b1622]/60 border border-white/20 rounded-3xl p-5 max-w-[calc(100vw-2rem)] overflow-hidden origin-bottom-left scale-[0.70] md:scale-75 lg:scale-75 xl:scale-[0.85] 2xl:scale-100 min-[1920px]:scale-125 transition-all duration-300"
        >
            {/* 1. SEZIONE INFO GIOCATORI */}
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 w-full">
                <div className="text-sm text-gray-200 font-extrabold uppercase tracking-widest mb-1 text-center drop-shadow-md">Giocatori</div>
                <div className="flex gap-5 justify-center">
                    {players.map((id, index) => {
                        const player = matchData?.players?.find(p => p.id === parseInt(id));
                        const avatarUrl = player?.photoURL || player?.avatar || `https://ui-avatars.com/api/?name=P${parseInt(id) + 1}&background=random`;
                        const nickname = player?.name || `Player${parseInt(id) + 1}`;
                        // G.hasLeft significa "uscito volontariamente, AFK o disconnesso" —
                        // non esiste alcuna funzione bot nel gioco, quindi il badge non deve dire "Bot".
                        const hasLeftGame = G.hasLeft?.[id] === true;
                        
                        // Calcola truppe e territori
                        const pTerritories = Object.values(G.owners || {}).filter(owner => owner === id).length;
                        const pTroops = Object.entries(G.owners || {}).filter(([key, owner]) => owner === id).map(([key]) => key).reduce((sum, territory) => sum + (G.troops?.[territory] ?? 0), 0);
                        
                        const isThisTurn = ctx.currentPlayer === id;
                        const isMe = id === playerID;

                        return (
                            <div key={index} className="flex flex-col items-center">
                                <div className={`relative rounded-full p-1 transition-all ${isThisTurn ? 'bg-[#38C7D7] shadow-[0_0_15px_rgba(56,199,215,0.5)]' : 'bg-transparent'}`}>
                                    <Avatar
                                        src={avatarUrl}
                                        alt={`Player ${parseInt(id) + 1}`}
                                        type="setupbar"
                                        id={id}
                                        playerID={playerID}
                                        ready={G.playersReady?.[id]}
                                        nickname={nickname}
                                        showHourglass={isSetup || (!isSetup && id === String(currentPlayer))}
                                    />
                                    {hasLeftGame && (
                                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg uppercase border border-white">
                                            Uscito
                                        </div>
                                    )}
                                </div>
                                <div className="mt-1 text-center">
                                    <div className="text-xs font-bold text-white flex justify-center gap-1">
                                        <span className="text-[#38C7D7]">{pTroops} ⚔️</span>
                                        <span className="text-[#FEC417]">{pTerritories} 🚩</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. SEZIONE PERSONALE (Carte e Obiettivo) */}
            <div className="flex flex-col justify-center items-center gap-4 border-b border-white/10 pb-5 w-full min-w-[150px]">
                <Button
                    variant="yellow"
                    size="md"
                    onClick={onShowCards}
                    className="w-full h-10 text-sm font-extrabold rounded-xl bg-[#FEC417] text-gray-900 hover:bg-[#e0ad15] shadow-lg border-0"
                >
                    Carte ({playerCards?.length || 0})
                </Button>
                
                {secretObjective && !isSetup && (
                    <div className="flex items-center gap-3 w-full justify-center px-2">
                        <Trophy className="w-8 h-8 text-[#FEC417] flex-shrink-0 drop-shadow-md" />
                        <div className="text-sm text-gray-100 font-bold leading-snug line-clamp-3 w-48 text-left drop-shadow-md">
                            {secretObjective}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. SEZIONE AZIONE PRINCIPALE */}
            <div className="flex items-center justify-center w-full min-w-[200px] pt-1">
                {isSetup ? (
                    !isReady ? (
                        isAnimating ? (
                            <Button
                                onClick={handleSkipAnimation}
                                variant="cyan"
                                size={null}
                                className="!h-[50px] w-full rounded-xl font-black text-sm tracking-wide px-4 uppercase shadow-[0_0_20px_rgba(56,199,215,0.4)]"
                            >
                                Salta Animazione
                            </Button>
                        ) : (
                            <Button
                                onClick={handleStartGame}
                                variant="cyan"
                                size={null}
                                className="!h-[50px] w-full rounded-xl font-black text-lg tracking-wide px-4 flex items-center justify-center gap-2 uppercase shadow-[0_0_20px_rgba(56,199,215,0.4)]"
                            >
                                AVANTI <ArrowRight />
                            </Button>
                        )
                    ) : (
                        <div className="text-center w-full">
                            <div className="text-[#38C7D7] font-bold text-sm uppercase tracking-wide">
                                {allReady ? 'PARTENZA...' : 'Attesa altri giocatori...'}
                            </div>
                            {!allReady && (
                                <div className="mt-2 flex justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#38C7D7]"></div>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    // GAME MODE
                    showButton ? (
                        <Button
                            onClick={handleButtonClick}
                            variant="cyan"
                            size={null}
                            disabled={!buttonEnabled}
                            className={`!h-[56px] w-[220px] rounded-xl font-black text-sm tracking-wide px-4 flex items-center justify-center gap-2 uppercase transition-all duration-300 ${buttonEnabled ? 'shadow-[0_0_20px_rgba(56,199,215,0.4)] scale-100 opacity-100' : 'opacity-50 grayscale scale-95'}`}
                        >
                            {buttonText} {buttonEnabled && <ArrowRight className="w-5 h-5" />}
                        </Button>
                    ) : (
                        <div className="text-center w-[220px]">
                            <div className="text-[#38C7D7] font-bold text-sm uppercase tracking-wide">
                                Turno di {matchData?.players?.[parseInt(currentPlayer)]?.name || `Player ${parseInt(currentPlayer) + 1}`}
                            </div>
                            <div className="mt-2 flex justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#38C7D7]"></div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
