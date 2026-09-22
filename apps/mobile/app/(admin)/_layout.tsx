import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { useAuthStore } from '../../stores/authStore';
import { isRoleAuthorizedForSegment, getAuthorizedHomeForRole } from '../../utils/rbac';

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  if (!isRoleAuthorizedForSegment(user.role, '(admin)')) {
    const target = getAuthorizedHomeForRole(user.role);
    return <Redirect href={target as any} />;
  }

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#1B4FD8',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: { height: 65, paddingBottom: 8, paddingTop: 4, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          headerStyle: { backgroundColor: '#1B4FD8' },
          headerTitleStyle: { color: '#FFFFFF', fontWeight: 'bold' },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16, padding: 6, backgroundColor: 'rgba(239,68,68,0.25)', borderRadius: 8 }}
              onPress={() => setLogoutModalVisible(true)}
              accessibilityLabel="Log Out"
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
        <Tabs.Screen name="billing" options={{ title: 'Billing', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
        <Tabs.Screen name="society" options={{ title: 'Society', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} /> }} />
        <Tabs.Screen name="tickets" options={{ title: 'Tickets', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="construct" size={size} color={color} /> }} />
        <Tabs.Screen name="reports" options={{ title: 'Reports', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
      </Tabs>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />
    </>
  );
}
