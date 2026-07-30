import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import { RouterProvider } from 'react-router-dom';
import router from './Routes';

import { Provider, useDispatch } from 'react-redux';
import store from './store';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase/firebaseConfig';
import { getUserData } from './firebase/db';
import { setUser, setLoading, setUnauthenticated } from './store/slices/userSlice';

const AuthWrapper = ({ children }) => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Determina se è un utente Google
          const isGoogleUser = firebaseUser.providerData.some(provider => provider.providerId === 'google.com');
          
          const result = await getUserData(firebaseUser.uid);
          if (result.success) {
            dispatch(setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              isGoogleUser,
              name: result.data.nickname || firebaseUser.email.split('@')[0],
              avatar: result.data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              ...result.data
            }));
          } else {
            dispatch(setUnauthenticated());
          }
        } catch (error) {
          dispatch(setUnauthenticated());
        }
      } else {
        dispatch(setUnauthenticated());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return children;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthWrapper>
        <RouterProvider router={router} />
      </AuthWrapper>
    </Provider>
  </React.StrictMode>
);


