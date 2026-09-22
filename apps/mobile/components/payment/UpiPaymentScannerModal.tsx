import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import {
  generateUpiUri,
  parseUpiUri,
  getPublicUpiQrImageUrl,
  openGooglePay,
  speakSoundboxNotification,
  UpiPaymentDetails,
} from '../../utils/upiPayment';
import { usePaymentStore, PaymentCategory, PaymentRecord } from '../../stores/paymentStore';
import { useAuthStore } from '../../stores/authStore';
import { UniversalCameraView } from '../camera/UniversalCameraView';

const { width } = Dimensions.get('window');

interface UpiPaymentScannerModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'RECEIVE' | 'SCAN';
  defaultAmount?: number | string;
  defaultPayeeName?: string;
  defaultPayeeVpa?: string;
  category?: PaymentCategory;
  referenceId?: string;
  defaultNote?: string;
  onPaymentSuccess?: (record: PaymentRecord) => void;
}

export function UpiPaymentScannerModal({
  visible,
  onClose,
  initialMode = 'RECEIVE',
  defaultAmount = 4500,
  defaultPayeeName,
  defaultPayeeVpa,
  category = 'MAINTENANCE',
  referenceId,
  defaultNote = 'Payment via UPI',
  onPaymentSuccess,
}: UpiPaymentScannerModalProps) {
  const { user } = useAuthStore();
  const {
    societyUpiId,
    societyPayeeName,
    myUpiId,
    recordPayment,
  } = usePaymentStore();

  const [mode, setMode] = useState<'RECEIVE' | 'SCAN'>(initialMode);

  // Form State for "Receive" mode
  const [payeeName, setPayeeName] = useState(defaultPayeeName || societyPayeeName);
  const [payeeVpa, setPayeeVpa] = useState(defaultPayeeVpa || societyUpiId);
  const [amountStr, setAmountStr] = useState(String(defaultAmount || ''));
  const [noteStr, setNoteStr] = useState(defaultNote);

  // Copy Feedback
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Soundbox & Payment Received Celebration State
  const [receivedRecord, setReceivedRecord] = useState<PaymentRecord | null>(null);
  const [soundboxPulse] = useState(new Animated.Value(1));

  // Scanner State
  const [manualUpiInput, setManualUpiInput] = useState('');
  const [scannedUpi, setScannedUpi] = useState<UpiPaymentDetails | null>(null);
  const [scanLineAnim] = useState(new Animated.Value(0));

  // Ref for QRCode SVG
  const qrRef = useRef<any>(null);

  // Reset and sync props when modal opens
  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setPayeeName(defaultPayeeName || societyPayeeName);
      setPayeeVpa(defaultPayeeVpa || societyUpiId);
      setAmountStr(defaultAmount ? String(defaultAmount) : '');
      setNoteStr(defaultNote);
      setReceivedRecord(null);
      setScannedUpi(null);
    }
  }, [visible, initialMode, defaultAmount, defaultPayeeName, defaultPayeeVpa, defaultNote]);

  // Animated laser scan line for Scan mode
  useEffect(() => {
    if (mode === 'SCAN' && visible) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [mode, visible]);

  // Numerical amount
  const parsedAmount = parseFloat(amountStr) || 0;

  // Active UPI URI for the Receive QR
  const upiUri = generateUpiUri({
    pa: payeeVpa,
    pn: payeeName,
    am: parsedAmount > 0 ? parsedAmount : undefined,
    tn: noteStr,
    tr: referenceId,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyVpa = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(payeeVpa);
    }
    setCopiedVpa(true);
    showToast(`Copied UPI ID: ${payeeVpa}`);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleOpenGPay = async () => {
    const success = await openGooglePay(upiUri);
    if (!success) {
      showToast('Opening Google Pay / UPI intent...');
    }
  };

  const handleShareQr = async () => {
    const publicUrl = getPublicUpiQrImageUrl(upiUri, 500);
    const shareText = `*UPI / Google Pay Payment Request*\n\n` +
      `Payee: *${payeeName}*\n` +
      `UPI ID: *${payeeVpa}*\n` +
      `Amount: *₹${parsedAmount > 0 ? parsedAmount.toLocaleString('en-IN') : 'Any Amount'}*\n` +
      `Note: ${noteStr}\n\n` +
      `📷 *Scan to Pay (Google Pay / PhonePe / Paytm):*\n${publicUrl}\n\n` +
      `Tap link above to open scannable QR code.`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      showToast('Payment link & details copied to clipboard!');
    } else {
      Alert.alert('Payment Share Details', shareText);
    }
  };

  // Soundbox Trigger & Payment Received Simulation
  const handleSimulatePaymentReceived = () => {
    const amt = parsedAmount > 0 ? parsedAmount : 500;
    
    // Animate soundbox pulse
    Animated.sequence([
      Animated.timing(soundboxPulse, { toValue: 1.25, duration: 150, useNativeDriver: true }),
      Animated.timing(soundboxPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    // Trigger voice announcement
    speakSoundboxNotification(amt, 'Google Pay');

    // Record in payment store
    const record = recordPayment({
      amount: amt,
      payeeName,
      payeeUpiId: payeeVpa,
      payerName: user?.name || 'Resident Payer',
      payerFlat: user?.flatNumber || 'B-204',
      category,
      referenceId,
      note: noteStr,
      method: 'UPI_GPAY',
      status: 'SUCCESS',
    });

    setReceivedRecord(record);
    if (onPaymentSuccess) {
      onPaymentSuccess(record);
    }
  };

  // Handle Scanning / Simulating an incoming UPI QR
  const handleScanSampleQr = (sampleUri: string) => {
    const parsed = parseUpiUri(sampleUri);
    if (parsed) {
      setScannedUpi(parsed);
    } else {
      showToast('Invalid UPI QR code format');
    }
  };

  const handleConfirmScannedPayment = () => {
    if (!scannedUpi) return;
    const amt = Number(scannedUpi.am) || 500;

    // Trigger voice announcement
    speakSoundboxNotification(amt, 'Google Pay');

    const record = recordPayment({
      amount: amt,
      payeeName: scannedUpi.pn,
      payeeUpiId: scannedUpi.pa,
      payerName: user?.name || 'Resident Payer',
      payerFlat: user?.flatNumber || 'B-204',
      category,
      referenceId,
      note: scannedUpi.tn || 'Scanned UPI QR Payment',
      method: 'UPI_GPAY',
      status: 'SUCCESS',
    });

    setReceivedRecord(record);
    if (onPaymentSuccess) {
      onPaymentSuccess(record);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.gpayBadge}>
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.gpayBadgeText}>UPI / Google Pay</Text>
              </View>
              <Text style={styles.modalTitle}>
                {mode === 'RECEIVE' ? 'Receive Payment' : 'Scan & Pay'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Mode Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'RECEIVE' && styles.modeTabActive]}
              onPress={() => {
                setMode('RECEIVE');
                setReceivedRecord(null);
              }}
            >
              <Ionicons
                name="qr-code-outline"
                size={18}
                color={mode === 'RECEIVE' ? '#1D4ED8' : '#6B7280'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.modeTabText, mode === 'RECEIVE' && styles.modeTabTextActive]}>
                Show QR (Receive)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'SCAN' && styles.modeTabActive]}
              onPress={() => {
                setMode('SCAN');
                setReceivedRecord(null);
              }}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color={mode === 'SCAN' ? '#1D4ED8' : '#6B7280'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.modeTabText, mode === 'SCAN' && styles.modeTabTextActive]}>
                Scan QR (Pay)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Toast Notification if any */}
          {toastMessage && (
            <View style={styles.toastBanner}>
              <Ionicons name="information-circle" size={18} color="#1E40AF" style={{ marginRight: 6 }} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ============================================================ */}
            {/* SUCCESS CELEBRATION CARD                                     */}
            {/* ============================================================ */}
            {receivedRecord ? (
              <View style={styles.successCard}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-circle" size={54} color="#15803D" />
                </View>
                <Text style={styles.successTitle}>Payment Verified & Received!</Text>
                <Text style={styles.successAmount}>
                  ₹{receivedRecord.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>

                {/* Soundbox Voice Announcement Bar */}
                <View style={styles.soundboxAlertBar}>
                  <Animated.View style={{ transform: [{ scale: soundboxPulse }] }}>
                    <Ionicons name="volume-high" size={24} color="#1D4ED8" />
                  </Animated.View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.soundboxTitle}>Smart Soundbox Voice Alert</Text>
                    <Text style={styles.soundboxSub}>
                      "₹{receivedRecord.amount} received successfully on Google Pay!"
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.replaySoundBtn}
                    onPress={() => speakSoundboxNotification(receivedRecord.amount, 'Google Pay')}
                  >
                    <Ionicons name="play" size={14} color="#1D4ED8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.successDetailsTable}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Transaction ID</Text>
                    <Text style={styles.tableValBold}>{receivedRecord.id}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Payee VPA</Text>
                    <Text style={styles.tableVal}>{receivedRecord.payeeUpiId}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Paid By</Text>
                    <Text style={styles.tableVal}>
                      {receivedRecord.payerName} ({receivedRecord.payerFlat})
                    </Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Time</Text>
                    <Text style={styles.tableVal}>{receivedRecord.timestamp}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Note</Text>
                    <Text style={styles.tableVal}>{receivedRecord.note}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => {
                    setReceivedRecord(null);
                    onClose();
                  }}
                >
                  <Text style={styles.doneBtnText}>Close & Return</Text>
                </TouchableOpacity>
              </View>
            ) : mode === 'RECEIVE' ? (
              /* ============================================================ */
              /* TAB 1: RECEIVE PAYMENT (SHOW DYNAMIC QR STANDEE)             */
              /* ============================================================ */
              <View style={styles.receiveContainer}>
                {/* Standee Card */}
                <View style={styles.standeeCard}>
                  {/* Standee Header */}
                  <View style={styles.standeeHeader}>
                    <Text style={styles.standeeTitle}>SCAN & PAY</Text>
                    <Text style={styles.standeeSub}>Accepted via Any UPI Application</Text>
                    <View style={styles.upiBadgesRow}>
                      <View style={styles.appChip}>
                        <Text style={styles.appChipText}>Google Pay</Text>
                      </View>
                      <View style={[styles.appChip, { backgroundColor: '#F3E8FF' }]}>
                        <Text style={[styles.appChipText, { color: '#6B21A8' }]}>PhonePe</Text>
                      </View>
                      <View style={[styles.appChip, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.appChipText, { color: '#0369A1' }]}>Paytm</Text>
                      </View>
                      <View style={[styles.appChip, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.appChipText, { color: '#047857' }]}>BHIM</Text>
                      </View>
                    </View>
                  </View>

                  {/* QR Code Container */}
                  <View style={styles.qrWrapper}>
                    <View style={styles.qrInner}>
                      <QRCode
                        value={upiUri}
                        size={190}
                        color="#0F172A"
                        backgroundColor="#FFFFFF"
                        getRef={(c) => (qrRef.current = c)}
                      />
                    </View>
                  </View>

                  {/* Amount Display */}
                  <View style={styles.amountDisplayBox}>
                    <Text style={styles.amountDisplayLabel}>Amount to Pay</Text>
                    <Text style={styles.amountDisplayNum}>
                      {parsedAmount > 0
                        ? `₹${parsedAmount.toLocaleString('en-IN')}`
                        : 'Custom Amount'}
                    </Text>
                  </View>

                  {/* Payee Info & Copy UPI ID */}
                  <View style={styles.payeeInfoBox}>
                    <Text style={styles.payeeNameText}>{payeeName}</Text>
                    <View style={styles.vpaRow}>
                      <Text style={styles.vpaText}>{payeeVpa}</Text>
                      <TouchableOpacity style={styles.copyVpaBtn} onPress={handleCopyVpa}>
                        <Ionicons
                          name={copiedVpa ? 'checkmark' : 'copy-outline'}
                          size={14}
                          color={copiedVpa ? '#15803D' : '#1D4ED8'}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.copyVpaText,
                            copiedVpa && { color: '#15803D', fontWeight: '700' },
                          ]}
                        >
                          {copiedVpa ? 'Copied' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Amount Customizer & Quick Chips */}
                <View style={styles.customizerCard}>
                  <Text style={styles.sectionHeader}>Customize Amount (₹)</Text>
                  <View style={styles.amountChipsRow}>
                    {['250', '500', '1000', '1750', '2000', '4500'].map((chip) => (
                      <TouchableOpacity
                        key={chip}
                        style={[
                          styles.amountChip,
                          amountStr === chip && styles.amountChipActive,
                        ]}
                        onPress={() => setAmountStr(chip)}
                      >
                        <Text
                          style={[
                            styles.amountChipText,
                            amountStr === chip && styles.amountChipTextActive,
                          ]}
                        >
                          ₹{chip}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Exact Amount (₹)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="e.g. 1500"
                        placeholderTextColor="#9CA3AF"
                        value={amountStr}
                        onChangeText={setAmountStr}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Remarks / Note</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Maintenance"
                        placeholderTextColor="#9CA3AF"
                        value={noteStr}
                        onChangeText={setNoteStr}
                      />
                    </View>
                  </View>

                  {/* VPA Selector */}
                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Receiving Account</Text>
                  <View style={styles.vpaPickerRow}>
                    <TouchableOpacity
                      style={[
                        styles.vpaPickerChip,
                        payeeVpa === societyUpiId && styles.vpaPickerChipActive,
                      ]}
                      onPress={() => {
                        setPayeeVpa(societyUpiId);
                        setPayeeName(societyPayeeName);
                      }}
                    >
                      <Ionicons name="business" size={14} color={payeeVpa === societyUpiId ? '#1D4ED8' : '#6B7280'} style={{ marginRight: 4 }} />
                      <Text style={[styles.vpaPickerText, payeeVpa === societyUpiId && styles.vpaPickerTextActive]}>
                        Society RWA Account
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.vpaPickerChip,
                        payeeVpa === myUpiId && styles.vpaPickerChipActive,
                      ]}
                      onPress={() => {
                        setPayeeVpa(myUpiId);
                        setPayeeName(user?.name || 'Resident');
                      }}
                    >
                      <Ionicons name="person" size={14} color={payeeVpa === myUpiId ? '#1D4ED8' : '#6B7280'} style={{ marginRight: 4 }} />
                      <Text style={[styles.vpaPickerText, payeeVpa === myUpiId && styles.vpaPickerTextActive]}>
                        My Personal UPI ({myUpiId})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Primary Action Buttons */}
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.gpayLaunchBtn} onPress={handleOpenGPay}>
                    <Ionicons name="open-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.gpayLaunchText}>Open Google Pay Directly</Text>
                  </TouchableOpacity>

                  <View style={styles.dualActionsRow}>
                    <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleShareQr}>
                      <Ionicons name="share-social-outline" size={16} color="#1E40AF" style={{ marginRight: 4 }} />
                      <Text style={styles.secondaryActionText}>Share QR Link</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.secondaryActionBtn, { borderColor: '#16A34A', backgroundColor: '#F0FDF4' }]}
                      onPress={handleSimulatePaymentReceived}
                    >
                      <Ionicons name="volume-medium-outline" size={16} color="#15803D" style={{ marginRight: 4 }} />
                      <Text style={[styles.secondaryActionText, { color: '#15803D' }]}>
                        Test Soundbox 🔊
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* ============================================================ */
              /* TAB 2: SCAN & PAY (CAMERA QR SCANNER)                        */
              /* ============================================================ */
              <View style={styles.scanContainer}>
                {/* Camera Scanner Viewfinder with Live Stream */}
                <View style={styles.viewfinderCard}>
                  <View style={styles.scannerCameraWrapper}>
                    <UniversalCameraView
                      mode="scanner"
                      facing="back"
                      isActive={visible && mode === 'SCAN'}
                      showFlipButton={true}
                      onBarcodeScanned={(scannedData) => {
                        handleScanSampleQr(scannedData);
                      }}
                      fallbackTitle="UPI QR Scanner Camera"
                      style={styles.cameraInnerFeed}
                    >
                      <View style={styles.scannerOverlayContent} pointerEvents="none">
                        <View style={styles.scannerTargetBox}>
                          {/* 4 Corner Brackets */}
                          <View style={[styles.cornerBracket, styles.topLeftCorner]} />
                          <View style={[styles.cornerBracket, styles.topRightCorner]} />
                          <View style={[styles.cornerBracket, styles.bottomLeftCorner]} />
                          <View style={[styles.cornerBracket, styles.bottomRightCorner]} />

                          {/* Animated Laser Scan Line */}
                          <Animated.View
                            style={[
                              styles.laserLine,
                              {
                                transform: [
                                  {
                                    translateY: scanLineAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, 180],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.scannerInstructions}>
                          Align UPI / Google Pay QR Code within the frame
                        </Text>
                      </View>
                    </UniversalCameraView>
                  </View>
                </View>

                {/* Scanned QR Confirmation Card */}
                {scannedUpi && (
                  <View style={styles.scannedPreviewCard}>
                    <View style={styles.scannedHeaderRow}>
                      <Ionicons name="checkmark-circle" size={20} color="#15803D" style={{ marginRight: 6 }} />
                      <Text style={styles.scannedHeaderTitle}>UPI QR Code Decoded!</Text>
                    </View>

                    <View style={styles.scannedRow}>
                      <Text style={styles.scannedLabel}>Payee Name:</Text>
                      <Text style={styles.scannedValBold}>{scannedUpi.pn}</Text>
                    </View>
                    <View style={styles.scannedRow}>
                      <Text style={styles.scannedLabel}>UPI ID (VPA):</Text>
                      <Text style={styles.scannedVal}>{scannedUpi.pa}</Text>
                    </View>
                    <View style={styles.scannedRow}>
                      <Text style={styles.scannedLabel}>Amount:</Text>
                      <Text style={styles.scannedAmountNum}>
                        ₹{scannedUpi.am ? scannedUpi.am.toLocaleString('en-IN') : 'Flexible'}
                      </Text>
                    </View>
                    {scannedUpi.tn && (
                      <View style={styles.scannedRow}>
                        <Text style={styles.scannedLabel}>Purpose:</Text>
                        <Text style={styles.scannedVal}>{scannedUpi.tn}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.payScannedBtn}
                      onPress={handleConfirmScannedPayment}
                    >
                      <Ionicons name="card" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.payScannedBtnText}>
                        Confirm & Pay ₹{scannedUpi.am || 500}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Quick Simulation Bar (One-Tap Test QRs) */}
                <View style={styles.sampleSimCard}>
                  <Text style={styles.sampleSimTitle}>Quick Simulation Test QRs</Text>
                  <Text style={styles.sampleSimSub}>
                    Tap any sample to simulate pointing the camera at that UPI QR:
                  </Text>

                  <TouchableOpacity
                    style={styles.simChip}
                    onPress={() =>
                      handleScanSampleQr(
                        'upi://pay?pa=ama.society@icici&pn=AMA%20Resident%20Welfare%20Association&am=4500.00&cu=INR&tn=Society%20Maintenance%20Bill'
                      )
                    }
                  >
                    <Ionicons name="business" size={16} color="#1D4ED8" style={{ marginRight: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.simChipTitle}>Society Maintenance Fee</Text>
                      <Text style={styles.simChipSub}>₹4,500 • ama.society@icici</Text>
                    </View>
                    <Text style={styles.simScanTag}>Simulate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.simChip}
                    onPress={() =>
                      handleScanSampleQr(
                        'upi://pay?pa=ama.events@okhdfcbank&pn=AMA%20Community%20Event%20Fund&am=500.00&cu=INR&tn=Heritage%20Excursion%20Pool'
                      )
                    }
                  >
                    <Ionicons name="trophy" size={16} color="#D97706" style={{ marginRight: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.simChipTitle}>Community Event Fund</Text>
                      <Text style={styles.simChipSub}>₹500 • ama.events@okhdfcbank</Text>
                    </View>
                    <Text style={styles.simScanTag}>Simulate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.simChip}
                    onPress={() =>
                      handleScanSampleQr(
                        'upi://pay?pa=aditya.sharma@okaxis&pn=Aditya%20Sharma&am=1750.00&cu=INR&tn=Heritage%20Bus%20Booking%20Reimbursement'
                      )
                    }
                  >
                    <Ionicons name="person" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.simChipTitle}>Aditya Sharma (Reimbursement)</Text>
                      <Text style={styles.simChipSub}>₹1,750 • aditya.sharma@okaxis</Text>
                    </View>
                    <Text style={styles.simScanTag}>Simulate</Text>
                  </TouchableOpacity>
                </View>

                {/* Manual UPI String Paste */}
                <View style={styles.manualCard}>
                  <Text style={styles.manualTitle}>Or Paste UPI Code / URL</Text>
                  <View style={styles.manualInputRow}>
                    <TextInput
                      style={styles.manualInput}
                      placeholder="upi://pay?pa=... or name@upi"
                      placeholderTextColor="#9CA3AF"
                      value={manualUpiInput}
                      onChangeText={setManualUpiInput}
                    />
                    <TouchableOpacity
                      style={styles.manualScanBtn}
                      onPress={() => handleScanSampleQr(manualUpiInput)}
                    >
                      <Text style={styles.manualScanBtnText}>Parse</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleGroup: {
    flex: 1,
  },
  gpayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 4,
  },
  gpayBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 6,
    gap: 8,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
  },
  toastText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },

  // RECEIVE MODE (STANDEE)
  receiveContainer: {
    gap: 16,
  },
  standeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  standeeHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  standeeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.5,
  },
  standeeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  upiBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  appChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  qrInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountDisplayBox: {
    marginTop: 14,
    alignItems: 'center',
  },
  amountDisplayLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountDisplayNum: {
    fontSize: 26,
    fontWeight: '900',
    color: '#15803D',
    marginTop: 2,
  },
  payeeInfoBox: {
    marginTop: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    width: '100%',
  },
  payeeNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  vpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  vpaText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyVpaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyVpaText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },

  // CUSTOMIZER
  customizerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  amountChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  amountChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  amountChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  amountChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  amountChipTextActive: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  vpaPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  vpaPickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  vpaPickerChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },
  vpaPickerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  vpaPickerTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },

  // ACTIONS
  actionsGrid: {
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  gpayLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  gpayLaunchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dualActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },

  // SCAN MODE (CAMERA VIEWFINDER)
  scanContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  viewfinderCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scannerCameraWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cameraInnerFeed: {
    width: '100%',
    height: '100%',
  },
  scannerOverlayContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scannerTargetBox: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38BDF8',
  },
  topLeftCorner: {
    top: 4,
    left: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRightCorner: {
    top: 4,
    right: 4,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeftCorner: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRightCorner: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  scannerInstructions: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },

  // SCANNED PREVIEW
  scannedPreviewCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#86EFAC',
    borderRadius: 16,
    padding: 16,
  },
  scannedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scannedHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  scannedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  scannedLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  scannedVal: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  scannedValBold: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '800',
  },
  scannedAmountNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  payScannedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  payScannedBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // SAMPLE SIMULATIONS
  sampleSimCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  sampleSimTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  sampleSimSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  simChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  simChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  simChipSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  simScanTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // MANUAL INPUT
  manualCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  manualTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
  },
  manualScanBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  manualScanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // SUCCESS / SOUNDBOX CELEBRATION
  successCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconCircle: {
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  successAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#15803D',
    marginVertical: 6,
  },
  soundboxAlertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginVertical: 14,
  },
  soundboxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
  },
  soundboxSub: {
    fontSize: 11,
    color: '#1D4ED8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  replaySoundBtn: {
    backgroundColor: '#DBEAFE',
    padding: 8,
    borderRadius: 20,
  },
  successDetailsTable: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  tableVal: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  tableValBold: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
