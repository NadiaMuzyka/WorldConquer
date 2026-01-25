
// src/firebase/db.js
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { app, auth } from "./firebaseConfig";
import { onAuthStateChanged, deleteUser } from "firebase/auth";

const db = getFirestore(app);

  // ===========================================================================
  // AUTENTICAZIONE UTENTE
  // ===========================================================================

/**
 * Salva i dati utente su Firestore
 * @param {string} uid - ID univoco dell'utente Firebase
 * @param {Object} userData - Dati utente da salvare
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export const saveUserData = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving user data:', error.code, error.message);
    return { 
      success: false, 
      error: 'Errore durante il salvataggio dei dati utente',
      errorCode: error.code 
    };
  }
};

/**
 * Ottiene i dati utente da Firestore
 * @param {string} uid - ID univoco dell'utente Firebase
 * @returns {Promise<Object>} Dati utente o errore
 */
export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'Utente non trovato' };
    }
  } catch (error) {
    console.error('Error getting user data:', error.code, error.message);
    return { 
      success: false, 
      error: 'Errore durante il recupero dei dati utente',
      errorCode: error.code 
    };
  }
};

/**
 * Aggiorna i dati utente su Firestore
 * @param {string} uid - ID univoco dell'utente Firebase
 * @param {Object} updates - Dati da aggiornare
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export const updateUserData = async (uid, updates) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user data:', error.code, error.message);
    return { 
      success: false, 
      error: 'Errore durante l\'aggiornamento dei dati utente',
      errorCode: error.code 
    };
  }
};

/**
 * Ottiene il profilo completo dell'utente corrente
 * Include dati da Auth e da Firestore
 * @returns {Promise<Object>} Profilo utente completo o errore
 */
export const getCurrentUserProfile = async () => {
  try {
    //const user = auth.currentUser;

    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) {
      return { success: false, error: 'Utente non autenticato' };
    }

    const result = await getUserData(user.uid);
    if (!result.success) {
      return result;
    }

    // Determina se è un utente Google
    const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');

    return {
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        isGoogleUser,
        ...result.data
      }
    };
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return {
      success: false,
      error: 'Errore durante il recupero del profilo',
      errorCode: error.code
    };
  }
};

/**
 * Aggiorna il profilo dell'utente corrente
 * @param {Object} updates - Dati da aggiornare
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export const updateCurrentUserProfile = async (updates) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Utente non autenticato' };
    }

    return await updateUserData(user.uid, updates);
  } catch (error) {
    console.error('Error updating current user profile:', error);
    return {
      success: false,
      error: 'Errore durante l\'aggiornamento del profilo',
      errorCode: error.code
    };
  }
};

/**
 * Aggiorna l'avatar dell'utente corrente
 * @param {string} photoURL - URL della nuova foto profilo
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export const updateCurrentUserAvatar = async (photoURL) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Utente non autenticato' };
    }

    return await updateUserData(user.uid, { photoURL });
  } catch (error) {
    console.error('Error updating current user avatar:', error);
    return {
      success: false,
      error: 'Errore durante l\'aggiornamento dell\'avatar',
      errorCode: error.code
    };
  }
};

  // ===========================================================================
  // GESTIONE LOBBY
  // ===========================================================================

// Example: Create a new lobby
export const createLobby = async (lobbyData) => {
  const lobbiesCol = collection(db, "lobbies");
  const docRef = await addDoc(lobbiesCol, lobbyData);
  return docRef.id;
};

// Example: Get a lobby by ID
export const getLobbyById = async (id) => {
  const docRef = doc(db, "lobbies", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

  // ===========================================================================
  // GESTIONE AMICI
  // ===========================================================================

/**
 * Aggiunge un amico alla lista dell'utente
 * @param {string} userId - ID dell'utente che aggiunge l'amico
 * @param {string} friendId - ID dell'amico da aggiungere
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export const addFriend = async (userId, friendId) => {
  try {
    if (!userId || !friendId) {
      return { success: false, error: 'ID utente o amico mancante' };
    }

    if (userId === friendId) {
      return { success: false, error: 'Non puoi aggiungere te stesso come amico' };
    }

    // Crea il documento dell'amicizia
    const friendshipRef = doc(db, "friendships", `${userId}_${friendId}`);
    await setDoc(friendshipRef, {
      userId,
      friendId,
      createdAt: new Date().toISOString(),
      status: 'active'
    });

    // Crea anche il documento inverso per query bidirezionali
    const inverseFriendshipRef = doc(db, "friendships", `${friendId}_${userId}`);
    await setDoc(inverseFriendshipRef, {
      userId: friendId,
      friendId: userId,
      createdAt: new Date().toISOString(),
      status: 'active'
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding friend:', error);
    return { 
      success: false, 
      error: 'Errore durante l\'aggiunta dell\'amico',
      errorCode: error.code 
    };
  }
};

/**
 * Rimuove un amico dalla lista dell'utente
 * @param {string} userId - ID dell'utente che rimuove l'amico
 * @param {string} friendId - ID dell'amico da rimuovere
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export const removeFriend = async (userId, friendId) => {
  try {
    if (!userId || !friendId) {
      return { success: false, error: 'ID utente o amico mancante' };
    }

    // Rimuove entrambi i documenti dell'amicizia
    const friendshipRef = doc(db, "friendships", `${userId}_${friendId}`);
    await deleteDoc(friendshipRef);

    const inverseFriendshipRef = doc(db, "friendships", `${friendId}_${userId}`);
    await deleteDoc(inverseFriendshipRef);

    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { 
      success: false, 
      error: 'Errore durante la rimozione dell\'amico',
      errorCode: error.code 
    };
  }
};

/**
 * Ottiene la lista degli amici di un utente
 * @param {string} userId - ID dell'utente
 * @returns {Promise<Object>} Lista degli amici con i loro dati
 */
