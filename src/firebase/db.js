// src/firebase/db.js
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { app } from "./firebaseConfig";
import auth from "./auth";

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
    const user = auth.currentUser;
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

export default db;