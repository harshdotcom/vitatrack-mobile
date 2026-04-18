/** Auth flow TypeScript interfaces — mirrors the Go backend models exactly. */

export interface AuthUser {
  user_id: number;
  email: string;
  google_id?: string | null;
  name: string;
  age?: number | null;
  gender?: string;
  profile_pic?: string | null;
  dob?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  gender?: string;
  dob?: string;
  profile_pic?: {
    uri: string;
    name: string;
    type: string;
  } | null;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  new_password: string;
}

export interface GoogleLoginPayload {
  token: string;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface SignupResponse {
  message: string;
  email_enabled: boolean;
}

export interface ApiError {
  message: string;
  error?: string;
}

// ── Form schemas (used with zod) ──────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
