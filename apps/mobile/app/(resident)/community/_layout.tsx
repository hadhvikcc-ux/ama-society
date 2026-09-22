import React from 'react';
import { Tabs } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarPosition: 'top',
        tabBarActiveTintColor: '#1B4FD8',
        tabBarInactiveTintColor: '#6B7280',
        tabBarIndicatorStyle: { backgroundColor: '#1B4FD8', height: 3 },
        tabBarStyle: { backgroundColor: '#FFFFFF', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600', textTransform: 'none' },
        headerShown: false,
      } as any}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="directory" options={{ title: '📞 Intercom' }} />
      <Tabs.Screen name="announcements" options={{ title: '📢 News' }} />
      <Tabs.Screen name="chat" options={{ title: '💬 Chat' }} />
      <Tabs.Screen name="events" options={{ title: '🎉 Events' }} />
      <Tabs.Screen name="facilities" options={{ title: '🏛️ Book' }} />
    </Tabs>
  );
}
