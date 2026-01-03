import { configureStore } from '@reduxjs/toolkit';

import lobbyReducer from './slices/lobbySlice';

const store = configureStore({
  reducer: {
    lobby: lobbyReducer,
  },
}); 

export default store;