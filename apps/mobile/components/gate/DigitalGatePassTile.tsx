import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BentoTile } from '../ui/BentoTile';
import { COLORS } from '../../constants/colors';
import { useResponsive } from '../../hooks/useResponsive';
import { TOUCH_TARGET } from '../../constants/theme';

interface DigitalGatePassTileProps {
  residentName?: string;
  flatNumber?: string;
  pin?: string;
  onShare?: () => void;
}

export function DigitalGatePassTile({
  residentName = 'John Doe',
  flatNumber = 'Flat B-204',
  pin = '5821',
  onShare,
}: DigitalGatePassTileProps) {
  const [showPin, setShowPin] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isSmallPhone, isTablet, isDesktop } = useResponsive();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleToggleCard = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setShowPin(!showPin);
  };

  const handleCopyPin = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (onShare) {
      onShare();
    } else {
      const msg = `AMA Gate Pass for ${residentName} (${flatNumber}). Passcode: ${pin}. Valid at Gate 1 & 2.`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Gate Pass Shared', msg);
      }
    }
  };

  // Dynamic QR frame size
  const qrBoxSize = isSmallPhone ? 70 : (isTablet || isDesktop) ? 96 : 82;

  return (
    <BentoTile color="lavender" style={styles.container}>
      {/* Tile Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="ticket-outline" size={18} color={COLORS.PASTEL.lavender.text} />
          <Text style={styles.headerTitle}>Digital Gate Pass</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Fast-Track</Text>
        </View>
      </View>

      {/* Interactive Card Canvas */}
      <TouchableOpacity
        style={styles.passCard}
        onPress={handleToggleCard}
        activeOpacity={0.9}
        accessibilityLabel="Toggle Gate Passcode and QR"
        accessibilityRole="button"
        accessibilityHint="Flips between visual QR code and 4-digit numeric gate passcode"
      >
        <View style={styles.passCardTop}>
          <Text style={styles.passCodeTag}>PASS #8921</Text>
          <View style={styles.verifiedChip}>
            <Text style={styles.verifiedText}>Active</Text>
          </View>
        </View>

        {showPin ? (
          /* PIN View */
          <View style={styles.pinCenterBox}>
            <Text style={styles.pinSubText}>Gate Verification Passcode</Text>
            <View style={styles.pinValueBox}>
              <Text style={styles.pinNumber}>{pin.split('').join(' ')}</Text>
            </View>
            <Text style={styles.pinHint}>Tap card to view QR code</Text>
          </View>
        ) : (
          /* QR Grid View */
          <View style={styles.qrCenterBox}>
            <View style={[styles.qrGrid, { width: qrBoxSize, height: qrBoxSize }]}>
              <View style={styles.qrRow}>
                <View style={[styles.qrCell, { backgroundColor: '#4338CA' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#1E1B4B' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#4338CA' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#A5B4FC' }]} />
              </View>
              <View style={styles.qrRow}>
                <View style={[styles.qrCell, { backgroundColor: '#1E1B4B' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#EEF2FF' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#1E1B4B' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#4338CA' }]} />
              </View>
              <View style={styles.qrRow}>
                <View style={[styles.qrCell, { backgroundColor: '#4338CA' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#1E1B4B' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#818CF8' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#1E1B4B' }]} />
              </View>
              <View style={styles.qrRow}>
                <View style={[styles.qrCell, { backgroundColor: '#A5B4FC' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#4338CA' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#1E1B4B' }]} />
                <View style={[styles.qrCell, { backgroundColor: '#4338CA' }]} />
              </View>
            </View>
            <Text style={styles.qrHint}>Tap to reveal 4-digit PIN</Text>
          </View>
        )}

        <View style={styles.passCardBottom}>
          <Text style={styles.residentName}>{residentName} • {flatNumber}</Text>
          <Text style={styles.barrierText}>Gate 1 &amp; Gate 2 Smart Barrier</Text>
        </View>
      </TouchableOpacity>

      {/* Accessible Action Footer with min 44pt Touch Targets */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.copyBtn}
          onPress={handleCopyPin}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Copy Gate Passcode"
        >
          <Ionicons 
            name={copied ? "checkmark-circle" : "copy-outline"} 
            size={16} 
            color={copied ? "#16A34A" : COLORS.PASTEL.lavender.text} 
          />
          <Text style={[styles.copyBtnText, copied && { color: '#16A34A' }]}>
            {copied ? 'Copied' : 'Copy PIN'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Share Pass via WhatsApp"
        >
          <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>Share Pass</Text>
        </TouchableOpacity>
      </View>
    </BentoTile>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#3730A3',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4338CA',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3730A3',
  },
  passCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    padding: 14,
    marginVertical: 4,
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  passCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passCodeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  verifiedChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  qrCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  qrGrid: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    justifyContent: 'space-between',
  },
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    marginVertical: 1,
  },
  qrCell: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  qrHint: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 6,
  },
  pinCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pinSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pinValueBox: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  pinNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#312E81',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pinHint: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 6,
  },
  passCardBottom: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  residentName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  barrierText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  copyBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.minHeight, // >= 44pt touch target
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  shareBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.minHeight, // >= 44pt touch target
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4338CA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DigitalGatePassTile;
