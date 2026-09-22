import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useAuthStore } from '../../stores/authStore';

interface ReportWrongParkingModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReportWrongParkingModal: React.FC<ReportWrongParkingModalProps> = ({
  visible,
  onClose,
}) => {
  const { reportWrongParking, getAllottedSlotForFlat } = useVehicleStore();
  const { user } = useAuthStore();

  const userFlat = user?.flatNumber || 'B-204';
  const defaultSlot = getAllottedSlotForFlat(userFlat) || 'B1-P14';

  const [slotNumber, setSlotNumber] = useState(defaultSlot);
  const [offendingPlate, setOffendingPlate] = useState('');
  const [notes, setNotes] = useState('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleSubmit = () => {
    if (!offendingPlate.trim()) {
      Alert.alert('Plate Number Required', 'Please enter the license plate of the vehicle parked in your spot.');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const alert = reportWrongParking({
      reportedByFlat: userFlat,
      reportedByPhone: user?.phone || '9820199001',
      slotNumber: slotNumber.trim(),
      offendingPlate: offendingPlate.trim().toUpperCase(),
      notes: notes.trim() || 'Vehicle blocking assigned reserved parking slot.',
    });

    Alert.alert(
      'Security Alert Dispatched',
      `Alert #${alert.id} sent to Main Gate Guard desk.\n\nGuard is contacting the owner of ${alert.offendingPlate} to clear slot ${alert.slotNumber}.`
    );

    setOffendingPlate('');
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={{ fontSize: 24 }}>⚠️</Text>
              <Text style={styles.headerTitle}>Report Unauthorized Parking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subTitle}>
            Is another vehicle parked in your reserved slot? Send an instant alert with plate lookup to the Guard Desk.
          </Text>

          <Text style={styles.inputLabel}>Your Reserved Parking Slot</Text>
          <TextInput
            style={styles.textInput}
            value={slotNumber}
            onChangeText={setSlotNumber}
            placeholder="e.g. B1-P14"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Offending Vehicle Plate Number *</Text>
          <TextInput
            style={[styles.textInput, { fontSize: 16, fontWeight: '800', letterSpacing: 1 }]}
            value={offendingPlate}
            onChangeText={setOffendingPlate}
            placeholder="e.g. DL 01 AB 1234"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />

          <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, { height: 60 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Silver sedan with hazard lights off, parked since morning"
            placeholderTextColor="#94A3B8"
            multiline
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Ionicons name="alert-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Dispatch Alert to Guard Desk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C2410C',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 22,
    marginBottom: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
