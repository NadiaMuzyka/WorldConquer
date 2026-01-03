import { configureStore } from '@reduxjs/toolkit';

import lobbyReducer from './slices/lobbySlice';
import matchReducer from './slices/matchSlice';

const store = configureStore({
  reducer: {
    lobby: lobbyReducer,
    match: matchReducer,
  },
}); 

export default store;