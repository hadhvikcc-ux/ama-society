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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupplierStore, SupplierRfq } from '../../stores/supplierStore';

export default function SupplierRfqScreen() {
  const { rfqs, submitRfqBid } = useSupplierStore();

  const [selectedRfq, setSelectedRfq] = useState<SupplierRfq | null>(null);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);

  // Quote Form
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [deliverySlaHours, setDeliverySlaHours] = useState('3');
  const [validityDays, setValidityDays] = useState('60');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days from invoice submission');
  const [remarks, setRemarks] = useState('');

  const handleOpenBid = (rfq: SupplierRfq) => {
    setSelectedRfq(rfq);
    setTotalAmount(rfq.estimatedValue.toString());
    setRatePerUnit('86');
    setRemarks('Bulk pricing with dedicated tankers and 3-hour emergency response SLA.');
    setQuoteModalVisible(true);
  };

  const handleSubmitBid = () => {
    if (!selectedRfq || !totalAmount.trim() || !ratePerUnit.trim()) {
      Alert.alert('Incomplete Bid', 'Please enter quoted rate and total contract amount.');
      return;
    }

    submitRfqBid(selectedRfq.id, {
      ratePerUnit: parseFloat(ratePerUnit) || 0,
      totalAmount: parseFloat(totalAmount) || 0,
      deliverySlaHours: parseInt(deliverySlaHours, 10) || 3,
      validityDays: parseInt(validityDays, 10) || 60,
      paymentTerms: paymentTerms.trim(),
      remarks: remarks.trim(),
    });

    setQuoteModalVisible(false);
    Alert.alert(
      '🎉 Quotation Submitted Successfully!',
      `Your commercial bid for ${selectedRfq.title} has been lodged with Orchid Towers Procurement Committee.`
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.banner}>
        <Ionicons name="hammer-outline" size={24} color="#0D9488" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Society Procurement Tenders &amp; RFQs</Text>
          <Text style={styles.bannerSub}>Annual supply rate contracts and competitive bidding</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {rfqs.map((rfq) => {
          const isOpen = rfq.bidStatus === 'OPEN_FOR_BID';
          const isSubmitted = rfq.bidStatus === 'BID_SUBMITTED';
          const isShortlisted = rfq.bidStatus === 'SHORTLISTED';

          return (
            <View key={rfq.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.rfqTag}>
                  <Text style={styles.rfqTagText}>{rfq.rfqNumber}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isOpen && styles.badgeOpen,
                    isSubmitted && styles.badgeSubmitted,
                    isShortlisted && styles.badgeShortlisted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isOpen && { color: '#0D9488' },
                      isSubmitted && { color: '#2563EB' },
                      isShortlisted && { color: '#15803D' },
                    ]}
                  >
                    {rfq.bidStatus.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.rfqTitle}>{rfq.title}</Text>
              <Text style={styles.rfqScope}>{rfq.scopeDescription}</Text>

              {/* Tender Details Box */}
              <View style={styles.metaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaKey}>Estimated Annual Budget</Text>
                  <Text style={styles.metaValBudget}>₹{rfq.estimatedValue.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaKey}>Contract Type</Text>
                  <Text style={styles.metaVal}>{rfq.contractDuration}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaKey}>Closing Deadline</Text>
                  <Text style={[styles.metaVal, { color: '#DC2626' }]}>
                    {new Date(rfq.closingDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* If Quote Already Submitted */}
              {rfq.quotationSubmitted && rfq.myQuoteDetails && (
                <View style={styles.submittedBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                    <Text style={styles.submittedTitle}>Your Lodged Quotation</Text>
                  </View>
                  <Text style={styles.submittedVal}>
                    Quoted Total: <Text style={{ fontWeight: '800' }}>₹{rfq.myQuotedAmount?.toLocaleString('en-IN')}</Text> (@ ₹{rfq.myQuoteDetails.ratePerUnit}/unit)
                  </Text>
                  <Text style={styles.submittedTerms}>Terms: {rfq.myQuoteDetails.paymentTerms}</Text>
                  <Text style={styles.submittedTerms}>SLA: {rfq.myQuoteDetails.deliverySlaHours}h dispatch • Validity: {rfq.myQuoteDetails.validityDays} days</Text>
                  {rfq.myQuoteDetails.remarks ? (
                    <Text style={styles.submittedRemarks}>"{rfq.myQuoteDetails.remarks}"</Text>
                  ) : null}
                </View>
              )}

              {/* Action Button */}
              {isOpen ? (
                <TouchableOpacity
                  style={styles.btnBid}
                  onPress={() => handleOpenBid(rfq)}
                >
                  <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.btnBidText}>Submit Commercial Quotation</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.bidSubmittedRow}>
                  <Ionicons name="lock-closed-outline" size={14} color="#64748B" />
                  <Text style={styles.bidSubmittedText}>Quotation Under Evaluation by Managing Committee</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Submit Quotation Modal */}
      <Modal visible={quoteModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Submit Tender Bid</Text>
                <Text style={styles.modalSub} numberOfLines={1}>{selectedRfq?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setQuoteModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <View style={styles.modalEstimateBox}>
                <Text style={styles.modalEstimateLabel}>Estimated Annual Value:</Text>
                <Text style={styles.modalEstimateVal}>₹{selectedRfq?.estimatedValue.toLocaleString('en-IN')}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Quoted Rate / Unit (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    value={ratePerUnit}
                    onChangeText={setRatePerUnit}
                    placeholder="86"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Total Annual Bid (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                    placeholder="510000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Emergency SLA (Hours)</Text>
                  <TextInput
                    style={styles.input}
                    value={deliverySlaHours}
                    onChangeText={setDeliverySlaHours}
                    placeholder="3"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Quote Validity (Days)</Text>
                  <TextInput
                    style={styles.input}
                    value={validityDays}
                    onChangeText={setValidityDays}
                    placeholder="60"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Payment Terms</Text>
              <TextInput
                style={styles.input}
                value={paymentTerms}
                onChangeText={setPaymentTerms}
                placeholder="Net 30 Days"
              />

              <Text style={styles.inputLabel}>Special Terms, Licenses &amp; Certifications</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="PESO license, dedicated tankers allocated, batch test reports..."
                multiline
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setQuoteModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirmBid}
                onPress={handleSubmitBid}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
                <Text style={styles.btnConfirmBidText}>Submit Formal Bid</Text>
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
  banner: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  bannerSub: { fontSize: 11, color: '#64748B', marginTop: 1 },

  listContent: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rfqTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rfqTagText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOpen: { backgroundColor: '#F0FDFA' },
  badgeSubmitted: { backgroundColor: '#EFF6FF' },
  badgeShortlisted: { backgroundColor: '#F0FDF4' },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  rfqTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  rfqScope: { fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 12 },

  metaGrid: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, gap: 6, marginBottom: 12 },
  metaCol: { flexDirection: 'row', justifyContent: 'space-between' },
  metaKey: { fontSize: 11, color: '#64748B' },
  metaVal: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  metaValBudget: { fontSize: 13, fontWeight: '800', color: '#0D9488' },

  submittedBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  submittedTitle: { fontSize: 12, fontWeight: '700', color: '#166534' },
  submittedVal: { fontSize: 12, color: '#15803D', marginTop: 2 },
  submittedTerms: { fontSize: 11, color: '#166534', marginTop: 2 },
  submittedRemarks: { fontSize: 11, fontStyle: 'italic', color: '#15803D', marginTop: 4 },

  btnBid: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnBidText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  bidSubmittedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  bidSubmittedText: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalEstimateBox: { backgroundColor: '#F0FDFA', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalEstimateLabel: { fontSize: 12, color: '#0F766E' },
  modalEstimateVal: { fontSize: 14, fontWeight: '800', color: '#0D9488' },

  inputLabel: { fontSize: 11, fontWeight: '600', color: '#334155', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0F172A' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  btnCancel: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  btnCancelText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  btnConfirmBid: { flex: 2, backgroundColor: '#0D9488', paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnConfirmBidText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
