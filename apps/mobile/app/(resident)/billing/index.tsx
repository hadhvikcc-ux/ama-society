import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { UpiPaymentScannerModal } from '../../../components/payment/UpiPaymentScannerModal';
import { LegalPolicyModal } from '../../../components/legal/LegalPolicyModal';
import { MetricTrendCard, TrendBarChart, TrendAreaLineChart } from '../../../components/charts';
import { usePaymentStore, PaymentRecord } from '../../../stores/paymentStore';
import { useAuthStore } from '../../../stores/authStore';
import {
  AUDIT_REPORTS_BY_YEAR,
  downloadAuditReportPdf,
  downloadAuditReportDoc,
  copyAuditSummaryToClipboard,
} from '../../../utils/auditReportGenerator';

const RESIDENT_MONTHLY_DUES_TREND = [
  { label: 'Apr', series1: 4650, series2: 4650, formatted1: '₹4,650 Billed', formatted2: '₹4,650 Paid', badge: 'Paid on 03 Apr' },
  { label: 'May', series1: 4700, series2: 4700, formatted1: '₹4,700 Billed', formatted2: '₹4,700 Paid', badge: 'Paid on 05 May' },
  { label: 'Jun', series1: 4850, series2: 4850, formatted1: '₹4,850 Billed', formatted2: '₹4,850 Paid', badge: 'Paid on 02 Jun' },
  { label: 'Jul', series1: 4800, series2: 4800, formatted1: '₹4,800 Billed', formatted2: '₹4,800 Paid', badge: 'Paid on 08 Jul' },
  { label: 'Aug', series1: 4850, series2: 4850, formatted1: '₹4,850 Billed', formatted2: '₹4,850 Paid', badge: 'Paid on 04 Aug' },
  { label: 'Sep', series1: 4850, series2: 0, formatted1: '₹4,850 Billed', formatted2: '₹0 Paid', badge: 'Due by 10 Sep' },
];

const RESIDENT_DUES_AREA = [
  { label: 'Apr', value: 4650, secondaryValue: 4650, formattedValue: '₹4,650 Billed', formattedSecondary: '₹4,650 Paid', subText: 'Paid On Time' },
  { label: 'May', value: 4700, secondaryValue: 4700, formattedValue: '₹4,700 Billed', formattedSecondary: '₹4,700 Paid', subText: 'Paid On Time' },
  { label: 'Jun', value: 4850, secondaryValue: 4850, formattedValue: '₹4,850 Billed', formattedSecondary: '₹4,850 Paid', subText: 'Paid On Time' },
  { label: 'Jul', value: 4800, secondaryValue: 4800, formattedValue: '₹4,800 Billed', formattedSecondary: '₹4,800 Paid', subText: 'Paid On Time' },
  { label: 'Aug', value: 4850, secondaryValue: 4850, formattedValue: '₹4,850 Billed', formattedSecondary: '₹4,850 Paid', subText: 'Paid On Time' },
  { label: 'Sep', value: 4850, secondaryValue: 0, formattedValue: '₹4,850 Current Due', formattedSecondary: '₹0 Settled', subText: 'Pending Settlement' },
];

const mockInvoices = [
  { id: 'INV-1', period: 'Sep 2023', amount: 4500, status: 'OVERDUE', dueDate: 'Sep 10, 2023' },
  { id: 'INV-2', period: 'Aug 2023', amount: 4500, status: 'PAID', dueDate: 'Aug 10, 2023' },
  { id: 'INV-3', period: 'Jul 2023', amount: 4500, status: 'PAID', dueDate: 'Jul 10, 2023' },
];

