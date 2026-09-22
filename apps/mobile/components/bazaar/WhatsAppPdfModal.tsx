import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BazaarOrder } from '../../stores/bazaarStore';
import { downloadReceiptPdf, formatWhatsAppReceiptMessage } from '../../utils/receiptPdfGenerator';

interface WhatsAppPdfModalProps {
  visible: boolean;
  onClose: () => void;
  order: BazaarOrder | null;
  onReopenWhatsApp?: () => void;
  onRedownloadPdf?: () => void;
  onCopyText?: () => void;
}

export function WhatsAppPdfModal({
  visible,
  onClose,
  order,
  onReopenWhatsApp,
  onRedownloadPdf,
  onCopyText,
}: WhatsAppPdfModalProps) {
  if (!order) return null;

  const fileName = `Receipt-${order.orderNumber}.pdf`;

  const handleDownload = () => {
    if (onRedownloadPdf) {
      onRedownloadPdf();
    } else {
      downloadReceiptPdf(order);
    }
  };

  const handleWhatsApp = () => {
    if (onReopenWhatsApp) {
      onReopenWhatsApp();
    } else {
      const msg = formatWhatsAppReceiptMessage(order);
      const cleanPhone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
      const targetPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
      const url = targetPhone.length >= 10
        ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    }
  };

  const handleCopy = () => {
    if (onCopyText) {
      onCopyText();
    } else {
      const msg = formatWhatsAppReceiptMessage(order);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(msg);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="document-text" size={20} color="#059669" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.headerTitle}>PDF Ready for WhatsApp</Text>
                <Text style={styles.headerSubtitle}>Official Vector Tax Invoice</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Success Status Banner */}
          <View style={styles.statusBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Downloaded to your device:</Text>
              <Text style={styles.statusFileName}>{fileName}</Text>
            </View>
            <TouchableOpacity style={styles.downloadAgainChip} onPress={handleDownload}>
              <Ionicons name="download" size={13} color="#4338CA" style={{ marginRight: 4 }} />
              <Text style={styles.downloadAgainText}>Re-download</Text>
            </TouchableOpacity>
          </View>

          {/* How to attach on WhatsApp Guide */}
          <View style={styles.guideBox}>
            <Text style={styles.guideHeading}>HOW TO SEND THE PDF ON WHATSAPP:</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={styles.stepDesc}>
                Open the customer's WhatsApp chat tab (we automatically launched it for you).
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={styles.stepDesc}>
                Click <Text style={{ fontWeight: '700' }}>📎 Attach → Document</Text>, or simply <Text style={{ fontWeight: '700' }}>drag & drop</Text> the downloaded <Text style={{ color: '#059669', fontWeight: '700' }}>{fileName}</Text> into the chat box!
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <Text style={styles.stepDesc}>
                Hit send! The customer receives the pristine official PDF file plus the itemized summary.
              </Text>
            </View>
          </View>

          {/* Order Snapshot */}
          <View style={styles.snapshotBox}>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotLabel}>Customer:</Text>
              <Text style={styles.snapshotVal}>{order.customerName} ({order.customerFlat})</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotLabel}>Items Count:</Text>
              <Text style={styles.snapshotVal}>{order.items?.length || 0} item(s)</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotLabel}>Total Amount:</Text>
              <Text style={[styles.snapshotVal, { color: '#059669', fontWeight: '700' }]}>
                ₹{Number(order.totalAmount || 0).toFixed(2)} ({order.paymentMethod})
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsWrap}>
            <TouchableOpacity style={styles.openWhatsAppBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.openWhatsAppBtnText}>Re-open WhatsApp Chat</Text>
            </TouchableOpacity>

            <View style={styles.secondaryBtnRow}>
              <TouchableOpacity style={styles.copyTextBtn} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={15} color="#334155" style={{ marginRight: 6 }} />
                <Text style={styles.copyTextBtnText}>Copy Text Summary</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Ionicons name="checkmark-done" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.doneBtnText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  statusFileName: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '700',
  },
  downloadAgainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  downloadAgainText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  guideBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  guideHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepDesc: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  snapshotBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginBottom: 16,
    gap: 4,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  snapshotLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  snapshotVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  actionsWrap: {
    gap: 8,
  },
  openWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 10,
  },
  openWhatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  copyTextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyTextBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

