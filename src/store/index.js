import { configureStore } from '@reduxjs/toolkit';

import lobbyReducer from './slices/lobbySlice';
import matchReducer from './slices/matchSlice';
import setupAnimationReducer from './slices/setupAnimationSlice';

const store = configureStore({
  reducer: {
    lobby: lobbyReducer,
    match: matchReducer,
    setupAnimation: setupAnimationReducer,
  },
}); 

export default store;