// src/ConnectionGuardian.js
import { useEffect, useRef, useCallback } from 'react';

/**
 * ConnectionGuardian v3.0 - Monitora disconnessioni di TUTTI i giocatori
 * 
 * Usa un approccio "timestamp di prima disconnessione" che SOPRAVVIVE ai cambi di turno.
 * Monitora tutti i giocatori (non solo il currentPlayer) per rilevare chi chiude la tab.
 * 
 * Logica "Sceriffo": Solo il prossimo giocatore attivo (non uscito) monitora ciascun target.
 */

const DISCONNECT_GRACE_PERIOD_MS = 45000; // 45 secondi di grazia
const CHECK_INTERVAL_MS = 5000; // Controlla ogni 5 secondi

const ConnectionGuardian = ({ ctx, moves, playerID, G, matchData }) => {
  // Mappa: playerID -> timestamp prima disconnessione rilevata
  const disconnectTimestamps = useRef({});
  const intervalRef = useRef(null);
  
  // Funzione per determinare se IO sono lo sceriffo di un dato giocatore
  const isSheriffOf = useCallback((targetPlayerID) => {
    if (!ctx?.playOrder || !G) return false;
    
    // Trova la posizione del target nel playOrder
    const targetPos = ctx.playOrder.indexOf(String(targetPlayerID));
    if (targetPos === -1) return false;
    
    // Il prossimo giocatore attivo (non uscito) dopo il target è lo sceriffo
    for (let i = 1; i < ctx.playOrder.length; i++) {
      const candidatePos = (targetPos + i) % ctx.playOrder.length;
      const candidateID = ctx.playOrder[candidatePos];
      if (!G?.hasLeft?.[candidateID]) {
        return String(playerID) === String(candidateID);
      }
    }
    return false;
  }, [ctx?.playOrder, playerID, G]);
  
  useEffect(() => {
    // Validazione
    if (!ctx?.playOrder || !moves?.reportPlayerDisconnected || !matchData) {
      return;
    }

    // Funzione di check periodico — controlla TUTTI i giocatori
    const checkConnections = () => {
      for (const targetID of ctx.playOrder) {
        // Non monitorare noi stessi
        if (String(targetID) === String(playerID)) continue;
        
        // Non monitorare giocatori già usciti
        if (G?.hasLeft?.[targetID] === true) continue;
        
        // Solo lo sceriffo di questo giocatore lo monitora
        if (!isSheriffOf(targetID)) continue;
        
        // Trova lo stato di connessione dal matchData nativo di boardgame.io
        const targetPlayerData = matchData?.find?.(p => String(p.id) === String(targetID));
        const isConnected = targetPlayerData?.isConnected ?? true;
        
        if (!isConnected) {
          // Giocatore disconnesso
          if (!disconnectTimestamps.current[targetID]) {
            // Prima rilevazione: registra il timestamp
            disconnectTimestamps.current[targetID] = Date.now();
            console.log(`🔌 [GUARDIAN] Player ${targetID} disconnesso - Timer ${DISCONNECT_GRACE_PERIOD_MS/1000}s avviato`);
          }
          
          // Controlla se il tempo di grazia è scaduto
          const elapsed = Date.now() - disconnectTimestamps.current[targetID];
          if (elapsed >= DISCONNECT_GRACE_PERIOD_MS) {
            console.log(`❌ [GUARDIAN] Player ${targetID} disconnesso da ${Math.floor(elapsed/1000)}s - Rimozione dalla partita`);
            
            // Pulisci il timestamp prima di kickare
            delete disconnectTimestamps.current[targetID];
            
            // Kick solo se non è già uscito (check di sicurezza)
            if (G?.hasLeft?.[targetID] !== true) {
              moves.reportPlayerDisconnected(targetID);
            }
          } else {
            console.log(`🔌 [GUARDIAN] Player ${targetID} ancora disconnesso - ${Math.floor(elapsed/1000)}s / ${DISCONNECT_GRACE_PERIOD_MS/1000}s`);
          }
        } else {
          // Giocatore connesso - se aveva un timer, cancellalo
          if (disconnectTimestamps.current[targetID]) {
            console.log(`✅ [GUARDIAN] Player ${targetID} tornato online - Timer cancellato`);
            delete disconnectTimestamps.current[targetID];
          }
        }
      }
    };
    
    // Check immediato
    checkConnections();
    
    // Check periodico ogni 5 secondi
    intervalRef.current = setInterval(checkConnections, CHECK_INTERVAL_MS);

    // Cleanup: ferma solo l'interval, NON cancellare i timestamp!
    // I timestamp sopravvivono ai cambi di turno intenzionalmente
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ctx?.currentPlayer, ctx?.playOrder, matchData, moves, playerID, G?.hasLeft, isSheriffOf, G]);

  return null;
};

export default ConnectionGuardian;
