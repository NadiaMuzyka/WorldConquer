import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  visibleCount: 0,
  finished: false,
};


const setupAnimationSlice = createSlice({
  name: 'setupAnimation',
  initialState,
  reducers: {
    incrementVisible(state) {
      state.visibleCount += 1;
    },
    resetVisible(state) {
      state.visibleCount = 0;
      state.finished = false;
    },
    setFinished(state, action) {
      state.finished = action.payload;
    },
    // Salta animazione: imposta visibleCount al massimo e finished a true
    skipAnimation(state, action) {
      state.visibleCount = action.payload; // deve essere myTerritories.length
      state.finished = true;
    }
  }
});

export const { incrementVisible, resetVisible, setFinished, skipAnimation } = setupAnimationSlice.actions;
export default setupAnimationSlice.reducer;
