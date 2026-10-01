import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBazaarStore } from '../../stores/bazaarStore';
import { useAuthStore } from '../../stores/authStore';
import { useResponsive } from '../../hooks/useResponsive';
import { isRoleAuthorizedForSegment, getAuthorizedHomeForRole } from '../../utils/rbac';

type IconName = keyof typeof Ionicons.glyphMap;

/** The six tabs residents see. Route names must match files exactly, e.g. "billing/index". */
const TABS: { name: string; title: string; icon: IconName; activeIcon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'billing/index', title: 'Billing', icon: 'card-outline', activeIcon: 'card' },
  { name: 'community', title: 'Community', icon: 'people-outline', activeIcon: 'people' },
  { name: 'bazaar/index', title: 'Bazaar', icon: 'storefront-outline', activeIcon: 'storefront' },
  { name: 'pass', title: 'My Pass', icon: 'qr-code-outline', activeIcon: 'qr-code' },
  { name: 'profile', title: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

/** Inner pages: reachable by navigation, never shown in the tab bar. */
const HIDDEN_ROUTES = [
  'billing/pay',
  'billing/audit',
  'bazaar/cart',
  'bazaar/inventory',
  'bazaar/ocr',
  'bazaar/outstanding',
  'bazaar/pos',
  'bazaar/scanner',
  'tickets/index',
  'tickets/new',
  'tickets/[id]',
  'cab',
  'tracking',
  'legal',
];

const TAB_BAR_MAX_WIDTH = 760;

export default function ResidentLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { width, isPhone } = useResponsive();
  const cartItemCount = useBazaarStore((s) => s.cart.reduce((sum, item) => sum + item.quantity, 0));

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />;
  }

  if (!isRoleAuthorizedForSegment(user.role, '(resident)')) {
    const target = getAuthorizedHomeForRole(user.role);
    return <Redirect href={target as any} />;
  }

  const bottomPadding = Math.max(insets.bottom, 8);
  // Phones: full-width docked bar. Wider screens: a centred, rounded bento tile.
  const sideMargin = isPhone ? 0 : Math.max(16, (width - TAB_BAR_MAX_WIDTH) / 2);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4338CA',
        tabBarInactiveTintColor: '#64748B',
        tabBarActiveBackgroundColor: '#EEF2FF',
        tabBarStyle: isPhone
          ? {
              backgroundColor: '#FFFFFF',
              height: 62 + bottomPadding,
              paddingBottom: bottomPadding,
              paddingTop: 6,
              paddingHorizontal: 6,
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
            }
          : {
              backgroundColor: '#FFFFFF',
              height: 68,
              marginHorizontal: sideMargin,
              marginBottom: 12,
              padding: 6,
              borderRadius: 24,
              borderWidth: 1,
              borderTopWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#1E293B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 6,
            },
        tabBarItemStyle: { borderRadius: 16, marginHorizontal: 2, paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? tab.activeIcon : tab.icon} size={22} color={color} />
            ),
            tabBarBadge: tab.name === 'bazaar/index' && cartItemCount > 0 ? cartItemCount : undefined,
          }}
        />
      ))}
      {HIDDEN_ROUTES.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
