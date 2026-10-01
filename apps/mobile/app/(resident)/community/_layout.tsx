import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PAGE_MAX_WIDTH, useWideLayout } from '../../../components/ui/TwoPaneLayout';

type IconName = keyof typeof Ionicons.glyphMap;

const SECTIONS: { name: string; title: string; subtitle: string; icon: IconName }[] = [
  { name: 'announcements', title: 'News & Notices', subtitle: 'Alerts, AGM, maintenance', icon: 'megaphone-outline' },
  { name: 'directory', title: 'Intercom', subtitle: 'Call neighbours & staff', icon: 'call-outline' },
  { name: 'chat', title: 'Chat', subtitle: 'Society groups', icon: 'chatbubbles-outline' },
  { name: 'events', title: 'Events', subtitle: 'Festivals & RSVPs', icon: 'calendar-outline' },
  { name: 'facilities', title: 'Book Facilities', subtitle: 'Courts, hall, pool', icon: 'business-outline' },
];

/**
 * Community section navigation. The bottom-tabs version in use has no top or side tab bar,
 * so the built-in bar is hidden and this menu is drawn instead: a left sidebar on wide
 * screens, a scrollable pill bar on phones.
 */
function CommunityNav({ wide }: { wide: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = SECTIONS.find((s) => pathname.includes(`/community/${s.name}`))?.name ?? 'announcements';

  if (wide) {
    return (
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Community</Text>
        {SECTIONS.map((s) => {
          const isActive = s.name === active;
          return (
            <TouchableOpacity
              key={s.name}
              onPress={() => router.push(`/(resident)/community/${s.name}` as any)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              activeOpacity={0.8}
            >
              <View style={[styles.sideItem, isActive && styles.sideItemActive]}>
                <View style={[styles.sideIcon, isActive && styles.sideIconActive]}>
                  <Ionicons name={s.icon} size={18} color={isActive ? '#FFFFFF' : '#475569'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sideItemTitle, isActive && styles.sideItemTitleActive]}>{s.title}</Text>
                  <Text style={styles.sideItemSub}>{s.subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.pillBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
        {SECTIONS.map((s) => {
          const isActive = s.name === active;
          return (
            <TouchableOpacity
              key={s.name}
              onPress={() => router.push(`/(resident)/community/${s.name}` as any)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              activeOpacity={0.8}
            >
              <View style={[styles.pill, isActive && styles.pillActive]}>
                <Ionicons name={s.icon} size={15} color={isActive ? '#FFFFFF' : '#475569'} />
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{s.title}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function CommunityLayout() {
  const wide = useWideLayout();

  return (
    <View style={[styles.root, wide && styles.rootWide]}>
      <CommunityNav wide={wide} />
      <View style={styles.content}>
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="index" options={{ href: null }} />
          {SECTIONS.map((s) => (
            <Tabs.Screen key={s.name} name={s.name} options={{ title: s.title }} />
          ))}
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  rootWide: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    paddingBottom: 0,
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  content: { flex: 1, minWidth: 0 },
  sidebar: {
    width: 280,
    flexShrink: 0,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
  },
  sidebarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16 },
  sideItemActive: { backgroundColor: '#EEF2FF' },
  sideIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  sideIconActive: { backgroundColor: '#4338CA' },
  sideItemTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  sideItemTitleActive: { color: '#4338CA', fontWeight: '800' },
  sideItemSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  pillBar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  pillScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#F1F5F9' },
  pillActive: { backgroundColor: '#4338CA' },
  pillText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  pillTextActive: { color: '#FFFFFF' },
});
