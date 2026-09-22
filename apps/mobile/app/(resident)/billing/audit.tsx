import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import {
  AUDIT_REPORTS_BY_YEAR,
  downloadAuditReportPdf,
  downloadAuditReportDoc,
  formatAuditReportSummaryText,
  copyAuditSummaryToClipboard,
  shareAuditSummaryOnWhatsApp,
  YearlyAuditData,
} from '../../../utils/auditReportGenerator';

export default function YearlyMaintenanceAuditScreen() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>('FY 2025-26');
  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'OPERATIONS' | 'STATUTORY'>('FINANCIAL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<boolean>(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState<boolean>(false);

  const auditData: YearlyAuditData = AUDIT_REPORTS_BY_YEAR[selectedYear] || AUDIT_REPORTS_BY_YEAR['FY 2025-26'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadPdf = () => {
    const success = downloadAuditReportPdf(auditData);
    if (success) {
      showToast(`📄 Downloaded PDF: Yearly_Maintenance_Audit_Report_${selectedYear}.pdf`);
    } else {
      showToast('📄 Opened print-to-PDF dialog.');
    }
  };

  const handleDownloadDoc = () => {
    const success = downloadAuditReportDoc(auditData);
    if (success) {
      showToast(`📝 Downloaded Word DOC: Yearly_Maintenance_Audit_Report_${selectedYear}.doc`);
    } else {
      showToast('⚠️ Word download available on web browser.');
    }
  };

  const handleCopySummary = async () => {
    try {
      const res = await copyAuditSummaryToClipboard(auditData);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 3500);
      showToast('📋 Audit executive summary copied to clipboard! Ready to paste in WhatsApp.');
    } catch (e) {
      console.warn('Direct clipboard copy failed, opening preview modal', e);
      setSummaryModalVisible(true);
      showToast('📋 Opening summary preview to copy.');
    }
  };

  const formatInr = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Yearly Maintenance Audit" showBack />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Header Card */}
        <View style={styles.societyHeroCard}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.societyName}>{auditData.societyName}</Text>
              <Text style={styles.societyReg}>
                Reg: {auditData.societyReg} • GSTIN: {auditData.gstin}
              </Text>
              <Text style={styles.societyAddress}>{auditData.societyAddress}</Text>
            </View>
            <View style={styles.auditSealCircle}>
              <Ionicons name="ribbon" size={26} color="#15803D" />
              <Text style={styles.auditSealText}>AUDITED</Text>
            </View>
          </View>

          {/* Audit Opinion Pill */}
          <View style={styles.opinionBanner}>
            <Ionicons name="shield-checkmark" size={18} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.opinionText}>
              {auditData.auditor.opinion}
            </Text>
          </View>

          <View style={styles.auditorMetaRow}>
            <Text style={styles.auditorMetaText}>
              Audited by: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{auditData.auditor.name}</Text> ({auditData.auditor.firm})
            </Text>
            <Text style={styles.auditorDateText}>Sign-off Date: {auditData.auditDate}</Text>
          </View>
        </View>

        {/* Fiscal Year Picker Bar */}
        <View style={styles.yearPickerCard}>
          <Text style={styles.yearPickerLabel}>Select Financial Year:</Text>
          <View style={styles.yearButtonsRow}>
            {Object.keys(AUDIT_REPORTS_BY_YEAR).map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[styles.yearBtn, selectedYear === yr && styles.yearBtnActive]}
                onPress={() => setSelectedYear(yr)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={selectedYear === yr ? 'calendar' : 'calendar-outline'}
                  size={15}
                  color={selectedYear === yr ? '#FFFFFF' : '#475569'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.yearBtnText, selectedYear === yr && styles.yearBtnTextActive]}>
                  {yr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document Download & Export Actions Bar */}
        <View style={styles.downloadBarCard}>
          <Text style={styles.downloadBarTitle}>📥 Export Official Statutory Audit Report:</Text>
          
          <View style={styles.downloadButtonsGrid}>
            {/* Download PDF */}
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#DC2626' }]}
              onPress={handleDownloadPdf}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <View>
                <Text style={styles.exportBtnText}>Download PDF</Text>
                <Text style={styles.exportBtnSub}>Print-Ready .pdf</Text>
              </View>
            </TouchableOpacity>

            {/* Download DOC */}
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#1D4ED8' }]}
              onPress={handleDownloadDoc}
              activeOpacity={0.8}
            >
              <Ionicons name="document" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <View>
                <Text style={styles.exportBtnText}>Download Word</Text>
                <Text style={styles.exportBtnSub}>Editable .doc</Text>
              </View>
            </TouchableOpacity>

            {/* Copy Summary */}
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: copiedState ? '#15803D' : '#059669' }]}
              onPress={handleCopySummary}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copiedState ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <View>
                <Text style={styles.exportBtnText}>
                  {copiedState ? '✓ Copied!' : 'Copy Summary'}
                </Text>
                <Text style={styles.exportBtnSub}>
                  {copiedState ? 'In Clipboard' : 'WhatsApp / Email'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Preview & WhatsApp Link */}
          <TouchableOpacity
            style={styles.previewSummaryLink}
            onPress={() => setSummaryModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles-outline" size={14} color="#6EE7B7" style={{ marginRight: 6 }} />
            <Text style={styles.previewSummaryLinkText}>
              View Full Text Summary & Direct WhatsApp Share &rarr;
            </Text>
          </TouchableOpacity>
        </View>

        {/* Executive KPI Grid */}
        <View style={styles.kpiGrid}>
          {/* Total Collections */}
          <View style={[styles.kpiCard, { borderLeftColor: '#15803D' }]}>
            <Text style={styles.kpiLabel}>Total Collections</Text>
            <Text style={[styles.kpiValue, { color: '#15803D' }]}>{formatInr(auditData.summary.totalIncome)}</Text>
            <Text style={styles.kpiSub}>
              {auditData.summary.collectionEfficiency}% on-time collection
            </Text>
          </View>

          {/* Total Expenses */}
          <View style={[styles.kpiCard, { borderLeftColor: '#DC2626' }]}>
            <Text style={styles.kpiLabel}>Maintenance Outflows</Text>
            <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{formatInr(auditData.summary.totalExpenses)}</Text>
            <Text style={styles.kpiSub}>Audited vendor AMC & bills</Text>
          </View>

          {/* Net Surplus */}
          <View style={[styles.kpiCard, { borderLeftColor: '#2563EB' }]}>
            <Text style={styles.kpiLabel}>Net Operating Surplus</Text>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>+{formatInr(auditData.summary.netSurplus)}</Text>
            <Text style={styles.kpiSub}>To General Society Reserve</Text>
          </View>

          {/* Sinking Fund Reserve */}
          <View style={[styles.kpiCard, { borderLeftColor: '#7C3AED' }]}>
            <Text style={styles.kpiLabel}>Sinking Fund Balance</Text>
            <Text style={[styles.kpiValue, { color: '#7C3AED' }]}>{formatInr(auditData.summary.sinkingFundReserve)}</Text>
            <Text style={styles.kpiSub}>In Auto-Sweep Fixed Deposits</Text>
          </View>
        </View>

        {/* View Section Switcher Tabs */}
        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, activeTab === 'FINANCIAL' && styles.sectionTabActive]}
            onPress={() => setActiveTab('FINANCIAL')}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={activeTab === 'FINANCIAL' ? '#1D4ED8' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.sectionTabText, activeTab === 'FINANCIAL' && styles.sectionTabTextActive]}>
              Financial Statement
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sectionTab, activeTab === 'OPERATIONS' && styles.sectionTabActive]}
            onPress={() => setActiveTab('OPERATIONS')}
          >
            <Ionicons
              name="construct-outline"
              size={16}
              color={activeTab === 'OPERATIONS' ? '#1D4ED8' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.sectionTabText, activeTab === 'OPERATIONS' && styles.sectionTabTextActive]}>
              Operations & SLAs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sectionTab, activeTab === 'STATUTORY' && styles.sectionTabActive]}
            onPress={() => setActiveTab('STATUTORY')}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={activeTab === 'STATUTORY' ? '#1D4ED8' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.sectionTabText, activeTab === 'STATUTORY' && styles.sectionTabTextActive]}>
              Auditor Certificate
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: FINANCIAL STATEMENT */}
        {activeTab === 'FINANCIAL' && (
          <View style={styles.tabContentContainer}>
            
            {/* Income Table */}
            <View style={styles.tableCard}>
              <View style={styles.tableCardHeader}>
                <Ionicons name="arrow-down-circle" size={20} color="#15803D" style={{ marginRight: 8 }} />
                <Text style={styles.tableCardTitle}>1. Statement of Maintenance Income & Receipts</Text>
              </View>

              {auditData.incomeBreakdown.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.rowTitle}>{item.category}</Text>
                    <Text style={styles.rowNotes}>{item.notes}</Text>
                  </View>
                  <Text style={styles.rowIncomeAmount}>{formatInr(item.amount)}</Text>
                </View>
              ))}

              <View style={styles.tableTotalRow}>
                <Text style={styles.totalLabel}>Total Revenue Receipts:</Text>
                <Text style={styles.totalIncomeVal}>{formatInr(auditData.summary.totalIncome)}</Text>
              </View>
            </View>

            {/* Expenditure Table */}
            <View style={styles.tableCard}>
              <View style={styles.tableCardHeader}>
                <Ionicons name="arrow-up-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.tableCardTitle}>2. Statement of Outflows & Facility AMC Expenses</Text>
              </View>

              {auditData.expenseBreakdown.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.rowTitle}>{item.category}</Text>
                      <View style={styles.percentChip}>
                        <Text style={styles.percentChipText}>{item.percent}%</Text>
                      </View>
                    </View>
                    <Text style={styles.vendorText}>Contractor / Vendor: {item.vendorName}</Text>
                    <Text style={styles.rowNotes}>{item.notes}</Text>

                    {/* Visual Progress Bar */}
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.min(100, item.percent * 3.5)}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.rowExpenseAmount}>{formatInr(item.amount)}</Text>
                </View>
              ))}

              <View style={styles.tableTotalRow}>
                <Text style={styles.totalLabel}>Total Maintenance Outflows:</Text>
                <Text style={styles.totalExpenseVal}>{formatInr(auditData.summary.totalExpenses)}</Text>
              </View>
            </View>

            {/* Net Surplus Summary Box */}
            <View style={styles.surplusBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.surplusBannerTitle}>Annual Net Operational Surplus</Text>
                <Text style={styles.surplusBannerSub}>
                  Total Income ({formatInr(auditData.summary.totalIncome)}) - Total Outflows ({formatInr(auditData.summary.totalExpenses)})
                </Text>
              </View>
              <Text style={styles.surplusBannerAmount}>+{formatInr(auditData.summary.netSurplus)}</Text>
            </View>
          </View>
        )}

        {/* TAB 2: OPERATIONS & SLAS */}
        {activeTab === 'OPERATIONS' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.opsGrid}>
              <View style={styles.opsCard}>
                <Ionicons name="construct" size={24} color="#1D4ED8" />
                <Text style={styles.opsVal}>{auditData.operations.resolvedTickets}/{auditData.operations.totalTickets}</Text>
                <Text style={styles.opsLabel}>Tickets Resolved</Text>
                <Text style={styles.opsSub}>{auditData.operations.slaPercentage}% resolution rate</Text>
              </View>

              <View style={styles.opsCard}>
                <Ionicons name="time" size={24} color="#059669" />
                <Text style={styles.opsVal}>{auditData.operations.avgResolutionDays} Days</Text>
                <Text style={styles.opsLabel}>Avg Turnaround</Text>
                <Text style={styles.opsSub}>Against 2.0 day SLA target</Text>
              </View>

              <View style={styles.opsCard}>
                <Ionicons name="hardware-chip" size={24} color="#7C3AED" />
                <Text style={styles.opsVal}>{auditData.operations.liftUptimePercentage}%</Text>
                <Text style={styles.opsLabel}>Elevator Uptime</Text>
                <Text style={styles.opsSub}>4 Schindler lifts audited</Text>
              </View>

              <View style={styles.opsCard}>
                <Ionicons name="flash" size={24} color="#D97706" />
                <Text style={styles.opsVal}>{auditData.operations.dgRunningHours} Hours</Text>
                <Text style={styles.opsLabel}>DG Backup Run</Text>
                <Text style={styles.opsSub}>100% power redundancy</Text>
              </View>
            </View>

            <View style={styles.waterQualityCard}>
              <View style={styles.waterIconWrap}>
                <Ionicons name="water" size={28} color="#0284C7" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.waterTitle}>Potable Drinking Water Compliance</Text>
                <Text style={styles.waterDesc}>
                  Monthly water potability testing conducted by NABL accredited laboratory. All 12 reports certify 100% compliance with Bureau of Indian Standards (BIS IS:10500) potability parameters.
                </Text>
                <View style={styles.waterVerifiedBadge}>
                  <Text style={styles.waterVerifiedText}>✓ 12/12 Clean NABL Test Certificates on Record</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: STATUTORY AUDITOR CERTIFICATE */}
        {activeTab === 'STATUTORY' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.statutoryCard}>
              <Text style={styles.statutoryHeader}>Statutory Auditor's Compliance Findings</Text>
              <Text style={styles.statutorySubtitle}>
                Verified in accordance with the Cooperative Societies Act, By-Laws & Accounting Standards
              </Text>

              {auditData.statutoryFindings.map((finding, idx) => (
                <View key={idx} style={styles.findingRow}>
                  <View style={styles.findingCheck}>
                    <Ionicons name="checkmark" size={14} color="#15803D" />
                  </View>
                  <Text style={styles.findingText}>{finding}</Text>
                </View>
              ))}

              {/* Signatures Representation */}
              <View style={styles.sigSection}>
                <Text style={styles.sigHeading}>Certified & Digitally Signed By:</Text>
                
                <View style={styles.sigGrid}>
                  <View style={styles.sigCard}>
                    <View style={styles.sigMockLine} />
                    <Text style={styles.sigPersonName}>{auditData.auditor.name}</Text>
                    <Text style={styles.sigPersonRole}>Statutory Auditor</Text>
                    <Text style={styles.sigPersonSub}>{auditData.auditor.firm}</Text>
                  </View>

                  <View style={styles.sigCard}>
                    <View style={styles.sigMockLine} />
                    <Text style={styles.sigPersonName}>Vikram Malhotra</Text>
                    <Text style={styles.sigPersonRole}>President / Chairman</Text>
                    <Text style={styles.sigPersonSub}>Managing Committee</Text>
                  </View>

                  <View style={styles.sigCard}>
                    <View style={styles.sigMockLine} />
                    <Text style={styles.sigPersonName}>Priya Sharma</Text>
                    <Text style={styles.sigPersonRole}>Hon. Secretary</Text>
                    <Text style={styles.sigPersonSub}>Managing Committee</Text>
                  </View>

                  <View style={styles.sigCard}>
                    <View style={styles.sigMockLine} />
                    <Text style={styles.sigPersonName}>Rajesh Nair</Text>
                    <Text style={styles.sigPersonRole}>Hon. Treasurer</Text>
                    <Text style={styles.sigPersonSub}>Managing Committee</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Executive Summary Preview & WhatsApp Modal */}
      <Modal
        visible={summaryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.summaryModalCard}>
            <View style={styles.summaryModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryModalTitle}>📋 Audit Executive Summary</Text>
                <Text style={styles.summaryModalSub}>
                  Financial Year {selectedYear} • WhatsApp & AGM Ready
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSummaryModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.summaryNoticeBar}>
              <Ionicons name="information-circle" size={16} color="#1D4ED8" style={{ marginRight: 6 }} />
              <Text style={styles.summaryNoticeText}>
                Select text below to copy manually, or use the one-tap action buttons.
              </Text>
            </View>

            <ScrollView style={styles.summaryTextScroll} contentContainerStyle={{ padding: 12 }}>
              <Text selectable style={styles.summaryCodeText}>
                {formatAuditReportSummaryText(auditData)}
              </Text>
            </ScrollView>

            <View style={styles.summaryModalFooter}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: copiedState ? '#15803D' : '#059669' }]}
                onPress={handleCopySummary}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedState ? 'checkmark-circle' : 'copy-outline'}
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.modalActionBtnText}>
                  {copiedState ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#25D366' }]}
                onPress={() => {
                  shareAuditSummaryOnWhatsApp(auditData);
                  showToast('💬 Opening WhatsApp with Audit Summary...');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalActionBtnText}>Share on WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  toastBox: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  societyHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  societyName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  societyReg: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
    marginTop: 2,
  },
  societyAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  auditSealCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  auditSealText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  opinionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
  },
  opinionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  auditorMetaRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  auditorMetaText: {
    fontSize: 12,
    color: '#475569',
  },
  auditorDateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  yearPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  yearPickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  yearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  yearBtnActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  yearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  yearBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  downloadBarCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  downloadBarTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  downloadButtonsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  exportBtnSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  sectionTabActive: {
    backgroundColor: '#EFF6FF',
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sectionTabTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  tabContentContainer: {
    gap: 14,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  rowNotes: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  vendorText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
    marginTop: 1,
  },
  rowIncomeAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  rowExpenseAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  percentChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  percentChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
  },
  tableTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalIncomeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  totalExpenseVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  surplusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 12,
    padding: 16,
  },
  surplusBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  surplusBannerSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  surplusBannerAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1D4ED8',
    marginLeft: 10,
  },
  opsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  opsCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    textAlign: 'center',
  },
  opsVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  opsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  opsSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  waterQualityCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 16,
    alignItems: 'flex-start',
  },
  waterIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  waterDesc: {
    fontSize: 11,
    color: '#0C4A6E',
    marginTop: 4,
    lineHeight: 16,
  },
  waterVerifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  waterVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  statutoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statutoryHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statutorySubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  findingCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  findingText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  sigSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sigHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sigGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sigCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sigMockLine: {
    width: 80,
    height: 1,
    backgroundColor: '#94A3B8',
    marginBottom: 8,
    marginTop: 14,
  },
  sigPersonName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  sigPersonRole: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
    marginTop: 1,
  },
  sigPersonSub: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  previewSummaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  previewSummaryLinkText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  summaryModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 540,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  summaryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  summaryNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  summaryNoticeText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
  },
  summaryTextScroll: {
    backgroundColor: '#F8FAFC',
    maxHeight: 320,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 18,
  },
  summaryModalFooter: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
