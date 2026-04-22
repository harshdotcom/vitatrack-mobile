import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const token = await AsyncStorage.getItem(TOKEN_KEY);
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
  save: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  remove: () => AsyncStorage.removeItem(TOKEN_KEY),
};

export const USER_KEY = 'vitatrack_auth_user';

export const userStorage = {
  save: (user: object) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  get: async <T>(): Promise<T | null> => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  remove: () => AsyncStorage.removeItem(USER_KEY),
};
