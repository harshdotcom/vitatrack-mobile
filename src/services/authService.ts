import { api } from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import type {
  LoginPayload,
  LoginResponse,
  SignupPayload,
  SignupResponse,
  VerifyOtpPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth.types';

export const authService = {
  /**
   * Login with email + password → returns JWT token + user.
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>(ENDPOINTS.LOGIN, payload);
    return data;
  },

  /**
   * Signup — multipart/form-data because profile_pic file is optional.
   */
  signup: async (payload: SignupPayload): Promise<SignupResponse> => {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('email', payload.email);
    form.append('password', payload.password);
    if (payload.gender) form.append('gender', payload.gender);
    if (payload.dob) form.append('dob', payload.dob);
    if (payload.profile_pic) {
      // React Native FormData file shape
      form.append('profile_pic', payload.profile_pic as unknown as Blob);
    }
    const { data } = await api.post<SignupResponse>(ENDPOINTS.SIGNUP, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Verify OTP sent to email after signup.
   */
  verifyOtp: async (payload: VerifyOtpPayload): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(ENDPOINTS.VERIFY_OTP, payload);
    return data;
  },

  /**
   * Resend OTP to email.
   */
  resendOtp: async (payload: ResendOtpPayload): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(ENDPOINTS.RESEND_OTP, payload);
    return data;
  },

  /**
   * Send reset OTP to email.
   */
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(ENDPOINTS.FORGOT_PASSWORD, payload);
    return data;
  },

  /**
   * Reset password with OTP.
   */
  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(ENDPOINTS.RESET_PASSWORD, payload);
    return data;
  },

  /**
   * Google OAuth login — pass the Google ID token.
   */
  googleLogin: async (token: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>(ENDPOINTS.GOOGLE_LOGIN, { token });
    return data;
  },
};
