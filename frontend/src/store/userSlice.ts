import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';



export interface UserProfile {
  name: string;
  email: string;
  address: string;
  phone: string;
  role: string;
}

interface UserState {
  isLoggedIn: boolean;
  profile: UserProfile | null;
}

const initialState: UserState = {
  isLoggedIn: false,
  profile: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ name: string; email: string; address?: string; role?: string }>) => {
      state.isLoggedIn = true;
      state.profile = {
        name: action.payload.name,
        email: action.payload.email,
        address: action.payload.address || '',
        phone: '',
        role: action.payload.role || 'USER',
      };
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.profile = null;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
  },
});

export const { login, logout, updateProfile } = userSlice.actions;
export default userSlice.reducer;
