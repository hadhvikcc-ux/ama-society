import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { isRoleAuthorizedForSegment, getAuthorizedHomeForRole } from '../utils/rbac';

export default function AdminRedirect() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  if (!isRoleAuthorizedForSegment(user.role, '(admin)')) {
    return <Redirect href={getAuthorizedHomeForRole(user.role) as any} />;
  }

  return <Redirect href="/(admin)" />;
}
