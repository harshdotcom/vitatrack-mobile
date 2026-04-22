import { useCallback } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type {
  ForgotPasswordPayload,
  ResendOtpPayload,
  VerifyOtpPayload,
} from '../types/auth.types';
import type { RootStackParamList } from '../navigation/types';

export function useAuth() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const store = useAuthStore();

  const resetTo = useCallback(
    (name: keyof RootStackParamList) => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name }],
        }),
      );
    },
    [navigation],
  );

  const loginAndNavigate = useCallback(
    async (email: string, password: string) => {
      await store.login({ email, password });
      resetTo('MainTabs');
    },
    [store, resetTo],
  );

  const signupAndNavigate = useCallback(
    async (params: Parameters<typeof store.signup>[0], email: string) => {
      const { emailEnabled } = await store.signup(params);
      if (emailEnabled) {
        navigation.navigate('VerifyOtp', { email });
      } else {
        resetTo('Login');
      }
    },
    [store, navigation, resetTo],
  );

  const googleLoginAndNavigate = useCallback(
    async (idToken: string) => {
      await store.googleLogin(idToken);
      resetTo('MainTabs');
    },
    [store, resetTo],
  );

  const verifyOtp = useCallback(
    async (payload: VerifyOtpPayload) => {
      await authService.verifyOtp(payload);
      resetTo('Login');
    },
    [resetTo],
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
      resetTo('Login');
    },
    [store, resetTo],
  );

  const logout = useCallback(async () => {
    await store.logout();
    resetTo('Login');
  }, [store, resetTo]);

  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
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
