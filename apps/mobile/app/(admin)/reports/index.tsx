import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { MetricTrendCard, TrendBarChart, TrendAreaLineChart } from '../../../components/charts';
import {
  AUDIT_REPORTS_BY_YEAR,
  downloadAuditReportPdf,
  downloadAuditReportDoc,
  copyAuditSummaryToClipboard,
} from '../../../utils/auditReportGenerator';

const SOCIETY_CASHFLOW_DATA = [
  { label: 'Apr', series1: 4.8, series2: 3.4, series3: 1.4, formatted1: '₹4.8L', formatted2: '₹3.4L', formatted3: '+₹1.4L', badge: '+₹1.4L' },
  { label: 'May', series1: 4.9, series2: 3.6, series3: 1.3, formatted1: '₹4.9L', formatted2: '₹3.6L', formatted3: '+₹1.3L', badge: '+₹1.3L' },
  { label: 'Jun', series1: 5.1, series2: 3.8, series3: 1.3, formatted1: '₹5.1L', formatted2: '₹3.8L', formatted3: '+₹1.3L', badge: '+₹1.3L' },
  { label: 'Jul', series1: 5.2, series2: 3.5, series3: 1.7, formatted1: '₹5.2L', formatted2: '₹3.5L', formatted3: '+₹1.7L', badge: '+₹1.7L' },
  { label: 'Aug', series1: 5.3, series2: 3.7, series3: 1.6, formatted1: '₹5.3L', formatted2: '₹3.7L', formatted3: '+₹1.6L', badge: '+₹1.6L' },
  { label: 'Sep', series1: 5.0, series2: 3.3, series3: 1.7, formatted1: '₹5.0L', formatted2: '₹3.3L', formatted3: '+₹1.7L', badge: '+₹1.7L' },
];

const SURPLUS_TREND_AREA = [
  { label: 'Apr', value: 14.2, secondaryValue: 1.4, formattedValue: '₹14.2L Reserve', formattedSecondary: '+₹1.4L Net', subText: '+11% Reserve' },
  { label: 'May', value: 15.5, secondaryValue: 1.3, formattedValue: '₹15.5L Reserve', formattedSecondary: '+₹1.3L Net', subText: '+9% Reserve' },
  { label: 'Jun', value: 16.8, secondaryValue: 1.3, formattedValue: '₹16.8L Reserve', formattedSecondary: '+₹1.3L Net', subText: '+8% Reserve' },
  { label: 'Jul', value: 18.5, secondaryValue: 1.7, formattedValue: '₹18.5L Reserve', formattedSecondary: '+₹1.7L Net', subText: '+10% Reserve' },
  { label: 'Aug', value: 20.1, secondaryValue: 1.6, formattedValue: '₹20.1L Reserve', formattedSecondary: '+₹1.6L Net', subText: '+9% Reserve' },
  { label: 'Sep', value: 21.8, secondaryValue: 1.7, formattedValue: '₹21.8L Reserve', formattedSecondary: '+₹1.7L Net', subText: '₹21.8L Fund' },
];

