import { User } from '../stores/authStore';

/** Maps a user returned by the API (/auth/login, /auth/firebase, /auth/register/complete) to the app's User. */
export function userFromApi(apiUser: any, fallbackEmail = ''): User {
  const role = (apiUser.role || 'resident').toLowerCase();
  const isResident = role.includes('resident');
  return {
    id: apiUser.id,
    name: apiUser.name || (apiUser.email || fallbackEmail).split('@')[0] || 'Resident',
    email: apiUser.email || fallbackEmail,
    phone: apiUser.phone || undefined,
    role: role as User['role'],
    flatNumber: apiUser.flat?.flatNumber || (isResident ? 'B-204' : undefined),
    tower: apiUser.flat?.tower || (isResident ? 'Tower B' : undefined),
    societyCode: apiUser.societyId || 'ORC123',
  };
}
