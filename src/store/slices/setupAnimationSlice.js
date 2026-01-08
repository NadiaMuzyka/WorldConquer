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
    }
  }
});

export const { incrementVisible, resetVisible, setFinished } = setupAnimationSlice.actions;
export default setupAnimationSlice.reducer;
