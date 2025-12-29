// src/utils/getUser.js

export const getCurrentUser = () => {
  // 1. Controlla se abbiamo già un utente salvato nel browser
  const storedUser = localStorage.getItem('risk_user_guest');

  if (storedUser) {
    return JSON.parse(storedUser);
  }

  // 2. Se non esiste, creiamo un nuovo profilo "Ospite"
  const randomId = Math.floor(Math.random() * 10000);
  const newUser = {
    id: `guest_${Date.now()}_${randomId}`, // ID univoco basato sul tempo
    name: `Generale ${Math.floor(Math.random() * 1000)}`, // Es: Generale 458
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomId}` // Avatar coerente
  };

  // 3. Salviamo nel LocalStorage per le prossime volte
  localStorage.setItem('risk_user_guest', JSON.stringify(newUser));

  return newUser;
};
