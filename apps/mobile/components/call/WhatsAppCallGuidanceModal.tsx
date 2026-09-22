import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallStore } from '../../stores/callStore';

export function WhatsAppCallGuidanceModal() {
  const { whatsAppGuidance, closeWhatsAppGuidance, startInAppCall } = useCallStore();

  if (!whatsAppGuidance || !whatsAppGuidance.visible || !whatsAppGuidance.contact) {
    return null;
  }

  const { contact } = whatsAppGuidance;

  const handleSwitchToInApp = () => {
    closeWhatsAppGuidance();
    startInAppCall(contact, 'VIDEO');
  };

  return (
    <Modal
      visible={whatsAppGuidance.visible}
      transparent
      animationType="fade"
      onRequestClose={closeWhatsAppGuidance}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Status Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="logo-whatsapp" size={26} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>WhatsApp Video Call</Text>
              <Text style={styles.headerSubtitle}>Chat opened with prefilled request</Text>
            </View>
            <TouchableOpacity
              onPress={closeWhatsAppGuidance}
              style={styles.closeBtn}
              accessibilityLabel="Close guidance modal"
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Contact Highlight Card */}
          <View style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarText}>{contact.avatar || '👤'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.contactName} numberOfLines={1}>{contact.name}</Text>
              <View style={styles.contactMetaRow}>
                {contact.flat && (
                  <View style={styles.flatPill}>
                    <Text style={styles.flatPillText}>{contact.flat}</Text>
                  </View>
                )}
                <Text style={styles.roleText}>{contact.role}</Text>
              </View>
              <Text style={styles.phoneText}>+91 {contact.phone}</Text>
            </View>
          </View>

          {/* Explanation / Guidance */}
          <View style={styles.instructionBox}>
            <View style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.stepTitle}>WhatsApp Chat Opened</Text>
                <Text style={styles.stepDesc}>
                  We opened your WhatsApp conversation with {contact.name} and pre-filled the society call request.
                </Text>
              </View>
            </View>

            <View style={[styles.stepRow, { marginTop: 12 }]}>
              <View style={[styles.stepNumberBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.stepTitle}>Tap 📹 Video Camera at Top-Right</Text>
                <Text style={styles.stepDesc}>
                  WhatsApp security guidelines require you to tap the <Text style={{ fontWeight: '700', color: '#0F172A' }}>📹 Camera icon</Text> at the top right of the WhatsApp chat to ring their phone.
                </Text>
              </View>
            </View>
          </View>

          {/* Alternative 1-Tap Option */}
          <View style={styles.orDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR WANT 1-TAP CALLING?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Switch to In-App HD Video Call Button */}
          <TouchableOpacity
            style={styles.switchInAppBtn}
            onPress={handleSwitchToInApp}
            activeOpacity={0.85}
          >
            <View style={styles.switchIconBox}>
              <Ionicons name="videocam" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.switchBtnTitle}>Start Instant In-App Video Call</Text>
              <Text style={styles.switchBtnSubtitle}>
                ⚡ Dials immediately with live camera & audio intercom
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7D2FE" />
          </TouchableOpacity>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={closeWhatsAppGuidance}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissBtnText}>I'm Calling in WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    fontSize: 20,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  flatPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  flatPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  roleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  phoneText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  instructionBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginHorizontal: 10,
  },
  switchInAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  switchIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  switchBtnSubtitle: {
    fontSize: 10,
    color: '#E0E7FF',
    marginTop: 2,
  },
  dismissBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
