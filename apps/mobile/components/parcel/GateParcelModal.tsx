import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useParcelStore,
  CourierCompany,
  GateParcel,
  COURIER_ICONS,
} from '../../stores/parcelStore';

interface GateParcelModalProps {
  visible: boolean;
  onClose: () => void;
  targetParcel?: GateParcel | null;
}

const COURIER_LIST: CourierCompany[] = [
  'Amazon',
  'Flipkart',
  'Swiggy Instamart',
  'Zomato / Blinkit',
  'BlueDart',
  'India Post',
  'Courier / Other',
];

export const GateParcelModal: React.FC<GateParcelModalProps> = ({
  visible,
  onClose,
  targetParcel,
}) => {
  const { logParcel, verifyAndHandover } = useParcelStore();

  const isHandoverMode = !!targetParcel;

  // Intake state
  const [courier, setCourier] = useState<CourierCompany>('Amazon');
  const [flatNumber, setFlatNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [itemCount, setItemCount] = useState('1');
  const [notes, setNotes] = useState('');

  // Handover state
  const [enteredPin, setEnteredPin] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleIntakeSubmit = () => {
    if (!flatNumber.trim()) {
      Alert.alert('Missing Unit', 'Please enter resident flat number (e.g. B-204).');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const parcel = logParcel({
      courier,
      flatNumber: flatNumber.trim().toUpperCase(),
      recipientName: recipientName.trim() || 'Resident',
      itemCount: parseInt(itemCount, 10) || 1,
      notes: notes.trim() || `Placed on Locker Shelf ${flatNumber.trim().toUpperCase()}`,
      intakeGuard: 'Main Gate Guard',
    });

    Alert.alert(
      'Parcel Logged Successfully',
      `4-Digit Pickup PIN: ${parcel.pickupPin}\n\nNotification sent to ${parcel.flatNumber}.`
    );

    // Reset
    setFlatNumber('');
    setRecipientName('');
    setItemCount('1');
    setNotes('');
    onClose();
  };

  const handleHandoverSubmit = () => {
    if (!targetParcel) return;
    if (!enteredPin.trim()) {
      setErrorMsg('Please enter the 4-digit pickup PIN.');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const res = verifyAndHandover(
      targetParcel.id,
      enteredPin.trim(),
      collectedBy.trim() || 'Resident (Verified)'
    );

    if (res.success) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert('Handover Complete', res.message);
      setEnteredPin('');
      setCollectedBy('');
      setErrorMsg(null);
      onClose();
    } else {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      setErrorMsg(res.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={{ fontSize: 24 }}>{isHandoverMode ? '🔑' : '📦'}</Text>
              <Text style={styles.headerTitle}>
                {isHandoverMode ? 'Verify Parcel Handover' : 'Log Delivery at Gate Desk'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          {isHandoverMode ? (
            /* HANDOVER / PIN VERIFICATION MODE */
            <View style={styles.handoverBox}>
              <View style={styles.parcelSummaryBox}>
                <Text style={styles.summaryTitle}>
                  {targetParcel?.courier} Delivery for Unit {targetParcel?.flatNumber}
                </Text>
                <Text style={styles.summarySub}>
                  {targetParcel?.recipientName} • {targetParcel?.itemCount} packages
                </Text>
                {targetParcel?.notes && (
                  <Text style={styles.summaryNotes}>Locker: {targetParcel.notes}</Text>
                )}
              </View>

              <Text style={styles.inputLabel}>Enter Resident 4-Digit Pickup PIN</Text>
              <TextInput
                style={styles.pinInput}
                value={enteredPin}
                onChangeText={(text) => {
                  setEnteredPin(text);
                  setErrorMsg(null);
                }}
                keyboardType="numeric"
                maxLength={4}
                placeholder="• • • •"
                placeholderTextColor="#94A3B8"
              />

              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

              <Text style={styles.inputLabel}>Collected By (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={collectedBy}
                onChangeText={setCollectedBy}
                placeholder="Resident / Maid / Family Member"
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleHandoverSubmit}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Verify PIN & Release Parcel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* INTAKE MODE */
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Courier Selector */}
              <Text style={styles.inputLabel}>Select Courier / Delivery App</Text>
              <View style={styles.courierGrid}>
                {COURIER_LIST.map((c) => {
                  const info = COURIER_ICONS[c];
                  const selected = courier === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.courierChip,
                        selected && { borderColor: '#4338CA', backgroundColor: '#EEF2FF' },
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setCourier(c);
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{info.emoji}</Text>
                      <Text
                        style={[
                          styles.courierChipText,
                          selected && { color: '#4338CA', fontWeight: '800' },
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Resident Unit */}
              <Text style={styles.inputLabel}>Flat Number *</Text>
              <TextInput
                style={styles.textInput}
                value={flatNumber}
                onChangeText={setFlatNumber}
                placeholder="e.g. B-204"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />

              {/* Recipient Name */}
              <Text style={styles.inputLabel}>Recipient Name (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Resident Name"
                placeholderTextColor="#94A3B8"
              />

              {/* Number of Packages */}
              <Text style={styles.inputLabel}>Number of Items</Text>
              <TextInput
                style={styles.textInput}
                value={itemCount}
                onChangeText={setItemCount}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#94A3B8"
              />

              {/* Locker / Location Notes */}
              <Text style={styles.inputLabel}>Locker Shelf / Placement Note</Text>
              <TextInput
                style={[styles.textInput, { height: 64 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Placed on Shelf B2"
                placeholderTextColor="#94A3B8"
                multiline
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleIntakeSubmit}>
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Generate Pickup PIN & Notify Resident</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
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
    maxHeight: '90%',
    borderRadius: 24,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  courierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  courierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  courierChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4338CA',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  handoverBox: {
    paddingTop: 8,
  },
  parcelSummaryBox: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  summarySub: {
    fontSize: 13,
    color: '#4338CA',
    marginTop: 4,
    fontWeight: '600',
  },
  summaryNotes: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 4,
  },
  pinInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#4338CA',
    borderRadius: 14,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '900',
    color: '#4338CA',
    textAlign: 'center',
    letterSpacing: 10,
  },
  errorText: {
    color: '#BE123C',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
});
