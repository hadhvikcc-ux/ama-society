import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { useAuthStore } from '../../stores/authStore';
import { isRoleAuthorizedForSegment, getAuthorizedHomeForRole } from '../../utils/rbac';

export default function VendorLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  if (!isRoleAuthorizedForSegment(user.role, '(vendor)')) {
    const target = getAuthorizedHomeForRole(user.role);
    return <Redirect href={target as any} />;
  }

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#7C3AED',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: { height: 65, paddingBottom: 8, paddingTop: 4 },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          headerStyle: { backgroundColor: '#7C3AED' },
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
        <Tabs.Screen name="index" options={{ title: 'POS', tabBarIcon: ({ color, size }) => <Ionicons name="calculator" size={size} color={color} /> }} />
        <Tabs.Screen name="pos" options={{ href: null }} />
        <Tabs.Screen name="inventory" options={{ title: 'Stock & Items', tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} /> }} />
        <Tabs.Screen name="outstanding" options={{ title: 'Outstanding', tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
        <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
        <Tabs.Screen name="catalog" options={{ title: 'Catalog', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
        <Tabs.Screen name="bids" options={{ title: 'Bids', tabBarIcon: ({ color, size }) => <Ionicons name="hammer" size={size} color={color} /> }} />
      </Tabs>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />
    </>
  );
}
