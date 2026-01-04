// src/hooks/useUserPresence.js
import { useEffect, useRef } from 'react';
import { initializePresence, setUserOffline } from '../firebase/presence';

/**
 * Hook personalizzato per gestire automaticamente la presenza dell'utente
 * @param {Object} user - Oggetto utente da Firebase Auth
 * @param {Object} additionalData - Dati aggiuntivi da salvare (username, avatar, ecc.)
 */
export const useUserPresence = (user, additionalData = {}) => {
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) {
      // Se non c'è un utente, rimuovi eventuali listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Prepara i dati da salvare
    const presenceData = {
      username: additionalData.username || user.displayName || 'Utente',
      photoURL: additionalData.photoURL || user.photoURL || null,
      email: additionalData.email || user.email || null,
      ...additionalData
    };

    // Inizializza la presenza
    const unsubscribe = initializePresence(user.uid, presenceData);
    unsubscribeRef.current = unsubscribe;

    // Cleanup quando il componente viene smontato o l'utente cambia
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      // Imposta l'utente come offline quando smonta
      if (user?.uid) {
        setUserOffline(user.uid, presenceData);
      }
    };
  }, [user?.uid, additionalData.username, additionalData.photoURL]);
};

export default useUserPresence;
