import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useCallStore, SOCIETY_CONTACTS, CallContact } from '../../../stores/callStore';
import { useChatStore } from '../../../stores/chatStore';
import { useAuthStore } from '../../../stores/authStore';
import { VideoMessageRecorderModal } from '../../../components/media/VideoMessageRecorderModal';

export default function SocietyDirectoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sendVideoMessage } = useChatStore();
  const {
    openCallPicker,
    callHistory,
    simulateIncomingCall,
  } = useCallStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [recordingContact, setRecordingContact] = useState<CallContact | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Contacts', icon: 'people' },
    { id: 'gate', label: 'Gate Intercom', icon: 'shield-checkmark' },
    { id: 'management', label: 'Office & Admin', icon: 'business' },
    { id: 'technician', label: 'Maintenance', icon: 'construct' },
    { id: 'vendor', label: 'Mart & Delivery', icon: 'cart' },
    { id: 'resident', label: 'Flats & Neighbors', icon: 'home' },
  ];

  const filteredContacts = useMemo(() => {
    return SOCIETY_CONTACTS.filter(contact => {
      const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        contact.name.toLowerCase().includes(q) ||
        (contact.flat && contact.flat.toLowerCase().includes(q)) ||
        contact.role.toLowerCase().includes(q) ||
        contact.phone.includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleAudioCall = (contact: CallContact) => {
    openCallPicker(contact, 'AUDIO');
  };

  const handleVideoCall = (contact: CallContact) => {
    openCallPicker(contact, 'VIDEO');
  };

  const handleRecordVideoMsg = (contact: CallContact) => {
    setRecordingContact(contact);
  };

  const handleSendVideo = (payload: { videoUri: string; durationSec: number; caption?: string }) => {
    if (!recordingContact) return;
    sendVideoMessage({
      channelId: 'general',
      videoUri: payload.videoUri,
      videoDurationSec: payload.durationSec,
      caption: payload.caption
        ? `[Video Note for ${recordingContact.name}] ${payload.caption}`
        : `Video note for ${recordingContact.name} (${recordingContact.role})`,
      senderName: user?.name || 'You',
      senderRole: user?.role === 'resident_owner' ? 'Resident Owner' : 'Resident',
      senderFlat: user?.flatNumber || 'B-204',
      recipientName: recordingContact.name,
    });
    setSuccessToast(`Video message delivered to ${recordingContact.name}!`);
    setTimeout(() => setSuccessToast(null), 4500);
    setRecordingContact(null);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const renderContact = ({ item }: { item: CallContact }) => (
    <View style={styles.contactCard}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>{item.avatar || '👤'}</Text>
        <View
          style={[
            styles.statusDotSmall,
            item.status === 'online'
              ? { backgroundColor: '#10B981' }
              : item.status === 'busy'
              ? { backgroundColor: '#F59E0B' }
              : { backgroundColor: '#94A3B8' },
          ]}
        />
      </View>

      <View style={styles.contactInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.flat && (
            <View style={styles.flatTag}>
              <Text style={styles.flatTagText}>{item.flat}</Text>
            </View>
          )}
        </View>

        <Text style={styles.contactRole}>{item.role}</Text>
        <Text style={styles.contactPhone}>+91 {item.phone}</Text>
      </View>

      {/* Action Buttons: Audio, Video & Video Note */}
      <View style={styles.actionButtonsCol}>
        <TouchableOpacity
          style={[styles.callActionBtn, styles.audioActionBtn]}
          onPress={() => handleAudioCall(item)}
          activeOpacity={0.7}
          accessibilityLabel={`Call ${item.name}`}
        >
          <Ionicons name="call" size={15} color="#FFFFFF" />
          <Text style={styles.callActionText}>Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.callActionBtn, styles.videoActionBtn]}
          onPress={() => handleVideoCall(item)}
          activeOpacity={0.7}
          accessibilityLabel={`Video call ${item.name}`}
        >
          <Ionicons name="videocam" size={15} color="#FFFFFF" />
          <Text style={styles.callActionText}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.callActionBtn, styles.videoMsgActionBtn]}
          onPress={() => handleRecordVideoMsg(item)}
          activeOpacity={0.7}
          accessibilityLabel={`Record video note for ${item.name}`}
        >
          <Ionicons name="recording" size={15} color="#FFFFFF" />
          <Text style={styles.callActionText}>Note</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Society Intercom & Calls 📞"
        subtitle="App-to-App VoIP & WhatsApp Calling"
      />

      {/* Top Demo Intercom Trigger Bar */}
      <View style={styles.demoBanner}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.demoTitle}>Need to test incoming intercom?</Text>
          <Text style={styles.demoSub}>Simulate receiving a Gate Video Call from Main Guard</Text>
        </View>
        <TouchableOpacity
          style={styles.demoTriggerBtn}
          onPress={() => simulateIncomingCall({ name: 'Main Gate Guard Ramesh', flat: 'Gate Intercom 1', avatar: '🛡️' }, 'VIDEO')}
          activeOpacity={0.8}
        >
          <Ionicons name="videocam" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.demoTriggerText}>Test Ring</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Flat (e.g. B-204), Name, Role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills Strip */}
      <View style={styles.categoryStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={selectedCategory === cat.id ? '#FFFFFF' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.categoryPillText, selectedCategory === cat.id && styles.categoryPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Call History Quick Dropdown Toggle */}
      <View style={styles.historyToggleRow}>
        <Text style={styles.sectionHeader}>
          {selectedCategory === 'all' ? 'ALL CONTACTS' : categories.find(c => c.id === selectedCategory)?.label.toUpperCase()} ({filteredContacts.length})
        </Text>
        <TouchableOpacity
          style={styles.historyToggleBtn}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Ionicons name="time-outline" size={14} color="#1D4ED8" style={{ marginRight: 4 }} />
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Hide Call Log' : `Recent Calls (${callHistory.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Calls Panel (Collapsible) */}
      {showHistory && (
        <View style={styles.historyBox}>
          <Text style={styles.historyHeading}>RECENT CALL HISTORY</Text>
          {callHistory.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#94A3B8', paddingVertical: 6 }}>No recent calls logged</Text>
          ) : (
            callHistory.slice(0, 4).map(h => (
              <View key={h.id} style={styles.historyRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons
                    name={h.callType === 'VIDEO' ? 'videocam' : 'call'}
                    size={16}
                    color={h.direction === 'INCOMING' ? '#10B981' : '#3B82F6'}
                    style={{ marginRight: 8 }}
                  />
                  <View>
                    <Text style={styles.historyName}>{h.contact.name}</Text>
                    <Text style={styles.historySub}>
                      {h.channel} • {h.timestamp} {h.durationSeconds > 0 ? `(${formatDuration(h.durationSeconds)})` : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.historyRedialBtn}
                  onPress={() => openCallPicker(h.contact, h.callType)}
                >
                  <Ionicons name="refresh" size={14} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.id}
        renderItem={renderContact}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching contacts</Text>
            <Text style={styles.emptySub}>Try adjusting your search query or selected category.</Text>
          </View>
        )}
      />

      {/* Video Message Delivered Success Toast */}
      {successToast && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{successToast}</Text>
          <TouchableOpacity
            style={styles.toastActionBtn}
            onPress={() => router.push('/(resident)/community/chat')}
            activeOpacity={0.8}
          >
            <Text style={styles.toastActionText}>View in Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Video Message Recorder Modal */}
      <VideoMessageRecorderModal
        visible={!!recordingContact}
        onClose={() => setRecordingContact(null)}
        onSendVideo={handleSendVideo}
        recipientName={recordingContact?.name}
        recipientRole={recordingContact?.role}
        recipientFlat={recordingContact?.flat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Demo Banner
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  demoTitle: { fontSize: 13, fontWeight: '700', color: '#1E3A8A' },
  demoSub: { fontSize: 11, color: '#3B82F6', marginTop: 1 },
  demoTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  demoTriggerText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },

  // Category Strip
  categoryStrip: {
    marginVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  categoryPillText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  categoryPillTextActive: { color: '#FFFFFF' },

  // History Toggle
  historyToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  historyToggleBtn: { flexDirection: 'row', alignItems: 'center' },
  historyToggleText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },

  // Collapsible History Box
  historyBox: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeading: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  historySub: { fontSize: 11, color: '#64748B' },
  historyRedialBtn: { padding: 6, borderRadius: 6, backgroundColor: '#EFF6FF' },

  // Contact Cards
  listContent: { paddingHorizontal: 16, paddingBottom: 60 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarEmoji: { fontSize: 22 },
  statusDotSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contactInfo: { flex: 1, marginRight: 8 },
  contactName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  flatTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  flatTagText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  contactRole: { fontSize: 11, color: '#64748B', marginTop: 1 },
  contactPhone: { fontSize: 10, color: '#94A3B8', marginTop: 1 },

  // Action Buttons
  actionButtonsCol: {
    flexDirection: 'row',
    gap: 6,
  },
  callActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  audioActionBtn: {
    backgroundColor: '#16A34A',
  },
  videoActionBtn: {
    backgroundColor: '#4338CA',
  },
  videoMsgActionBtn: {
    backgroundColor: '#DC2626',
  },
  callActionText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', marginLeft: 4 },

  // Toast Banner
  toastContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 40,
  },
  toastText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  toastActionBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  toastActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60A5FA',
  },

  // Empty State
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
});
