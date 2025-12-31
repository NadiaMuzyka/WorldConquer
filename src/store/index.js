import { configureStore } from '@reduxjs/toolkit';

import lobbyReducer from './slices/lobbySlice';

import authReducer, { setAuthUser, clearAuthUser } from './slices/authSlice';
import { onUserStateChange } from '../firebase/auth'; 

const store = configureStore({
  reducer: {
    lobby: lobbyReducer,
  },
}); 

// Listener globale: sincronizza Firebase con lo Store di Redux
onUserStateChange((user) => {
  if (user) {
    store.dispatch(setAuthUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    }));
  } else {
    store.dispatch(clearAuthUser());
  }
});


export default store;