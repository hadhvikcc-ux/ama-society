/**
 * Roles an admin can give a member. Keys are what the app sends; each maps to the
 * stored role plus, for residents, owner or tenant.
 */
export const MEMBER_ROLES = {
  RESIDENT_OWNER: { role: 'RESIDENT', tenancyType: 'OWNER' },
  RESIDENT_TENANT: { role: 'RESIDENT', tenancyType: 'TENANT' },
  COMMITTEE: { role: 'COMMITTEE', tenancyType: null },
  GUARD: { role: 'GUARD', tenancyType: null },
  VENDOR: { role: 'VENDOR', tenancyType: null },
  SUPPLIER: { role: 'SUPPLIER', tenancyType: null },
  ADMIN: { role: 'ADMIN', tenancyType: null },
} as const;

export type MemberRoleKey = keyof typeof MEMBER_ROLES;
export const MEMBER_ROLE_KEYS = Object.keys(MEMBER_ROLES) as MemberRoleKey[];
