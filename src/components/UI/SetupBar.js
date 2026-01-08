import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRisk } from '../../context/GameContext';
import { PLAYER_COLORS } from '../Constants/colors';
import Button from './Button';
import Card from './Card';
import Avatar from './Avatar';

export default function SetupBar() {
    const { G, ctx, moves, playerID } = useRisk();
    const matchData = useSelector((state) => state.match?.data);
    const [countdown, setCountdown] = useState(10);
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);

    const players = Array.from({ length: ctx.numPlayers }, (_, i) => String(i));
    const isReady = G.playersReady?.[playerID];
    const allReady = players.every(id => G.playersReady?.[id]);

    // Timer di 10 secondi
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setIsButtonEnabled(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Handler per il bottone
    const handleStartGame = () => {
        if (moves && moves.confirmSetupView) {
            moves.confirmSetupView();
        }
    };

    return (
        <Card
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 w-auto h-20] shadow-lg"
            padding="none"
        >
            <div className="flex items-center gap-20 h-full px-10 py-3">
                {/* Avatars dei giocatori */}
                <div className="flex items-center gap-4">{players.map((id, index) => {
                    const player = matchData?.players?.[index];
                    const avatarUrl = player?.photoURL || player?.avatar || `https://ui-avatars.com/api/?name=P${parseInt(id) + 1}&background=random`;

                    return (
                        <Avatar
                            key={id}
                            src={avatarUrl}
                            alt={`Player ${parseInt(id) + 1}`}
                            size="xs"
                            showName={false}
                            showNickname={false}
                            borderColor={PLAYER_COLORS[id]}
                            borderWidth={3}
                            showIndicator={id === playerID}
                            opacity={G.playersReady?.[id] ? 1 : 0.5}
                        />
                    );
                })}
            </div>

            {/* Bottone Start */}
            {!isReady ? (
                <Button
                    onClick={handleStartGame}
                    disabled={!isButtonEnabled}
                    variant={isButtonEnabled ? "cyan" : "gray"}
                    size={null}
                    className="!h-[44px] w-[180px] rounded-[25px] font-bold text-xl tracking-wide px-6"
                >
                    AVANTI
                </Button>
            ) : (
                <div className="text-center w-[180px]">
                    <div className="text-cyan-400 font-semibold mb-2">
                        {allReady ? 'PARTENZA...' : 'Attesa...'}
                    </div>
                    {!allReady && (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                        </div>
                    )}
                </div>
            )}
            </div>
        </Card>
    );
}
