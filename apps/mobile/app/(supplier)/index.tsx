import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSupplierStore, PurchaseOrder, DeliveryChallan, PurchaseOrderStatus, DeliveryChallanStatus } from '../../stores/supplierStore';

export default function SupplierDashboard() {
  const router = useRouter();
  const { profile, purchaseOrders, deliveryChallans, invoices, ledgerEntries, catalog } = useSupplierStore();

  const activePOs = purchaseOrders.filter(
    (p) => p.status === 'NEW_PO' || p.status === 'CONFIRMED' || p.status === 'DISPATCHED'
  );
  const pendingValue = activePOs.reduce((acc, p) => acc + p.totalAmount, 0);

  const activeDeliveries = deliveryChallans.filter(
    (dc) => dc.gateStatus === 'DISPATCHED' || dc.gateStatus === 'AT_GATE'
  );

  const totalReceivables = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].runningBalance : 0;
  const lowStockCount = catalog.filter((c) => c.stockQuantity < 20).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Supplier Profile Banner */}
      <View style={styles.profileBanner}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={{ fontSize: 26 }}>🚛</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.profileName}>{profile.companyName}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#0D9488" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.profileCategory}>
              GSTIN: {profile.gstin} • {profile.city}
            </Text>
          </View>
        </View>

        <View style={styles.bannerDivider} />

        <View style={styles.bannerMetaRow}>
          <View style={styles.bannerMetaCol}>
            <Text style={styles.metaLabel}>Contracted Society</Text>
            <Text style={styles.metaValue}>Orchid Towers (ORC123)</Text>
          </View>
          <View style={styles.bannerMetaCol}>
            <Text style={styles.metaLabel}>Account Rep</Text>
            <Text style={styles.metaValue}>{profile.contactPerson} ({profile.phone.slice(-5)})</Text>
          </View>
        </View>
      </View>

      {/* Bento Grid Metrics */}
      <Text style={styles.sectionTitle}>Key Metrics & Society Standing</Text>
      <View style={styles.bentoGrid}>
        {/* Metric 1: Active POs */}
        <TouchableOpacity
          style={[styles.bentoCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
          onPress={() => router.push('/(supplier)/orders')}
          activeOpacity={0.85}
        >
          <View style={styles.bentoHeader}>
            <View style={[styles.bentoIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="receipt" size={20} color="#16A34A" />
            </View>
            <Text style={[styles.bentoTag, { color: '#15803D', backgroundColor: '#DCFCE7' }]}>
              {activePOs.length} Open
            </Text>
          </View>
          <Text style={styles.bentoValue}>₹{pendingValue.toLocaleString('en-IN')}</Text>
          <Text style={styles.bentoLabel}>Active Purchase Orders</Text>
        </TouchableOpacity>

        {/* Metric 2: Deliveries / Inward Passes */}
        <TouchableOpacity
          style={[styles.bentoCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
          onPress={() => router.push('/(supplier)/challans')}
          activeOpacity={0.85}
        >
          <View style={styles.bentoHeader}>
            <View style={[styles.bentoIconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="barcode" size={20} color="#2563EB" />
            </View>
            <Text style={[styles.bentoTag, { color: '#1D4ED8', backgroundColor: '#DBEAFE' }]}>
              {activeDeliveries.length} Active
            </Text>
          </View>
          <Text style={styles.bentoValue}>{deliveryChallans.length}</Text>
          <Text style={styles.bentoLabel}>Gate Inward Passes</Text>
        </TouchableOpacity>

        {/* Metric 3: Khata Receivables */}
        <TouchableOpacity
          style={[styles.bentoCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}
          onPress={() => router.push('/(supplier)/invoices')}
          activeOpacity={0.85}
        >
          <View style={styles.bentoHeader}>
            <View style={[styles.bentoIconBox, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="wallet" size={20} color="#EA580C" />
            </View>
            <Text style={[styles.bentoTag, { color: '#C2410C', backgroundColor: '#FFEDD5' }]}>
              Net 30 Khata
            </Text>
          </View>
          <Text style={styles.bentoValue}>₹{totalReceivables.toLocaleString('en-IN')}</Text>
          <Text style={styles.bentoLabel}>Outstanding Receivable</Text>
        </TouchableOpacity>

        {/* Metric 4: Wholesale Inventory */}
        <TouchableOpacity
          style={[styles.bentoCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
          onPress={() => router.push('/(supplier)/catalog')}
          activeOpacity={0.85}
        >
          <View style={styles.bentoHeader}>
            <View style={[styles.bentoIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="layers" size={20} color="#7C3AED" />
            </View>
            {lowStockCount > 0 ? (
              <Text style={[styles.bentoTag, { color: '#B91C1C', backgroundColor: '#FEE2E2' }]}>
                {lowStockCount} Low
              </Text>
            ) : (
              <Text style={[styles.bentoTag, { color: '#6D28D9', backgroundColor: '#EDE9FE' }]}>
                Ready
              </Text>
            )}
          </View>
          <Text style={styles.bentoValue}>{catalog.length} SKUs</Text>
          <Text style={styles.bentoLabel}>Wholesale Materials</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Buttons */}
      <Text style={styles.sectionTitle}>Quick Operations</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(supplier)/challans')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#0D9488' }]}>
            <Ionicons name="car" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.actionBtnTitle}>Gate Inward Pass</Text>
          <Text style={styles.actionBtnSub}>Pass for delivery truck</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(supplier)/orders')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#2563EB' }]}>
            <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.actionBtnTitle}>Fulfill PO</Text>
          <Text style={styles.actionBtnSub}>Review society orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(supplier)/invoices')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#D97706' }]}>
            <Ionicons name="document-text" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.actionBtnTitle}>GST Tax Invoice</Text>
          <Text style={styles.actionBtnSub}>Bill against PO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(supplier)/rfq')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#7C3AED' }]}>
            <Ionicons name="hammer" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.actionBtnTitle}>Society Tender</Text>
          <Text style={styles.actionBtnSub}>Submit quote / bid</Text>
        </TouchableOpacity>
      </View>

      {/* Active In-Transit Delivery Trucks */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Active In-Transit & Gate Deliveries</Text>
        <TouchableOpacity onPress={() => router.push('/(supplier)/challans')}>
          <Text style={styles.seeAllText}>Manage ({deliveryChallans.length}) &rarr;</Text>
        </TouchableOpacity>
      </View>

      {deliveryChallans.slice(0, 2).map((dc) => (
        <View key={dc.id} style={styles.deliveryCard}>
          <View style={styles.deliveryTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.vehicleIconCircle}>
                <Ionicons name="bus-outline" size={22} color="#0D9488" />
              </View>
              <View>
                <Text style={styles.vehiclePlate}>{dc.vehicleNumber}</Text>
                <Text style={styles.vehicleType}>{dc.vehicleType}</Text>
              </View>
            </View>

            <View style={[styles.gateStatusBadge, dc.gateStatus === DeliveryChallanStatus.OFFLOADED ? styles.statusOffloaded : styles.statusDispatched]}>
              <Text style={styles.gateStatusText}>{dc.gateStatus}</Text>
            </View>
          </View>

          <View style={styles.challanInfoBox}>
            <View style={styles.challanInfoRow}>
              <Text style={styles.challanInfoKey}>Pass Token Code:</Text>
              <Text style={styles.challanPassCode}>{dc.passCode}</Text>
            </View>
            <View style={styles.challanInfoRow}>
              <Text style={styles.challanInfoKey}>Driver:</Text>
              <Text style={styles.challanInfoVal}>{dc.driverName} ({dc.driverPhone})</Text>
            </View>
            <View style={styles.challanInfoRow}>
              <Text style={styles.challanInfoKey}>Material:</Text>
              <Text style={styles.challanInfoVal} numberOfLines={1}>{dc.materialsSummary}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Recent Society Purchase Orders */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Purchase Orders from Society</Text>
        <TouchableOpacity onPress={() => router.push('/(supplier)/orders')}>
          <Text style={styles.seeAllText}>All POs ({purchaseOrders.length}) &rarr;</Text>
        </TouchableOpacity>
      </View>

      {purchaseOrders.slice(0, 2).map((po) => (
        <TouchableOpacity
          key={po.id}
          style={styles.poCard}
          onPress={() => router.push('/(supplier)/orders')}
          activeOpacity={0.8}
        >
          <View style={styles.poTopRow}>
            <View>
              <Text style={styles.poNumberText}>{po.poNumber}</Text>
              <Text style={styles.poSocietyText}>{po.societyName}</Text>
            </View>
            <View style={[
              styles.poStatusBadge,
              po.status === PurchaseOrderStatus.NEW_PO && styles.poNewBadge,
              po.status === PurchaseOrderStatus.DELIVERED && styles.poDeliveredBadge,
              po.status === PurchaseOrderStatus.INVOICED && styles.poInvoicedBadge,
            ]}>
              <Text style={styles.poStatusText}>{po.status.replace('_', ' ')}</Text>
            </View>
          </View>

          <Text style={styles.poItemsDesc} numberOfLines={1}>
            {po.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(' • ')}
          </Text>

          <View style={styles.poBottomRow}>
            <Text style={styles.poAmountText}>₹{po.totalAmount.toLocaleString('en-IN')}</Text>
            <Text style={styles.poLocationText} numberOfLines={1}>📍 {po.deliveryLocation}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },

  profileBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  profileCategory: { fontSize: 12, color: '#64748B', marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#0D9488' },
  bannerDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  bannerMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bannerMetaCol: { flex: 1 },
  metaLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  metaValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 },
  seeAllText: { fontSize: 12, fontWeight: '600', color: '#0D9488' },

  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  bentoCard: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  bentoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bentoIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bentoTag: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  bentoValue: { fontSize: 19, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  bentoLabel: { fontSize: 11, fontWeight: '500', color: '#64748B' },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionBtn: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionBtnTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  actionBtnSub: { fontSize: 11, color: '#64748B', marginTop: 2 },

  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  vehicleIconCircle: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center' },
  vehiclePlate: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  vehicleType: { fontSize: 11, color: '#64748B' },
  gateStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDispatched: { backgroundColor: '#EFF6FF' },
  statusOffloaded: { backgroundColor: '#F0FDF4' },
  gateStatusText: { fontSize: 10, fontWeight: '700', color: '#0F172A' },
  challanInfoBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, gap: 4 },
  challanInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  challanInfoKey: { fontSize: 12, color: '#64748B' },
  challanPassCode: { fontSize: 13, fontWeight: '800', color: '#0D9488' },
  challanInfoVal: { fontSize: 12, fontWeight: '600', color: '#1E293B', maxWidth: '60%', textAlign: 'right' },

  poCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  poTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  poNumberText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  poSocietyText: { fontSize: 11, color: '#64748B' },
  poStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F1F5F9' },
  poNewBadge: { backgroundColor: '#FEF2F2' },
  poDeliveredBadge: { backgroundColor: '#F0FDF4' },
  poInvoicedBadge: { backgroundColor: '#EFF6FF' },
  poStatusText: { fontSize: 10, fontWeight: '700', color: '#0F172A' },
  poItemsDesc: { fontSize: 12, color: '#334155', marginBottom: 10 },
  poBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  poAmountText: { fontSize: 15, fontWeight: '800', color: '#0D9488' },
  poLocationText: { fontSize: 11, color: '#64748B', maxWidth: '65%' },
});
