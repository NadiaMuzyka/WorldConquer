// src/utils/getUser.js
import { getCurrentUserProfile } from '../firebase/db';

/**
 * Recupera i dati del giocatore autenticato per l'uso nel gioco
 * @returns {Promise<Object>} Oggetto con id, name (nickname), avatar (photoURL)
 * @throws Reindirizza a /login se l'utente non è autenticato
 */
export const getGameUser = async () => {
  try {
    const result = await getCurrentUserProfile();
    
    if (!result.success) {
      console.error('Utente non autenticato:', result.error);
      window.location.href = '/login';
      throw new Error('Utente non autenticato');
    }

    const userData = result.data;
    
    return {
      id: userData.uid,
      name: userData.nickname || userData.email.split('@')[0], // Fallback al nome email se manca nickname
      avatar: userData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.uid}`
    };
  } catch (error) {
    console.error('Errore recupero dati utente:', error);
    window.location.href = '/login';
    throw error;
  }
};
