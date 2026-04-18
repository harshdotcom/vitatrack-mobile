/**
 * All API endpoint constants — mirrors api.constants.ts from the Angular frontend.
 * Production base URL: https://vitatrack-ai.onrender.com/api/v1
 * Local : http://localhost:8081/api/v1
 */

const BASE_URL = "http://10.0.2.2:8082/api/v1";

export const ENDPOINTS = {
  BASE_URL,

  // Auth (public)
  LOGIN: `${BASE_URL}/users/login`,
  SIGNUP: `${BASE_URL}/users/signup`,
  VERIFY_OTP: `${BASE_URL}/users/verify-otp`,
  RESEND_OTP: `${BASE_URL}/users/resend-otp`,
  FORGOT_PASSWORD: `${BASE_URL}/users/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/users/reset-password`,
  GOOGLE_LOGIN: `${BASE_URL}/users/google`,

  // User (protected)
  USER_USAGE: `${BASE_URL}/user-details/usage`,
  AI_CREDITS: `${BASE_URL}/user-details/ai-credits`,
  UPDATE_PROFILE: `${BASE_URL}/user-details/update`,

  // Files (protected)
  FILES_UPLOAD: `${BASE_URL}/files/upload`,
  file: (id: string) => `${BASE_URL}/files/${id}`,
  fileText: (id: string) => `${BASE_URL}/files/ocr/${id}`,
  fileAnalysis: (id: string) => `${BASE_URL}/files/ai/${id}`,

  // Documents (protected)
  DOCUMENTS: `${BASE_URL}/documents`,
  DOCUMENTS_CALENDAR: `${BASE_URL}/documents/calendar`,
  document: (id: string) => `${BASE_URL}/documents/${id}`,
  updateDocument: (id: string) => `${BASE_URL}/documents/update/${id}`,

  // Health metrics (protected)
  HEALTH_METRIC_SAVE: `${BASE_URL}/health-metric/save`,
  healthMetric: (id: string) => `${BASE_URL}/health-metric/${id}`,
} as const;
