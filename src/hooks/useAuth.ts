import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { VerifyOtpPayload, ResendOtpPayload, ForgotPasswordPayload } from '../types/auth.types';

/**
 * Convenience hook wrapping the auth store + navigation actions.
 * Screens import this instead of the store directly for a clean API.
 */
export function useAuth() {
  const router = useRouter();
  const store = useAuthStore();

  const loginAndNavigate = useCallback(
    async (email: string, password: string) => {
      await store.login({ email, password });
      router.replace('/(tabs)');
    },
    [store, router],
  );

  const signupAndNavigate = useCallback(
    async (params: Parameters<typeof store.signup>[0], email: string) => {
      const { emailEnabled } = await store.signup(params);
      if (emailEnabled) {
        router.push({ pathname: '/(auth)/verify-otp', params: { email } });
      } else {
        // Email flow disabled — go straight to login
        router.replace('/(auth)/login');
      }
    },
    [store, router],
  );

  const googleLoginAndNavigate = useCallback(
    async (idToken: string) => {
      await store.googleLogin(idToken);
      router.replace('/(tabs)');
    },
    [store, router],
  );

  const verifyOtp = useCallback(
    async (payload: VerifyOtpPayload) => {
      await authService.verifyOtp(payload);
      router.replace('/(auth)/login');
    },
    [router],
  );

  const resendOtp = useCallback(async (payload: ResendOtpPayload) => {
    await authService.resendOtp(payload);
  }, []);

  const forgotPassword = useCallback(
    async (payload: ForgotPasswordPayload, onSuccess: () => void) => {
      await authService.forgotPassword(payload);
      onSuccess();
    },
    [],
  );

  const resetPasswordAndNavigate = useCallback(
    async (payload: Parameters<typeof store.resetPassword>[0]) => {
      await store.resetPassword(payload);
      router.replace('/(auth)/login');
    },
    [store, router],
  );

  const logout = useCallback(async () => {
    await store.logout();
    router.replace('/(auth)/login');
  }, [store, router]);

  return {
    // State
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    // Actions
    loginAndNavigate,
    signupAndNavigate,
    googleLoginAndNavigate,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPasswordAndNavigate,
    logout,
    clearError: store.clearError,
  };
}
