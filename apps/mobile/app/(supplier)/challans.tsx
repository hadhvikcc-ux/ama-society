import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useSupplierStore, DeliveryChallan, DeliveryChallanStatus } from '../../stores/supplierStore';

export default function SupplierChallans() {
  const {
    deliveryChallans,
    createDeliveryChallan,
    updateChallanGateStatus,
  } = useSupplierStore();

  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);
  const [newModalVisible, setNewModalVisible] = useState(false);

  // New Challan Form
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Water Tanker (12KL)');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [materialsSummary, setMaterialsSummary] = useState('');
  const [poNumber, setPoNumber] = useState('PO-2026-0812');

  const handleCreateChallan = () => {
    if (!vehicleNumber.trim() || !driverName.trim() || !driverPhone.trim() || !materialsSummary.trim()) {
      Alert.alert('Incomplete Form', 'Please enter vehicle registration, driver details, and materials description.');
      return;
    }

    const challanNumber = `DC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDc = createDeliveryChallan({
      challanNumber,
      poId: 'po-custom',
      poNumber: poNumber.trim() || 'PO-2026-ADHOC',
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      materialsSummary: materialsSummary.trim(),
      dispatchedAt: new Date().toISOString(),
      gateStatus: DeliveryChallanStatus.DISPATCHED,
    });

    setNewModalVisible(false);
    setSelectedChallan(newDc);
    Alert.alert('Gate Inward Pass Created', `Inward Pass Code: ${newDc.passCode}\nVehicle: ${newDc.vehicleNumber}`);
  };

  const handleShareToDriver = (dc: DeliveryChallan) => {
    const text = `🚚 *AMA Gate Inward Delivery Pass*\n\n` +
      `*Pass Code:* ${dc.passCode}\n` +
      `*Vehicle:* ${dc.vehicleNumber}\n` +
      `*Destination:* Orchid Towers, Sector 45, Gurugram (Gate 1)\n` +
      `*PO Ref:* ${dc.poNumber}\n` +
      `*Material:* ${dc.materialsSummary}\n` +
      `*Driver:* ${dc.driverName}\n\n` +
      `Show this 6-digit pass code to the security guard at the main entrance gate for barrier clearance.`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = dc.driverPhone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('WhatsApp Not Available', text);
      });
    }
  };

  const handleSimulateGateCheckIn = (dc: DeliveryChallan) => {
    updateChallanGateStatus(
      dc.id,
      DeliveryChallanStatus.INSPECTED,
      'Bahadur Singh (Security Gate 1)',
      'Vehicle gross weight & seal verified. Barrier opened for unloading bay.'
    );
    Alert.alert('Gate Barrier Check-In Recorded', `Guard Bahadur Singh verified ${dc.vehicleNumber} and marked status INSPECTED.`);
  };

  return (
    <View style={styles.container}>
      {/* Top Banner Action */}
      <View style={styles.topActionBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Digital Gate Inward Passes</Text>
          <Text style={styles.bannerSub}>QR tokens verified by security guards at society entrance</Text>
        </View>
        <TouchableOpacity
          style={styles.newChallanBtn}
          onPress={() => setNewModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newChallanBtnText}>+ New Pass</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {deliveryChallans.map((dc) => {
          const isOffloaded = dc.gateStatus === DeliveryChallanStatus.OFFLOADED;
          const isInspected = dc.gateStatus === DeliveryChallanStatus.INSPECTED;
          const isAtGate = dc.gateStatus === DeliveryChallanStatus.AT_GATE;
          const isDispatched = dc.gateStatus === DeliveryChallanStatus.DISPATCHED;

          return (
            <View key={dc.id} style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.vehicleBadge}>
                    <Ionicons name="bus" size={20} color="#0D9488" />
                  </View>
                  <View>
                    <Text style={styles.vehiclePlate}>{dc.vehicleNumber}</Text>
                    <Text style={styles.vehicleType}>{dc.vehicleType}</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isOffloaded && styles.badgeOffloaded,
                    isInspected && styles.badgeInspected,
                    isAtGate && styles.badgeAtGate,
                    isDispatched && styles.badgeDispatched,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{dc.gateStatus.replace('_', ' ')}</Text>
                </View>
              </View>

              {/* Inward Pass Highlight Box */}
              <View style={styles.passHighlightBox}>
                <View style={styles.passCodeCol}>
                  <Text style={styles.passLabel}>GATE INWARD TOKEN</Text>
                  <Text style={styles.passCodeBig}>{dc.passCode}</Text>
                  <Text style={styles.challanNum}>Challan: {dc.challanNumber}</Text>
                </View>

                <TouchableOpacity
                  style={styles.qrThumbnailBox}
                  onPress={() => setSelectedChallan(dc)}
                  activeOpacity={0.8}
                >
                  <QRCode value={dc.qrCodeData} size={64} color="#0F172A" backgroundColor="#FFFFFF" />
                  <Text style={styles.tapToEnlarge}>Tap to View</Text>
                </TouchableOpacity>
              </View>

              {/* Delivery Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={14} color="#64748B" />
                  <Text style={styles.detailVal}>Driver: {dc.driverName} ({dc.driverPhone})</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={14} color="#64748B" />
                  <Text style={styles.detailVal}>PO Ref: {dc.poNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cube-outline" size={14} color="#64748B" />
                  <Text style={styles.detailVal} numberOfLines={1}>Materials: {dc.materialsSummary}</Text>
                </View>
                {dc.meterStart && (
                  <View style={styles.detailRow}>
                    <Ionicons name="speedometer-outline" size={14} color="#64748B" />
                    <Text style={styles.detailVal}>Meter: {dc.meterStart} {dc.meterEnd ? `&rarr; ${dc.meterEnd}` : ''}</Text>
                  </View>
                )}
                {dc.inspectedByGuard && (
                  <View style={[styles.detailRow, { backgroundColor: '#F0FDF4', padding: 6, borderRadius: 6 }]}>
                    <Ionicons name="shield-checkmark" size={14} color="#16A34A" />
                    <Text style={[styles.detailVal, { color: '#166534' }]}>
                      Guard: {dc.inspectedByGuard} {dc.securityNotes ? `• ${dc.securityNotes}` : ''}
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions Footer */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.btnShareWhatsApp}
                  onPress={() => handleShareToDriver(dc)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.btnShareWhatsAppText}>Send Pass to Driver</Text>
                </TouchableOpacity>

                {isDispatched && (
                  <TouchableOpacity
                    style={styles.btnSimulateGuard}
                    onPress={() => handleSimulateGateCheckIn(dc)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={15} color="#0D9488" />
                    <Text style={styles.btnSimulateGuardText}>Gate Entry</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Large QR Code Lightbox Modal */}
      <Modal visible={!!selectedChallan} transparent animationType="fade">
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrModalHeader}>
              <View>
                <Text style={styles.qrModalTitle}>Society Gate Inward Pass</Text>
                <Text style={styles.qrModalSub}>{selectedChallan?.vehicleNumber} • {selectedChallan?.vehicleType}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedChallan(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrLargeContainer}>
              {selectedChallan && (
                <QRCode
                  value={selectedChallan.qrCodeData}
                  size={200}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              )}
              <View style={styles.qrCodeHighlightBox}>
                <Text style={styles.qrTokenText}>{selectedChallan?.passCode}</Text>
              </View>
              <Text style={styles.qrInstruct}>Show to Security Guard at Main Gate</Text>
            </View>

            <View style={styles.qrMetaList}>
              <Text style={styles.qrMetaItem}><Text style={{ fontWeight: '700' }}>Driver: </Text>{selectedChallan?.driverName} ({selectedChallan?.driverPhone})</Text>
              <Text style={styles.qrMetaItem}><Text style={{ fontWeight: '700' }}>Destination: </Text>Orchid Towers, Sector 45</Text>
              <Text style={styles.qrMetaItem}><Text style={{ fontWeight: '700' }}>Material: </Text>{selectedChallan?.materialsSummary}</Text>
            </View>

            <TouchableOpacity
              style={styles.qrCloseBtn}
              onPress={() => setSelectedChallan(null)}
            >
              <Text style={styles.qrCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Challan Creation Modal */}
      <Modal visible={newModalVisible} transparent animationType="slide">
        <View style={styles.formModalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>Issue Gate Inward Pass</Text>
              <TouchableOpacity onPress={() => setNewModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Vehicle Number Plate *</Text>
              <TextInput
                style={styles.input}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="e.g. KA-04-E-8821"
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Vehicle Type *</Text>
              <TextInput
                style={styles.input}
                value={vehicleType}
                onChangeText={setVehicleType}
                placeholder="e.g. Water Tanker (12KL), Diesel Bowser"
              />

              <Text style={styles.inputLabel}>Driver Name *</Text>
              <TextInput
                style={styles.input}
                value={driverName}
                onChangeText={setDriverName}
                placeholder="Driver full name"
              />

              <Text style={styles.inputLabel}>Driver Mobile Number *</Text>
              <TextInput
                style={styles.input}
                value={driverPhone}
                onChangeText={setDriverPhone}
                placeholder="+91 98860 00000"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Materials Description *</Text>
              <TextInput
                style={styles.input}
                value={materialsSummary}
                onChangeText={setMaterialsSummary}
                placeholder="e.g. 12,000L Potable Water Tanker"
              />

              <Text style={styles.inputLabel}>Linked PO Number</Text>
              <TextInput
                style={styles.input}
                value={poNumber}
                onChangeText={setPoNumber}
                placeholder="e.g. PO-2026-0812"
              />
            </ScrollView>

            <View style={styles.formModalActions}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setNewModalVisible(false)}
              >
                <Text style={styles.formCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.formSubmitBtn}
                onPress={handleCreateChallan}
              >
                <Ionicons name="barcode-outline" size={18} color="#FFFFFF" />
                <Text style={styles.formSubmitBtnText}>Generate Pass</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topActionBanner: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  bannerSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  newChallanBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newChallanBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  listContent: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  vehicleBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center' },
  vehiclePlate: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  vehicleType: { fontSize: 11, color: '#64748B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeDispatched: { backgroundColor: '#EFF6FF' },
  badgeAtGate: { backgroundColor: '#FEF3C7' },
  badgeInspected: { backgroundColor: '#F0FDFA' },
  badgeOffloaded: { backgroundColor: '#F0FDF4' },
  statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#0F172A' },

  passHighlightBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passCodeCol: { flex: 1 },
  passLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  passCodeBig: { fontSize: 24, fontWeight: '900', color: '#0D9488', letterSpacing: 1, marginVertical: 2 },
  challanNum: { fontSize: 11, color: '#64748B' },
  qrThumbnailBox: { alignItems: 'center', backgroundColor: '#FFFFFF', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  tapToEnlarge: { fontSize: 9, fontWeight: '600', color: '#64748B', marginTop: 4 },

  detailsGrid: { gap: 6, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailVal: { fontSize: 12, color: '#334155', flexShrink: 1 },

  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  btnShareWhatsApp: {
    flex: 1,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  btnShareWhatsAppText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  btnSimulateGuard: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnSimulateGuardText: { color: '#0D9488', fontSize: 12, fontWeight: '700' },

  qrModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  qrModalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, alignItems: 'center' },
  qrModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  qrModalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  qrModalSub: { fontSize: 12, color: '#64748B' },
  qrLargeContainer: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  qrCodeHighlightBox: { backgroundColor: '#F0FDFA', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#99F6E4' },
  qrTokenText: { fontSize: 24, fontWeight: '900', color: '#0D9488', letterSpacing: 2 },
  qrInstruct: { fontSize: 11, color: '#64748B', marginTop: 8 },
  qrMetaList: { width: '100%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginVertical: 12, gap: 4 },
  qrMetaItem: { fontSize: 12, color: '#334155' },
  qrCloseBtn: { backgroundColor: '#0D9488', width: '100%', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  qrCloseBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  formModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  formModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  formModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  formModalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#0F172A' },
  formModalActions: { flexDirection: 'row', gap: 10, marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  formCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  formCancelBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  formSubmitBtn: { flex: 2, backgroundColor: '#0D9488', paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  formSubmitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
