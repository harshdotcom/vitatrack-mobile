export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  VerifyOtp: { email?: string };
  ForgotPassword: undefined;
  ResetPassword: { email?: string };
  MainTabs: undefined;
  DocumentDetails: { id: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
};
