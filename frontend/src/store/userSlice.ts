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
  // User session (for /account, user-facing pages)
  isLoggedIn: boolean;
  profile: UserProfile | null;
  // Admin session (for /admin pages) — separate so two tabs don't conflict
  isAdminLoggedIn: boolean;
  adminProfile: UserProfile | null;
}

/**
 * Restore user/admin session from localStorage so that a page refresh (F5)
 * does NOT reset the Redux state to logged-out before the first render.
 */
const loadUserFromStorage = (): { isLoggedIn: boolean; profile: UserProfile | null } => {
  try {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    if (!token || !raw) return { isLoggedIn: false, profile: null };
    const user = JSON.parse(raw);
    if (!user || !user.email) return { isLoggedIn: false, profile: null };
    return {
      isLoggedIn: true,
      profile: {
        id: user.id,
        name: user.name || user.fullName || '',
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || 'USER',
      },
    };
  } catch {
    return { isLoggedIn: false, profile: null };
  }
};

const loadAdminFromStorage = (): { isAdminLoggedIn: boolean; adminProfile: UserProfile | null } => {
  try {
    const token = localStorage.getItem('admin_token');
    const raw = localStorage.getItem('admin_user');
    if (!token || !raw) return { isAdminLoggedIn: false, adminProfile: null };
    const admin = JSON.parse(raw);
    if (!admin || !admin.email) return { isAdminLoggedIn: false, adminProfile: null };
    return {
      isAdminLoggedIn: true,
      adminProfile: {
        id: admin.id,
        name: admin.name || admin.fullName || '',
        email: admin.email,
        phone: admin.phone || '',
        address: admin.address || '',
        role: admin.role || 'ADMIN',
      },
    };
  } catch {
    return { isAdminLoggedIn: false, adminProfile: null };
  }
};

const initialState: UserState = {
  ...loadUserFromStorage(),
  ...loadAdminFromStorage(),
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

    // ── Admin session actions ──────────────────────────────────────────
    adminLogin: (
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
      state.isAdminLoggedIn = true;
      state.adminProfile = {
        id: action.payload.id,
        name: action.payload.name,
        email: action.payload.email,
        phone: action.payload.phone || '',
        address: action.payload.address || '',
        role: action.payload.role || 'ADMIN',
      };
    },
    adminLogout: (state) => {
      state.isAdminLoggedIn = false;
      state.adminProfile = null;
    },
    updateAdminProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.adminProfile) {
        state.adminProfile = { ...state.adminProfile, ...action.payload };
        const stored = localStorage.getItem('admin_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorage.setItem(
              'admin_user',
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

export const {
  login,
  logout,
  updateProfile,
  adminLogin,
  adminLogout,
  updateAdminProfile,
} = userSlice.actions;
export default userSlice.reducer;