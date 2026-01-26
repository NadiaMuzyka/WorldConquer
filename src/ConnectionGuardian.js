// src/components/ConnectionGuardian.js
import { useEffect, useRef } from 'react';
import { watchHeartbeat } from './firebase/presence';

/**
 * ConnectionGuardian - Monitora l'heartbeat del giocatore di turno (Logica "Sceriffo")
 * 
 * Sistema di monitoraggio distribuito dove SOLO il giocatore successivo nella sequenza
 * di gioco sorveglia quello corrente.
 * 
 * Usa un sistema di heartbeat (ping ogni 3s) per rilevare disconnessioni.
 * Se l'heartbeat è più vecchio di 7 secondi, considera il giocatore disconnesso
 * e chiama moves.reportPlayerDisconnected.
 * 
 * @param {Object} props.ctx - Contesto boardgame.io (playOrder, playOrderPos, currentPlayer)
 * @param {Object} props.moves - Moves boardgame.io (per reportPlayerDisconnected)
 * @param {string} props.playerID - ID del giocatore corrente (per determinare se sono il guardiano)
 * @param {Object} props.G - Game state (per accedere a hasLeft)
 * @param {string} props.matchID - ID della partita
 */
const ConnectionGuardian = ({ ctx, moves, playerID, G, matchID }) => {
  const disconnectTimerRef = useRef(null);
  
  useEffect(() => {
    // Validazione dati necessari
    if (!ctx?.currentPlayer || !ctx?.playOrder || !moves?.reportPlayerDisconnected || !matchID) {
      return;
    }

    const currentPlayerID = ctx.currentPlayer;

    // Logica "Sceriffo" - Solo il prossimo giocatore monitora
    const nextPlayerPos = (ctx.playOrderPos + 1) % ctx.playOrder.length;
    const nextPlayerID = ctx.playOrder[nextPlayerPos];
    
    // Se IO non sono il prossimo giocatore, NON devo monitorare
    if (String(playerID) !== String(nextPlayerID)) {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      return;
    }

    // Non monitorare noi stessi (non dovrebbe mai accadere con la logica dello sceriffo)
    if (currentPlayerID === playerID) {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      return;
    }

    // Non monitorare giocatori che hanno già abbandonato
    if (G?.hasLeft?.[currentPlayerID] === true) {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      return;
    }

    // Callback per gestire i cambiamenti di heartbeat
    const handleHeartbeatChange = ({ isAlive, age }) => {
      if (!isAlive) {
        // Il giocatore non invia più heartbeat - avvia timer se non già attivo
        if (!disconnectTimerRef.current) {
          console.log(`⚠️ Player ${currentPlayerID} non risponde - Timer 3s avviato`);
          
          disconnectTimerRef.current = setTimeout(() => {
            if (G?.hasLeft?.[currentPlayerID] !== true) {
              console.log(`❌ Player ${currentPlayerID} disconnesso - Rimozione dalla partita`);
              moves.reportPlayerDisconnected(currentPlayerID);
            }
            disconnectTimerRef.current = null;
          }, 5000);
        }
      } else {
        // Il giocatore è vivo - cancella il timer
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
      }
    };

    // Avvia il listener di heartbeat
    const unsubscribe = watchHeartbeat(matchID, currentPlayerID, handleHeartbeatChange);

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    };
  }, [ctx?.currentPlayer, matchID, moves, playerID, G?.hasLeft]);

  return null;
};

export default ConnectionGuardian;
