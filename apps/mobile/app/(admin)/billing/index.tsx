import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { MetricTrendCard, TrendBarChart, TrendAreaLineChart } from '../../../components/charts';

const MONTHLY_BILLING_TREND = [
  { label: 'Apr', series1: 5.1, series2: 4.3, series3: 0.8, formatted1: '₹5.1L', formatted2: '₹4.3L', formatted3: '₹0.8L', badge: '84% coll.' },
  { label: 'May', series1: 5.1, series2: 4.4, series3: 0.7, formatted1: '₹5.1L', formatted2: '₹4.4L', formatted3: '₹0.7L', badge: '86% coll.' },
  { label: 'Jun', series1: 5.2, series2: 4.6, series3: 0.6, formatted1: '₹5.2L', formatted2: '₹4.6L', formatted3: '₹0.6L', badge: '88% coll.' },
  { label: 'Jul', series1: 5.2, series2: 4.7, series3: 0.5, formatted1: '₹5.2L', formatted2: '₹4.7L', formatted3: '₹0.5L', badge: '90% coll.' },
  { label: 'Aug', series1: 5.2, series2: 4.8, series3: 0.4, formatted1: '₹5.2L', formatted2: '₹4.8L', formatted3: '₹0.4L', badge: '92% coll.' },
  { label: 'Sep', series1: 5.2, series2: 4.5, series3: 0.7, formatted1: '₹5.2L', formatted2: '₹4.5L', formatted3: '₹0.7L', badge: '87% coll.' },
];

const REVENUE_AREA_DATA = [
  { label: 'Apr', value: 5.1, secondaryValue: 4.3, formattedValue: '₹5.1L Billed', formattedSecondary: '₹4.3L Coll.', subText: '₹80K Overdue' },
  { label: 'May', value: 5.1, secondaryValue: 4.4, formattedValue: '₹5.1L Billed', formattedSecondary: '₹4.4L Coll.', subText: '₹70K Overdue' },
  { label: 'Jun', value: 5.2, secondaryValue: 4.6, formattedValue: '₹5.2L Billed', formattedSecondary: '₹4.6L Coll.', subText: '₹60K Overdue' },
  { label: 'Jul', value: 5.2, secondaryValue: 4.7, formattedValue: '₹5.2L Billed', formattedSecondary: '₹4.7L Coll.', subText: '₹50K Overdue' },
  { label: 'Aug', value: 5.2, secondaryValue: 4.8, formattedValue: '₹5.2L Billed', formattedSecondary: '₹4.8L Coll.', subText: '₹40K Overdue' },
  { label: 'Sep', value: 5.2, secondaryValue: 4.5, formattedValue: '₹5.2L Billed', formattedSecondary: '₹4.5L Coll.', subText: '₹70K Current Due' },
];

export interface FlatBillingItem {
  id: string;
  flat: string;
  name: string;
  phone: string;
  amount: number;
  status: 'Paid' | 'Overdue' | 'Issued';
  dueDate: string;
  reminded?: boolean;
  remindedAt?: string;
  remindCount?: number;
  lastChannel?: string;
}

