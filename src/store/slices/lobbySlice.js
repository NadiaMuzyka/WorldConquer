// src/store/slices/lobbySlice.js
import { createSlice } from '@reduxjs/toolkit';

const lobbySlice = createSlice({
  name: 'lobby',
  initialState: {
    games: [], // Qui arriveranno i dati da Firebase
    status: 'idle',
    filters: {
      playerRange: [3, 6],
      mode: 'tutte', 
      public: true, 
      private: false,      
      friends: false,       
    }
  },
  reducers: {
    // Aggiorna la lista quando il DB cambia
    syncMatches: (state, action) => {
      state.games = action.payload; 
      state.status = 'active';
    },
    setFilter: (state, action) => {
      const { name, value } = action.payload;
      state.filters[name] = value;
    },
    resetFilters: (state) => {
      state.filters = {
        playerRange: [3, 6],
        mode: 'tutte',
        public: true, 
        private: false,
        friends: false
      };
    },
    enterMatch: (state, action) => {
      state.currentMatchId = action.payload; // Salviamo l'ID della partita
    },
  },
});

// Esportiamo le azioni e il reducer
export const { setFilter, resetFilters, syncMatches, enterMatch} = lobbySlice.actions;
export const selectFilters = (state) => state.lobby.filters; 
export default lobbySlice.reducer;