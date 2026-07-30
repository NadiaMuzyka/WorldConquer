import { configureStore } from '@reduxjs/toolkit';

import lobbyReducer from './slices/lobbySlice';
import matchReducer from './slices/matchSlice';
import setupAnimationReducer from './slices/setupAnimationSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    lobby: lobbyReducer,
    match: matchReducer,
    setupAnimation: setupAnimationReducer,
    user: userReducer,
  },
}); 

export default store;