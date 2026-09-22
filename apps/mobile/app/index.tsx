import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { getAuthorizedHomeForRole } from '../utils/rbac';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#1B4FD8" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  const target = getAuthorizedHomeForRole(user.role);
  return <Redirect href={target as any} />;
}
