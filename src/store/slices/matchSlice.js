// src/store/slices/matchSlice.js
import { createSlice } from '@reduxjs/toolkit';

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
export default matchSlice.reducer;