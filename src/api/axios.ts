import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ENDPOINTS } from './endpoints';

const TOKEN_KEY = 'vitatrack_auth_token';

// ── Axios instance ────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: ENDPOINTS.BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor — inject JWT ─────────────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — normalize errors ───────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Something went wrong';
    return Promise.reject(new Error(message));
  },
);

// ── Secure token helpers ──────────────────────────────────────────────────────

export const tokenStorage = {
  save: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export const USER_KEY = 'vitatrack_auth_user';

export const userStorage = {
  save: (user: object) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  get: async <T>(): Promise<T | null> => {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  remove: () => SecureStore.deleteItemAsync(USER_KEY),
};
