/**
 * Roles a person can pick on the sign-up form. Residents get access at once; staff roles
 * wait for a society admin to approve them. ADMIN is never self-selectable.
 */
export const SIGNUP_ROLES = {
  RESIDENT_OWNER: { role: 'RESIDENT', tenancyType: 'OWNER', needsApproval: false },
  RESIDENT_TENANT: { role: 'RESIDENT', tenancyType: 'TENANT', needsApproval: false },
  GUARD: { role: 'GUARD', tenancyType: null, needsApproval: true },
  COMMITTEE: { role: 'COMMITTEE', tenancyType: null, needsApproval: true },
  VENDOR: { role: 'VENDOR', tenancyType: null, needsApproval: true },
  SUPPLIER: { role: 'SUPPLIER', tenancyType: null, needsApproval: true },
} as const;

export type SignupRole = keyof typeof SIGNUP_ROLES;

/** Accepted values for the `role` field; plain RESIDENT is kept for older app versions. */
export const SIGNUP_ROLE_VALUES = [...Object.keys(SIGNUP_ROLES), 'RESIDENT'];

export function resolveSignupRole(choice?: string) {
  const key = (choice && choice in SIGNUP_ROLES ? choice : 'RESIDENT_OWNER') as SignupRole;
  return SIGNUP_ROLES[key];
}
