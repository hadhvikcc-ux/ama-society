import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActiveCallOverlay } from '../components/call/ActiveCallOverlay';
import { CallPickerModal } from '../components/call/CallPickerModal';
import { WhatsAppCallGuidanceModal } from '../components/call/WhatsAppCallGuidanceModal';
import { E2ETestBotModal } from '../components/testing/E2ETestBotModal';
import { E2ETestBotFloatingTrigger } from '../components/testing/E2ETestBotFloatingTrigger';
import { getAuthorizedHomeForRole, isRoleAuthorizedForSegment, isPublicRoute } from '../utils/rbac';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const publicRoute = isPublicRoute(segments as string[]);
    const inAuthGroup = segments[0] === 'auth';

    // 1. Universal Authentication Gate: Block all protected routes if not logged in
    if (!isAuthenticated || !user) {
      if (!publicRoute && segments[0]) {
        router.replace('/auth/login');
      }
      return;
    }

    // 2. Authenticated user visiting /auth/*: Forward to designated role portal
    if (inAuthGroup) {
      const targetPortal = getAuthorizedHomeForRole(user.role);
      router.replace(targetPortal as any);
      return;
    }

    // 3. Strict Role-Based Access Control (RBAC):
    // Block cross-role tampering and redirect to the user's permitted portal
    const targetSegment = segments[0];
    if (targetSegment && !isRoleAuthorizedForSegment(user.role, targetSegment)) {
      console.warn(`[RBAC] Access denied: User with role "${user.role}" tried to access "${targetSegment}". Redirecting to authorized portal.`);
      const authorizedPortal = getAuthorizedHomeForRole(user.role);
      router.replace(authorizedPortal as any);
    }
  }, [isAuthenticated, segments, user, rootNavigationState?.key]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Slot />
          <ActiveCallOverlay />
          <CallPickerModal />
          <WhatsAppCallGuidanceModal />
          {/* E2E Test Bot is exclusively accessible to logged-in Admin only */}
          {isAuthenticated && user?.role?.toLowerCase() === 'admin' && (
            <>
              <E2ETestBotModal />
              <E2ETestBotFloatingTrigger />
            </>
          )}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
