import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSosStore, EMERGENCY_TYPE_INFO } from '../../stores/sosStore';
import { useCallStore } from '../../stores/callStore';

export const ActiveSosBanner: React.FC = () => {
  const { activeAlert, acknowledgeAlert, resolveAlert, isSirenActive, dismissSiren } = useSosStore();
  const { startInAppCall } = useCallStore();

  const [resolving, setResolving] = useState(false);

  if (!activeAlert) return null;

  const info = EMERGENCY_TYPE_INFO[activeAlert.type];

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Heavy) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleCallResident = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    startInAppCall(
      {
        id: activeAlert.residentId,
        name: activeAlert.residentName,
        flat: activeAlert.flatNumber,
        phone: activeAlert.phone,
        role: 'Resident',
        category: 'resident',
      },
      'AUDIO'
    );
  };

  const handleAcknowledge = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    acknowledgeAlert('Main Gate Guard');
  };

  const handleResolve = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    resolveAlert('Main Gate Guard', 'On-site team attended and confirmed resident safe.');
  };

  return (
    <View style={[styles.banner, { backgroundColor: info.bg, borderColor: info.color }]}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{info.emoji}</Text>
          <View>
            <View style={styles.badgeRow}>
              <Text style={[styles.title, { color: info.color }]}>
                {info.title.toUpperCase()}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: activeAlert.status === 'TRIGGERED' ? '#BE123C' : '#D97706' }]}>
                <Text style={styles.statusBadgeText}>
                  {activeAlert.status === 'TRIGGERED' ? '🚨 LIVE SIREN' : '⚡ DISPATCHED'}
                </Text>
              </View>
            </View>
            <Text style={styles.subText}>
              Unit {activeAlert.flatNumber} ({activeAlert.tower}) • {activeAlert.residentName} • {activeAlert.phone}
            </Text>
          </View>
        </View>

        {isSirenActive && (
          <TouchableOpacity style={styles.muteBtn} onPress={dismissSiren}>
            <Ionicons name="volume-mute-outline" size={18} color="#BE123C" />
            <Text style={styles.muteBtnText}>Mute Siren</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeAlert.notes && (
        <Text style={styles.notesText}>Note: {activeAlert.notes}</Text>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCallResident}>
          <Ionicons name="call" size={16} color="#FFFFFF" />
          <Text style={styles.callBtnText}>Call Resident</Text>
        </TouchableOpacity>

        {activeAlert.status === 'TRIGGERED' ? (
          <TouchableOpacity style={styles.ackBtn} onPress={handleAcknowledge}>
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.ackBtnText}>Acknowledge & Dispatch</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.resolveBtnText}>Mark Resolved</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emoji: {
    fontSize: 32,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  subText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  muteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  muteBtnText: {
    fontSize: 12,
    color: '#BE123C',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    borderRadius: 10,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ackBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 10,
  },
  ackBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resolveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 10,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
