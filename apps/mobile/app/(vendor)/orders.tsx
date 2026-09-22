import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBazaarStore, BazaarOrder, OrderStatus } from '../../stores/bazaarStore';
import {
  downloadReceiptPdf,
  shareReceiptPdf,
  formatWhatsAppReceiptMessage,
  normalizeOrderItems,
} from '../../utils/receiptPdfGenerator';
import { WhatsAppPdfModal } from '../../components/bazaar/WhatsAppPdfModal';

export default function VendorOrders() {
  const router = useRouter();
  const { orders, updateOrderStatus, updateOrderDetails } = useBazaarStore();
  const [activeTab, setActiveTab] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Edit Order Details Modal
  const [editingOrder, setEditingOrder] = useState<BazaarOrder | null>(null);
  const [editName, setEditName] = useState('');
  const [editFlat, setEditFlat] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // WhatsApp PDF Modal State
  const [whatsAppModalVisible, setWhatsAppModalVisible] = useState(false);
  const [selectedWhatsAppOrder, setSelectedWhatsAppOrder] = useState<BazaarOrder | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEdit = (order: BazaarOrder) => {
    setEditingOrder(order);
    setEditName(order.customerName);
    setEditFlat(order.customerFlat);
    setEditPhone(order.customerPhone || '');
    setEditNotes(order.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingOrder) return;
    if (!editName.trim()) {
      showToast('⚠️ Customer name cannot be empty');
      return;
    }

    updateOrderDetails(editingOrder.id, {
      customerName: editName.trim(),
      customerFlat: editFlat.trim() || editingOrder.customerFlat,
      customerPhone: editPhone.trim() || editingOrder.customerPhone,
      notes: editNotes.trim() || editingOrder.notes,
    });

    setEditingOrder(null);
    showToast(`✓ Updated details for #${editingOrder.orderNumber}`);
  };

  // True PDF Download (.pdf file)
  const handleDownloadOrderPdf = (order: BazaarOrder) => {
    try {
      const fileName = downloadReceiptPdf(order);
      if (fileName) {
        showToast(`✓ Downloaded ${fileName}`);
      } else {
        router.push(`/receipts?orderId=${encodeURIComponent(order.orderNumber)}&download=pdf` as any);
      }
    } catch (e) {
      router.push(`/receipts?orderId=${encodeURIComponent(order.orderNumber)}&download=pdf` as any);
    }
  };

  // WhatsApp Share with PDF Attachment Support & Helper Modal
  const handleShareWhatsAppReceipt = async (order: BazaarOrder) => {
    setSelectedWhatsAppOrder(order);
    try {
      const res = await shareReceiptPdf(order);
      if (res.method === 'download-and-whatsapp' || res.method === 'clipboard-fallback') {
        setWhatsAppModalVisible(true);
      }
      showToast(`✓ PDF generated & WhatsApp opened for #${order.orderNumber}`);
    } catch (e) {
      setWhatsAppModalVisible(true);
    }
  };

  // Filter Orders based on active tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return o.status === 'PENDING';
    if (activeTab === 'Preparing') return o.status === 'PACKED';
    if (activeTab === 'Out for Delivery') return o.status === 'OUT_FOR_DELIVERY';
    if (activeTab === 'Delivered') return o.status === 'DELIVERED';
    if (activeTab === 'Cancelled') return o.status === 'CANCELLED';
    return true;
  });

  // Calculate live statistics
  const totalOrdersCount = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'PACKED':
        return 'Preparing / Packed';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return '#F59E0B';
      case 'PACKED':
        return '#8B5CF6';
      case 'OUT_FOR_DELIVERY':
        return '#3B82F6';
      case 'DELIVERED':
        return '#10B981';
      case 'CANCELLED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderOrder = ({ item }: { item: BazaarOrder }) => (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="receipt-outline" size={16} color="#7C3AED" />
          <Text style={styles.orderId}>{item.orderNumber}</Text>
        </View>
        <Text style={styles.orderTime}>{item.createdAt}</Text>
      </View>

      {/* Customer Info with Quick Edit Button */}
      <View style={styles.customerInfo}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <TouchableOpacity
              style={styles.editNameBtn}
              onPress={() => handleOpenEdit(item)}
            >
              <Ionicons name="pencil" size={12} color="#7C3AED" />
              <Text style={styles.editNameBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {item.customerPhone ? (
            <Text style={styles.customerPhoneText}>📞 {item.customerPhone}</Text>
          ) : null}
          {item.deliveryAddress ? (
            <Text style={styles.customerAddressText} numberOfLines={1}>
              📍 {item.deliveryAddress}
            </Text>
          ) : null}
          {item.notes ? (
            <Text style={styles.customerNotesText}>Note: "{item.notes}"</Text>
          ) : null}
        </View>

        <View style={styles.customerFlatBadge}>
          <Text style={styles.customerFlat}>{item.customerFlat}</Text>
        </View>
      </View>

      {/* Items List */}
      <View style={styles.itemsList}>
        {normalizeOrderItems(item).map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemText}>
              {it.emoji || '📦'} {it.name} x {it.quantity} {it.unit}
            </Text>
            <Text style={styles.itemPrice}>₹{it.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalText}>
            ₹{item.totalAmount}{' '}
            <Text style={styles.paymentMethodText}>({item.paymentMethod})</Text>
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            ● {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Receipt & WhatsApp Actions Row */}
      <View style={styles.receiptActionsRow}>
        <TouchableOpacity
          style={styles.viewPdfBtn}
          onPress={() => handleDownloadOrderPdf(item)}
        >
          <Ionicons name="download-outline" size={14} color="#374151" />
          <Text style={styles.viewPdfBtnText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsAppReceiptBtn}
          onPress={() => handleShareWhatsAppReceipt(item)}
        >
          <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
          <Text style={styles.whatsAppReceiptBtnText}>Send to WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Status Transition Action Buttons */}
      {item.status === 'PENDING' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={() => {
              updateOrderStatus(item.id, 'CANCELLED');
              showToast(`Cancelled order #${item.orderNumber}`);
            }}
          >
            <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
            onPress={() => {
              updateOrderStatus(item.id, 'PACKED');
              showToast(`Order #${item.orderNumber} accepted & packed!`);
            }}
          >
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Accept & Pack</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'PACKED' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
            onPress={() => {
              updateOrderStatus(item.id, 'OUT_FOR_DELIVERY');
              showToast(`Order #${item.orderNumber} dispatched!`);
            }}
          >
            <Ionicons name="bicycle" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Dispatch for Delivery</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'OUT_FOR_DELIVERY' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
            onPress={() => {
              updateOrderStatus(item.id, 'DELIVERED');
              showToast(`Order #${item.orderNumber} marked delivered!`);
            }}
          >
            <Ionicons name="checkmark-done" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Confirm Handover</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Floating Toast */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Dynamic Summary Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{totalOrdersCount}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#10B981' }]}>₹{totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', 'Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item && styles.activeTab]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.tabs}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 600);
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Orders in "{activeTab}"</Text>
            <Text style={styles.emptySub}>
              New customer orders from resident checkout will appear here in real-time.
            </Text>
          </View>
        }
      />

      {/* Modal: Edit Order Customer Name & Details */}
      <Modal visible={!!editingOrder} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="create" size={20} color="#7C3AED" />
                <Text style={[styles.modalTitle, { marginLeft: 6 }]}>
                  Edit Order #{editingOrder?.orderNumber}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOrder(null)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Update customer details. Changes immediately update across invoices, POS receipts,
              and WhatsApp downloads.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Customer full name..."
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Flat Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFlat}
                  onChangeText={setEditFlat}
                  placeholder="e.g. B-204"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 98765..."
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Delivery Instructions / Notes</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Special notes..."
                multiline
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingOrder(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save Updates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: WhatsApp PDF Attachment Guidance & Quick Actions */}
      <WhatsAppPdfModal
        visible={whatsAppModalVisible}
        onClose={() => setWhatsAppModalVisible(false)}
        order={selectedWhatsAppOrder}
        onRedownloadPdf={() => selectedWhatsAppOrder && handleDownloadOrderPdf(selectedWhatsAppOrder)}
        onReopenWhatsApp={() => selectedWhatsAppOrder && handleShareWhatsAppReceipt(selectedWhatsAppOrder)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  toastBox: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  toastText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: '#7C3AED', padding: 16, paddingBottom: 24 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  tabsWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabs: { paddingHorizontal: 12, paddingVertical: 12 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  activeTab: { backgroundColor: '#7C3AED' },
  tabText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  orderId: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  orderTime: { fontSize: 12, color: '#6B7280' },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  customerPhoneText: { fontSize: 12, color: '#4B5563', marginTop: 2 },
  customerAddressText: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  customerNotesText: { fontSize: 11, color: '#D97706', fontStyle: 'italic', marginTop: 2 },
  editNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  editNameBtnText: { fontSize: 10, fontWeight: '700', color: '#7C3AED' },
  customerFlatBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customerFlat: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
  itemsList: {
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: { fontSize: 13, color: '#4B5563' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#111827' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  totalLabel: { fontSize: 11, color: '#6B7280' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  paymentMethodText: { fontSize: 11, fontWeight: 'normal', color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  receiptActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewPdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewPdfBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  whatsAppReceiptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  whatsAppReceiptBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  actionRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionBtnText: { fontWeight: 'bold', fontSize: 13 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  modalSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 14 },
  formGroup: { marginBottom: 12 },
  formRow: { flexDirection: 'row' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
  },
  saveBtnText: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },
});
