import { create } from 'zustand';
import { tokenStorage, userStorage } from '../api/axios';
import { authService } from '../services/authService';
import type {
  AuthUser,
  LoginPayload,
  SignupPayload,
  ResetPasswordPayload,
} from '../types/auth.types';

interface AuthStore {
  // State
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<{ emailEnabled: boolean }>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  clearError: () => void;
  hydrateFromStorage: () => Promise<void>;
}

function sanitizeUser(user: AuthUser & { password?: string }): AuthUser {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ── Login ────────────────────────────────────────────────────────────────

  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(payload);
      await tokenStorage.save(res.token);
      const safeUser = sanitizeUser(res.user as AuthUser & { password?: string });
      await userStorage.save(safeUser);
      set({
        user: safeUser,
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  // ── Signup ───────────────────────────────────────────────────────────────

  signup: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.signup(payload);
      set({ isLoading: false });
      return { emailEnabled: res.email_enabled };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  // ── Google Login ─────────────────────────────────────────────────────────

  googleLogin: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.googleLogin(idToken);
      await tokenStorage.save(res.token);
      const safeUser = sanitizeUser(res.user as AuthUser & { password?: string });
      await userStorage.save(safeUser);
      set({
        user: safeUser,
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────

  logout: async () => {
    await tokenStorage.remove();
    await userStorage.remove();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  // ── Reset Password ────────────────────────────────────────────────────────

  resetPassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(payload);
      set({ isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  // ── Misc ─────────────────────────────────────────────────────────────────

  clearError: () => set({ error: null }),

  hydrateFromStorage: async () => {
    const token = await tokenStorage.get();
    const user = await userStorage.get<AuthUser>();
    if (token && user) {
      set({ token, user, isAuthenticated: true });
    }
  },
}));
