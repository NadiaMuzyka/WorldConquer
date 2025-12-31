import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isInitialized: false,
    },
    reducers: {
        setAuthUser: (state, action) => {
            state.user = action.payload; // Payload: { uid, email, ... }
            state.isInitialized = true;
        },
        clearAuthUser: (state) => {
            state.user = null;
            state.isInitialized = true;
        }
    }
});

export const { setAuthUser, clearAuthUser } = authSlice.actions;
export default authSlice.reducer;