// src/store/slices/lobbySlice.js
import { createSlice } from '@reduxjs/toolkit';

const lobbySlice = createSlice({
  name: 'lobby',
  initialState: {
    games: [],
    status: 'idle',
    filters: {
      playerRange: [3, 6], // Array [min, max] per lo Slider
      pubblic: true, 
      private: false,      
      friends: false,       
    }
  },
  reducers: {
    setFilter: (state, action) => {
      const { name, value } = action.payload;
      state.filters[name] = value;
    },
    resetFilters: (state) => {
      state.filters = {
        playerRange: [3, 6],
        public: true,
        private: false,
        friends: false
      };
    }
  }
});

export const { setFilter, resetFilters } = lobbySlice.actions;
export const selectFilters = (state) => state.lobby.filters; 
export default lobbySlice.reducer;