export const getUserFriends = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'ID utente mancante', data: [] };
    }

    // Query per trovare tutte le amicizie dell'utente
    const friendshipsRef = collection(db, "friendships");
    const q = query(friendshipsRef, where("userId", "==", userId), where("status", "==", "active"));
    const querySnapshot = await getDocs(q);

    // Ottieni i dati completi di ogni amico
    const friendsPromises = querySnapshot.docs.map(async (friendshipDoc) => {
      const friendship = friendshipDoc.data();
      const friendData = await getUserData(friendship.friendId);
      
      return {
        uid: friendship.friendId,
        friendshipId: friendshipDoc.id,
        addedAt: friendship.createdAt,
        ...friendData.data
      };
    });

    const friends = await Promise.all(friendsPromises);

    return { success: true, data: friends };
  } catch (error) {
    console.error('Error getting user friends:', error);
    return { 
      success: false, 
      error: 'Errore durante il recupero degli amici',
      errorCode: error.code,
      data: []
    };
  }
};

/**
 * Controlla se due utenti sono amici
 * @param {string} userId - ID del primo utente
 * @param {string} friendId - ID del secondo utente
 * @returns {Promise<Object>} Risultato del controllo
 */
export const areFriends = async (userId, friendId) => {
  try {
    if (!userId || !friendId) {
      return { success: false, areFriends: false };
    }

    const friendshipRef = doc(db, "friendships", `${userId}_${friendId}`);
    const friendshipSnap = await getDoc(friendshipRef);

    return { 
      success: true, 
      areFriends: friendshipSnap.exists() && friendshipSnap.data().status === 'active'
    };
  } catch (error) {
    console.error('Error checking friendship:', error);
    return { 
      success: false, 
      areFriends: false,
      error: 'Errore durante il controllo dell\'amicizia'
    };
  }
};

/**
 * Cerca utenti per username o email
 * @param {string} searchTerm - Termine di ricerca
 * @param {number} limit - Numero massimo di risultati (default: 10)
 * @returns {Promise<Object>} Lista degli utenti trovati
 */
export const searchUsers = async (searchTerm, limit = 10) => {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return { success: false, error: 'Termine di ricerca troppo corto', data: [] };
    }

    const usersRef = collection(db, "users");
    
    // Cerca per username (case-insensitive usando startAt/endAt)
    const searchTermLower = searchTerm.toLowerCase();
    const q = query(
      usersRef,
      where("usernameLower", ">=", searchTermLower),
      where("usernameLower", "<=", searchTermLower + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs
      .slice(0, limit)
      .map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));

    return { success: true, data: users };
  } catch (error) {
    console.error('Error searching users:', error);
    return { 
      success: false, 
      error: 'Errore durante la ricerca degli utenti',
      errorCode: error.code,
      data: []
    };
  }
};

/**
 * Elimina l'account utente (Firebase Auth + Firestore)
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export const deleteUserAccount = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: 'Utente non autenticato' };
    }

    const uid = currentUser.uid;

    // 1. Elimina i dati Firestore
    try {
      const userRef = doc(db, "users", uid);
      await deleteDoc(userRef);
    } catch (firestoreError) {
      console.error('Error deleting Firestore data:', firestoreError);
      // Continua comunque con l'eliminazione dell'account Firebase
    }

    // 2. Elimina l'account Firebase Auth
    await deleteUser(currentUser);

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    
    // Se l'errore è auth/requires-recent-login, l'utente deve riautenticarsi
    if (error.code === 'auth/requires-recent-login') {
      return { 
        success: false, 
        error: 'Per eliminare l\'account, devi prima effettuare nuovamente il login per motivi di sicurezza.'
      };
    }
    
    return { 
      success: false, 
      error: 'Errore durante l\'eliminazione dell\'account',
      errorCode: error.code 
    };
  }
};

  // ===========================================================================
  // STATISTICHE PARTITE
  // ===========================================================================

/**
 * Recupera tutte le partite FINISHED dove l'utente ha partecipato
 * @param {string} uid - ID Firebase dell'utente
 * @returns {Promise<Array>} Lista partite
 */
export const getUserFinishedMatches = async (uid) => {
  try {
    const matchesCol = collection(db, "matches");
    // Prende solo le partite FINISHED
    const q = query(matchesCol, where("status", "==", "FINISHED"));
    const querySnapshot = await getDocs(q);
    // Filtra solo quelle dove l'utente è tra i players
    const matches = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(match => Array.isArray(match.players) && match.players.some(p => p && (p.uid === uid || p.id === uid || p.name === uid)));
    return matches;
  } catch (error) {
    console.error('Errore getUserFinishedMatches:', error);
    return [];
  }
};

/**
 * Recupera tutte le partite FINISHED (per statistiche globali)
 * @returns {Promise<Array>} Lista partite
 */
export const getAllFinishedMatches = async () => {
  try {
    const matchesCol = collection(db, "matches");
    const q = query(matchesCol, where("status", "==", "FINISHED"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Errore getAllFinishedMatches:', error);
    return [];
  }
};

export default db;


