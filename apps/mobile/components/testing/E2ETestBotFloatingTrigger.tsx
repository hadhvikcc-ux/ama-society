import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTestBotStore } from '../../stores/testBotStore';
import { useAuthStore } from '../../stores/authStore';

export function E2ETestBotFloatingTrigger() {
  const { modalVisible, setModalVisible, isRunning, stats } = useTestBotStore();
  const { user, isAuthenticated } = useAuthStore();

  // Exclusively render for authenticated Admin users
  const isAdmin = isAuthenticated && user?.role?.toLowerCase() === 'admin';
  if (!isAdmin) {
    return null;
  }

  if (modalVisible) return null;

  const allPassed = stats.passed === stats.total && stats.total > 0;

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <TouchableOpacity
        style={[
          styles.triggerBtn,
          isRunning && styles.triggerBtnRunning,
          allPassed && styles.triggerBtnPassed,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
        accessibilityLabel="Open Admin End-to-End Test Bot"
      >
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 18 }}>🤖</Text>
          <View style={[styles.liveDot, isRunning && styles.liveDotRunning]} />
        </View>

        <View style={styles.textColumn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.titleText}>E2E Bot</Text>
            <View style={styles.adminTag}>
              <Text style={styles.adminTagText}>ADMIN</Text>
            </View>
            {stats.passed > 0 && (
              <View style={[styles.badge, allPassed ? styles.badgePassed : styles.badgeNormal]}>
                <Text style={styles.badgeText}>
                  {stats.passed}/{stats.total}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.statusSubText}>
            {isRunning ? 'Running 53 Tests...' : stats.failed > 0 ? `${stats.failed} Failed` : '19 Suites (53 Tests)'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    bottom: Platform.OS === 'web' ? 85 : 95,
    right: 20,
    zIndex: 999999,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    gap: 10,
  },
  triggerBtnRunning: {
    backgroundColor: '#312E81',
    borderColor: '#818CF8',
  },
  triggerBtnPassed: {
    backgroundColor: '#064E3B',
    borderColor: '#34D399',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  liveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  liveDotRunning: {
    backgroundColor: '#F59E0B',
  },
  textColumn: {
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  adminTag: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusSubText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeNormal: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgePassed: {
    backgroundColor: '#059669',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
