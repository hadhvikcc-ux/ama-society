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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSupplierStore, PurchaseOrder, PurchaseOrderStatus } from '../../stores/supplierStore';

export default function SupplierOrders() {
  const router = useRouter();
  const {
    purchaseOrders,
    confirmPurchaseOrder,
    dispatchPurchaseOrder,
    markOrderDelivered,
    generateInvoiceFromPO,
  } = useSupplierStore();

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Dispatch Modal State
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [targetPO, setTargetPO] = useState<PurchaseOrder | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('KA-04-E-8821');
  const [vehicleType, setVehicleType] = useState('Water Tanker (12KL)');
  const [driverName, setDriverName] = useState('Suresh Yadav');
  const [driverPhone, setDriverPhone] = useState('+91 98860 77123');
  const [meterStart, setMeterStart] = useState('');

  const filteredPOs = purchaseOrders.filter((po) => {
    if (activeFilter === 'ALL') return true;
    return po.status === activeFilter;
  });

  const handleOpenDispatch = (po: PurchaseOrder) => {
    setTargetPO(po);
    // Suggest vehicle type based on PO items
    const itemName = po.items[0]?.name.toLowerCase() || '';
    if (itemName.includes('water')) {
      setVehicleType('Water Tanker (12KL)');
    } else if (itemName.includes('diesel')) {
      setVehicleType('Diesel Bowser (1KL)');
    } else {
      setVehicleType('Flatbed Delivery Truck');
    }
    setDispatchModalVisible(true);
  };

  const handleConfirmDispatch = () => {
    if (!targetPO) return;
    if (!vehicleNumber.trim() || !driverName.trim() || !driverPhone.trim()) {
      Alert.alert('Incomplete Info', 'Please fill in vehicle plate, driver name, and driver contact number.');
      return;
    }

    const challan = dispatchPurchaseOrder(targetPO.id, {
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      meterStart: meterStart.trim() || undefined,
    });

    setDispatchModalVisible(false);
    Alert.alert(
      '🚚 Truck Dispatched & Gate Inward Pass Generated!',
      `Pass Code: ${challan.passCode}\nVehicle: ${challan.vehicleNumber}\nDriver: ${challan.driverName}\n\nSecurity guard at society main gate can scan or enter ${challan.passCode} to verify truck entry.`,
      [
        { text: 'View Gate Pass', onPress: () => router.push('/(supplier)/challans') },
        { text: 'OK' },
      ]
    );
  };

  const handleCreateInvoice = (po: PurchaseOrder) => {
    const inv = generateInvoiceFromPO(po.id);
    Alert.alert(
      '🧾 GST B2B Invoice Generated!',
      `Invoice Number: ${inv.invoiceNumber}\nAmount: ₹${inv.totalAmount.toLocaleString('en-IN')}\n\nInvoice has been dispatched to society estate office and logged into the Khata ledger.`,
      [
        { text: 'View in Invoices & Khata', onPress: () => router.push('/(supplier)/invoices') },
        { text: 'OK' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Status Filter Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { key: 'ALL', label: 'All Orders' },
            { key: PurchaseOrderStatus.NEW_PO, label: 'New POs' },
            { key: PurchaseOrderStatus.CONFIRMED, label: 'Confirmed' },
            { key: PurchaseOrderStatus.DISPATCHED, label: 'In-Transit' },
            { key: PurchaseOrderStatus.DELIVERED, label: 'Delivered' },
            { key: PurchaseOrderStatus.INVOICED, label: 'Invoiced' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, activeFilter === tab.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[styles.filterChipText, activeFilter === tab.key && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredPOs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Purchase Orders Found</Text>
            <Text style={styles.emptySub}>No orders match the selected filter.</Text>
          </View>
        ) : (
          filteredPOs.map((po) => {
            const isNew = po.status === PurchaseOrderStatus.NEW_PO;
            const isConfirmed = po.status === PurchaseOrderStatus.CONFIRMED;
            const isDispatched = po.status === PurchaseOrderStatus.DISPATCHED;
            const isDelivered = po.status === PurchaseOrderStatus.DELIVERED;
            const isInvoiced = po.status === PurchaseOrderStatus.INVOICED;

            return (
              <View key={po.id} style={styles.poCard}>
                {/* Top Row: PO Number & Urgency */}
                <View style={styles.poHeaderRow}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.poNum}>{po.poNumber}</Text>
                      {po.urgency === 'CRITICAL' && (
                        <View style={styles.criticalBadge}>
                          <Text style={styles.criticalText}>CRITICAL</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.poSociety}>{po.societyName}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isNew && styles.statusPillNew,
                      isConfirmed && styles.statusPillConfirmed,
                      isDispatched && styles.statusPillDispatched,
                      isDelivered && styles.statusPillDelivered,
                      isInvoiced && styles.statusPillInvoiced,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isNew && styles.statusTextNew,
                        isConfirmed && styles.statusTextConfirmed,
                        isDispatched && styles.statusTextDispatched,
                        isDelivered && styles.statusTextDelivered,
                        isInvoiced && styles.statusTextInvoiced,
                      ]}
                    >
                      {po.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Items Table */}
                <View style={styles.itemsTable}>
                  {po.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemDesc}>{item.description}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.itemQty}>
                          {item.quantity} {item.unit}
                        </Text>
                        <Text style={styles.itemRate}>@ ₹{item.unitPrice.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Location & Instructions */}
                <View style={styles.detailBox}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      <Text style={{ fontWeight: '600' }}>Drop Bay: </Text>
                      {po.deliveryLocation}
                    </Text>
                  </View>
                  {po.specialInstructions && (
                    <View style={[styles.detailRow, { marginTop: 4 }]}>
                      <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
                      <Text style={[styles.detailText, { color: '#B45309' }]}>
                        {po.specialInstructions}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Pricing Breakdown */}
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.subtotalLabel}>Subtotal: ₹{po.subtotal.toLocaleString('en-IN')}</Text>
                    <Text style={styles.gstLabel}>GST ({po.gstRate}%): ₹{po.gstAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.totalLabel}>Total PO Value</Text>
                    <Text style={styles.totalValue}>₹{po.totalAmount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Contextual Action Buttons */}
                <View style={styles.actionRow}>
                  {isNew && (
                    <TouchableOpacity
                      style={[styles.btnPrimary, { backgroundColor: '#0D9488' }]}
                      onPress={() => confirmPurchaseOrder(po.id)}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                      <Text style={styles.btnPrimaryText}>Acknowledge & Confirm PO</Text>
                    </TouchableOpacity>
                  )}

                  {isConfirmed && (
                    <TouchableOpacity
                      style={[styles.btnPrimary, { backgroundColor: '#2563EB' }]}
                      onPress={() => handleOpenDispatch(po)}
                    >
                      <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                      <Text style={styles.btnPrimaryText}>Dispatch Truck & Issue Inward Pass</Text>
                    </TouchableOpacity>
                  )}

                  {isDispatched && (
                    <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
                      <TouchableOpacity
                        style={[styles.btnSecondary, { flex: 1 }]}
                        onPress={() => router.push('/(supplier)/challans')}
                      >
                        <Ionicons name="barcode-outline" size={16} color="#0D9488" />
                        <Text style={styles.btnSecondaryText}>View Gate Pass</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnPrimary, { backgroundColor: '#059669', flex: 1.2 }]}
                        onPress={() => markOrderDelivered(po.id)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.btnPrimaryText}>Confirm Delivered</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isDelivered && (
                    <TouchableOpacity
                      style={[styles.btnPrimary, { backgroundColor: '#D97706' }]}
                      onPress={() => handleCreateInvoice(po)}
                    >
                      <Ionicons name="document-text" size={16} color="#FFFFFF" />
                      <Text style={styles.btnPrimaryText}>Generate B2B GST Tax Invoice</Text>
                    </TouchableOpacity>
                  )}

                  {isInvoiced && (
                    <TouchableOpacity
                      style={[styles.btnSecondary, { borderColor: '#BBF7D0' }]}
                      onPress={() => router.push('/(supplier)/invoices')}
                    >
                      <Ionicons name="wallet-outline" size={16} color="#16A34A" />
                      <Text style={[styles.btnSecondaryText, { color: '#16A34A' }]}>View Invoice & Khata</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Dispatch Truck & Generate Gate Inward Pass Modal */}
      <Modal visible={dispatchModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Dispatch Delivery Vehicle</Text>
                <Text style={styles.modalSub}>{targetPO?.poNumber} • {targetPO?.societyName}</Text>
              </View>
              <TouchableOpacity onPress={() => setDispatchModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Vehicle Number Plate (Mandatory for Gate Barrier)</Text>
              <TextInput
                style={styles.input}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="e.g. KA-04-E-8821"
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Vehicle Type</Text>
              <TextInput
                style={styles.input}
                value={vehicleType}
                onChangeText={setVehicleType}
                placeholder="e.g. Water Tanker (12KL), Diesel Bowser"
              />

              <Text style={styles.inputLabel}>Driver Name</Text>
              <TextInput
                style={styles.input}
                value={driverName}
                onChangeText={setDriverName}
                placeholder="Driver full name"
              />

              <Text style={styles.inputLabel}>Driver Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={driverPhone}
                onChangeText={setDriverPhone}
                placeholder="+91 98860 00000"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Initial Meter / Dip Reading (Optional)</Text>
              <TextInput
                style={styles.input}
                value={meterStart}
                onChangeText={setMeterStart}
                placeholder="e.g. 45,820 L or Full Level Dip"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btnSecondary, { flex: 1 }]}
                onPress={() => setDispatchModalVisible(false)}
              >
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, { flex: 2, backgroundColor: '#0D9488' }]}
                onPress={handleConfirmDispatch}
              >
                <Ionicons name="barcode-outline" size={18} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Generate Gate Pass</Text>
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
  filterContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 10 },
  filterRow: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: '#0D9488' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },

  listContent: { padding: 16 },
  emptyCard: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#64748B', marginTop: 4 },

  poCard: {
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
  poHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  poNum: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  poSociety: { fontSize: 12, color: '#64748B', marginTop: 2 },
  criticalBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  criticalText: { fontSize: 9, fontWeight: '800', color: '#B91C1C' },

  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPillNew: { backgroundColor: '#FEF2F2' },
  statusPillConfirmed: { backgroundColor: '#EFF6FF' },
  statusPillDispatched: { backgroundColor: '#F0FDFA' },
  statusPillDelivered: { backgroundColor: '#F0FDF4' },
  statusPillInvoiced: { backgroundColor: '#FAF5FF' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  statusTextNew: { color: '#B91C1C' },
  statusTextConfirmed: { color: '#1D4ED8' },
  statusTextDispatched: { color: '#0D9488' },
  statusTextDelivered: { color: '#15803D' },
  statusTextInvoiced: { color: '#7E22CE' },

  itemsTable: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  itemDesc: { fontSize: 11, color: '#64748B' },
  itemQty: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  itemRate: { fontSize: 11, color: '#64748B' },

  detailBox: { backgroundColor: '#F1F5F9', borderRadius: 8, padding: 8, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: '#334155', flexShrink: 1 },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 12,
  },
  subtotalLabel: { fontSize: 11, color: '#64748B' },
  gstLabel: { fontSize: 11, color: '#64748B' },
  totalLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: '600' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#0D9488' },

  actionRow: { flexDirection: 'row', gap: 8 },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  btnSecondaryText: { color: '#0D9488', fontSize: 13, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
});
