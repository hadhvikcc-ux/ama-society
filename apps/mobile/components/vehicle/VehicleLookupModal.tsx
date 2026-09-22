import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useVehicleStore, RegisteredVehicle } from '../../stores/vehicleStore';
import { useCallStore } from '../../stores/callStore';

interface VehicleLookupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VehicleLookupModal: React.FC<VehicleLookupModalProps> = ({ visible, onClose }) => {
  const { vehicles, searchByPlate } = useVehicleStore();
  const { startInAppCall } = useCallStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<RegisteredVehicle | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const filteredVehicles = searchQuery.trim()
    ? vehicles.filter(
        (v) =>
          v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.normalizedPlate.includes(searchQuery.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) ||
          v.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : vehicles;

  const handleCallOwner = (vehicle: RegisteredVehicle) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    startInAppCall(
      {
        id: vehicle.id,
        name: vehicle.ownerName,
        flat: vehicle.flatNumber,
        phone: vehicle.ownerPhone,
        role: 'Resident',
        category: 'resident',
      },
      'AUDIO'
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={{ fontSize: 24 }}>🚗</Text>
              <Text style={styles.headerTitle}>Vehicle Plate &amp; Parking Lookup</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subTitle}>
            Instantly identify vehicle owners, resolve parking blocks, and verify society entry stickers.
          </Text>

          {/* Search Input */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Enter plate number (e.g. DL 08 CC 9988) or unit..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {filteredVehicles.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 32 }}>🔍</Text>
                <Text style={styles.emptyTitle}>No Matching Vehicle</Text>
                <Text style={styles.emptySub}>
                  Vehicle plate "{searchQuery}" is not registered to any resident. May be an external visitor.
                </Text>
              </View>
            ) : (
              filteredVehicles.map((v) => (
                <View key={v.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleTop}>
                    <View>
                      <View style={styles.plateRow}>
                        <View style={styles.indTag}>
                          <Text style={styles.indText}>IND</Text>
                        </View>
                        <Text style={styles.plateText}>{v.plateNumber}</Text>
                      </View>
                      <Text style={styles.modelText}>
                        {v.makeModel} • {v.vehicleType}
                      </Text>
                    </View>

                    <View style={styles.slotBadge}>
                      <Text style={styles.slotBadgeText}>{v.allottedSlot}</Text>
                    </View>
                  </View>

                  <View style={styles.ownerRow}>
                    <View>
                      <Text style={styles.ownerLabel}>REGISTERED RESIDENT</Text>
                      <Text style={styles.ownerName}>
                        {v.ownerName} • Unit {v.flatNumber} ({v.tower})
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.callBtn} onPress={() => handleCallOwner(v)}>
                      <Ionicons name="call" size={14} color="#FFFFFF" />
                      <Text style={styles.callBtnText}>Call Owner</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
    maxWidth: 520,
    maxHeight: '85%',
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  list: {
    maxHeight: 380,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
  },
  vehicleCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  vehicleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  indTag: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  indText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  plateText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  modelText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    fontWeight: '600',
  },
  slotBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  ownerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  ownerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  ownerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
