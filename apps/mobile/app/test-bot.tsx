import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { getAuthorizedHomeForRole } from '../utils/rbac';
import { TestBotView } from '../components/testing/E2ETestBotModal';

export default function TestBotScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Defense-in-depth: Reject unauthenticated access
  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  // E2E Test Bot is strictly accessible ONLY to Admin
  if (user.role?.toLowerCase() !== 'admin') {
    return <Redirect href={getAuthorizedHomeForRole(user.role) as any} />;
  }

  return (
    <View style={styles.container}>
      <TestBotView isModal={false} onClose={() => router.replace(getAuthorizedHomeForRole(user.role) as any)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
