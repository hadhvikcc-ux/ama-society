import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { UpiPaymentScannerModal } from '../../../components/payment/UpiPaymentScannerModal';
import { usePaymentStore, PaymentRecord } from '../../../stores/paymentStore';
import { useAuthStore } from '../../../stores/authStore';
import { openGooglePay, generateUpiUri } from '../../../utils/upiPayment';
import { AttachmentUploader } from '../../../components/ui/AttachmentUploader';
import { AppAttachment } from '../../../utils/filePicker';

export default function PayScreen() {
  const { invoiceId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { societyUpiId, societyPayeeName, recordPayment } = usePaymentStore();

  const [method, setMethod] = useState<'UPI' | 'NetBanking' | 'Card'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastReceipt, setLastReceipt] = useState('REC-89234');
  const [receiptAttachments, setReceiptAttachments] = useState<AppAttachment[]>([]);

  // UPI Scanner / Receiver Modal State
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiModalMode, setUpiModalMode] = useState<'RECEIVE' | 'SCAN'>('RECEIVE');

  const invoiceAmount = 4500;
  const invoiceRef = (invoiceId as string) || 'INV-1';

  const handleOpenReceiveQr = () => {
    setUpiModalMode('RECEIVE');
    setUpiModalVisible(true);
  };

  const handleOpenScanCamera = () => {
    setUpiModalMode('SCAN');
    setUpiModalVisible(true);
  };

  const handleDirectGPay = async () => {
    const uri = generateUpiUri({
      pa: societyUpiId,
      pn: societyPayeeName,
      am: invoiceAmount,
      tn: `Maintenance Fee ${invoiceRef}`,
      tr: invoiceRef,
    });
    await openGooglePay(uri);
  };

  const handlePaymentSuccess = (record: PaymentRecord) => {
    setLastReceipt(record.id);
    setSuccess(true);
  };

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const rec = recordPayment({
        amount: invoiceAmount,
        payeeName: societyPayeeName,
        payeeUpiId: societyUpiId,
        payerName: user?.name || 'Aditya Sharma',
        payerFlat: user?.flatNumber || 'B-204',
        category: 'MAINTENANCE',
        referenceId: invoiceRef,
        note: `Maintenance payment for ${invoiceRef}`,
        method: method === 'UPI' ? 'UPI_GPAY' : method === 'NetBanking' ? 'NETBANKING' : 'CARD',
        status: 'SUCCESS',
        attachments: receiptAttachments,
      });
      setLastReceipt(rec.id);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark" size={64} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSub}>Receipt #{lastReceipt}</Text>
        <Text style={styles.successSub2}>₹{invoiceAmount.toLocaleString('en-IN')} paid to {societyPayeeName}</Text>
        {receiptAttachments.length > 0 && (
          <View style={styles.receiptProofBox}>
            <Ionicons name="document-attach" size={18} color="#15803D" />
            <Text style={styles.receiptProofText}>
              {receiptAttachments.length} Payment Proof Document(s) Attached & Stored
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Go to Billing & Ledger</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Make Payment" showBack />
      
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Invoice Period</Text>
          <Text style={styles.summaryValue}>Sep 2023</Text>
          <View style={styles.divider} />
          <Text style={styles.summaryLabel}>Amount to Pay</Text>
          <Text style={styles.summaryAmount}>₹{invoiceAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryDue}>Due Date: Sep 10, 2023</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        
        {/* UPI / GPay Option */}
        <TouchableOpacity
          style={[styles.methodCard, method === 'UPI' && styles.methodCardActive]}
          onPress={() => setMethod('UPI')}
        >
          <View style={styles.methodLeft}>
            <View style={styles.upiIconChip}>
              <Ionicons name="card" size={18} color="#1D4ED8" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.methodText, method === 'UPI' && styles.methodTextActive]}>
                UPI / Google Pay (GPay)
              </Text>
              <Text style={styles.methodSubtext}>Instant QR Scanner, PhonePe, Paytm, BHIM</Text>
            </View>
          </View>
          <View style={[styles.radio, method === 'UPI' && styles.radioActive]} />
        </TouchableOpacity>

        {method === 'UPI' && (
          <View style={styles.upiOptionsContainer}>
            <Text style={styles.upiOptionsTitle}>UPI Payment & Scanner Options:</Text>

            {/* Option 1: Show Dynamic Society UPI QR */}
            <TouchableOpacity style={styles.upiActionRow} onPress={handleOpenReceiveQr}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="qr-code" size={20} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.actionTitle}>Show Society UPI / GPay QR Standee</Text>
                <Text style={styles.actionSub}>Display dynamic QR code with ₹4,500 & soundbox alert</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Option 2: Scan with Camera */}
            <TouchableOpacity style={styles.upiActionRow} onPress={handleOpenScanCamera}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="camera" size={20} color="#15803D" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.actionTitle}>Scan UPI QR with Camera</Text>
                <Text style={styles.actionSub}>Scan society paper QR or bill standee to pay</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Option 3: Open GPay Direct Intent */}
            <TouchableOpacity style={styles.upiActionRow} onPress={handleDirectGPay}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="phone-portrait" size={20} color="#B45309" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.actionTitle}>Launch Google Pay App</Text>
                <Text style={styles.actionSub}>Open UPI deep link directly on this device</Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#B45309" />
            </TouchableOpacity>

            {/* Manual UPI ID fallback */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.manualInputLabel}>Or Enter Your VPA / UPI ID:</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. yourname@okhdfcbank"
                placeholderTextColor="#94A3B8"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        {/* NetBanking Option */}
        <TouchableOpacity
          style={[styles.methodCard, method === 'NetBanking' && styles.methodCardActive]}
          onPress={() => setMethod('NetBanking')}
        >
          <View style={styles.methodLeft}>
            <Ionicons name="business-outline" size={22} color={method === 'NetBanking' ? '#1B4FD8' : '#6B7280'} />
            <Text style={[styles.methodText, method === 'NetBanking' && styles.methodTextActive]}>
              Net Banking
            </Text>
          </View>
          <View style={[styles.radio, method === 'NetBanking' && styles.radioActive]} />
        </TouchableOpacity>

        {/* Card Option */}
        <TouchableOpacity
          style={[styles.methodCard, method === 'Card' && styles.methodCardActive]}
          onPress={() => setMethod('Card')}
        >
          <View style={styles.methodLeft}>
            <Ionicons name="card-outline" size={22} color={method === 'Card' ? '#1B4FD8' : '#6B7280'} />
            <Text style={[styles.methodText, method === 'Card' && styles.methodTextActive]}>
              Credit / Debit Card
            </Text>
          </View>
          <View style={[styles.radio, method === 'Card' && styles.radioActive]} />
        </TouchableOpacity>

        {/* Payment Receipt / Proof Attachments */}
        <View style={styles.attachmentCardWrapper}>
          <AttachmentUploader
            attachments={receiptAttachments}
            onChange={setReceiptAttachments}
            title="Attach Payment Receipt / Proof (Optional)"
            subtitle="Upload bank transfer slip, UTR screenshot, or GPay receipt screenshot"
            maxFiles={5}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payNowBtn} onPress={handlePay} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payNowText}>Proceed to Pay ₹{invoiceAmount.toLocaleString('en-IN')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Global UPI Payment Scanner Modal */}
      <UpiPaymentScannerModal
        visible={upiModalVisible}
        onClose={() => setUpiModalVisible(false)}
        initialMode={upiModalMode}
        defaultAmount={invoiceAmount}
        defaultPayeeName={societyPayeeName}
        defaultPayeeVpa={societyUpiId}
        category="MAINTENANCE"
        referenceId={invoiceRef}
        defaultNote={`Maintenance Fee ${invoiceRef}`}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, flex: 1 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  summaryAmount: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginVertical: 4 },
  summaryDue: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 12 },

  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  methodCardActive: { borderColor: '#1B4FD8', backgroundColor: '#F0F5FF' },
  methodLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  upiIconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  methodSubtext: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  methodTextActive: { color: '#1B4FD8', fontWeight: '700' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB' },
  radioActive: { borderColor: '#1B4FD8', backgroundColor: '#1B4FD8', borderWidth: 5 },

  upiOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  upiOptionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  upiActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  manualInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
  },

  footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  payNowBtn: {
    backgroundColor: '#1B4FD8',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payNowText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  successContainer: {
    flex: 1,
    backgroundColor: '#15803D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  successSub: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: 4 },
  successSub2: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 28 },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#15803D', fontSize: 15, fontWeight: 'bold' },
  attachmentCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 8,
  },
  receiptProofText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
