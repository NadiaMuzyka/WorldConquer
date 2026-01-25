// src/firebase/presence.js
import { getDatabase, ref, set, onValue, onDisconnect, serverTimestamp, get, update } from "firebase/database";
import { app } from "./firebaseConfig";
import auth from "./auth";

const rtdb = getDatabase(app);

/**
 * HEARTBEAT - Invia un ping periodico per segnalare che il client è vivo
 * @param {string} matchID - ID della partita
 * @param {string} playerID - ID del giocatore
 * @returns {Function} Funzione di cleanup che ferma l'heartbeat
 */
export const startHeartbeat = (matchID, playerID) => {
  if (!matchID || playerID === undefined || playerID === null) {
    console.error('❤️ [HEARTBEAT] matchID o playerID mancante');
    return () => {};
  }

  const heartbeatRef = ref(rtdb, `heartbeats/${matchID}/${playerID}`);
  
  // Funzione per aggiornare l'heartbeat
  const sendHeartbeat = () => {
    set(heartbeatRef, {
      timestamp: Date.now(),
      playerID: String(playerID)
    }).catch(err => {
      console.error(`❤️ [HEARTBEAT] Errore invio ping Player ${playerID}:`, err);
    });
  };

  // Invia subito il primo heartbeat
  sendHeartbeat();
  console.log(`❤️ [HEARTBEAT] ✅ Avviato per Player ${playerID} in match ${matchID}`);

  // Imposta onDisconnect per pulizia automatica
  onDisconnect(heartbeatRef).remove();

  // Invia heartbeat ogni 5 secondi
  const intervalId = setInterval(sendHeartbeat, 5000);

  // Funzione di cleanup
  return () => {
    clearInterval(intervalId);
    set(heartbeatRef, null);
  };
};

/**
 * HEARTBEAT - Monitora l'heartbeat di un giocatore (con polling)
 * @param {string} matchID - ID della partita
 * @param {string} playerID - ID del giocatore da monitorare
 * @param {Function} callback - Callback chiamata periodicamente con lo stato
 * @returns {Function} Funzione per rimuovere il polling
 */
export const watchHeartbeat = (matchID, playerID, callback) => {
  if (!matchID || playerID === undefined || playerID === null) {
    console.error('❤️ [HEARTBEAT-WATCH] matchID o playerID mancante');
    return () => {};
  }

  const heartbeatRef = ref(rtdb, `heartbeats/${matchID}/${playerID}`);
  
  console.log(`❤️ [HEARTBEAT-WATCH] 👁️ Monitoring Player ${playerID} in match ${matchID}`);

  // Funzione per controllare l'heartbeat
  const checkHeartbeat = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const snapshot = await Promise.race([get(heartbeatRef), timeoutPromise]);
      const data = snapshot.val();
      
      console.log(`❤️ [HEARTBEAT-WATCH] 📩 Poll Player ${playerID}:`, data);
      
      if (!data || !data.timestamp) {
        // Nessun heartbeat → considera offline
        console.log(`❤️ [HEARTBEAT-WATCH] ⚰️ Player ${playerID} - NESSUN HEARTBEAT`);
        callback({
          isAlive: false,
          lastSeen: null,
          playerID: String(playerID)
        });
        return;
      }

      const now = Date.now();
      const age = now - data.timestamp;
      const isAlive = age < 8000; // Considerato vivo se heartbeat < 8s

      callback({
        isAlive,
        lastSeen: data.timestamp,
        age,
        playerID: String(playerID)
      });
    } catch (error) {
      console.error(`❤️ [HEARTBEAT-WATCH] Errore lettura Player ${playerID}:`, error.message);
    }
  };

  // Controlla subito
  checkHeartbeat();

  // Poll ogni 5 secondi
  const intervalId = setInterval(checkHeartbeat, 5000);

  // Funzione di cleanup
  return () => {
    clearInterval(intervalId);
  };
};

/**
 * Inizializza il sistema di presenza per l'utente corrente
 * Imposta l'utente come online e gestisce la disconnessione automatica
 * @param {string} uid - ID utente
 * @param {Object} additionalData - Dati aggiuntivi da salvare (es. username, avatar)
 * @returns {Function} Funzione per rimuovere i listener
 */
