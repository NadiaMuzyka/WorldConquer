import React from 'react';
import { useSelector } from 'react-redux';
import { useRisk } from '../../context/GameContext';
import Button from './Button';
import Card from './Card';
import Avatar from './Avatar';
import { ArrowRight } from 'lucide-react';

export default function GameBar() {
    const { G, ctx, moves, playerID } = useRisk();
    const matchData = useSelector((state) => state.match?.data);

    // Determina se siamo nella fase GAME
    if (ctx?.phase !== 'GAME') return null;

    const currentPlayer = ctx.currentPlayer;
    const isMyTurn = currentPlayer === playerID;
    const currentStage = ctx.activePlayers?.[currentPlayer];

    const players = Array.from({ length: ctx.numPlayers }, (_, i) => String(i));

    // REINFORCEMENT: Mostra bottone solo se è il mio turno e ho truppe da piazzare
    const reinforcementsLeft = G.reinforcementsToPlace?.[currentPlayer] || 0;
    const canEndReinforcement = isMyTurn && reinforcementsLeft === 0;

    // ATTACK: Bottone sempre disponibile per il giocatore di turno
    const canEndAttack = isMyTurn && currentStage === 'attack';

    // STRATEGIC_MOVEMENT: Bottone sempre disponibile per il giocatore di turno
    const canSkipFortify = isMyTurn && currentStage === 'strategicMovement';

    const handleButtonClick = () => {
        if (currentStage === 'reinforcement' && moves?.endReinforcement) {
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

    return (
        <Card
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-auto h-auto shadow-lg"
            padding="none"
        >
            <div className="flex items-center gap-20 h-full px-10 py-3">
                {/* Avatars dei giocatori */}
                <div className="flex items-center gap-4">
                    {players.map((id, index) => {
                        const player = matchData?.players?.[index];
                        const avatarUrl = player?.photoURL || player?.avatar || `https://ui-avatars.com/api/?name=P${parseInt(id) + 1}&background=random`;
                        const nickname = player?.name || `Player${parseInt(id) + 1}`;
                        const isActive = id === currentPlayer;
                        
                        return (
                            <Avatar
                                key={index}
                                src={avatarUrl}
                                alt={`Player ${parseInt(id) + 1}`}
                                type="setupbar"
                                id={id}
                                playerID={currentPlayer}
                                ready={isActive}
                                nickname={nickname}
                            />
                        );
                    })}
                </div>

                {/* Bottone stage-specific */}
                {showButton ? (
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
                )}
            </div>
        </Card>
    );
}
