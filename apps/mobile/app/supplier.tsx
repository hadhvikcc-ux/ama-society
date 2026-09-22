import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { isRoleAuthorizedForSegment, getAuthorizedHomeForRole } from '../utils/rbac';

export default function SupplierRedirect() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  if (!isRoleAuthorizedForSegment(user.role, '(supplier)')) {
    return <Redirect href={getAuthorizedHomeForRole(user.role) as any} />;
  }

  return <Redirect href="/(supplier)" />;
}
