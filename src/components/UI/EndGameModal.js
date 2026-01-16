import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { PLAYER_COLORS } from '../Constants/colors';

/**
 * EndGameModal - Mostra quando un giocatore ha vinto completando il suo obiettivo segreto
 * 
 * @param {string} winnerID - ID del giocatore vincitore
 * @param {string} winnerName - Nome del vincitore
 * @param {object} objective - L'obiettivo segreto completato { type, description, ... }
 * @param {array} players - Array di tutti i giocatori dal Redux match.players
 * @param {function} onTimerComplete - Callback chiamato dopo 10 secondi
 */
export default function EndGameModal({ 
  winnerID, 
  winnerName, 
  objective,
  players = [],
  onTimerComplete 
}) {
  const [countdown, setCountdown] = useState(10);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) {
      if (onTimerComplete) onTimerComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onTimerComplete]);

  // Trova il vincitore nell'array players per ottenere info aggiuntive
  const winner = players.find(p => String(p.id) === String(winnerID)) || {};
  const hasAvatarUrl =
    typeof winner.avatar === 'string' &&
    (winner.avatar.startsWith('http://') ||
      winner.avatar.startsWith('https://') ||
      winner.avatar.startsWith('data:'));
  const winnerColor = PLAYER_COLORS[winnerID] || '#38C7D7';
  
  return (
    <Modal 
      title="🏆 Partita Conclusa" 
      size="md" 
      preventClose={true}
      className="border-2 border-[#38C7D7]"
    >
      <div className="flex flex-col items-center text-center space-y-6">
        
        {/* Avatar e nome vincitore */}
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg border-4"
            style={{ 
              backgroundColor: winnerColor,
              borderColor: '#38C7D7'
            }}
          >
            {hasAvatarUrl ? (
              <img
                src={winner.avatar}
                alt={winnerName || winner.name || `Giocatore ${winnerID}`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              winner.avatar || '👑'
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {winnerName || winner.name || `Giocatore ${winnerID}`}
          </h2>
          <p className="text-[#38C7D7] text-lg font-semibold">
            ha vinto la partita!
          </p>
        </div>

        {/* Obiettivo completato */}
        <div className="bg-black/30 rounded-lg p-4 w-full border border-gray-700">
          <p className="text-gray-400 text-sm uppercase mb-2">Obiettivo Completato</p>
          <p className="text-white text-base leading-relaxed">
            {objective?.description || 'Obiettivo sconosciuto'}
          </p>
        </div>

        {/* Messaggio di reindirizzamento */}
        <div className="flex flex-col items-center space-y-2">
          <p className="text-gray-300 text-sm">
            Verrai reindirizzato alla lobby a breve...
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#38C7D7] flex items-center justify-center text-white font-bold animate-pulse">
              {countdown}
            </div>
            <span className="text-gray-400 text-xs">secondi</span>
          </div>
        </div>

        {/* Decorazione */}
        <div className="flex space-x-2 text-3xl opacity-50">
          <span>🎉</span>
          <span>🏆</span>
          <span>🎊</span>
        </div>
      </div>
    </Modal>
  );
}
