import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRisk } from '../../context/GameContext';
import { PLAYER_COLORS } from '../Constants/colors';
import Button from './Button';
import { skipAnimation } from '../../store/slices/setupAnimationSlice';
import Card from './Card';
import Avatar from './Avatar';
import { ArrowRight } from 'lucide-react';

export default function SetupBar() {
    const { G, ctx, moves, playerID } = useRisk();
    const dispatch = useDispatch();
    const matchData = useSelector((state) => state.match?.data);

    const players = Array.from({ length: ctx.numPlayers }, (_, i) => String(i));
    const isReady = G.playersReady?.[playerID];
    const allReady = players.every(id => G.playersReady?.[id]);

    // Bottone "Avanti" abilitato solo quando animazione finita
    const setupFinished = useSelector(state => state.setupAnimation.finished);
    const visibleCount = useSelector(state => state.setupAnimation.visibleCount);

    // Territori assegnati a me (per skipAnimation)
    const myTerritories = G.setupAssignmentOrder?.filter(
        countryId => G.owners[countryId] === playerID
    ) || [];

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

    const isAnimating = !setupFinished;

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
                        return (
                            <Avatar
                                key={index}
                                src={avatarUrl}
                                alt={`Player ${parseInt(id) + 1}`}
                                type="setupbar"
                                id={id}
                                playerID={playerID}
                                ready={G.playersReady?.[id]}
                                nickname={nickname}
                            />
                        );
                    })}
                </div>

                {/* Bottone "Salta animazione" o "Avanti" */}
                {!isReady ? (
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
                            <ArrowRight/>
                        </Button>
                    )
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
