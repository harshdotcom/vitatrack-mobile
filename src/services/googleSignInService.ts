import { GOOGLE_WEB_CLIENT_ID } from '../config/google';
import { NativeModules } from 'react-native';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let isConfigured = false;

function hasNativeGoogleModule() {
  return Boolean(NativeModules.RNGoogleSignin);
}

function getGoogleModule(): GoogleSignInModule | null {
  if (!hasNativeGoogleModule()) {
    return null;
  }

  try {
    return require('@react-native-google-signin/google-signin') as GoogleSignInModule;
  } catch {
    return null;
  }
}

function ensureModule(): GoogleSignInModule {
  const googleModule = getGoogleModule();

  if (!googleModule) {
    throw new Error(
      'Google sign-in is not available in this build yet. Rebuild the app to enable it.',
    );
  }

  return googleModule;
}

function ensureConfigured(googleModule: GoogleSignInModule) {
  if (isConfigured) {
    return;
  }

  googleModule.GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['email', 'profile'],
  });
  isConfigured = true;
}

function mapGoogleError(
  error: unknown,
  googleModule: Pick<GoogleSignInModule, 'isErrorWithCode' | 'statusCodes'>,
): Error {
  if (googleModule.isErrorWithCode(error)) {
    switch (error.code) {
      case googleModule.statusCodes.IN_PROGRESS:
        return new Error('Google sign-in is already in progress.');
      case googleModule.statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return new Error('Google Play Services are not available on this device.');
      case googleModule.statusCodes.SIGN_IN_REQUIRED:
        return new Error('Please choose a Google account to continue.');
      default:
        break;
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Google sign-in failed. Please try again.');
}

export const googleSignInService = {
  async signIn(): Promise<string | null> {
    const googleModule = ensureModule();
    ensureConfigured(googleModule);
    await googleModule.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    try {
      const response = await googleModule.GoogleSignin.signIn();

      if (googleModule.isCancelledResponse(response)) {
        return null;
      }

      if (!googleModule.isSuccessResponse(response) || !response.data.idToken) {
        throw new Error('Google sign-in did not return an ID token.');
      }

      return response.data.idToken;
    } catch (error) {
      throw mapGoogleError(error, googleModule);
    }
  },

  async signOut(): Promise<void> {
    const googleModule = getGoogleModule();

    if (!googleModule) {
      return;
    }

    ensureConfigured(googleModule);

    if (!googleModule.GoogleSignin.hasPreviousSignIn()) {
      return;
    }

    try {
      await googleModule.GoogleSignin.signOut();
    } catch {
      // Local logout should not fail because Google sign-out could not be completed.
    }
  },
};
