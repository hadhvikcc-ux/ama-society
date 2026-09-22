import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { BazaarGroupHeader } from '../../../components/bazaar/BazaarGroupHeader';
import { Ionicons } from '@expo/vector-icons';
import { MetricTrendCard, TrendBarChart, TrendAreaLineChart } from '../../../components/charts';
import {
  useBazaarStore,
  OrderStatus,
} from '../../../stores/bazaarStore';
import { useCallStore } from '../../../stores/callStore';

const KHATA_MONTHLY_TREND = [
  { label: 'Apr', series1: 12500, series2: 11200, formatted1: '₹12.5K', formatted2: '₹11.2K', badge: '90% settled' },
  { label: 'May', series1: 14000, series2: 13500, formatted1: '₹14.0K', formatted2: '₹13.5K', badge: '96% settled' },
  { label: 'Jun', series1: 15200, series2: 14800, formatted1: '₹15.2K', formatted2: '₹14.8K', badge: '97% settled' },
  { label: 'Jul', series1: 16800, series2: 16000, formatted1: '₹16.8K', formatted2: '₹16.0K', badge: '95% settled' },
  { label: 'Aug', series1: 15500, series2: 15000, formatted1: '₹15.5K', formatted2: '₹15.0K', badge: '97% settled' },
  { label: 'Sep', series1: 14200, series2: 11500, formatted1: '₹14.2K', formatted2: '₹11.5K', badge: '₹2.7K Pending' },
];

const KHATA_AREA_DATA = [
  { label: 'Apr', value: 12500, secondaryValue: 11200, formattedValue: '₹12.5K Credit', formattedSecondary: '₹11.2K Recv', subText: '₹1.3K Net Due' },
  { label: 'May', value: 14000, secondaryValue: 13500, formattedValue: '₹14.0K Credit', formattedSecondary: '₹13.5K Recv', subText: '₹500 Net Due' },
  { label: 'Jun', value: 15200, secondaryValue: 14800, formattedValue: '₹15.2K Credit', formattedSecondary: '₹14.8K Recv', subText: '₹400 Net Due' },
  { label: 'Jul', value: 16800, secondaryValue: 16000, formattedValue: '₹16.8K Credit', formattedSecondary: '₹16.0K Recv', subText: '₹800 Net Due' },
  { label: 'Aug', value: 15500, secondaryValue: 15000, formattedValue: '₹15.5K Credit', formattedSecondary: '₹15.0K Recv', subText: '₹500 Net Due' },
  { label: 'Sep', value: 14200, secondaryValue: 11500, formattedValue: '₹14.2K Active Credit', formattedSecondary: '₹11.5K Settled', subText: '₹2.7K Due' },
];