export default function AdminReports() {
  const [period, setPeriod] = useState('This Month');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [cashflowType, setCashflowType] = useState<'bar' | 'area'>('bar');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Reports & Analytics" />

      {toastMsg && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.toastBannerText}>{toastMsg}</Text>
        </View>
      )}
      
      <View style={styles.tabs}>
        {['This Month', 'Last 3 Months', 'This Year'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, period === tab && styles.activeTab]} onPress={() => setPeriod(tab)}>
            <Text style={[styles.tabText, period === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Monthly Inflows vs Outflows Cash Flow Trend */}
        <MetricTrendCard
          title="Monthly Operating Cash Flow & Inflow vs Outflow"
          subtitle="Maintenance Collections & Facility Receipts vs Society Operational Expenses"
          icon="cash-outline"
          iconColor="#10B981"
          chartTypeToggle
          chartType={cashflowType}
          onChangeChartType={setCashflowType}
          metrics={[
            { label: '6M Total Inflow', value: '₹30.3L', color: '#16A34A', subText: 'Collections & Rent' },
            { label: '6M Total Outflow', value: '₹21.3L', color: '#DC2626', subText: 'Security, Power, AMC' },
            { label: 'Net Cash Surplus', value: '+₹9.0L', color: '#1D4ED8', subText: '30% Savings Rate' },
          ]}
          footerNote="Surplus auto-deposited into Bank Sinking Fund & Fixed Deposits."
        >
          {cashflowType === 'bar' ? (
            <TrendBarChart
              data={SOCIETY_CASHFLOW_DATA}
              height={200}
              series1Label="Inflow"
              series1Color="#16A34A"
              series2Label="Expense"
              series2Color="#EF4444"
              series3Label="Surplus"
              series3Color="#2563EB"
              yAxisPrefix="₹"
              yAxisSuffix="L"
            />
          ) : (
            <TrendAreaLineChart
              data={SOCIETY_CASHFLOW_DATA.map(d => ({
                label: d.label,
                value: d.series1,
                secondaryValue: d.series2,
                formattedValue: `₹${d.series1}L Inflow`,
                formattedSecondary: `₹${d.series2}L Outflow`,
                subText: `${d.badge} Net`,
              }))}
              height={190}
              primaryColor="#16A34A"
              primaryLabel="Inflows"
              secondaryColor="#EF4444"
              secondaryLabel="Expenses"
              showSecondaryLine
              yAxisPrefix="₹"
              yAxisSuffix="L"
            />
          )}
        </MetricTrendCard>

        {/* 2. Sinking Fund & Treasury Accumulation Trend */}
        <MetricTrendCard
          title="Sinking Fund & Treasury Reserve Accumulation"
          subtitle="6-Month Growth of Society Capital Reserve Account"
          icon="shield-checkmark-outline"
          iconColor="#6366F1"
          metrics={[
            { label: 'Current Reserve', value: '₹21.8L', color: '#4338CA', subText: 'ICICI Bank FD' },
            { label: 'Annual Growth', value: '+53.5%', color: '#16A34A', subText: 'Over Last 6 Mos' },
            { label: 'Monthly Inflow', value: '+₹1.7L', color: '#059669', subText: 'Sep Allocation' },
          ]}
          footerNote="Audited by Chartered Accountant as per RWA Bye-Laws."
        >
          <TrendAreaLineChart
            data={SURPLUS_TREND_AREA}
            height={180}
            primaryColor="#6366F1"
            primaryLabel="Total Reserve"
            secondaryColor="#10B981"
            secondaryLabel="Monthly Net"
            showSecondaryLine
            yAxisPrefix="₹"
            yAxisSuffix="L"
          />
        </MetricTrendCard>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Expenses</Text>
          {[
            { label: 'Security Staff', amount: '₹1,20,000', percent: 80, color: '#EF4444' },
            { label: 'Electricity (Common)', amount: '₹85,000', percent: 60, color: '#F59E0B' },
            { label: 'Housekeeping', amount: '₹45,000', percent: 35, color: '#10B981' },
            { label: 'Lift AMC', amount: '₹25,000', percent: 20, color: '#8B5CF6' },
            { label: 'Plumbing Repairs', amount: '₹15,000', percent: 12, color: '#6B7280' },
          ].map(expense => (
            <View key={expense.label} style={styles.expenseRow}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseLabel}>{expense.label}</Text>
                <Text style={styles.expenseAmount}>{expense.amount}</Text>
              </View>
              <View style={styles.expenseTrack}>
                <View style={[styles.expenseFill, { width: `${expense.percent}%`, backgroundColor: expense.color }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ticket Analytics</Text>
          <View style={styles.ticketStats}>
            <View style={styles.ticketStatBox}>
              <Text style={[styles.ticketStatValue, { color: '#DC2626' }]}>8</Text>
              <Text style={styles.ticketStatLabel}>Open Tickets</Text>
            </View>
            <View style={styles.ticketStatBox}>
              <Text style={[styles.ticketStatValue, { color: '#16A34A' }]}>42</Text>
              <Text style={styles.ticketStatLabel}>Resolved</Text>
            </View>
            <View style={styles.ticketStatBox}>
              <Text style={[styles.ticketStatValue, { color: '#1B4FD8' }]}>1.2d</Text>
              <Text style={styles.ticketStatLabel}>Avg Resolution</Text>
            </View>
          </View>
        </View>

        {/* Yearly Maintenance Statutory Audit Card */}
        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#15803D' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Yearly Maintenance Statutory Audit</Text>
              <Text style={styles.subtitle}>FY 2025-26 • Certified by CA. R. Narayanan & Associates</Text>
            </View>
            <View style={styles.opinionBadgeAdmin}>
              <Ionicons name="checkmark-circle" size={12} color="#15803D" style={{ marginRight: 3 }} />
              <Text style={styles.opinionBadgeAdminText}>Clean Audit</Text>
            </View>
          </View>

          <View style={styles.auditMiniStatsGrid}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>Collections</Text>
              <Text style={[styles.miniStatVal, { color: '#15803D' }]}>₹65.19L</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>Outflows</Text>
              <Text style={[styles.miniStatVal, { color: '#DC2626' }]}>₹62.60L</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>Surplus</Text>
              <Text style={[styles.miniStatVal, { color: '#2563EB' }]}>+₹2.59L</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>Reserve</Text>
              <Text style={[styles.miniStatVal, { color: '#7C3AED' }]}>₹38.45L</Text>
            </View>
          </View>

          <Text style={{ fontSize: 11, color: '#64748B', marginVertical: 8 }}>
            Complete itemized revenue statement, 11 AMC contracts, SLA ticket scorecard & regulatory compliance.
          </Text>

          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => {
                downloadAuditReportPdf(AUDIT_REPORTS_BY_YEAR['FY 2025-26']);
                showToast('📄 Downloaded Yearly Maintenance Audit in PDF format.');
              }}
            >
              <Ionicons name="document-text" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={[styles.exportBtnText, { color: '#FFFFFF' }]}>PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#1D4ED8' }]}
              onPress={() => {
                downloadAuditReportDoc(AUDIT_REPORTS_BY_YEAR['FY 2025-26']);
                showToast('📝 Downloaded Yearly Maintenance Audit in Word DOC format.');
              }}
            >
              <Ionicons name="document" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={[styles.exportBtnText, { color: '#FFFFFF' }]}>Word</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#059669' }]}
              onPress={async () => {
                await copyAuditSummaryToClipboard(AUDIT_REPORTS_BY_YEAR['FY 2025-26']);
                showToast('📋 Audit executive summary copied to clipboard!');
              }}
            >
              <Ionicons name="copy-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={[styles.exportBtnText, { color: '#FFFFFF' }]}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', justifyContent: 'center' },
  tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginHorizontal: 4, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#1B4FD8' },
  tabText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  collectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  totalAmount: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  circleChart: { width: 64, height: 64, borderRadius: 32, borderWidth: 6, borderColor: '#16A34A', justifyContent: 'center', alignItems: 'center' },
  circlePercent: { fontSize: 16, fontWeight: 'bold', color: '#16A34A' },
  barChart: { marginTop: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { width: 40, fontSize: 12, color: '#6B7280' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  expenseRow: { marginBottom: 16 },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  expenseLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  expenseAmount: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  expenseTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  expenseFill: { height: '100%', borderRadius: 3 },
  ticketStats: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketStatBox: { flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginHorizontal: 4 },
  ticketStatValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  ticketStatLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  exportRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, marginHorizontal: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  exportBtnText: { color: '#1B4FD8', fontWeight: 'bold', fontSize: 14 },
  opinionBadgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  opinionBadgeAdminText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  auditMiniStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  miniStat: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  miniStatVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  toastBanner: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
