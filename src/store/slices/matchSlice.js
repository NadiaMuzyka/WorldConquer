// src/store/slices/matchSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const initialState = {
  data: null,      // I dati da Firestore (playersCurrent, playersMax, ecc.)
  loading: true,
  error: null,
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    setMatchData: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    setMatchError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearMatchData: (state) => {
      state.data = null;
      state.loading = true;
      state.error = null;
    },
  },
});

export const { setMatchData, setMatchError, clearMatchData } = matchSlice.actions;

// ✨ NUOVO: Thunk per centralizzare listener Firestore
export const subscribeToMatch = (matchId) => (dispatch) => {
  console.log(`[REDUX] Sottoscrizione Firestore per match ${matchId}`);
  
  const unsubscribe = onSnapshot(
    doc(db, 'matches', matchId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Serializza Timestamp Firestore per Redux
        if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
          data.createdAt = data.createdAt.toMillis();
        }
        
        console.log(`[REDUX] Match data aggiornato:`, { 
          status: data.status, 
          players: data.playersCurrent 
        });
        
        dispatch(setMatchData(data));
      } else {
        console.warn(`[REDUX] Match ${matchId} non trovato su Firestore`);
        dispatch(setMatchError('Partita non trovata'));
      }
    },
    (error) => {
      console.error(`[REDUX] Errore listener Firestore:`, error);
      dispatch(setMatchError(error.message));
    }
  );
  
  // Ritorna cleanup function
  return unsubscribe;
};

export default matchSlice.reducer;