const initialFlats: FlatBillingItem[] = [
  { id: '1', flat: 'A-101', name: 'Aditya Sharma', phone: '9820112345', amount: 4500, status: 'Paid', dueDate: '01 Sep 2026' },
  { id: '2', flat: 'A-102', name: 'Priya Mehta', phone: '9833445566', amount: 4500, status: 'Overdue', dueDate: '01 Sep 2026' },
  { id: '3', flat: 'A-103', name: 'Rahul Verma', phone: '9819988776', amount: 4500, status: 'Issued', dueDate: '01 Oct 2026' },
  { id: '4', flat: 'B-201', name: 'Sunita Rao', phone: '9920123456', amount: 4500, status: 'Paid', dueDate: '01 Sep 2026' },
  { id: '5', flat: 'B-202', name: 'Vikram Singh', phone: '9769012345', amount: 4500, status: 'Overdue', dueDate: '01 Sep 2026' },
  { id: '6', flat: 'C-301', name: 'Neha Gupta', phone: '9821234567', amount: 4500, status: 'Paid', dueDate: '01 Sep 2026' },
  { id: '7', flat: 'C-302', name: 'Amit Kumar', phone: '9820556677', amount: 4500, status: 'Issued', dueDate: '01 Oct 2026' },
  { id: '8', flat: 'D-401', name: 'Sneha Patel', phone: '9819123456', amount: 4500, status: 'Paid', dueDate: '01 Sep 2026' },
  { id: '9', flat: 'D-402', name: 'Rohan Desai', phone: '9820987654', amount: 4500, status: 'Paid', dueDate: '01 Sep 2026' },
  { id: '10', flat: 'E-501', name: 'Kavita Joshi', phone: '9820334455', amount: 4500, status: 'Overdue', dueDate: '01 Sep 2026' },
  { id: '11', flat: 'E-502', name: 'Manish Tiwari', phone: '9820445566', amount: 4500, status: 'Paid', dueDate: '01 Sep 2026' },
  { id: '12', flat: 'F-601', name: 'Pooja Reddy', phone: '9820778899', amount: 4500, status: 'Issued', dueDate: '01 Oct 2026' },
  { id: '13', flat: 'F-602', name: 'Sanjay Kapoor', phone: '9820667788', amount: 4500, status: 'Paid', dueDate: '01 Sep 2026' },
  { id: '14', flat: 'G-701', name: 'Anita Das', phone: '9820889900', amount: 4500, status: 'Paid', dueDate: '01 Sep 2026' },
  { id: '15', flat: 'G-702', name: 'Rajesh Nair', phone: '9820123987', amount: 4500, status: 'Overdue', dueDate: '01 Sep 2026' },
];

const mockLedger = [
  { id: 'l1', desc: 'Maintenance Collection', amount: 150000, type: 'credit', date: '10 Sep 2026' },
  { id: 'l2', desc: 'Plumbing Repair', amount: 5000, type: 'debit', date: '08 Sep 2026' },
  { id: 'l3', desc: 'Electricity Bill', amount: 45000, type: 'debit', date: '05 Sep 2026' },
  { id: 'l4', desc: 'Lift Maintenance', amount: 12000, type: 'debit', date: '02 Sep 2026' },
  { id: 'l5', desc: 'Security Services', amount: 30000, type: 'debit', date: '01 Sep 2026' },
];

