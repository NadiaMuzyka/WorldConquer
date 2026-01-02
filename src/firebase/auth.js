// src/firebase/auth.js
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { app } from "./firebaseConfig";

const auth = getAuth(app);

/**
 * Mappa i codici di errore Firebase in messaggi user-friendly
 */
const getErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/invalid-email': 'Email non valida',
    'auth/user-disabled': 'Account disabilitato',
    'auth/user-not-found': 'Utente non trovato',
    'auth/wrong-password': 'Password errata',
    'auth/email-already-in-use': 'Email già registrata',
    'auth/weak-password': 'Password troppo debole (minimo 6 caratteri)',
    'auth/operation-not-allowed': 'Operazione non permessa',
    'auth/invalid-credential': 'Credenziali non valide',
    'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi',
    'auth/network-request-failed': 'Errore di connessione',
    'auth/popup-closed-by-user': 'Login annullato',
    'auth/cancelled-popup-request': 'Popup già aperto'
  };

  return errorMessages[errorCode] || 'Si è verificato un errore durante l\'autenticazione';
};

/**
 * Effettua il login di un utente con email e password
 * @param {string} email - Email dell'utente
 * @param {string} password - Password dell'utente
 * @returns {Promise<Object>} Oggetto con credenziali utente o errore
 */
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code
    };
  }
};

/**
 * Registra un nuovo utente con email e password
 * @param {string} email - Email dell'utente
 * @param {string} password - Password dell'utente
 * @returns {Promise<Object>} Oggetto con credenziali utente o errore
 */
export const register = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Registration error:', error.code, error.message);
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code
    };
  }
};


/**
 * Effettua il logout dell'utente corrente
 * @returns {Promise<Object>} Stato di successo o errore
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error.code, error.message);
    return {
      success: false,
      error: 'Errore durante il logout',
      errorCode: error.code
    };
  }
};

/**
 * Ascolta i cambiamenti dello stato di autenticazione
 * @param {Function} callback - Funzione callback da eseguire al cambio di stato
 * @returns {Function} Funzione per annullare la sottoscrizione
 */
export const onUserStateChange = (callback) => onAuthStateChanged(auth, callback);

/**
 * Effettua il login dell'utente con Google
 * @returns {Promise<Object>} Oggetto con credenziali utente o errore
 */
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Google login error:', error.code, error.message);
    return {
      success: false,
      error: getErrorMessage(error.code),
      errorCode: error.code
    };
  }
};

export default auth;
