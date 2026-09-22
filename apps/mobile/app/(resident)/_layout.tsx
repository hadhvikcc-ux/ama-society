import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBazaarStore } from '../../stores/bazaarStore';
import { useAuthStore } from '../../stores/authStore';
import { isRoleAuthorizedForSegment, getAuthorizedHomeForRole } from '../../utils/rbac';

export default function ResidentLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  if (!isRoleAuthorizedForSegment(user.role, '(resident)')) {
    const target = getAuthorizedHomeForRole(user.role);
    return <Redirect href={target as any} />;
  }

  const insets = useSafeAreaInsets();
  const { cart } = useBazaarStore();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const bottomPadding = Math.max(insets.bottom, 8);
  const tabHeight = 58 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4338CA',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { 
          backgroundColor: '#FFFFFF', 
          height: tabHeight, 
          paddingBottom: bottomPadding, 
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          shadowColor: '#1E293B',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.03,
          shadowRadius: 6,
          elevation: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color }) => <Ionicons name="card-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bazaar"
        options={{
          title: 'Bazaar',
          tabBarIcon: ({ color }) => <Ionicons name="storefront-outline" size={24} color={color} />,
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
        }}
      />
      <Tabs.Screen
        name="pass"
        options={{
          title: 'My Pass',
          tabBarIcon: ({ color }) => <Ionicons name="qr-code-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cab"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
