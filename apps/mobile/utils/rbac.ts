/**
 * Role-Based Access Control (RBAC) & Navigation Permission Guard
 * Enforces strict routing permissions across Resident, Guard, Admin, Vendor, and Supplier portals.
 */

import { AssociationRole } from '../stores/authStore';

export const ROLE_AUTHORIZED_PORTAL_MAP: Record<string, string> = {
  admin: '/(admin)',
  committee: '/(admin)',
  facility_manager: '/(admin)',
  guard: '/(guard)',
  technician: '/(guard)',
  vendor: '/(vendor)',
  supplier: '/(supplier)',
  resident: '/(resident)',
  resident_owner: '/(resident)',
  resident_tenant: '/(resident)',
};

/**
 * Returns the designated home route for a given user role.
 */
export function getAuthorizedHomeForRole(roleStr?: string | null): string {
  const role = roleStr?.toLowerCase() || 'resident';
  return ROLE_AUTHORIZED_PORTAL_MAP[role] || '/(resident)';
}

/**
 * Allowed route groups per role:
 * - Admin group: admin, committee, facility_manager
 * - Guard group: guard, technician
 * - Vendor group: vendor
 * - Supplier group: supplier
 * - Resident group: resident, resident_owner, resident_tenant, committee
 */
export const ALLOWED_SEGMENTS_BY_ROLE: Record<string, string[]> = {
  admin: ['(admin)', 'admin', 'test-bot'],
  facility_manager: ['(admin)', 'admin'],
  committee: ['(admin)', 'admin', '(resident)', 'resident', 'directory'],
  guard: ['(guard)', 'guard'],
  technician: ['(guard)', 'guard'],
  vendor: ['(vendor)', 'vendor'],
  supplier: ['(supplier)', 'supplier'],
  resident: ['(resident)', 'resident', 'directory'],
  resident_owner: ['(resident)', 'resident', 'directory'],
  resident_tenant: ['(resident)', 'resident', 'directory'],
};

/**
 * Checks if a specific role is authorized to access a given URL route segment.
 */
export function isRoleAuthorizedForSegment(roleStr: string | undefined | null, segment: string): boolean {
  if (!segment) return true;
  const role = roleStr?.toLowerCase() || '';

  // Clean segment string (e.g., '(admin)' or 'admin' or 'test-bot')
  const cleanSegment = segment.replace(/^\/+/, '').split('/')[0];

  // If this segment is not a protected portal root, allow standard sub-navigation
  const protectedPortals = [
    '(admin)', 'admin',
    '(guard)', 'guard',
    '(vendor)', 'vendor',
    '(supplier)', 'supplier',
    '(resident)', 'resident',
    'directory',
    'test-bot',
  ];

  if (!protectedPortals.includes(cleanSegment)) {
    return true;
  }

  const allowedSegments = ALLOWED_SEGMENTS_BY_ROLE[role] || ['(resident)', 'resident'];
  return allowedSegments.includes(cleanSegment);
}

/**
 * Check if the route is publicly accessible without login.
 * Note: test-bot is restricted exclusively to authenticated admin users.
 */
export function isPublicRoute(segments: string[]): boolean {
  if (!segments || segments.length === 0) return false;
  
  const rootSegment = segments[0]?.toLowerCase();
  // Strictly only authentication routes (login, register) are publicly accessible
  return rootSegment === 'auth';
}
