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
