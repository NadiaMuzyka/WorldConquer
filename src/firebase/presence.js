// src/firebase/presence.js
import { getDatabase, ref, set, onValue, onDisconnect, serverTimestamp, get, update } from "firebase/database";
import { app } from "./firebaseConfig";
import auth from "./auth";

const rtdb = getDatabase(app);

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
