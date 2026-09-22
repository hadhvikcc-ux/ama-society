import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSosStore, EmergencyType, EMERGENCY_TYPE_INFO } from '../../stores/sosStore';
import { useAuthStore } from '../../stores/authStore';

interface SosPanicModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SosPanicModal: React.FC<SosPanicModalProps> = ({ visible, onClose }) => {
  const { triggerEmergency, cancelAlert, activeAlert } = useSosStore();
  const { user } = useAuthStore();

  const [selectedType, setSelectedType] = useState<EmergencyType>('MEDICAL');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [triggeredAlertId, setTriggeredAlertId] = useState<string | null>(null);

  const countdownTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setCountdown(null);
      setTriggeredAlertId(null);
    }
  }, [visible]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Heavy) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const startCountdown = (type: EmergencyType) => {
    setSelectedType(type);
    setCountdown(3);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    let remaining = 3;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        clearInterval(countdownTimerRef.current);
        setCountdown(null);
        // Dispatch alert!
        const alert = triggerEmergency({
          type,
          residentName: user?.name || 'Aditya Sharma',
          flatNumber: user?.flatNumber || 'B-204',
          tower: user?.tower || 'Tower B',
          phone: user?.phone || '9820199001',
        });
        setTriggeredAlertId(alert.id);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdown(null);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAbortTriggered = () => {
    cancelAlert('False alarm cancelled by resident');
    setTriggeredAlertId(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerEmoji}>🚨</Text>
              <Text style={styles.headerTitle}>Emergency SOS Broadcast</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* ACTIVE DISPATCH STATE */}
          {triggeredAlertId ? (
            <View style={styles.dispatchedContainer}>
              <View style={styles.pulsingIconCircle}>
                <Text style={{ fontSize: 44 }}>🚨</Text>
              </View>
              <Text style={styles.dispatchedTitle}>SIREN BROADCAST ACTIVE</Text>
              <Text style={styles.dispatchedSub}>
                Main Gate Security, Quick Response Team, and Admin desk have received your emergency alert.
              </Text>
              <View style={styles.detailsBox}>
                <Text style={styles.detailsRow}>
                  <Text style={styles.bold}>Alert ID: </Text>{triggeredAlertId}
                </Text>
                <Text style={styles.detailsRow}>
                  <Text style={styles.bold}>Unit: </Text>{user?.flatNumber || 'B-204'} • {user?.name || 'Aditya Sharma'}
                </Text>
                <Text style={styles.detailsRow}>
                  <Text style={styles.bold}>Type: </Text>{EMERGENCY_TYPE_INFO[selectedType].title}
                </Text>
              </View>

              <TouchableOpacity style={styles.cancelAlertBtn} onPress={handleAbortTriggered}>
                <Text style={styles.cancelAlertBtnText}>Cancel Alert (False Alarm)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Close Modal (Alert Remains Active)</Text>
              </TouchableOpacity>
            </View>
          ) : countdown !== null ? (
            /* COUNTDOWN ABORT STATE */
            <View style={styles.countdownContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
              <Text style={styles.countdownTitle}>Broadcasting in {countdown} seconds...</Text>
              <Text style={styles.countdownSub}>
                Alerting Security Desk for <Text style={styles.bold}>{EMERGENCY_TYPE_INFO[selectedType].title}</Text>
              </Text>

              <TouchableOpacity style={styles.abortBtn} onPress={cancelCountdown}>
                <Text style={styles.abortBtnText}>ABORT NOW (Cancel)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* CATEGORY SELECTION STATE */
            <View style={styles.categoryContainer}>
              <Text style={styles.instructionText}>
                Tap your emergency type. You will have 3 seconds to cancel before the siren triggers at the Guard Desk.
              </Text>

              <View style={styles.grid}>
                {(Object.keys(EMERGENCY_TYPE_INFO) as EmergencyType[]).map((type) => {
                  const info = EMERGENCY_TYPE_INFO[type];
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.categoryTile, { backgroundColor: info.bg, borderColor: info.color + '40' }]}
                      onPress={() => startCountdown(type)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.categoryEmoji}>{info.emoji}</Text>
                      <Text style={[styles.categoryTitle, { color: info.color }]}>{info.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.footerNote}>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                <Text style={styles.footerNoteText}>
                  For life-threatening situations outside the society, call 112 directly.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  categoryContainer: {
    width: '100%',
  },
  instructionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  grid: {
    gap: 12,
  },
  categoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  categoryEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  countdownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#BE123C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  countdownTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  countdownSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  abortBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  abortBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dispatchedContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pulsingIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dispatchedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#BE123C',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dispatchedSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  detailsRow: {
    fontSize: 13,
    color: '#475569',
  },
  cancelAlertBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelAlertBtnText: {
    color: '#BE123C',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    paddingVertical: 10,
  },
  doneBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
