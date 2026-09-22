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
import { useCallStore } from '../../stores/callStore';

export function CallPickerModal() {
  const {
    callPickerVisible,
    selectedContact,
    preferredCallType,
    closeCallPicker,
    startInAppCall,
    launchWhatsAppCall,
    launchCellularCall,
  } = useCallStore();

  if (!callPickerVisible || !selectedContact) return null;

  const isVideo = preferredCallType === 'VIDEO';

  const handleInApp = () => {
    startInAppCall(selectedContact, preferredCallType);
  };

  const handleWhatsApp = () => {
    launchWhatsAppCall(selectedContact, preferredCallType);
  };

  const handleCellular = () => {
    launchCellularCall(selectedContact);
  };

  return (
    <Modal
      visible={callPickerVisible}
      transparent
      animationType="fade"
      onRequestClose={closeCallPicker}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{selectedContact.avatar || '👤'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.nameText} numberOfLines={1}>{selectedContact.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
                {selectedContact.flat && (
                  <View style={styles.flatPill}>
                    <Text style={styles.flatPillText}>{selectedContact.flat}</Text>
                  </View>
                )}
                <Text style={styles.roleText}>{selectedContact.role}</Text>
              </View>
              <Text style={styles.phoneText}>+91 {selectedContact.phone}</Text>
            </View>
            <TouchableOpacity onPress={closeCallPicker} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.promptHeading}>
            CHOOSE {isVideo ? 'VIDEO' : 'AUDIO'} CALL METHOD:
          </Text>

          {/* Educational notice if Video call is selected */}
          {isVideo && (
            <View style={styles.videoNoticeBox}>
              <Ionicons name="videocam" size={16} color="#4338CA" style={{ marginTop: 1 }} />
              <Text style={styles.videoNoticeText}>
                <Text style={{ fontWeight: '700', color: '#312E81' }}>Tip:</Text> Use{' '}
                <Text style={{ fontWeight: '700', color: '#4338CA' }}>In-App HD Video</Text> for instant 1-tap connection with live camera. WhatsApp opens chat & requires tapping 📹 in WhatsApp to ring.
              </Text>
            </View>
          )}

          {/* Option 1: In-App VoIP Call */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              styles.inAppCard,
              isVideo && styles.inAppCardHighlighted,
            ]}
            onPress={handleInApp}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: isVideo ? '#4338CA' : '#16A34A' }]}>
              <Ionicons name={isVideo ? 'videocam' : 'call'} size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.optionTitle}>In-App HD {isVideo ? 'Video' : 'Voice'} Call</Text>
                <View style={[styles.recommendedBadge, isVideo && styles.instantBadge]}>
                  <Text style={[styles.recommendedBadgeText, isVideo && styles.instantBadgeText]}>
                    {isVideo ? '⚡ Instant (1-Tap)' : 'Fast & Free'}
                  </Text>
                </View>
              </View>
              <Text style={styles.optionSub}>
                {isVideo
                  ? 'Connects immediately inside AMA with live camera & audio intercom'
                  : 'Direct App-to-App connection • Crystal-clear intercom'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isVideo ? '#4338CA' : '#94A3B8'} />
          </TouchableOpacity>

          {/* Option 2: WhatsApp Call */}
          <TouchableOpacity
            style={[styles.optionCard, styles.whatsAppCard]}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.optionTitle}>WhatsApp {isVideo ? 'Video' : 'Voice'} Call</Text>
                <View style={[styles.recommendedBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.recommendedBadgeText, { color: '#15803D' }]}>
                    {isVideo ? 'Opens Chat' : 'External'}
                  </Text>
                </View>
              </View>
              <Text style={styles.optionSub}>
                {isVideo
                  ? `Opens WhatsApp chat • Tap 📹 at top-right to ring`
                  : `Launches WhatsApp to +91 ${selectedContact.phone}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Option 3: Cellular Call (if audio) */}
          {!isVideo && (
            <TouchableOpacity
              style={[styles.optionCard, styles.cellularCard]}
              onPress={handleCellular}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.optionTitle}>Standard Phone Call</Text>
                <Text style={styles.optionSub}>Direct cellular dialer (+91 {selectedContact.phone})</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={closeCallPicker}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24 },
  nameText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  flatPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flatPillText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  roleText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  phoneText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  closeBtn: { padding: 6 },
  promptHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  inAppCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  whatsAppCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cellularCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  optionSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  recommendedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  recommendedBadgeText: { fontSize: 10, fontWeight: '700', color: '#1D4ED8' },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  videoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 8,
  },
  videoNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  inAppCardHighlighted: {
    backgroundColor: '#F5F3FF',
    borderColor: '#818CF8',
    borderWidth: 1.5,
  },
  instantBadge: {
    backgroundColor: '#4338CA',
  },
  instantBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
