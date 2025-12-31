// src/firebase/auth.js
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import app from "./firebaseConfig";

const auth = getAuth(app);

/**
 * Maps Firebase error codes to user-friendly messages
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
 * Logs in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential object or error
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
 * Registers a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential object or error
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
 * Logs out the current user
 * @returns {Promise<Object>} Success status or error
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
export const onUserStateChange = (callback) => onAuthStateChanged(auth, callback);

/**
 * Logs in a user with Google
 * @returns {Promise<Object>} User credential object or error
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
