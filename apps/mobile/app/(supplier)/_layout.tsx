import React, { useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { useSupplierStore } from '../../stores/supplierStore';
import { useAuthStore } from '../../stores/authStore';
import { isRoleAuthorizedForSegment, getAuthorizedHomeForRole } from '../../utils/rbac';

export default function SupplierLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  if (!isRoleAuthorizedForSegment(user.role, '(supplier)')) {
    const target = getAuthorizedHomeForRole(user.role);
    return <Redirect href={target as any} />;
  }

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const profile = useSupplierStore((state) => state.profile);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0D9488', // Emerald/Teal brand color for B2B Supply Chain
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            height: 65,
            paddingBottom: 8,
            paddingTop: 4,
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          headerStyle: { backgroundColor: '#0D9488' },
          headerTitleStyle: { color: '#FFFFFF', fontWeight: 'bold' },
          headerTintColor: '#FFFFFF',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="cube" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                  {profile.tradeName || 'Supplier Portal'}
                </Text>
                <Text style={{ color: '#CCFBF1', fontSize: 11, fontWeight: '500' }}>
                  B2B Society Vendor • {profile.verifiedSocietyCode}
                </Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{
                marginRight: 16,
                padding: 6,
                backgroundColor: 'rgba(239,68,68,0.25)',
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
              onPress={() => setLogoutModalVisible(true)}
              accessibilityLabel="Log Out"
            >
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Exit</Text>
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Overview',
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'POs',
            tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="challans"
          options={{
            title: 'Inward Passes',
            tabBarIcon: ({ color, size }) => <Ionicons name="barcode-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="catalog"
          options={{
            title: 'Catalog',
            tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="invoices"
          options={{
            title: 'Invoices & Khata',
            tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="rfq"
          options={{
            title: 'Tenders',
            tabBarIcon: ({ color, size }) => <Ionicons name="hammer-outline" size={size} color={color} />,
          }}
        />
      </Tabs>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />
    </>
  );
}
