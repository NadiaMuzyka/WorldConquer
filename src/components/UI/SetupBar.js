import React from 'react';
import { useRisk } from '../../context/GameContext';
import { PLAYER_COLORS } from '../Constants/colors';
import Button from './Button';
import Card from './Card';
import Avatar from './Avatar';

export default function SetupBar() {
    const { G, ctx, moves, playerID } = useRisk();

    const players = Array.from({ length: ctx.numPlayers }, (_, i) => String(i));
    
    // Verifica se tutti i giocatori sono connessi controllando playersData
    const allConnected = players.every(id => ctx.playersData?.[id]);

    const handleStartGame = () => {
        moves.confirmSetupView();
    };

    return (
        <Card
            className="fixed bottom-[32px] left-1/2 -translate-x-1/2 z-20"
            padding="none"
            style={{
                width: '1200px',
                minWidth: '1200px',
                height: '120px',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
                padding: '0 60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
        >
            {/* Avatars dei giocatori */}
            <div className="flex items-center gap-6">
                {players.map((id) => {
                    const playerData = ctx.playersData?.[id];
                    const avatarUrl = playerData?.photoURL || `https://ui-avatars.com/api/?name=P${parseInt(id) + 1}&background=random`;

                    return (
                        <Avatar
                            key={id}
                            src={avatarUrl}
                            alt={`Player ${parseInt(id) + 1}`}
                            size="md"
                            showName={false}
                            showNickname={false}
                            borderColor={PLAYER_COLORS[id]}
                            borderWidth={5}
                            showIndicator={id === playerID}
                            opacity={allConnected ? 1 : (ctx.playersData?.[id] ? 1 : 0.5)}
                        />
                    );
                })}
            </div>

            {/* Bottone Start */}
            {!allConnected ? (
                <div className="text-center" style={{ width: '280px' }}>
                    <div className="text-cyan-400 font-semibold mb-2">
                        In attesa degli altri giocatori...
                    </div>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                    </div>
                </div>
            ) : (
                <Button
                    onClick={handleStartGame}
                    variant="yellow"
                    className="h-[48px] rounded-[25px] font-bold text-xl tracking-wide"
                    style={{
                        width: '280px',
                        letterSpacing: '0.2px'
                    }}
                >
                    COMINCIA LA PARTITA
                </Button>
            )}
        </Card>
    );
}
