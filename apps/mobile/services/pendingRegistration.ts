// Holds a Google/phone sign-up in memory between the login screen and the
// complete-profile screen (kept out of the URL so the token never lands in history).
export interface PendingRegistration {
  registrationToken: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}

let pending: PendingRegistration | null = null;

export const setPendingRegistration = (value: PendingRegistration | null) => {
  pending = value;
};

export const getPendingRegistration = () => pending;

// Role picked on the sign-up page (e.g. RESIDENT_TENANT, GUARD), used as the default on complete-profile.
let chosenSignupRole: string | null = null;

export const setChosenSignupRole = (role: string | null) => {
  chosenSignupRole = role;
};

export const getChosenSignupRole = () => chosenSignupRole;