export const initializePresence = (uid, additionalData = {}) => {
  if (!uid) {
    console.error('UID mancante per inizializzare la presenza');
    return () => {};
  }

  const userStatusRef = ref(rtdb, `status/${uid}`);
  const userConnectionsRef = ref(rtdb, '.info/connected');

  // Dati da salvare quando l'utente è online
  const onlineData = {
    state: 'online',
    lastSeen: serverTimestamp(),
    ...additionalData
  };

  // Dati da salvare quando l'utente va offline
  const offlineData = {
    state: 'offline',
    lastSeen: serverTimestamp(),
    ...additionalData
  };

  // Listener per lo stato di connessione
  const unsubscribe = onValue(userConnectionsRef, (snapshot) => {
    if (snapshot.val() === false) {
      return; // Non connesso, non fare nulla
    }

    // Siamo connessi, impostiamo l'azione di disconnessione
    onDisconnect(userStatusRef)
      .set(offlineData)
      .then(() => {
        // Una volta impostata l'azione di disconnessione, impostiamo lo stato online
        set(userStatusRef, onlineData);
      });
  });

  return unsubscribe;
};

/**
 * Imposta manualmente l'utente come offline
 * @param {string} uid - ID utente
 * @param {Object} additionalData - Dati aggiuntivi
 */
export const setUserOffline = async (uid, additionalData = {}) => {
  if (!uid) return;

  const userStatusRef = ref(rtdb, `status/${uid}`);
  await set(userStatusRef, {
    state: 'offline',
    lastSeen: serverTimestamp(),
    ...additionalData
  });
};

/**
 * Ottiene lo stato di presenza di un singolo utente
 * @param {string} uid - ID utente
 * @returns {Promise<Object>} Stato di presenza dell'utente
 */
export const getUserPresence = async (uid) => {
  try {
    const userStatusRef = ref(rtdb, `status/${uid}`);
    const snapshot = await get(userStatusRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    } else {
      return { 
        success: false, 
        error: 'Stato di presenza non trovato',
        data: { state: 'offline', lastSeen: null }
      };
    }
  } catch (error) {
    console.error('Errore nel recupero dello stato di presenza:', error);
    return { 
      success: false, 
      error: 'Errore durante il recupero dello stato',
      data: { state: 'offline', lastSeen: null }
    };
  }
};

/**
 * Monitora lo stato di presenza di un utente in tempo reale
 * @param {string} uid - ID utente
 * @param {Function} callback - Funzione chiamata quando lo stato cambia
 * @returns {Function} Funzione per rimuovere il listener
 */
export const watchUserPresence = (uid, callback) => {
  if (!uid || !callback) {
    console.error('UID o callback mancanti');
    return () => {};
  }

  const userStatusRef = ref(rtdb, `status/${uid}`);
  
  return onValue(userStatusRef, (snapshot) => {
    const data = snapshot.exists() 
      ? snapshot.val() 
      : { state: 'offline', lastSeen: null };
    
    callback(data);
  });
};

/**
 * Monitora lo stato di presenza di più utenti contemporaneamente
 * @param {string[]} uids - Array di ID utente
 * @param {Function} callback - Funzione chiamata quando uno stato cambia
 * @returns {Function} Funzione per rimuovere tutti i listener
 */
export const watchMultipleUsersPresence = (uids, callback) => {
  if (!uids || !Array.isArray(uids) || uids.length === 0) {
    console.error('Array di UIDs non valido');
    return () => {};
  }

  const unsubscribers = uids.map(uid => {
    return watchUserPresence(uid, (presenceData) => {
      callback(uid, presenceData);
    });
  });

  // Ritorna una funzione che rimuove tutti i listener
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

/**
 * Ottiene tutti gli utenti online
 * @returns {Promise<Object>} Lista di utenti online
 */
export const getOnlineUsers = async () => {
  try {
    const statusRef = ref(rtdb, 'status');
    const snapshot = await get(statusRef);
    
    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    const allStatuses = snapshot.val();
    const onlineUsers = [];

    Object.entries(allStatuses).forEach(([uid, status]) => {
      if (status.state === 'online') {
        onlineUsers.push({ uid, ...status });
      }
    });

    return { success: true, data: onlineUsers };
  } catch (error) {
    console.error('Errore nel recupero degli utenti online:', error);
    return { 
      success: false, 
      error: 'Errore durante il recupero degli utenti online',
      data: []
    };
  }
};

/**
 * Aggiorna i dati di presenza senza cambiare lo stato online/offline
 * Utile per aggiornare username, avatar, ecc.
 * @param {string} uid - ID utente
 * @param {Object} updates - Dati da aggiornare
 */
export const updatePresenceData = async (uid, updates) => {
  if (!uid) return;

  const userStatusRef = ref(rtdb, `status/${uid}`);
  
  try {
    await update(userStatusRef, {
      ...updates,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dei dati di presenza:', error);
  }
};
