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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupplierStore, SupplierInvoice, SupplierLedgerEntry, SupplierInvoiceStatus } from '../../stores/supplierStore';

export default function SupplierInvoices() {
  const { profile, invoices, ledgerEntries, recordInvoicePayment } = useSupplierStore();

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'KHATA'>('INVOICES');
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);

  // Record Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE'>('NEFT');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'PAID')
    .reduce((acc, inv) => acc + inv.balanceAmount, 0);

  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);

  const handleOpenPayment = (inv: SupplierInvoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceAmount.toString());
    setReference(`NEFT-${Date.now().toString().slice(-6)}`);
    setPaymentModalVisible(true);
  };

  const handleSavePayment = () => {
    if (!selectedInvoice || !paymentAmount.trim() || !reference.trim()) {
      Alert.alert('Incomplete', 'Please enter payment amount and transaction UTR / reference number.');
      return;
    }

    const amount = parseFloat(paymentAmount) || 0;
    recordInvoicePayment(selectedInvoice.id, {
      amount,
      method: paymentMethod,
      reference: reference.trim(),
      date: new Date().toISOString(),
      notes: notes.trim() || undefined,
    });

    setPaymentModalVisible(false);
    Alert.alert('Payment Recorded', `Recorded receipt of ₹${amount.toLocaleString('en-IN')} against ${selectedInvoice.invoiceNumber}. Khata balance has been updated.`);
  };

  const handlePrintOrShare = (inv: SupplierInvoice) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const win = window.open();
      if (win) {
        win.document.write(`
          <html>
            <head><title>${inv.invoiceNumber} - Tax Invoice</title></head>
            <body style="font-family:system-ui,sans-serif; padding:40px; color:#0f172a; max-width:800px; margin:0 auto;">
              <div style="border-bottom:2px solid #0d9488; padding-bottom:16px; margin-bottom:20px; display:flex; justify-content:space-between;">
                <div>
                  <h1 style="margin:0; color:#0d9488;">${profile.companyName}</h1>
                  <p style="margin:4px 0 0; font-size:13px; color:#64748b;">GSTIN: ${profile.gstin} | PAN: ${profile.pan}</p>
                  <p style="margin:2px 0 0; font-size:13px; color:#64748b;">${profile.address}, ${profile.city} - ${profile.pincode}</p>
                </div>
                <div style="text-align:right;">
                  <h2 style="margin:0; font-size:20px;">TAX INVOICE</h2>
                  <p style="margin:4px 0 0; font-weight:bold; font-size:14px;">${inv.invoiceNumber}</p>
                  <p style="margin:2px 0 0; font-size:12px; color:#64748b;">Dated: ${new Date(inv.issueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div style="background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:24px;">
                <p style="margin:0; font-size:12px; color:#64748b;">BILLED TO:</p>
                <h3 style="margin:4px 0; color:#0f172a;">${inv.societyName}</h3>
                <p style="margin:2px 0; font-size:13px;">GSTIN: ${inv.societyGstin}</p>
                <p style="margin:2px 0; font-size:13px; color:#64748b;">Against Purchase Order: <strong>${inv.poNumber}</strong></p>
              </div>

              <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
                <thead>
                  <tr style="background:#0d9488; color:#fff; text-align:left;">
                    <th style="padding:10px;">Item Description</th>
                    <th style="padding:10px; text-align:right;">Taxable Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:12px;">Bulk Society Supplies against ${inv.poNumber}</td>
                    <td style="padding:12px; text-align:right;">₹${inv.subtotal.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:8px 12px; color:#64748b;">Central GST (CGST)</td>
                    <td style="padding:8px 12px; text-align:right; color:#64748b;">₹${inv.cgst.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:8px 12px; color:#64748b;">State GST (SGST)</td>
                    <td style="padding:8px 12px; text-align:right; color:#64748b;">₹${inv.sgst.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style="background:#f0fdfa; font-weight:bold;">
                    <td style="padding:12px; color:#0d9488; font-size:16px;">Total Payable</td>
                    <td style="padding:12px; text-align:right; color:#0d9488; font-size:16px;">₹${inv.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div style="border-top:1px solid #e2e8f0; padding-top:16px; font-size:12px; color:#64748b;">
                <p style="margin:0;">Bank Name: ${profile.bankName} | A/C: ${profile.accountNumber} | IFSC: ${profile.ifsc}</p>
                <p style="margin:4px 0 0;">UPI ID: ${profile.upiId}</p>
              </div>
            </body>
          </html>
        `);
      }
    } else {
      Alert.alert('Tax Invoice', `Invoice: ${inv.invoiceNumber}\nAmount: ₹${inv.totalAmount}\nPO: ${inv.poNumber}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Segmented Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'INVOICES' && styles.tabBtnActive]}
          onPress={() => setActiveTab('INVOICES')}
        >
          <Ionicons name="document-text-outline" size={16} color={activeTab === 'INVOICES' ? '#0D9488' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'INVOICES' && styles.tabBtnTextActive]}>
            GST Invoices ({invoices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'KHATA' && styles.tabBtnActive]}
          onPress={() => setActiveTab('KHATA')}
        >
          <Ionicons name="book-outline" size={16} color={activeTab === 'KHATA' ? '#0D9488' : '#64748B'} />
          <Text style={[styles.tabBtnText, activeTab === 'KHATA' && styles.tabBtnTextActive]}>
            Society Khata Ledger
          </Text>
        </TouchableOpacity>
      </View>

      {/* Financial Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={styles.summaryValueOutstanding}>₹{totalOutstanding.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySub}>Awaiting Society Settlement</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Settled</Text>
          <Text style={styles.summaryValueSettled}>₹{totalCollected.toLocaleString('en-IN')}</Text>
          <Text style={styles.summarySub}>Received via NEFT/UPI</Text>
        </View>
      </View>

      {activeTab === 'INVOICES' ? (
        /* INVOICES LIST */
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {invoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const isPartial = inv.status === 'PARTIALLY_PAID';
            const isIssued = inv.status === 'ISSUED';

            return (
              <View key={inv.id} style={styles.invCard}>
                <View style={styles.invCardHeader}>
                  <View>
                    <Text style={styles.invNum}>{inv.invoiceNumber}</Text>
                    <Text style={styles.invSociety}>{inv.societyName} • Ref: {inv.poNumber}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isPaid && styles.statusPillPaid,
                      isPartial && styles.statusPillPartial,
                      isIssued && styles.statusPillIssued,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isPaid && { color: '#16A34A' },
                        isPartial && { color: '#D97706' },
                        isIssued && { color: '#2563EB' },
                      ]}
                    >
                      {inv.status}
                    </Text>
                  </View>
                </View>

                {/* Amounts Breakdown */}
                <View style={styles.amountBreakdown}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountKey}>Taxable Subtotal:</Text>
                    <Text style={styles.amountVal}>₹{inv.subtotal.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountKey}>CGST + SGST:</Text>
                    <Text style={styles.amountVal}>₹{(inv.cgst + inv.sgst).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.amountRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalKey}>Total Invoice Amount:</Text>
                    <Text style={styles.grandTotalVal}>₹{inv.totalAmount.toLocaleString('en-IN')}</Text>
                  </View>

                  {isPaid ? (
                    <View style={styles.paidInfoBox}>
                      <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                      <Text style={styles.paidInfoText}>
                        Settled in full via {inv.payments[0]?.method || 'NEFT'} ({inv.payments[0]?.reference})
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.dueInfoBox}>
                      <Text style={styles.dueInfoText}>
                        Balance Due: <Text style={{ fontWeight: '800' }}>₹{inv.balanceAmount.toLocaleString('en-IN')}</Text>
                      </Text>
                      <Text style={styles.dueDateText}>Due by: {new Date(inv.dueDate).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.invActions}>
                  <TouchableOpacity
                    style={styles.invBtnSecondary}
                    onPress={() => handlePrintOrShare(inv)}
                  >
                    <Ionicons name="print-outline" size={15} color="#0D9488" />
                    <Text style={styles.invBtnSecondaryText}>View / Print PDF</Text>
                  </TouchableOpacity>

                  {!isPaid && (
                    <TouchableOpacity
                      style={styles.invBtnPrimary}
                      onPress={() => handleOpenPayment(inv)}
                    >
                      <Ionicons name="cash-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.invBtnPrimaryText}>+ Record Payment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* KHATA RUNNING LEDGER */
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Society Ledger Statement Box */}
          <View style={styles.ledgerHeaderCard}>
            <Text style={styles.ledgerSocietyTitle}>Orchid Towers AMA Account</Text>
            <Text style={styles.ledgerSocietySub}>B2B Khata Statement • Net 30 Terms</Text>
          </View>

          {ledgerEntries.map((entry) => (
            <View key={entry.id} style={styles.ledgerItemCard}>
              <View style={styles.ledgerItemLeft}>
                <View
                  style={[
                    styles.ledgerTypeIcon,
                    entry.type === 'INVOICE' ? { backgroundColor: '#EFF6FF' } : { backgroundColor: '#F0FDF4' },
                  ]}
                >
                  <Ionicons
                    name={entry.type === 'INVOICE' ? 'document-text' : 'checkmark-circle'}
                    size={18}
                    color={entry.type === 'INVOICE' ? '#2563EB' : '#16A34A'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ledgerDesc}>{entry.description}</Text>
                  <Text style={styles.ledgerMeta}>
                    {new Date(entry.date).toLocaleDateString()} • Ref: {entry.refNumber}
                  </Text>
                </View>
              </View>

              <View style={styles.ledgerItemRight}>
                {entry.debit > 0 && (
                  <Text style={styles.debitText}>+ ₹{entry.debit.toLocaleString('en-IN')}</Text>
                )}
                {entry.credit > 0 && (
                  <Text style={styles.creditText}>- ₹{entry.credit.toLocaleString('en-IN')}</Text>
                )}
                <Text style={styles.runningBalance}>Bal: ₹{entry.runningBalance.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          ))}

          {/* Bank Payment Remittance Info Card */}
          <View style={styles.bankInfoCard}>
            <Text style={styles.bankInfoTitle}>Receiving Bank Details for Remittance</Text>
            <View style={styles.bankInfoGrid}>
              <Text style={styles.bankText}><Text style={{ fontWeight: '700' }}>Bank: </Text>{profile.bankName}</Text>
              <Text style={styles.bankText}><Text style={{ fontWeight: '700' }}>Account: </Text>{profile.accountNumber}</Text>
              <Text style={styles.bankText}><Text style={{ fontWeight: '700' }}>IFSC: </Text>{profile.ifsc}</Text>
              <Text style={styles.bankText}><Text style={{ fontWeight: '700' }}>UPI: </Text>{profile.upiId}</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Record Payment Receipt Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment Receipt</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.invoiceNotice}>
              For Invoice: <Text style={{ fontWeight: '800' }}>{selectedInvoice?.invoiceNumber}</Text>
            </Text>

            <Text style={styles.inputLabel}>Amount Received (₹) *</Text>
            <TextInput
              style={styles.input}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder="e.g. 44500"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
              {(['NEFT', 'RTGS', 'UPI', 'CHEQUE'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodPill, paymentMethod === m && styles.methodPillActive]}
                  onPress={() => setPaymentMethod(m)}
                >
                  <Text style={[styles.methodPillText, paymentMethod === m && { color: '#FFFFFF' }]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>UTR Number / Transaction Reference *</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="e.g. NEFT-HDFC88992144"
            />

            <Text style={styles.inputLabel}>Remarks / Cheque Details</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="Paid by Treasurer via Net Banking"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirmPayment}
                onPress={handleSavePayment}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.btnConfirmPaymentText}>Save Receipt</Text>
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

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: '#F0FDFA' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabBtnTextActive: { color: '#0D9488', fontWeight: '800' },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  summaryValueOutstanding: { fontSize: 20, fontWeight: '900', color: '#EA580C', marginVertical: 3 },
  summaryValueSettled: { fontSize: 20, fontWeight: '900', color: '#16A34A', marginVertical: 3 },
  summarySub: { fontSize: 10, color: '#64748B' },

  listContent: { padding: 16 },

  invCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  invNum: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  invSociety: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPillPaid: { backgroundColor: '#DCFCE7' },
  statusPillPartial: { backgroundColor: '#FEF3C7' },
  statusPillIssued: { backgroundColor: '#EFF6FF' },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  amountBreakdown: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 12 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  amountKey: { fontSize: 12, color: '#64748B' },
  amountVal: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 6, marginTop: 4 },
  grandTotalKey: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  grandTotalVal: { fontSize: 15, fontWeight: '800', color: '#0D9488' },

  paidInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#F0FDF4', padding: 6, borderRadius: 6 },
  paidInfoText: { fontSize: 11, color: '#166534', fontWeight: '500' },
  dueInfoBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, backgroundColor: '#FFF7ED', padding: 6, borderRadius: 6 },
  dueInfoText: { fontSize: 11, color: '#C2410C' },
  dueDateText: { fontSize: 10, color: '#9A3412', fontWeight: '500' },

  invActions: { flexDirection: 'row', gap: 8 },
  invBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  invBtnSecondaryText: { color: '#0D9488', fontSize: 12, fontWeight: '700' },
  invBtnPrimary: {
    flex: 1.2,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  invBtnPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  ledgerHeaderCard: { backgroundColor: '#0D9488', borderRadius: 12, padding: 14, marginBottom: 12 },
  ledgerSocietyTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  ledgerSocietySub: { fontSize: 12, color: '#CCFBF1', marginTop: 2 },
  ledgerItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ledgerItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  ledgerTypeIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ledgerDesc: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  ledgerMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  ledgerItemRight: { alignItems: 'flex-end', minWidth: 90 },
  debitText: { fontSize: 13, fontWeight: '800', color: '#2563EB' },
  creditText: { fontSize: 13, fontWeight: '800', color: '#16A34A' },
  runningBalance: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  bankInfoCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  bankInfoTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  bankInfoGrid: { gap: 4 },
  bankText: { fontSize: 12, color: '#334155' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  invoiceNotice: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#334155', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0F172A' },
  methodPill: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center' },
  methodPillActive: { backgroundColor: '#0D9488' },
  methodPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  btnCancel: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  btnCancelText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  btnConfirmPayment: { flex: 2, backgroundColor: '#0D9488', paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnConfirmPaymentText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