export default function BillingScreen() {
  const [tab, setTab] = useState<'invoices' | 'ledger' | 'audit'>('invoices');
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const { records, societyUpiId, societyPayeeName } = usePaymentStore();

  // UPI Scanner / Receiver Modal State
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiModalMode, setUpiModalMode] = useState<'RECEIVE' | 'SCAN'>('RECEIVE');
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);

  // Legal / Payment Policy Modal State
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [resChartType, setResChartType] = useState<'area' | 'bar'>('area');

  const handleOpenReceive = (inv?: typeof mockInvoices[0]) => {
    setSelectedInvoice(inv || null);
    setUpiModalMode('RECEIVE');
    setUpiModalVisible(true);
  };

  const handleOpenScan = () => {
    setSelectedInvoice(null);
    setUpiModalMode('SCAN');
    setUpiModalVisible(true);
  };

  const renderInvoice = ({ item }: { item: typeof mockInvoices[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.periodText}>{item.period}</Text>
          <Text style={styles.invoiceIdText}>#{item.id}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.cardBody}>
        <View>
          <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
          <Text style={styles.dueDateText}>Due: {item.dueDate}</Text>
        </View>
        {['ISSUED', 'OVERDUE'].includes(item.status) && (
          <View style={styles.cardActionsRow}>
            {/* Direct UPI / GPay QR button */}
            <TouchableOpacity
              style={styles.upiQrBtn}
              onPress={() => handleOpenReceive(item)}
            >
              <Ionicons name="qr-code" size={15} color="#1D4ED8" style={{ marginRight: 4 }} />
              <Text style={styles.upiQrBtnText}>UPI QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => router.push(`/billing/pay?invoiceId=${item.id}`)}
            >
              <Text style={styles.payBtnText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.pdfBtn}>
          <Ionicons name="document-text-outline" size={16} color="#1B4FD8" />
          <Text style={styles.pdfText}>View Invoice PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLedger = ({ item }: { item: PaymentRecord }) => (
    <View style={styles.ledgerItem}>
      <View style={styles.ledgerLeft}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.methodBadge, { backgroundColor: item.status === 'SUCCESS' ? '#DCFCE7' : '#FEE2E2' }]}>
            <Ionicons
              name={item.method === 'UPI_GPAY' ? 'card' : 'cash-outline'}
              size={12}
              color={item.status === 'SUCCESS' ? '#15803D' : '#B91C1C'}
            />
            <Text style={[styles.methodBadgeText, { color: item.status === 'SUCCESS' ? '#15803D' : '#B91C1C' }]}>
              {item.method === 'UPI_GPAY' ? 'UPI / GPay' : item.method}
            </Text>
          </View>
          <Text style={styles.ledgerRefText}>#{item.id}</Text>
        </View>
        <Text style={styles.ledgerDesc}>{item.note || item.payeeName}</Text>
        <Text style={styles.ledgerDate}>
          {item.timestamp} • {item.payerName} ({item.payerFlat})
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.ledgerAmount, { color: '#059669' }]}>
          +₹{item.amount.toLocaleString('en-IN')}
        </Text>
        <Text style={styles.ledgerSuccessTag}>SUCCESS</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Billing & Payments" />
      
      <View style={styles.headerCardWrapper}>
        <View style={styles.headerCard}>
          <Text style={styles.ledgerTitle}>Society Dues & Payments</Text>
          <View style={styles.ledgerRow}>
            <View>
              <Text style={styles.ledgerLabel}>Total Paid (YTD)</Text>
              <Text style={styles.ledgerValueGreen}>₹54,000</Text>
            </View>
            <View>
              <Text style={styles.ledgerLabel}>Pending Overdue</Text>
              <Text style={styles.ledgerValueRed}>₹4,500</Text>
            </View>
          </View>

          {/* UPI Quick Action Pills Bar */}
          <View style={styles.upiPillsBar}>
            <TouchableOpacity
              style={styles.upiPillBtn}
              onPress={() => handleOpenReceive()}
            >
              <Ionicons name="qr-code" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.upiPillText}>Receive Payment (Show QR)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.upiPillBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
              onPress={handleOpenScan}
            >
              <Ionicons name="scan" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.upiPillText}>Scan & Pay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'invoices' && styles.activeTab]} onPress={() => setTab('invoices')}>
          <Text style={[styles.tabText, tab === 'invoices' && styles.activeTabText]}>Invoices (3)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'ledger' && styles.activeTab]} onPress={() => setTab('ledger')}>
          <Text style={[styles.tabText, tab === 'ledger' && styles.activeTabText]}>
            UPI & Ledger ({records.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'audit' && styles.activeTab]} onPress={() => setTab('audit')}>
          <Text style={[styles.tabText, tab === 'audit' && styles.activeTabText]}>
            Audit Report 📊
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'invoices' ? (
        <FlatList
          data={mockInvoices}
          keyExtractor={item => item.id}
          renderItem={renderInvoice}
          contentContainerStyle={styles.list}
          ListHeaderComponent={() => (
            <MetricTrendCard
              title="My 6-Month Maintenance & Dues History"
              subtitle="Monthly Society Dues Billed vs Settlement Receipts"
              icon="calendar-outline"
              iconColor="#2563EB"
              chartTypeToggle
              chartType={resChartType}
              onChangeChartType={setResChartType}
              metrics={[
                { label: '6M Total Billed', value: '₹28.7K', subText: 'Flat Outflow' },
                { label: 'Settled to Date', value: '₹23.8K', color: '#16A34A', subText: '5 Paid On-Time' },
                { label: 'Current Outflow', value: '₹4.85K', color: '#DC2626', subText: 'Sep Bill Pending' },
              ]}
              footerNote="Pay before 10th each month to receive early settlement waiver."
            >
              {resChartType === 'area' ? (
                <TrendAreaLineChart
                  data={RESIDENT_DUES_AREA}
                  height={170}
                  primaryColor="#2563EB"
                  primaryLabel="Billed Dues"
                  secondaryColor="#10B981"
                  secondaryLabel="Paid"
                  showSecondaryLine
                  yAxisPrefix="₹"
                />
              ) : (
                <TrendBarChart
                  data={RESIDENT_MONTHLY_DUES_TREND}
                  height={180}
                  series1Label="Billed"
                  series1Color="#2563EB"
                  series2Label="Paid"
                  series2Color="#10B981"
                  yAxisPrefix="₹"
                />
              )}
            </MetricTrendCard>
          )}
        />
      ) : tab === 'ledger' ? (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          renderItem={renderLedger}
          contentContainerStyle={styles.list}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Audit Report Summary Card */}
          <View style={styles.auditSummaryCard}>
            <View style={styles.auditCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.auditSocietyTitle}>Yearly Maintenance Statutory Audit</Text>
                <Text style={styles.auditPeriodText}>Financial Year 2025-26 (Audited & Certified)</Text>
              </View>
              <View style={styles.opinionBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 4 }} />
                <Text style={styles.opinionBadgeText}>Clean Opinion</Text>
              </View>
            </View>

            <Text style={styles.auditAuditorText}>
              Audited by CA. R. Narayanan, FCA • M/s. R. Narayanan & Associates
            </Text>

            {/* Quick Metrics */}
            <View style={styles.auditKpiRow}>
              <View style={styles.auditKpiBox}>
                <Text style={styles.auditKpiLabel}>Total Collections</Text>
                <Text style={[styles.auditKpiVal, { color: '#15803D' }]}>₹65.19 Lakhs</Text>
                <Text style={styles.auditKpiSub}>96% on-time</Text>
              </View>
              <View style={styles.auditKpiBox}>
                <Text style={styles.auditKpiLabel}>Annual Expenses</Text>
                <Text style={[styles.auditKpiVal, { color: '#DC2626' }]}>₹62.60 Lakhs</Text>
                <Text style={styles.auditKpiSub}>11 expenditure heads</Text>
              </View>
            </View>

            <View style={styles.auditKpiRow}>
              <View style={styles.auditKpiBox}>
                <Text style={styles.auditKpiLabel}>Operating Surplus</Text>
                <Text style={[styles.auditKpiVal, { color: '#2563EB' }]}>+₹2.59 Lakhs</Text>
                <Text style={styles.auditKpiSub}>Retained in reserve</Text>
              </View>
              <View style={styles.auditKpiBox}>
                <Text style={styles.auditKpiLabel}>Sinking Reserve</Text>
                <Text style={[styles.auditKpiVal, { color: '#7C3AED' }]}>₹38.45 Lakhs</Text>
                <Text style={styles.auditKpiSub}>Held in Bank FDs</Text>
              </View>
            </View>

            {auditFeedback && (
              <View style={styles.feedbackNotice}>
                <Ionicons name="information-circle" size={16} color="#1E40AF" style={{ marginRight: 6 }} />
                <Text style={styles.feedbackNoticeText}>{auditFeedback}</Text>
              </View>
            )}

            {/* Direct Download & Export Actions */}
            <View style={styles.auditDownloadActions}>
              <TouchableOpacity
                style={[styles.auditDownloadBtn, { backgroundColor: '#DC2626' }]}
                onPress={() => {
                  downloadAuditReportPdf(AUDIT_REPORTS_BY_YEAR['FY 2025-26']);
                  setAuditFeedback('📄 Downloaded Yearly Maintenance Audit Report in PDF format.');
                  setTimeout(() => setAuditFeedback(null), 4000);
                }}
              >
                <Ionicons name="document-text" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.auditDownloadBtnText}>PDF (.pdf)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.auditDownloadBtn, { backgroundColor: '#1D4ED8' }]}
                onPress={() => {
                  downloadAuditReportDoc(AUDIT_REPORTS_BY_YEAR['FY 2025-26']);
                  setAuditFeedback('📝 Downloaded Yearly Maintenance Audit Report in Word DOC format.');
                  setTimeout(() => setAuditFeedback(null), 4000);
                }}
              >
                <Ionicons name="document" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.auditDownloadBtnText}>Word (.doc)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.auditDownloadBtn, { backgroundColor: '#059669' }]}
                onPress={async () => {
                  await copyAuditSummaryToClipboard(AUDIT_REPORTS_BY_YEAR['FY 2025-26']);
                  setAuditFeedback('📋 Audit summary copied to clipboard! Ready to paste in WhatsApp.');
                  setTimeout(() => setAuditFeedback(null), 4000);
                }}
              >
                <Ionicons name="copy-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.auditDownloadBtnText}>Copy Summary</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.viewFullAuditBtn}
              onPress={() => router.push('/(resident)/billing/audit' as any)}
            >
              <Text style={styles.viewFullAuditBtnText}>
                Open Interactive Audit Report & Multi-Year View &rarr;
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Payment Policy & Guidelines Footnote */}
      <TouchableOpacity
        style={styles.policyFootnote}
        onPress={() => setLegalModalVisible(true)}
      >
        <Ionicons name="shield-checkmark" size={14} color="#1E40AF" style={{ marginRight: 6 }} />
        <Text style={styles.policyFootnoteText}>
          View Payment Guidelines, Invoicing Cycles & Dispute Policy &rarr;
        </Text>
      </TouchableOpacity>

      {/* Global UPI Payment Scanner Modal */}
      <UpiPaymentScannerModal
        visible={upiModalVisible}
        onClose={() => setUpiModalVisible(false)}
        initialMode={upiModalMode}
        defaultAmount={selectedInvoice ? selectedInvoice.amount : 4500}
        defaultPayeeName={societyPayeeName}
        defaultPayeeVpa={societyUpiId}
        category="MAINTENANCE"
        referenceId={selectedInvoice ? selectedInvoice.id : 'INV-1'}
        defaultNote={selectedInvoice ? `Maintenance ${selectedInvoice.id}` : 'Society Maintenance Fee'}
      />

      {/* Legal & Payment Policy Modal */}
      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialSection="PAYMENT"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerCardWrapper: { padding: 16 },
  headerCard: {
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  ledgerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  ledgerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 2 },
  ledgerValueGreen: { color: '#6EE7B7', fontSize: 22, fontWeight: '900' },
  ledgerValueRed: { color: '#FCA5A5', fontSize: 22, fontWeight: '900' },

  upiPillsBar: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 12,
  },
  upiPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  upiPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#1E40AF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#1E40AF', fontWeight: '800' },
  list: { padding: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  periodText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  invoiceIdText: { fontSize: 11, color: '#64748B', marginTop: 1, fontWeight: '600' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  amountText: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  dueDateText: { fontSize: 12, color: '#64748B' },

  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upiQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upiQrBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  payBtn: { backgroundColor: '#1E40AF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  payBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cardFooter: { backgroundColor: '#F8FAFC', padding: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  pdfBtn: { flexDirection: 'row', alignItems: 'center' },
  pdfText: { color: '#1E40AF', fontSize: 13, fontWeight: '600', marginLeft: 4 },

  ledgerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ledgerLeft: { flex: 1, marginRight: 10 },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ledgerRefText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  ledgerDesc: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 4, marginBottom: 2 },
  ledgerDate: { fontSize: 11, color: '#64748B' },
  ledgerAmount: { fontSize: 16, fontWeight: '800' },
  ledgerSuccessTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  policyFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
  },
  policyFootnoteText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '700',
  },

  // Audit Report Card Styles
  auditSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  auditCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  auditSocietyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  auditPeriodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
    marginTop: 2,
  },
  opinionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  opinionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  auditAuditorText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
  },
  auditKpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  auditKpiBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditKpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  auditKpiVal: {
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 2,
  },
  auditKpiSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  feedbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  feedbackNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
  },
  auditDownloadActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  auditDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  auditDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  viewFullAuditBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  viewFullAuditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});
