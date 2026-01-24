// src/components/ConnectionGuardian.js
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { watchUserPresence } from '../firebase/presence';

/**
 * ConnectionGuardian - Monitora la presenza del giocatore di turno
 * 
 * Questo componente sorveglia lo stato di presenza (online/offline) del giocatore
 * che ha il turno corrente. Se il giocatore va offline, avvia un timer di 15 secondi.
 * Se il timer scade e il giocatore è ancora offline, chiama automaticamente
 * moves.reportPlayerDisconnected per gestire la disconnessione.
 * 
 * @param {Object} props
 * @param {Object} props.ctx - Contesto Boardgame.io (per currentPlayer)
 * @param {Object} props.moves - Moves Boardgame.io (per reportPlayerDisconnected)
 * @param {string} props.playerID - ID del giocatore corrente (per evitare self-monitoring)
 * @param {Object} props.G - Game state (per accedere a hasLeft)
 */
const ConnectionGuardian = ({ ctx, moves, playerID, G }) => {
  const disconnectTimerRef = useRef(null);
  const currentPlayerUidRef = useRef(null);
  
  // Ottieni i dati del match da Redux per mappare playerID -> UID
  const matchData = useSelector((state) => state.match?.data);

  console.log(`🛡️ [GUARDIAN] 🔄 Render - currentPlayer: ${ctx?.currentPlayer}, myPlayer: ${playerID}`);

  useEffect(() => {
    console.log(`🛡️ [GUARDIAN] useEffect triggered - currentPlayer: ${ctx?.currentPlayer}, myPlayerID: ${playerID}`);
    
    // Se non abbiamo i dati necessari, non facciamo nulla
    if (!ctx?.currentPlayer || !matchData?.players || !moves?.reportPlayerDisconnected) {
      console.warn(`⚠️ [GUARDIAN] Dati mancanti - ctx.currentPlayer: ${!!ctx?.currentPlayer}, matchData.players: ${!!matchData?.players}, moves.reportPlayerDisconnected: ${!!moves?.reportPlayerDisconnected}`);
      return;
    }

    const currentPlayerID = ctx.currentPlayer;

    // NON monitorare noi stessi
    if (currentPlayerID === playerID) {
      console.log(`🛡️ [GUARDIAN] Skip monitoring - è il mio turno (Player ${playerID})`);
      // Pulizia eventuale timer se avevamo monitorato qualcun altro prima
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      return;
    }

    // NON monitorare giocatori che hanno già abbandonato
    // Usa una snapshot del valore hasLeft invece di G come dipendenza
    const hasLeftSnapshot = G?.hasLeft?.[currentPlayerID];
    if (hasLeftSnapshot === true) {
      console.log(`🛡️ [GUARDIAN] Player ${currentPlayerID} ha già abbandonato - skip monitoring`);
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      return;
    }

    // Trova l'UID del giocatore di turno
    const currentPlayerData = matchData.players.find(
      (p) => String(p.id) === String(currentPlayerID)
    );

    if (!currentPlayerData?.uid) {
      console.warn(`⚠️ [GUARDIAN] UID non trovato per player ${currentPlayerID}`, matchData.players);
      return;
    }

    const currentPlayerUid = currentPlayerData.uid;
    currentPlayerUidRef.current = currentPlayerUid;

    console.log(`🛡️ [GUARDIAN] ✅ Inizio monitoraggio presenza di Player ${currentPlayerID} (UID: ${currentPlayerUid})`);

    // Callback per gestire i cambiamenti di presenza
    const handlePresenceChange = (presenceData) => {
      const { state, lastSeen } = presenceData;

      console.log(`🛡️ [GUARDIAN] 📡 Presenza Player ${currentPlayerID} (UID: ${currentPlayerUid}): ${state}`, { lastSeen, presenceData });

      if (state === 'offline') {
        // Il giocatore è offline - avvia timer se non già attivo
        if (!disconnectTimerRef.current) {
          console.log(`⏱️ [GUARDIAN] ⏰ Player ${currentPlayerID} offline - avvio timer 15s`);
          
          disconnectTimerRef.current = setTimeout(() => {
            console.log(`⏰ [GUARDIAN] 🔔 Timer scaduto - Player ${currentPlayerID} ancora offline`);
            
            // Rileggi hasLeft al momento dell'esecuzione del timer
            // NON usare la closure, accedi direttamente a G
            const currentHasLeft = G?.hasLeft?.[currentPlayerID];
            console.log(`   ↳ hasLeft[${currentPlayerID}] al momento del timeout: ${currentHasLeft}`);
            console.log(`   ↳ moves.reportPlayerDisconnected disponibile: ${!!moves?.reportPlayerDisconnected}`);
            
            // Verifica che il giocatore non abbia già abbandonato nel frattempo
            if (currentHasLeft !== true) {
              console.log(`🔌 [GUARDIAN] 📞 Chiamata moves.reportPlayerDisconnected(${currentPlayerID})`);
              try {
                moves.reportPlayerDisconnected(currentPlayerID);
                console.log(`✅ [GUARDIAN] Move chiamata con successo`);
              } catch (error) {
                console.error(`❌ [GUARDIAN] Errore chiamata move:`, error);
              }
            } else {
              console.log(`🛡️ [GUARDIAN] ⚠️ Player ${currentPlayerID} ha già abbandonato - skip report`);
            }
            
            disconnectTimerRef.current = null;
          }, 15000); // 15 secondi
        } else {
          console.log(`⏱️ [GUARDIAN] Timer già attivo per Player ${currentPlayerID}`);
        }
      } else if (state === 'online') {
        // Il giocatore è tornato online - cancella il timer
        if (disconnectTimerRef.current) {
          console.log(`✅ [GUARDIAN] 🟢 Player ${currentPlayerID} tornato online - cancello timer`);
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
      }
    };

    // Avvia il listener di presenza
    console.log(`🛡️ [GUARDIAN] 🎧 Avvio listener presenza per UID ${currentPlayerUid}`);
    const unsubscribe = watchUserPresence(currentPlayerUid, handlePresenceChange);

    if (!unsubscribe) {
      console.error(`❌ [GUARDIAN] watchUserPresence non ha ritornato unsubscribe function!`);
    }

    // Cleanup quando il componente si smonta o currentPlayer cambia
    return () => {
      console.log(`🛡️ [GUARDIAN] 🧹 Cleanup monitoraggio Player ${currentPlayerID}`);
      
      // Rimuovi il listener
      if (unsubscribe) {
        unsubscribe();
        console.log(`   ↳ Listener rimosso`);
      }
      
      // Cancella il timer se attivo
      if (disconnectTimerRef.current) {
        console.log(`   ↳ Timer cancellato`);
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    };
  }, [ctx?.currentPlayer, matchData, moves, playerID]); // RIMOSSO G dalle dipendenze!

  // Questo componente non renderizza nulla
  return null;
};

export default ConnectionGuardian;
