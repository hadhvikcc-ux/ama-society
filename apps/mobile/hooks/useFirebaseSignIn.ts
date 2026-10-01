import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { ConfirmationResult } from 'firebase/auth';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { getAuthorizedHomeForRole } from '../utils/rbac';
import { userFromApi } from '../utils/session';
import { setPendingRegistration } from '../services/pendingRegistration';
import {
  confirmPhoneOtp,
  firebaseErrorMessage,
  isSocialSignInAvailable,
  sendPhoneOtp,
  signInWithGoogle,
} from '../services/firebase';

/** DOM id for Firebase's invisible reCAPTCHA; render <View nativeID={RECAPTCHA_CONTAINER_ID} /> on screens that send OTPs. */
export const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

interface Options {
  setError: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Google sign-in and phone OTP via Firebase, shared by the sign-in and sign-up screens.
 * Existing users land on their home screen; new users go to /auth/complete-profile.
 */
export function useFirebaseSignIn({ setError, setLoading }: Options) {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const finish = async (idToken: string) => {
    try {
      const res = await api.post('/auth/firebase', { idToken });
      if (res.data?.needsRegistration) {
        setPendingRegistration({ registrationToken: res.data.registrationToken, ...res.data.profile });
        router.push('/auth/complete-profile');
        return;
      }
      const user = userFromApi(res.data.user);
      setUser(user);
      setTokens(res.data.accessToken, res.data.refreshToken);
      router.replace(getAuthorizedHomeForRole(user.role) as any);
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 401 || status === 403
          ? err.response.data?.message || 'Sign-in was rejected. Please try again.'
          : status
            ? `Sign-in is unavailable right now (server error ${status}). Please try again later.`
            : 'Unable to reach the server. Please check your connection and try again.'
      );
    }
  };

  const run = async (work: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await work();
    } catch (error: any) {
      setError(firebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return {
    available: isSocialSignInAvailable,
    otpSent: confirmation !== null,

    googleSignIn: () => run(async () => finish(await signInWithGoogle())),

    /** Sends the SMS code. Returns true when sent. */
    sendOtp: async (tenDigitPhone: string) => {
      if (!/^[6-9]\d{9}$/.test(tenDigitPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return false;
      }
      let sent = false;
      await run(async () => {
        setConfirmation(await sendPhoneOtp(tenDigitPhone, RECAPTCHA_CONTAINER_ID));
        sent = true;
      });
      return sent;
    },

    verifyOtp: (code: string) => {
      if (!confirmation) return Promise.resolve();
      if (!/^\d{6}$/.test(code)) {
        setError('Please enter the 6-digit code from the SMS.');
        return Promise.resolve();
      }
      return run(async () => finish(await confirmPhoneOtp(confirmation, code)));
    },

    resetOtp: () => setConfirmation(null),
  };
}