export default function AdminBilling() {
  const [flats, setFlats] = useState<FlatBillingItem[]>(initialFlats);
  const [activeTab, setActiveTab] = useState<'All' | 'Issued' | 'Paid' | 'Overdue'>('All');
  
  // Modals & Toast State
  const [selectedFlatForReminder, setSelectedFlatForReminder] = useState<FlatBillingItem | null>(null);
  const [bulkReminderModalVisible, setBulkReminderModalVisible] = useState(false);
  const [generateInvoiceModalVisible, setGenerateInvoiceModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'area' | 'bar'>('bar');
  const [showTrendCard, setShowTrendCard] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredFlats = flats.filter(f => activeTab === 'All' || f.status === activeTab);
  const overdueFlats = flats.filter(f => f.status === 'Overdue');
  const overdueCount = overdueFlats.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return '#16A34A';
      case 'Overdue': return '#DC2626';
      case 'Issued': return '#D97706';
      default: return '#6B7280';
    }
  };

  // Helper to build friendly, professional WhatsApp / SMS message
  const buildReminderMessage = (flat: FlatBillingItem) => {
    return [
      '🔔 *MAINTENANCE PAYMENT REMINDER*',
      `Society: Orchid Towers Apartment Association`,
      `Resident: ${flat.name} (${flat.flat})`,
      '',
      `Dear ${flat.name},`,
      `This is a friendly reminder from Orchid Towers RWA that your society maintenance payment of *₹${flat.amount.toLocaleString('en-IN')}* was due on *${flat.dueDate}* and is currently *OVERDUE*.`,
      '',
      '💳 *Payment Options:*',
      '• UPI ID: orchid.society@icici',
      '• Bank Transfer / IMPS: ICICI Bank A/C 001105001234, IFSC: ICIC0000011',
      '• Or pay instantly with 0 transaction fee in the AMA Society App: Billing > Pay Now',
      '',
      'Kindly share payment receipt once paid. Please ignore if already settled.',
      'Thank you for your cooperation!',
    ].join('\n');
  };

  // 1. WhatsApp Reminder Handler
  const handleSendWhatsAppReminder = (flat: FlatBillingItem) => {
    const msg = buildReminderMessage(flat);
    const cleanPhone = flat.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const waUrl = targetPhone.length >= 10
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    // Mark as reminded
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setFlats(prev =>
      prev.map(f =>
        f.id === flat.id
          ? { ...f, reminded: true, remindedAt: `Today, ${nowStr}`, remindCount: (f.remindCount || 0) + 1, lastChannel: 'WhatsApp' }
          : f
      )
    );

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const win = window.open(waUrl, '_blank');
      if (!win) {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(msg);
        }
        showToast(`📋 Copied reminder notice (Popup was blocked)`);
      } else {
        showToast(`✓ Opened WhatsApp reminder for Flat ${flat.flat} (${flat.name})`);
      }
    } else {
      Linking.canOpenURL(waUrl)
        .then(supported => {
          if (supported) {
            Linking.openURL(waUrl);
            showToast(`✓ Opened WhatsApp for Flat ${flat.flat}`);
          } else {
            Linking.openURL(waUrl).catch(() => {
              showToast(`✓ Reminder notice generated for Flat ${flat.flat}`);
            });
          }
        })
        .catch(() => {
          Linking.openURL(waUrl).catch(() => {});
        });
    }

    setSelectedFlatForReminder(null);
  };

  // 2. In-App Notice & SMS Handler
  const handleSendSmsPushReminder = (flat: FlatBillingItem) => {
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setFlats(prev =>
      prev.map(f =>
        f.id === flat.id
          ? { ...f, reminded: true, remindedAt: `Today, ${nowStr}`, remindCount: (f.remindCount || 0) + 1, lastChannel: 'SMS & Notice' }
          : f
      )
    );
    showToast(`✓ Dispatched SMS & App Notification to ${flat.name} (+91 ${flat.phone})`);
    setSelectedFlatForReminder(null);
  };

  // 3. Share / Copy Handler
  const handleShareNotice = async (flat: FlatBillingItem) => {
    const msg = buildReminderMessage(flat);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      showToast(`📋 Notice copied to clipboard for Flat ${flat.flat}`);
    } else {
      try {
        await Share.share({ message: msg, title: `Maintenance Reminder - Flat ${flat.flat}` });
        showToast(`✓ Shared notice for Flat ${flat.flat}`);
      } catch (err) {
        showToast(`Notice copied to clipboard`);
      }
    }
  };

  // 4. Bulk Reminders Handler
  const handleSendAllBulkReminders = (channel: 'whatsapp' | 'sms') => {
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setFlats(prev =>
      prev.map(f =>
        f.status === 'Overdue'
          ? {
              ...f,
              reminded: true,
              remindedAt: `Today, ${nowStr}`,
              remindCount: (f.remindCount || 0) + 1,
              lastChannel: channel === 'whatsapp' ? 'WhatsApp Broadcast' : 'SMS & Notice',
            }
          : f
      )
    );
    setBulkReminderModalVisible(false);
    showToast(`✓ Dispatched reminders to all ${overdueCount} overdue flats via ${channel === 'whatsapp' ? 'WhatsApp & App Notice' : 'SMS & Notice'}!`);
  };

  // 5. Generate Invoices Handler
  const handleGenerateInvoicesConfirm = () => {
    setGenerateInvoiceModalVisible(false);
    showToast(`✓ Generated 120 invoices for current cycle! Bills notified to all residents.`);
  };

  const renderFlat = ({ item }: { item: FlatBillingItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.flatIconCircle}>
            <Ionicons name="home-outline" size={16} color="#1B4FD8" />
          </View>
          <Text style={styles.flatText}>{item.flat}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.residentName}>{item.name}</Text>
          <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
          <Text style={styles.dueSubText}>Due: {item.dueDate}</Text>
          {item.reminded && (
            <View style={styles.remindedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
              <Text style={styles.remindedBadgeText}>
                Reminded ({item.remindedAt || 'Today'}) {item.remindCount && item.remindCount > 1 ? `• ${item.remindCount}x` : ''}
              </Text>
            </View>
          )}
        </View>

        {item.status === 'Overdue' && (
          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
            {item.reminded ? (
              <TouchableOpacity
                style={styles.remindedActionBtn}
                onPress={() => setSelectedFlatForReminder(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="paper-plane" size={13} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.remindedActionBtnText}>Re-send</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setSelectedFlatForReminder(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={14} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.actionButtonText}>Send Reminder</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Billing Management" />

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header Action Bar */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setGenerateInvoiceModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text" size={18} color="#FFF" />
          <Text style={styles.primaryBtnText}>Generate Invoices</Text>
        </TouchableOpacity>

        {overdueCount > 0 && (
          <TouchableOpacity
            style={styles.bulkReminderBtn}
            onPress={() => setBulkReminderModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={18} color="#FFF" />
            <Text style={styles.bulkReminderBtnText}>
              Send Reminders ({overdueCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Financial Summary Strip */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Issued</Text>
          <Text style={[styles.summaryValue, { color: '#1B4FD8' }]}>₹5.2L</Text>
          <Text style={styles.summarySub}>120 Flats</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Collected</Text>
          <Text style={[styles.summaryValue, { color: '#16A34A' }]}>₹4.5L</Text>
          <Text style={styles.summarySub}>104 Paid</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overdue</Text>
          <Text style={[styles.summaryValue, { color: '#DC2626' }]}>₹70K</Text>
          <Text style={styles.summarySub}>{overdueCount} Pending</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {(['All', 'Issued', 'Paid', 'Overdue'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab} {tab === 'Overdue' ? `(${overdueCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Flat List with Overdue Invoices & Monthly Trend Chart */}
      <FlatList
        data={filteredFlats}
        keyExtractor={item => item.id}
        renderItem={renderFlat}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity
              style={styles.trendToggleHeader}
              onPress={() => setShowTrendCard(prev => !prev)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="stats-chart" size={16} color="#1D4ED8" />
                <Text style={styles.trendToggleTitle}>6-Month Collections & Dues Analytics</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.trendToggleAction}>{showTrendCard ? 'Hide Chart' : 'Show Chart'}</Text>
                <Ionicons name={showTrendCard ? 'chevron-up' : 'chevron-down'} size={14} color="#64748B" />
              </View>
            </TouchableOpacity>

            {showTrendCard && (
              <MetricTrendCard
                title="Society Revenue & Collections Trend"
                subtitle="Monthly Billed Maintenance vs Realized Collections vs Overdue Dues"
                icon="trending-up"
                iconColor="#1D4ED8"
                chartTypeToggle
                chartType={chartType}
                onChangeChartType={setChartType}
                metrics={[
                  { label: '6M Billed', value: '₹31.0L', subText: '120 Units Total' },
                  { label: '6M Collected', value: '₹27.3L', color: '#16A34A', subText: '88% Realized' },
                  { label: 'Overdue Dues', value: '₹3.7L', color: '#DC2626', subText: `${overdueCount} Pending Flats` },
                ]}
                footerNote="Monthly invoices generate on 1st. Automated WhatsApp reminders trigger on 10th."
              >
                {chartType === 'bar' ? (
                  <TrendBarChart
                    data={MONTHLY_BILLING_TREND}
                    height={200}
                    series1Label="Billed"
                    series1Color="#1D4ED8"
                    series2Label="Collected"
                    series2Color="#10B981"
                    series3Label="Overdue"
                    series3Color="#EF4444"
                    yAxisPrefix="₹"
                    yAxisSuffix="L"
                  />
                ) : (
                  <TrendAreaLineChart
                    data={REVENUE_AREA_DATA}
                    height={190}
                    primaryColor="#1D4ED8"
                    primaryLabel="Billed"
                    secondaryColor="#10B981"
                    secondaryLabel="Collected"
                    showSecondaryLine
                    yAxisPrefix="₹"
                    yAxisSuffix="L"
                  />
                )}
              </MetricTrendCard>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#16A34A" />
            <Text style={styles.emptyTitle}>No flats found for tab '{activeTab}'</Text>
            <Text style={styles.emptySub}>All resident dues in this category are up to date.</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.ledgerSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Recent Society Ledger Entries</Text>
              <Text style={{ fontSize: 12, color: '#1B4FD8', fontWeight: '600' }}>View All</Text>
            </View>
            {mockLedger.map(entry => (
              <View key={entry.id} style={styles.ledgerItem}>
                <View style={[styles.ledgerIconContainer, { backgroundColor: entry.type === 'credit' ? '#DCFCE7' : '#FEE2E2' }]}>
                  <Ionicons name={entry.type === 'credit' ? 'arrow-down' : 'arrow-up'} size={18} color={entry.type === 'credit' ? '#16A34A' : '#DC2626'} />
                </View>
                <View style={styles.ledgerDetails}>
                  <Text style={styles.ledgerDesc}>{entry.desc}</Text>
                  <Text style={styles.ledgerDate}>{entry.date}</Text>
                </View>
                <Text style={[styles.ledgerAmount, { color: entry.type === 'credit' ? '#16A34A' : '#DC2626' }]}>
                  {entry.type === 'credit' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </View>
        )}
      />

      {/* MODAL 1: Individual Reminder Dispatch Modal */}
      <Modal
        visible={selectedFlatForReminder !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFlatForReminder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedFlatForReminder && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.modalHeaderIcon}>
                      <Ionicons name="notifications" size={20} color="#DC2626" />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.modalTitle}>Send Overdue Reminder</Text>
                      <Text style={styles.modalSubtitle}>Flat {selectedFlatForReminder.flat} • {selectedFlatForReminder.name}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedFlatForReminder(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Overdue Snapshot Card */}
                <View style={styles.modalSnapshotCard}>
                  <View style={styles.snapshotRow}>
                    <Text style={styles.snapshotLabel}>Overdue Amount:</Text>
                    <Text style={styles.snapshotAmount}>₹{selectedFlatForReminder.amount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.snapshotRow}>
                    <Text style={styles.snapshotLabel}>Due Date:</Text>
                    <Text style={styles.snapshotVal}>{selectedFlatForReminder.dueDate} (Overdue)</Text>
                  </View>
                  <View style={styles.snapshotRow}>
                    <Text style={styles.snapshotLabel}>Resident Phone:</Text>
                    <Text style={styles.snapshotVal}>+91 {selectedFlatForReminder.phone}</Text>
                  </View>
                  {selectedFlatForReminder.reminded && (
                    <View style={[styles.snapshotRow, { marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#FEE2E2' }]}>
                      <Text style={styles.snapshotLabel}>Last Reminder:</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#16A34A' }}>
                        {selectedFlatForReminder.remindedAt} ({selectedFlatForReminder.lastChannel})
                      </Text>
                    </View>
                  )}
                </View>

                {/* Message Preview Box */}
                <Text style={styles.previewHeading}>NOTICE PREVIEW:</Text>
                <View style={styles.previewBox}>
                  <ScrollView style={{ maxHeight: 110 }}>
                    <Text style={styles.previewText}>
                      {buildReminderMessage(selectedFlatForReminder)}
                    </Text>
                  </ScrollView>
                </View>

                {/* Dispatch Action Buttons */}
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => handleSendWhatsAppReminder(selectedFlatForReminder)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.modalActionBtnText}>Send via WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#1B4FD8' }]}
                    onPress={() => handleSendSmsPushReminder(selectedFlatForReminder)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.modalActionBtnText}>Send In-App & SMS Notice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]}
                    onPress={() => handleShareNotice(selectedFlatForReminder)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="copy-outline" size={18} color="#334155" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalActionBtnText, { color: '#334155' }]}>Copy Notice to Clipboard</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Bulk Reminders Modal */}
      <Modal
        visible={bulkReminderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBulkReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="megaphone" size={20} color="#DC2626" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Bulk Overdue Reminders</Text>
                  <Text style={styles.modalSubtitle}>{overdueCount} flats with unpaid maintenance</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setBulkReminderModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
              The following residents have overdue maintenance fees. You can dispatch automated reminders across WhatsApp, SMS, and Society Noticeboard:
            </Text>

            <ScrollView style={{ maxHeight: 180, marginBottom: 16 }}>
              {overdueFlats.map((f, idx) => (
                <View key={f.id} style={styles.bulkRowItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.bulkIndex}>{idx + 1}.</Text>
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.bulkFlatText}>{f.flat} — {f.name}</Text>
                      <Text style={styles.bulkPhoneText}>+91 {f.phone}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bulkAmountText}>₹{f.amount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.bulkStatusText}>{f.reminded ? '✓ Reminded' : 'Pending'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#25D366' }]}
                onPress={() => handleSendAllBulkReminders('whatsapp')}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.modalActionBtnText}>Broadcast via WhatsApp ({overdueCount})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#1B4FD8' }]}
                onPress={() => handleSendAllBulkReminders('sms')}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.modalActionBtnText}>Send In-App & SMS to All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Generate Invoices Modal */}
      <Modal
        visible={generateInvoiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenerateInvoiceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 24 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="document-text" size={28} color="#1B4FD8" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                Generate Monthly Maintenance Invoices
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                This will generate official maintenance bills for all registered society flats for the billing period.
              </Text>
            </View>

            <View style={styles.invoiceSummaryBox}>
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>Billing Cycle:</Text>
                <Text style={styles.snapshotVal}>October 2026</Text>
              </View>
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>Base Maintenance Rate:</Text>
                <Text style={styles.snapshotVal}>₹4,500 / flat</Text>
              </View>
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotLabel}>Total Flats:</Text>
                <Text style={styles.snapshotVal}>120 Flats</Text>
              </View>
              <View style={[styles.snapshotRow, { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }]}>
                <Text style={[styles.snapshotLabel, { fontWeight: '700', color: '#0F172A' }]}>Expected Billing:</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1B4FD8' }}>₹5,40,000</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 1, backgroundColor: '#F1F5F9' }]}
                onPress={() => setGenerateInvoiceModalVisible(false)}
              >
                <Text style={{ color: '#475569', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 2, backgroundColor: '#1B4FD8' }]}
                onPress={handleGenerateInvoicesConfirm}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Generate Invoices</Text>
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

  // Toast
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', flex: 1 },

  // Header Actions
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#1B4FD8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  bulkReminderBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  bulkReminderBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginLeft: 6 },

  // Summary Row
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryTitle: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  summaryValue: { fontSize: 17, fontWeight: '800' },
  summarySub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 6,
    backgroundColor: '#F1F5F9',
  },
  activeTab: { backgroundColor: '#1B4FD8' },
  tabText: { color: '#64748B', fontWeight: '600', fontSize: 12 },
  activeTabText: { color: '#FFFFFF' },

  // List & Cards
  listContent: { padding: 12, paddingBottom: 80 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  flatIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  flatText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  residentName: { fontSize: 13, color: '#475569', fontWeight: '500', marginBottom: 2 },
  amountText: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  dueSubText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  remindedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  remindedBadgeText: { fontSize: 10, fontWeight: '700', color: '#15803D', marginLeft: 4 },

  // Action Buttons on rows
  actionButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: { color: '#DC2626', fontWeight: '700', fontSize: 12 },
  remindedActionBtn: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  remindedActionBtnText: { color: '#16A34A', fontWeight: '700', fontSize: 11 },

  // Empty State
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', marginTop: 4 },

  // Ledger Section
  ledgerSection: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ledgerIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ledgerDetails: { flex: 1 },
  ledgerDesc: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  ledgerDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  ledgerAmount: { fontSize: 15, fontWeight: '700' },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 1 },
  modalCloseBtn: { padding: 6 },

  // Snapshot Card inside Modal
  modalSnapshotCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  snapshotLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  snapshotAmount: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
  snapshotVal: { fontSize: 12, fontWeight: '600', color: '#0F172A' },

  previewHeading: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6, letterSpacing: 0.5 },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 16,
  },
  previewText: { fontSize: 11, color: '#334155', lineHeight: 16, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  modalActionButtons: { gap: 10 },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalActionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Bulk Modal Rows
  bulkRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bulkIndex: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  bulkFlatText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  bulkPhoneText: { fontSize: 11, color: '#64748B' },
  bulkAmountText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  bulkStatusText: { fontSize: 10, fontWeight: '600', color: '#16A34A' },

  invoiceSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  trendToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  trendToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  trendToggleAction: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
});
