import { Platform } from 'react-native';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  ConfirmationResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
  signInWithPopup,
} from 'firebase/auth';

// Public Firebase web config (not secrets). Set in apps/mobile/.env before `expo export`.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Google and phone sign-in use the Firebase web SDK, so they are enabled on web only for now.
export const isSocialSignInAvailable = Platform.OS === 'web' && !!config.apiKey && !!config.projectId;

let auth: Auth | null = null;
function firebaseAuth(): Auth {
  if (!isSocialSignInAvailable) throw new Error('Google and phone sign-in are not available here.');
  if (!auth) {
    const app: FirebaseApp = getApps()[0] ?? initializeApp(config);
    auth = getAuth(app);
  }
  return auth;
}

/** Opens the Google account picker and returns a Firebase ID token. */
export async function signInWithGoogle(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(firebaseAuth(), provider);
  return cred.user.getIdToken();
}

let recaptcha: RecaptchaVerifier | null = null;
let recaptchaElement: Element | null = null;

/**
 * Sends an SMS code to an Indian mobile number. `containerId` is a DOM element id
 * for Firebase's invisible reCAPTCHA.
 */
export async function sendPhoneOtp(tenDigitPhone: string, containerId: string): Promise<ConfirmationResult> {
  const a = firebaseAuth();
  // The container is re-created when the user moves between sign-in and sign-up screens;
  // a verifier bound to a detached element cannot be reused.
  const element = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
  if (recaptcha && element !== recaptchaElement) {
    try {
      recaptcha.clear();
    } catch {
      // Already detached with its old screen.
    }
    recaptcha = null;
  }
  if (!recaptcha) {
    recaptcha = new RecaptchaVerifier(a, containerId, { size: 'invisible' });
    recaptchaElement = element;
  }
  try {
    return await signInWithPhoneNumber(a, `+91${tenDigitPhone}`, recaptcha);
  } catch (error) {
    // A used or failed reCAPTCHA cannot be reused; build a fresh one on the next attempt.
    recaptcha.clear();
    recaptcha = null;
    throw error;
  }
}

/** Confirms the SMS code and returns a Firebase ID token. */
export async function confirmPhoneOtp(confirmation: ConfirmationResult, code: string): Promise<string> {
  const cred = await confirmation.confirm(code);
  return cred.user.getIdToken();
}

/** Readable messages for the Firebase errors users actually hit. */
export function firebaseErrorMessage(error: any): string {
  switch (error?.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.';
    case 'auth/invalid-phone-number':
      return 'That mobile number is not valid.';
    case 'auth/invalid-verification-code':
      return 'Incorrect OTP. Please check the code and try again.';
    case 'auth/code-expired':
      return 'This OTP has expired. Please request a new one.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/unauthorized-domain':
      return 'This website is not authorised for sign-in yet (add it under Firebase Authentication → Settings → Authorised domains).';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase yet.';
    default:
      return error?.message ? `Sign-in failed: ${error.message}` : 'Sign-in failed. Please try again.';
  }
}
