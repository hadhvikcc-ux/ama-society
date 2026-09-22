import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

export interface WorkOrderData {
  id: string; // e.g. "WO-2026-0842"
  title: string;
  category: string;
  status: 'ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  amount: string; // e.g. "₹12,000"
  societyName: string;
  societyAddress?: string;
  contractorName: string;
  contractorPhone?: string;
  supervisorName: string;
  supervisorPhone: string;
  issuedDate: string;
  targetDate: string;
  gatePassCode: string;
  scopeItems: string[];
  milestones: { title: string; percent: number; amount: string; status: 'DONE' | 'IN_PROGRESS' | 'PENDING' }[];
  terms: string[];
  flat?: string;
  priority?: string;
}

interface WorkOrderModalProps {
  visible: boolean;
  onClose: () => void;
  workOrder: WorkOrderData | null;
  onStatusChange?: (newStatus: 'IN_PROGRESS' | 'COMPLETED') => void;
}

export function WorkOrderModal({ visible, onClose, workOrder, onStatusChange }: WorkOrderModalProps) {
  const [currentStatus, setCurrentStatus] = useState<'ISSUED' | 'IN_PROGRESS' | 'COMPLETED'>(
    workOrder?.status === 'CANCELLED' ? 'ISSUED' : workOrder?.status || 'IN_PROGRESS'
  );
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  if (!workOrder) return null;

  const showCopyNotice = (text: string) => {
    setCopyNotice(text);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleCopyGatePass = () => {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      navigator.clipboard.writeText(workOrder.gatePassCode);
      showCopyNotice(`✓ Copied Gate Pass: ${workOrder.gatePassCode}`);
    } else {
      Alert.alert('Gate Pass Copied', workOrder.gatePassCode);
    }
  };

  const handleShareWhatsApp = () => {
    const message = [
      `🏢 *${workOrder.societyName} — Official Work Order*`,
      `📋 *Order ID:* ${workOrder.id}`,
      `🛠️ *Title:* ${workOrder.title}`,
      `🏷️ *Category:* ${workOrder.category}`,
      `💰 *Approved Value:* ${workOrder.amount}`,
      `🛡️ *Gate Inward Code:* ${workOrder.gatePassCode}`,
      `📅 *Target Completion:* ${workOrder.targetDate}`,
      `👤 *Site Supervisor:* ${workOrder.supervisorName} (${workOrder.supervisorPhone})`,
      `🔧 *Assigned Contractor:* ${workOrder.contractorName}`,
      ``,
      `*Scope of Work:*`,
      ...workOrder.scopeItems.map((s, idx) => `${idx + 1}. ${s}`),
      ``,
      `*Gate Security:* Present code ${workOrder.gatePassCode} to guard desk for entry approval.`,
    ].join('\n');

    const cleanPhone = workOrder.supervisorPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Share.share({ message, title: `Work Order ${workOrder.id}` }).catch(() => {
        Linking.openURL(url).catch(() => {});
      });
    }
  };

  const handlePrintPdf = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        Alert.alert('Pop-up Blocked', 'Please allow pop-ups to view printable Work Order.');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Work Order - ${workOrder.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #111827; }
            .header { border-bottom: 2px solid #4338CA; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
            .society-name { font-size: 22px; font-weight: 800; color: #1E1B4B; margin: 0; }
            .society-sub { font-size: 12px; color: #6B7280; margin-top: 4px; }
            .wo-badge { background: #EEF2FF; border: 1px solid #C7D2FE; color: #4338CA; font-weight: 800; padding: 6px 14px; border-radius: 8px; font-size: 14px; }
            .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; background: #F8FAFC; padding: 16px; border-radius: 12px; border: 1px solid #E2E8F0; }
            .meta-item label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; display: block; margin-bottom: 4px; }
            .meta-item span { font-size: 14px; font-weight: 700; color: #0F172A; }
            .section-title { font-size: 15px; font-weight: 800; color: #0F172A; margin: 20px 0 10px; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; background: #F1F5F9; font-size: 12px; padding: 8px 12px; border-bottom: 1px solid #CBD5E1; }
            td { padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
            .terms { font-size: 12px; color: #475569; line-height: 1.6; padding-left: 20px; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; }
            .sign-box { width: 220px; border-top: 1px solid #94A3B8; text-align: center; font-size: 12px; color: #64748B; padding-top: 8px; }
            @media print {
              .no-print { display: none; }
              body { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background:#4338CA; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;">
              🖨️ Print / Save as PDF
            </button>
          </div>

          <div class="header">
            <div>
              <h1 class="society-name">🏢 ${workOrder.societyName}</h1>
              <div class="society-sub">${workOrder.societyAddress || 'Apartment Owners Association (AOA) • Bangalore'}</div>
            </div>
            <div class="wo-badge">
              WORK ORDER: ${workOrder.id}
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><label>Contractor / Vendor</label><span>${workOrder.contractorName}</span></div>
            <div class="meta-item"><label>Order Value</label><span style="color:#047857;">${workOrder.amount}</span></div>
            <div class="meta-item"><label>Current Status</label><span>${currentStatus}</span></div>
            <div class="meta-item"><label>Issued Date</label><span>${workOrder.issuedDate}</span></div>
            <div class="meta-item"><label>Target Completion</label><span>${workOrder.targetDate}</span></div>
            <div class="meta-item"><label>Gate Inward Pass</label><span style="color:#4338CA;">${workOrder.gatePassCode}</span></div>
          </div>

          <div class="section-title">Scope of Work &amp; Specifications</div>
          <table style="margin-top: 8px;">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Deliverable Description</th>
                <th style="width: 120px;">Category</th>
              </tr>
            </thead>
            <tbody>
              ${workOrder.scopeItems.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><b>${item}</b></td>
                  <td>${workOrder.category}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Milestone Payment Schedule</div>
          <table>
            <thead>
              <tr>
                <th>Milestone Description</th>
                <th style="width: 100px;">Share</th>
                <th style="width: 140px;">Payable Amount</th>
                <th style="width: 120px;">Milestone Status</th>
              </tr>
            </thead>
            <tbody>
              ${workOrder.milestones.map(m => `
                <tr>
                  <td>${m.title}</td>
                  <td>${m.percent}%</td>
                  <td><b>${m.amount}</b></td>
                  <td>${m.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Contractor Obligations &amp; Safety Compliance</div>
          <ul class="terms">
            ${workOrder.terms.map(t => `<li>${t}</li>`).join('')}
          </ul>

          <div class="footer-sign">
            <div class="sign-box">
              Contractor Signature &amp; Stamp<br />
              <b>${workOrder.contractorName}</b>
            </div>
            <div class="sign-box">
              Authorised Association Signatory<br />
              <b>${workOrder.supervisorName}</b>
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      Alert.alert('Download Work Order', `Work Order ${workOrder.id} ready for printing.`);
    }
  };

  const handleToggleStatus = () => {
    const nextStatus = currentStatus === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS';
    setCurrentStatus(nextStatus);
    if (onStatusChange) {
      onStatusChange(nextStatus);
    }
    showCopyNotice(`✓ Work Order status updated to ${nextStatus}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.woIconCircle}>
                <Ionicons name="document-text" size={20} color="#4338CA" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.woNumber}>{workOrder.id}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      currentStatus === 'COMPLETED'
                        ? styles.statusPillDone
                        : styles.statusPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        currentStatus === 'COMPLETED'
                          ? styles.statusPillTextDone
                          : styles.statusPillTextActive,
                      ]}
                    >
                      {currentStatus}
                    </Text>
                  </View>
                </View>
                <Text style={styles.woSubtitle} numberOfLines={1}>
                  {workOrder.societyName}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Copy / Toast Notice */}
          {copyNotice && (
            <View style={styles.toastBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.toastBannerText}>{copyNotice}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Title & Amount Card */}
            <View style={styles.titleCard}>
              <Text style={styles.titleText}>{workOrder.title}</Text>
              <View style={styles.amountRow}>
                <View>
                  <Text style={styles.amountLabel}>Total Approved Value</Text>
                  <Text style={styles.amountValue}>{workOrder.amount}</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{workOrder.category}</Text>
                </View>
              </View>
            </View>

            {/* Quick KPI Grid */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Issued Date</Text>
                <Text style={styles.kpiValue}>{workOrder.issuedDate}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Target Date</Text>
                <Text style={styles.kpiValue}>{workOrder.targetDate}</Text>
              </View>
            </View>

            {/* Gate Inward Pass Section with QR */}
            <View style={styles.gatePassCard}>
              <View style={styles.gatePassHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gatePassTitle}>🛡️ Security Gate Inward Pass</Text>
                  <Text style={styles.gatePassSub}>Show or scan this token at society gate for truck/technician entry</Text>
                  <View style={styles.gateCodeRow}>
                    <Text style={styles.gateCodeText}>{workOrder.gatePassCode}</Text>
                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopyGatePass}>
                      <Ionicons name="copy-outline" size={15} color="#4338CA" style={{ marginRight: 4 }} />
                      <Text style={styles.copyBtnText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.qrContainer}>
                  <QRCode value={`AMA-WORKORDER:${workOrder.id}:${workOrder.gatePassCode}`} size={64} />
                </View>
              </View>
            </View>

            {/* Scope of Work */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>🛠️ Scope of Work &amp; Deliverables</Text>
              {workOrder.scopeItems.map((item, idx) => (
                <View key={idx} style={styles.scopeRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#4F46E5" style={{ marginTop: 2, marginRight: 8 }} />
                  <Text style={styles.scopeText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Milestones Schedule */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>📊 Payment Milestones</Text>
              {workOrder.milestones.map((m, idx) => (
                <View key={idx} style={styles.milestoneRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneTitle}>{m.title}</Text>
                    <Text style={styles.milestoneSub}>Share: {m.percent}% • Status: {m.status}</Text>
                  </View>
                  <Text style={styles.milestoneAmount}>{m.amount}</Text>
                </View>
              ))}
            </View>

            {/* Contacts & Site Access */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>👤 Contacts &amp; Supervision</Text>
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Facility Supervisor:</Text>
                <Text style={styles.contactVal}>{workOrder.supervisorName} ({workOrder.supervisorPhone})</Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Contractor Assigned:</Text>
                <Text style={styles.contactVal}>{workOrder.contractorName}</Text>
              </View>
              {workOrder.flat && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Resident Flat Unit:</Text>
                  <Text style={styles.contactVal}>{workOrder.flat}</Text>
                </View>
              )}
            </View>

            {/* Safety & Compliance Terms */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>📜 Compliance Terms</Text>
              {workOrder.terms.map((term, idx) => (
                <Text key={idx} style={styles.termText}>
                  • {term}
                </Text>
              ))}
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrintPdf}>
              <Ionicons name="print-outline" size={17} color="#4338CA" style={{ marginRight: 6 }} />
              <Text style={styles.printBtnText}>PDF / Print</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsAppBtn} onPress={handleShareWhatsApp}>
              <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusBtn,
                currentStatus === 'COMPLETED' ? styles.statusBtnDone : styles.statusBtnProgress,
              ]}
              onPress={handleToggleStatus}
            >
              <Ionicons
                name={currentStatus === 'COMPLETED' ? 'refresh' : 'checkmark-done'}
                size={17}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.statusBtnText}>
                {currentStatus === 'COMPLETED' ? 'Mark In Progress' : 'Mark Completed'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 24 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 24 : 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  woIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  woNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  woSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusPillActive: {
    backgroundColor: '#FEF3C7',
  },
  statusPillDone: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusPillTextActive: {
    color: '#B45309',
  },
  statusPillTextDone: {
    color: '#15803D',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toastBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  scrollBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  categoryBadgeText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 3,
  },
  gatePassCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  gatePassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gatePassTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
  },
  gatePassSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    lineHeight: 15,
  },
  gateCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  gateCodeText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E1B4B',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scopeText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  milestoneSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  milestoneAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 6,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 130,
  },
  contactVal: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  termText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  printBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#16A34A',
  },
  whatsAppBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusBtnProgress: {
    backgroundColor: '#059669',
  },
  statusBtnDone: {
    backgroundColor: '#D97706',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
