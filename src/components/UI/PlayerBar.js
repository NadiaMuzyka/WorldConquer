import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRisk } from '../../context/GameContext';
import { PLAYER_COLORS } from '../Constants/colors';
import Button from './Button';
import { skipAnimation } from '../../store/slices/setupAnimationSlice';
import Card from './Card';
import Avatar from './Avatar';
import { ArrowRight } from 'lucide-react';

export default function PlayerBar() {
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
        <Card
            className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-auto h-auto shadow-lg"
            padding="none"
        >
            <div className="flex items-center gap-20 h-full px-10 py-3">
                {/* Avatars dei giocatori */}
                <div className="flex items-center gap-4">
                    {players.map((id, index) => {
                        // Trova il player corrispondente a questo ID in matchData
                        const player = matchData?.players?.find(p => p.id === parseInt(id));
                        const avatarUrl = player?.photoURL || player?.avatar || `https://ui-avatars.com/api/?name=P${parseInt(id) + 1}&background=random`;
                        const nickname = player?.name || `Player${parseInt(id) + 1}`;
                        
                        // Verifica se il player è un bot (ctx.hasLeft = true)
                        const isBot = ctx.hasLeft?.[id] === true;
                        
                        return (
                            <div key={index} className="relative">
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
                                
                                {/* Badge BOT AI */}
                                {isBot && (
                                    <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#1B2227] shadow-lg">
                                        🤖 BOT
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bottone o messaggio condizionale in base alla fase */}
                <div className="flex items-center">
                    {isSetup ? (
                        !isReady ? (
                            isAnimating ? (
                                <Button
                                    onClick={handleSkipAnimation}
                                    variant="cyan"
                                    size={null}
                                    className="!h-[44px] w-[220px] rounded-[25px] font-bold text-base tracking-wide px-6"
                                >
                                    SALTA ANIMAZIONE
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleStartGame}
                                    variant="cyan"
                                    size={null}
                                    className="!h-[44px] w-[180px] rounded-[25px] font-bold text-xl tracking-wide px-6 flex items-center justify-center gap-2"
                                >
                                    AVANTI
                                    <ArrowRight />
                                </Button>
                            )
                        ) : (
                            <div className="text-center w-[180px]">
                                <div className="text-cyan-400 font-semibold mb-2">
                                    {allReady ? 'PARTENZA...' : 'Attesa degli altri ...'}
                                </div>
                                {!allReady && (
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        // GAME: Bottone stage-specific o messaggio turno
                        showButton ? (
                            <Button
                                onClick={handleButtonClick}
                                variant="cyan"
                                size={null}
                                disabled={!buttonEnabled}
                                className="!h-[44px] w-[240px] rounded-[25px] font-bold text-base tracking-wide px-6 flex items-center justify-center gap-2"
                            >
                                {buttonText}
                                {buttonEnabled && <ArrowRight />}
                            </Button>
                        ) : (
                            <div className="text-center w-[240px]">
                                <div className="text-cyan-400 font-semibold mb-2">
                                    Turno di {matchData?.players?.[parseInt(currentPlayer)]?.name || `Player ${parseInt(currentPlayer) + 1}`}
                                </div>
                                <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </Card>
    );
}
