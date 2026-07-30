import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
  currentUser: null,
  error: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.status = 'authenticated';
      state.error = null;
    },
    setLoading: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    setUnauthenticated: (state) => {
      state.currentUser = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
    setError: (state, action) => {
      state.status = 'unauthenticated';
      state.error = action.payload;
    }
  }
});

export const { setUser, setLoading, setUnauthenticated, setError } = userSlice.actions;

export const selectUser = (state) => state.user.currentUser;
export const selectUserStatus = (state) => state.user.status;

export default userSlice.reducer;
