// src/components/ConnectionGuardian.js
import { useEffect, useRef } from 'react';

/**
 * ConnectionGuardian - Monitora la connessione del giocatore di turno (Logica "Sceriffo")
 * 
 * Legge la flag isConnected broadcastata nativamente da boardgame.io.
 * Se isConnected è false per più di 45 secondi, chiama reportPlayerDisconnected.
 * 
 * @param {Object} props.ctx - Contesto boardgame.io (playOrder, playOrderPos, currentPlayer)
 * @param {Object} props.moves - Moves boardgame.io (per reportPlayerDisconnected)
 * @param {string} props.playerID - ID del giocatore corrente (per determinare se sono il guardiano)
 * @param {Object} props.G - Game state (per accedere a hasLeft)
 * @param {string} props.matchID - ID della partita
 * @param {Object} props.matchData - Metadata della lobby con le flag isConnected
 */
const ConnectionGuardian = ({ ctx, moves, playerID, G, matchID, matchData }) => {
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

    // Trova il giocatore corrente nei metadati di boardgame.io
    const currentPlayerData = matchData?.players?.find(p => String(p.id) === String(currentPlayerID));
    
    // Se isConnected === false (vero e proprio drop di rete)
    if (currentPlayerData && currentPlayerData.isConnected === false) {
      if (!disconnectTimerRef.current) {
        console.log(`⚠️ Player ${currentPlayerID} ha chiuso la connessione - Timer 45s di tolleranza avviato!`);
        
        disconnectTimerRef.current = setTimeout(() => {
          if (G?.hasLeft?.[currentPlayerID] !== true) {
            console.log(`❌ Player ${currentPlayerID} disconnessione accertata - Espulsione dalla partita`);
            moves.reportPlayerDisconnected(currentPlayerID);
          }
          disconnectTimerRef.current = null;
        }, 45000); // 45 secondi di tolleranza
      }
    } else {
      // Se è online o torna online prima che finisca il timer, resetta il kick
      if (disconnectTimerRef.current) {
        console.log(`✅ Player ${currentPlayerID} tornato online - Timeout ConnectionGuardian cancellato`);
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    }

    // Cleanup
    return () => {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    };
  }, [ctx?.currentPlayer, matchID, moves, playerID, G?.hasLeft, matchData]);

  return null;
};

export default ConnectionGuardian;