export default function OutstandingScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const { openCallPicker } = useCallStore();
  const {
    products,
    orders,
    khataAccounts,
    updateOrderStatus,
    updateOrderDetails,
    adjustStock,
    settleKhataPayment,
  } = useBazaarStore();

  const [activeTab, setActiveTab] = useState<'GOODS' | 'ORDERS' | 'KHATA'>('GOODS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [khataChartType, setKhataChartType] = useState<'area' | 'bar'>('bar');

  // Edit Order Customer Details Modal
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editFlat, setEditFlat] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Khata Settlement Modal
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [settleFlat, setSettleFlat] = useState<string>('');
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleNote, setSettleNote] = useState<string>('Cash received at counter');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Outstanding Goods / Products (Stock <= reorderLevel)
  const outstandingGoods = useMemo(() => {
    return products
      .filter((p) => p.type === 'STOCK' && p.stockQuantity <= p.reorderLevel)
      .map((p) => {
        const targetBuffer = p.reorderLevel * 4; // recommended inventory level
        const deficit = Math.max(0, targetBuffer - p.stockQuantity);
        const estRestockCost = deficit * (p.costPrice || Math.round(p.price * 0.8));
        return {
          ...p,
          targetBuffer,
          deficit,
          estRestockCost,
        };
      })
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }, [products]);

  // 2. Outstanding Customer Orders (Unfulfilled)
  const outstandingOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'PENDING' || o.status === 'PACKED' || o.status === 'OUT_FOR_DELIVERY'
    );
  }, [orders]);

  // 3. Outstanding Khata / Credit Accounts (totalOutstanding > 0)
  const outstandingKhata = useMemo(() => {
    return Object.values(khataAccounts).filter((acc) => acc.totalOutstanding > 0);
  }, [khataAccounts]);

  const totalKhataCreditSum = useMemo(() => {
    return outstandingKhata.reduce((sum, acc) => sum + acc.totalOutstanding, 0);
  }, [outstandingKhata]);

  const totalGoodsDeficitUnits = useMemo(() => {
    return outstandingGoods.reduce((sum, g) => sum + g.deficit, 0);
  }, [outstandingGoods]);

  const totalWholesaleReorderEst = useMemo(() => {
    return outstandingGoods.reduce((sum, g) => sum + g.estRestockCost, 0);
  }, [outstandingGoods]);

  // Quick Restock Action
  const handleQuickRestock = (productId: string, name: string, qty: number) => {
    adjustStock(productId, qty, 'Wholesale Restock Inward');
    showToast('✓ Restocked +' + qty + ' units of ' + name);
  };

  // Open Khata Settlement Modal
  const handleOpenSettleModal = (flat: string, currentBalance: number) => {
    setSettleFlat(flat);
    setSettleAmount(String(currentBalance));
    setSettleNote('Cash received at counter');
    setSettleModalVisible(true);
  };

  const handleConfirmSettlement = () => {
    const amt = parseFloat(settleAmount);
    if (!settleFlat || isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid settlement amount');
      return;
    }

    settleKhataPayment(settleFlat, amt, settleNote);
    setSettleModalVisible(false);
    showToast('✓ Settled ₹' + amt + ' for Flat ' + settleFlat);
  };

  // Send WhatsApp Reminder to Resident
  const sendWhatsAppKhataReminder = (flat: string, name: string, balance: number, phone?: string) => {
    const msg = [
      '🔔 *SOCIETY MART BAZAAR KHATA REMINDER*',
      'Hello ' + name + ' (Flat ' + flat + '),',
      '',
      'This is a friendly reminder from Green Glen Palms Society Mart regarding your outstanding grocery Khata balance: *₹' + balance + '*.',
      '',
      'You can settle this at the clubhouse mart counter via Cash or UPI, or pay directly via the AMA Society App under the Billing/Bazaar tab.',
      '',
      'Society Mart UPI: mart.greenglen@icici',
      'Thank you for your cooperation!',
    ].join('\n');

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const targetPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const waUrl = targetPhone.length >= 10
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const win = window.open(waUrl, '_blank');
      if (!win) {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(msg);
        }
        showToast(`📋 Copied reminder notice for Flat ${flat} (Popup was blocked)`);
      } else {
        showToast(`✓ Opened WhatsApp reminder for Flat ${flat} (${name})`);
      }
    } else {
      Linking.canOpenURL(waUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(waUrl);
            showToast(`✓ Opening WhatsApp for Flat ${flat}`);
          } else {
            Linking.openURL(waUrl).catch(() => {
              Alert.alert('WhatsApp Reminder', msg);
            });
          }
        })
        .catch(() => {
          Linking.openURL(waUrl).catch(() => Alert.alert('WhatsApp Reminder', msg));
        });
    }
  };

  const handleOpenEditOrder = (order: any) => {
    setEditingOrder(order);
    setEditName(order.customerName);
    setEditFlat(order.customerFlat);
    setEditPhone(order.customerPhone || '');
  };

  const handleSaveOrderDetails = () => {
    if (!editingOrder) return;
    if (!editName.trim()) {
      showToast('⚠️ Customer name cannot be empty');
      return;
    }
    updateOrderDetails(editingOrder.id, {
      customerName: editName.trim(),
      customerFlat: editFlat.trim() || editingOrder.customerFlat,
      customerPhone: editPhone.trim() || editingOrder.customerPhone,
    });
    setEditingOrder(null);
    showToast(`✓ Updated customer details for #${editingOrder.orderNumber}`);
  };

  const handleShareOrderWhatsApp = (order: any) => {
    const baseUrl =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:8081';
    const downloadLink = `${baseUrl}/receipts?orderId=${encodeURIComponent(
      order.orderNumber
    )}&download=pdf`;

    const itemsSummary = (order.items || [])
      .map((it: any, idx: number) => {
        const name = it.productName || it.name || it.title || `Item #${idx + 1}`;
        const qty = Number(it.quantity) || 1;
        const unit = it.unit || 'pcs';
        const rate = Number(it.price) || (Number(it.total) && qty ? Number(it.total) / qty : 0);
        const tot = Number(it.total) || rate * qty;
        return `• ${name} (${qty} ${unit}) - ₹${tot.toFixed(2)}`;
      })
      .join('\n');

    const msg = [
      '🧾 *OFFICIAL MART RECEIPT*',
      `Order #: *${order.orderNumber}*`,
      `Customer: *${order.customerName}* (Flat ${order.customerFlat})`,
      '--------------------------------',
      itemsSummary,
      '--------------------------------',
      `*Total: ₹${Number(order.totalAmount || 0).toFixed(2)}* (${order.paymentMethod} • ${order.paymentStatus})`,
      '--------------------------------',
      '📄 *Download / Print PDF Receipt Online:*',
      downloadLink,
    ].join('\n');

    const cleanPhone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
    const targetPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const whatsappUrl = targetPhone.length >= 10
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const win = window.open(whatsappUrl, '_blank');
      if (!win && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(msg);
        showToast('📋 Copied receipt to clipboard (popup blocked)');
      } else {
        showToast('✓ Opening WhatsApp with receipt & PDF link!');
      }
    } else {
      Linking.canOpenURL(whatsappUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(whatsappUrl);
            showToast(`✓ Opening WhatsApp with receipt for #${order.orderNumber}`);
          } else {
            Linking.openURL(whatsappUrl).catch(() => {
              Alert.alert('WhatsApp Receipt', msg);
            });
          }
        })
        .catch(() => {
          Linking.openURL(whatsappUrl).catch(() => Alert.alert('WhatsApp Receipt', msg));
        });
    }
  };

  return (
    <View style={styles.container}>
      {!embedded && (
        <BazaarGroupHeader
          activeTab="OUTSTANDING"
          showBack
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Khata Credit & Dues Ledger</Text>
          <Text style={{ fontSize: 11, color: '#64748B' }}>Track unpaid orders, credit balances & send WhatsApp reminders</Text>
        </View>
        <TouchableOpacity
          style={styles.posShortcutBtn}
          onPress={() => router.push('/(resident)/bazaar/pos' as any)}
        >
          <Ionicons name="flash" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.posShortcutText}>Open POS</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Notification */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Ionicons name="information-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* 3 Overview Metric Cards */}
      <View style={styles.metricsStrip}>
        <TouchableOpacity
          style={[styles.metricCard, activeTab === 'GOODS' && styles.metricCardActive]}
          onPress={() => setActiveTab('GOODS')}
          activeOpacity={0.8}
        >
          <View style={styles.metricIconWrap}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={outstandingGoods.length > 0 ? '#DC2626' : '#15803D'}
            />
          </View>
          <Text style={styles.metricVal}>{outstandingGoods.length}</Text>
          <Text style={styles.metricLabel}>Stock Alerts</Text>
          <Text style={styles.metricSub}>{totalGoodsDeficitUnits} units deficit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, activeTab === 'ORDERS' && styles.metricCardActive]}
          onPress={() => setActiveTab('ORDERS')}
          activeOpacity={0.8}
        >
          <View style={styles.metricIconWrap}>
            <Ionicons
              name="bicycle"
              size={20}
              color={outstandingOrders.length > 0 ? '#D97706' : '#15803D'}
            />
          </View>
          <Text style={styles.metricVal}>{outstandingOrders.length}</Text>
          <Text style={styles.metricLabel}>Pending Orders</Text>
          <Text style={styles.metricSub}>Unfulfilled goods</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, activeTab === 'KHATA' && styles.metricCardActive]}
          onPress={() => setActiveTab('KHATA')}
          activeOpacity={0.8}
        >
          <View style={styles.metricIconWrap}>
            <Ionicons
              name="book"
              size={20}
              color={totalKhataCreditSum > 0 ? '#7C3AED' : '#15803D'}
            />
          </View>
          <Text style={styles.metricVal}>₹{totalKhataCreditSum}</Text>
          <Text style={styles.metricLabel}>Khata Credit</Text>
          <Text style={styles.metricSub}>{outstandingKhata.length} flats due</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector Switcher */}
      <View style={styles.tabsNav}>
        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'GOODS' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('GOODS')}
        >
          <Ionicons
            name="cube-outline"
            size={16}
            color={activeTab === 'GOODS' ? '#1D4ED8' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabNavBtnText, activeTab === 'GOODS' && styles.tabNavBtnTextActive]}>
            1. Stock Needs ({outstandingGoods.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'ORDERS' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('ORDERS')}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeTab === 'ORDERS' ? '#1D4ED8' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabNavBtnText, activeTab === 'ORDERS' && styles.tabNavBtnTextActive]}>
            2. Customer Orders ({outstandingOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'KHATA' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('KHATA')}
        >
          <Ionicons
            name="wallet-outline"
            size={16}
            color={activeTab === 'KHATA' ? '#1D4ED8' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabNavBtnText, activeTab === 'KHATA' && styles.tabNavBtnTextActive]}>
            3. Khata Ledger ({outstandingKhata.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* TAB 1: OUTSTANDING GOODS & STOCK NEEDS */}
        {activeTab === 'GOODS' && (
          <View>
            <View style={styles.tabBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tabBannerTitle}>Low Stock & Out of Stock Goods</Text>
                <Text style={styles.tabBannerSub}>
                  Products below reorder threshold. Est. Wholesale Inward Cost: ₹{totalWholesaleReorderEst}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.invLinkBtn}
                onPress={() => router.push('/(resident)/bazaar/inventory' as any)}
              >
                <Ionicons name="list" size={14} color="#1D4ED8" style={{ marginRight: 4 }} />
                <Text style={styles.invLinkText}>All Inventory</Text>
              </TouchableOpacity>
            </View>

            {outstandingGoods.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#15803D" />
                <Text style={styles.emptyTitle}>All Products Well Stocked!</Text>
                <Text style={styles.emptySub}>No items are currently below minimum reorder levels.</Text>
              </View>
            ) : (
              outstandingGoods.map((item) => (
                <View key={item.id} style={styles.goodsCard}>
                  <View style={styles.goodsTopRow}>
                    <Text style={styles.goodsEmoji}>{item.emoji}</Text>
                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                      <Text style={styles.goodsName}>{item.name}</Text>
                      <Text style={styles.goodsMeta}>
                        Category: {item.category} • Barcode: {item.barcode || 'N/A'}
                      </Text>
                    </View>

                    {item.stockQuantity === 0 ? (
                      <View style={styles.badgeOut}>
                        <Text style={styles.badgeOutText}>OUT OF STOCK</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeLow}>
                        <Text style={styles.badgeLowText}>LOW ({item.stockQuantity} left)</Text>
                      </View>
                    )}
                  </View>

                  {/* Stock Metrics Breakdown */}
                  <View style={styles.goodsMetricsGrid}>
                    <View style={styles.gMetricBox}>
                      <Text style={styles.gMetricLabel}>Current Stock</Text>
                      <Text
                        style={[
                          styles.gMetricVal,
                          { color: item.stockQuantity === 0 ? '#DC2626' : '#D97706' },
                        ]}
                      >
                        {item.stockQuantity} {item.unit}
                      </Text>
                    </View>

                    <View style={styles.gMetricBox}>
                      <Text style={styles.gMetricLabel}>Reorder Point</Text>
                      <Text style={styles.gMetricVal}>≤{item.reorderLevel} {item.unit}</Text>
                    </View>

                    <View style={styles.gMetricBox}>
                      <Text style={styles.gMetricLabel}>Order Deficit</Text>
                      <Text style={[styles.gMetricVal, { color: '#DC2626' }]}>
                        +{item.deficit} {item.unit}
                      </Text>
                    </View>

                    <View style={styles.gMetricBox}>
                      <Text style={styles.gMetricLabel}>Wholesale Est.</Text>
                      <Text style={[styles.gMetricVal, { color: '#15803D' }]}>
                        ₹{item.estRestockCost}
                      </Text>
                    </View>
                  </View>

                  {/* Restock Actions */}
                  <View style={styles.goodsActionsRow}>
                    <TouchableOpacity
                      style={[styles.goodsActionBtn, { backgroundColor: '#15803D' }]}
                      onPress={() => handleQuickRestock(item.id, item.name, item.deficit || 20)}
                    >
                      <Ionicons name="add-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.goodsActionBtnText}>
                        1-Tap Restock (+{item.deficit || 20} {item.unit})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.goodsActionBtn, { backgroundColor: '#1E293B' }]}
                      onPress={() => {
                        showToast('Added ' + item.name + ' to Wholesale PO Draft');
                      }}
                    >
                      <Ionicons name="document-text" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.goodsActionBtnText}>Add to Supplier PO</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: OUTSTANDING CUSTOMER ORDERS */}
        {activeTab === 'ORDERS' && (
          <View>
            <View style={styles.tabBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tabBannerTitle}>Unfulfilled Customer Orders</Text>
                <Text style={styles.tabBannerSub}>
                  Orders placed by residents awaiting packaging or delivery.
                </Text>
              </View>
            </View>

            {outstandingOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="#15803D" />
                <Text style={styles.emptyTitle}>No Pending Deliveries!</Text>
                <Text style={styles.emptySub}>All resident orders have been fulfilled and delivered.</Text>
              </View>
            ) : (
              outstandingOrders.map((ord) => (
                <View key={ord.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.orderNum}>Order #{ord.orderNumber}</Text>
                      <Text style={styles.orderTime}>{ord.createdAt}</Text>
                    </View>

                    <View style={styles.orderBadgesRight}>
                      <View
                        style={[
                          styles.statusPill,
                          ord.status === 'PENDING'
                            ? styles.statusPending
                            : ord.status === 'PACKED'
                            ? styles.statusPacked
                            : styles.statusOut,
                        ]}
                      >
                        <Text style={styles.statusPillText}>
                          {ord.status === 'PENDING'
                            ? 'Needs Packing'
                            : ord.status === 'PACKED'
                            ? 'Parcel Ready'
                            : 'Out for Delivery'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Customer Information */}
                  <View style={styles.customerBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="person" size={15} color="#1D4ED8" />
                        <Text style={styles.customerNameText}>{ord.customerName}</Text>
                        <View style={styles.flatTag}>
                          <Text style={styles.flatTagText}>{ord.customerFlat}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 2,
                          backgroundColor: '#EFF6FF',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                        onPress={() => handleOpenEditOrder(ord)}
                      >
                        <Ionicons name="pencil" size={11} color="#1D4ED8" />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8' }}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.custAddressText}>
                      📍 {ord.deliveryAddress || 'Counter Pickup'}
                    </Text>
                    {ord.customerPhone ? (
                      <Text style={[styles.custNoteText, { color: '#475569' }]}>📞 {ord.customerPhone}</Text>
                    ) : null}
                    {ord.notes && <Text style={styles.custNoteText}>Note: "{ord.notes}"</Text>}
                  </View>

                  {/* Items List Checklist */}
                  <View style={styles.orderItemsBox}>
                    <Text style={styles.orderItemsHeader}>GOODS TO PACK:</Text>
                    {ord.items.map((it, idx) => (
                      <View key={idx} style={styles.orderItemLine}>
                        <Text style={styles.orderItemEmoji}>{it.emoji}</Text>
                        <Text style={styles.orderItemTitle}>
                          {it.productName} ({it.quantity} {it.unit})
                        </Text>
                        <Text style={styles.orderItemPrice}>₹{it.total}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Order Total & Payment Summary */}
                  <View style={styles.orderFooter}>
                    <View>
                      <Text style={styles.orderFooterLabel}>Total Amount:</Text>
                      <Text style={styles.orderFooterVal}>₹{ord.totalAmount}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.orderFooterLabel}>Payment:</Text>
                      <Text
                        style={[
                          styles.orderPayVal,
                          ord.paymentStatus === 'OUTSTANDING' ? { color: '#7C3AED' } : { color: '#15803D' },
                        ]}
                      >
                        {ord.paymentMethod === 'KHATA_FLAT'
                          ? 'Added to Khata'
                          : ord.paymentMethod + ' (PAID)'}
                      </Text>
                    </View>
                  </View>

                  {/* Receipt & WhatsApp Links */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F1F5F9',
                        paddingVertical: 7,
                        borderRadius: 6,
                        gap: 4,
                      }}
                      onPress={() => router.push(`/receipts?orderId=${encodeURIComponent(ord.orderNumber)}` as any)}
                    >
                      <Ionicons name="document-text-outline" size={13} color="#334155" />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#334155' }}>View Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1.3,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#25D366',
                        paddingVertical: 7,
                        borderRadius: 6,
                        gap: 4,
                      }}
                      onPress={() => handleShareOrderWhatsApp(ord)}
                    >
                      <Ionicons name="logo-whatsapp" size={13} color="#FFFFFF" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>WhatsApp PDF Link</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Stage Advancement Action Bar */}
                  <View style={styles.orderActionsRow}>
                    {ord.status === 'PENDING' && (
                      <TouchableOpacity
                        style={[styles.stageBtn, { backgroundColor: '#D97706' }]}
                        onPress={() => {
                          updateOrderStatus(ord.id, 'PACKED');
                          showToast('✓ Order #' + ord.orderNumber + ' marked PACKED & ready.');
                        }}
                      >
                        <Ionicons name="cube" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.stageBtnText}>Mark as Packed & Ready</Text>
                      </TouchableOpacity>
                    )}

                    {ord.status === 'PACKED' && (
                      <TouchableOpacity
                        style={[styles.stageBtn, { backgroundColor: '#2563EB' }]}
                        onPress={() => {
                          updateOrderStatus(ord.id, 'OUT_FOR_DELIVERY');
                          showToast('🚴 Order #' + ord.orderNumber + ' dispatched with guard/boy.');
                        }}
                      >
                        <Ionicons name="bicycle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.stageBtnText}>Dispatch for Delivery</Text>
                      </TouchableOpacity>
                    )}

                    {ord.status === 'OUT_FOR_DELIVERY' && (
                      <TouchableOpacity
                        style={[styles.stageBtn, { backgroundColor: '#15803D' }]}
                        onPress={() => {
                          updateOrderStatus(ord.id, 'DELIVERED');
                          showToast('✓ Order #' + ord.orderNumber + ' marked DELIVERED.');
                        }}
                      >
                        <Ionicons name="checkmark-done" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.stageBtnText}>Confirm Handover / Delivered</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: OUTSTANDING KHATA / RESIDENT CREDIT LEDGER */}
        {activeTab === 'KHATA' && (
          <View>
            <View style={styles.tabBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tabBannerTitle}>Apartment Flat Khata (Udhar) Ledger</Text>
                <Text style={styles.tabBannerSub}>
                  Total Society Mart Credit Owed: ₹{totalKhataCreditSum} across {outstandingKhata.length} flats
                </Text>
              </View>
            </View>

            {/* Monthly Khata Credit vs Recovery Trend Chart */}
            <MetricTrendCard
              title="6-Month Khata Credit & Recovery Trend"
              subtitle="Monthly Resident Grocery Credit Issued vs Settlements Received at Counter"
              icon="wallet-outline"
              iconColor="#7C3AED"
              chartTypeToggle
              chartType={khataChartType}
              onChangeChartType={setKhataChartType}
              metrics={[
                { label: '6M Credit Given', value: '₹88.2K', subText: 'Mart Grocery Tabs' },
                { label: '6M Recovered', value: '₹82.0K', color: '#16A34A', subText: '93% Settlement Speed' },
                { label: 'Active Balance', value: `₹${totalKhataCreditSum}`, color: '#7C3AED', subText: `${outstandingKhata.length} Flats Pending` },
              ]}
              footerNote="Khata tabs auto-reconcile on counter payment. Invoices include UPI QR for direct settlement."
            >
              {khataChartType === 'bar' ? (
                <TrendBarChart
                  data={KHATA_MONTHLY_TREND}
                  height={190}
                  series1Label="Credit Given"
                  series1Color="#7C3AED"
                  series2Label="Settled"
                  series2Color="#10B981"
                  yAxisPrefix="₹"
                />
              ) : (
                <TrendAreaLineChart
                  data={KHATA_AREA_DATA}
                  height={180}
                  primaryColor="#7C3AED"
                  primaryLabel="Credit Given"
                  secondaryColor="#10B981"
                  secondaryLabel="Settled"
                  showSecondaryLine
                  yAxisPrefix="₹"
                />
              )}
            </MetricTrendCard>

            {outstandingKhata.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="wallet-outline" size={48} color="#15803D" />
                <Text style={styles.emptyTitle}>All Khata Balances Settled!</Text>
                <Text style={styles.emptySub}>No flats have outstanding grocery debts or pending dues.</Text>
              </View>
            ) : (
              outstandingKhata.map((acc) => (
                <View key={acc.flatNumber} style={styles.khataCard}>
                  <View style={styles.khataHeader}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.flatTagLarge}>
                          <Text style={styles.flatTagLargeText}>Flat {acc.flatNumber}</Text>
                        </View>
                        <Text style={styles.khataResidentName}>{acc.residentName}</Text>
                      </View>
                      <Text style={styles.khataPhone}>
                        {acc.residentPhone || 'Resident Phone on File'} • Last: {acc.lastUpdated}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.khataDueLabel}>Balance Due:</Text>
                      <Text style={styles.khataDueAmount}>₹{acc.totalOutstanding}</Text>
                    </View>
                  </View>

                  {/* Recent Transactions List */}
                  <View style={styles.khataEntriesBox}>
                    <Text style={styles.khataEntriesTitle}>TRANSACTION LEDGER:</Text>
                    {acc.entries.slice(0, 3).map((en) => (
                      <View key={en.id} style={styles.khataEntryRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.entryDesc}>{en.description}</Text>
                          <Text style={styles.entryDate}>{en.date}</Text>
                        </View>
                        <Text
                          style={[
                            styles.entryAmount,
                            en.type === 'PAYMENT' ? { color: '#15803D' } : { color: '#7C3AED' },
                          ]}
                        >
                          {en.type === 'PAYMENT' ? '-₹' : '+₹'}{en.amount}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons: Settle Payment & Send WhatsApp Reminder */}
                  <View style={styles.khataActionsRow}>
                    <TouchableOpacity
                      style={[styles.khataActionBtn, { backgroundColor: '#15803D' }]}
                      onPress={() => handleOpenSettleModal(acc.flatNumber, acc.totalOutstanding)}
                    >
                      <Ionicons name="cash-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.khataActionBtnText}>Record Pay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.khataActionBtn, { backgroundColor: '#25D366' }]}
                      onPress={() =>
                        sendWhatsAppKhataReminder(
                          acc.flatNumber,
                          acc.residentName,
                          acc.totalOutstanding,
                          acc.residentPhone
                        )
                      }
                    >
                      <Ionicons name="logo-whatsapp" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.khataActionBtnText}>Remind</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.khataActionBtn, { backgroundColor: '#1D4ED8' }]}
                      onPress={() =>
                        openCallPicker({
                          id: `khata-${acc.flatNumber}`,
                          name: acc.residentName,
                          flat: acc.flatNumber,
                          role: 'Resident Customer',
                          phone: acc.residentPhone || '9820445566',
                          category: 'resident',
                        }, 'AUDIO')
                      }
                    >
                      <Ionicons name="call" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.khataActionBtnText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Settle Khata Payment Modal */}
      <Modal visible={settleModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💵 Settle Flat Khata Payment</Text>
              <TouchableOpacity onPress={() => setSettleModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Recording payment received from Flat {settleFlat}
            </Text>

            <Text style={styles.inputLabel}>Amount Received (₹):</Text>
            <TextInput
              style={styles.inputField}
              keyboardType="numeric"
              placeholder="e.g. 420"
              value={settleAmount}
              onChangeText={setSettleAmount}
            />

            <Text style={styles.inputLabel}>Payment Mode / Reference Note:</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Cash received at counter, UPI to mart"
              value={settleNote}
              onChangeText={setSettleNote}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#E2E8F0' }]}
                onPress={() => setSettleModalVisible(false)}
              >
                <Text style={{ color: '#475569', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#15803D' }]}
                onPress={handleConfirmSettlement}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Confirm Settlement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Order Customer Modal */}
      <Modal visible={!!editingOrder} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Edit Order Customer</Text>
              <TouchableOpacity onPress={() => setEditingOrder(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Update details for Order #{editingOrder?.orderNumber}. Changes reflect on printed receipts and WhatsApp links.
            </Text>

            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Customer Full Name"
              value={editName}
              onChangeText={setEditName}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Flat No *</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. B-204"
                  value={editFlat}
                  onChangeText={setEditFlat}
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="+91 98765..."
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#E2E8F0' }]}
                onPress={() => setEditingOrder(null)}
              >
                <Text style={{ color: '#475569', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#1D4ED8' }]}
                onPress={handleSaveOrderDetails}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Changes</Text>
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
  posShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  posShortcutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  toastBox: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', flex: 1 },

  metricsStrip: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricCardActive: { borderColor: '#1D4ED8', backgroundColor: '#EFF6FF' },
  metricIconWrap: { marginBottom: 2 },
  metricVal: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  metricLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  metricSub: { fontSize: 9, color: '#94A3B8', marginTop: 1 },

  tabsNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tabNavBtnActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  tabNavBtnText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  tabNavBtnTextActive: { color: '#FFFFFF' },

  contentScroll: { padding: 14 },
  tabBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBannerTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  tabBannerSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  invLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  invLinkText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },

  // Goods Cards
  goodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goodsTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  goodsEmoji: { fontSize: 30 },
  goodsName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  goodsMeta: { fontSize: 11, color: '#64748B', marginTop: 1 },
  badgeOut: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeOutText: { fontSize: 9, fontWeight: '800', color: '#DC2626' },
  badgeLow: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeLowText: { fontSize: 9, fontWeight: '800', color: '#D97706' },

  goodsMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
  },
  gMetricBox: { flex: 1, alignItems: 'center' },
  gMetricLabel: { fontSize: 9, color: '#64748B', fontWeight: '600' },
  gMetricVal: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  goodsActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  goodsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  goodsActionBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Order Cards
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderNum: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  orderTime: { fontSize: 11, color: '#64748B' },
  orderBadgesRight: { flexDirection: 'row', gap: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusPacked: { backgroundColor: '#EFF6FF' },
  statusOut: { backgroundColor: '#F0FDF4' },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#1E293B' },

  customerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  customerNameText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  flatTag: { backgroundColor: '#EDE9FE', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  flatTagText: { fontSize: 10, fontWeight: '800', color: '#7C3AED' },
  custAddressText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  custNoteText: { fontSize: 11, color: '#1D4ED8', fontStyle: 'italic', marginTop: 2 },

  orderItemsBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    marginBottom: 8,
  },
  orderItemsHeader: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 4 },
  orderItemLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  orderItemEmoji: { fontSize: 14, marginRight: 6 },
  orderItemTitle: { fontSize: 11, color: '#1E293B', flex: 1 },
  orderItemPrice: { fontSize: 11, fontWeight: '700', color: '#0F172A' },

  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginBottom: 10,
  },
  orderFooterLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  orderFooterVal: { fontSize: 15, fontWeight: '900', color: '#1D4ED8' },
  orderPayVal: { fontSize: 12, fontWeight: '800' },
  orderActionsRow: { flexDirection: 'row' },
  stageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  stageBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  // Khata Cards
  khataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  khataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  flatTagLarge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flatTagLargeText: { fontSize: 12, fontWeight: '800', color: '#7C3AED' },
  khataResidentName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  khataPhone: { fontSize: 11, color: '#64748B', marginTop: 3 },
  khataDueLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  khataDueAmount: { fontSize: 18, fontWeight: '900', color: '#7C3AED' },

  khataEntriesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  khataEntriesTitle: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 4 },
  khataEntryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  entryDesc: { fontSize: 11, color: '#1E293B' },
  entryDate: { fontSize: 9, color: '#94A3B8' },
  entryAmount: { fontSize: 11, fontWeight: '800' },

  khataActionsRow: { flexDirection: 'row', gap: 8 },
  khataActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  khataActionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 18,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 10 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 8, marginBottom: 4 },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalActionsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
});
