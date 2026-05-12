import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
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
    login: (
      state,
      action: PayloadAction<{
        id?: string;
        name: string;
        email: string;
        phone?: string;
        address?: string;
        role?: string;
      }>,
    ) => {
      state.isLoggedIn = true;
      state.profile = {
        id: action.payload.id,
        name: action.payload.name,
        email: action.payload.email,
        phone: action.payload.phone || '',
        address: action.payload.address || '',
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
        // Keep localStorage in sync so the next page refresh restores the updated profile.
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorage.setItem(
              'user',
              JSON.stringify({ ...parsed, ...action.payload }),
            );
          } catch {
            // ignore
          }
        }
      }
    },
  },
});

export const { login, logout, updateProfile } = userSlice.actions;
export default userSlice.reducer;