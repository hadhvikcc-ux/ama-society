import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/authStore';
import { useCallStore, SOCIETY_CONTACTS } from '../../../stores/callStore';
import { useChatStore, ChatMessage } from '../../../stores/chatStore';
import { VideoMessageCard } from '../../../components/chat/VideoMessageCard';
import { VideoMessageRecorderModal } from '../../../components/media/VideoMessageRecorderModal';
import { VideoPlayerModal } from '../../../components/media/VideoPlayerModal';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [selectedVideoMessage, setSelectedVideoMessage] = useState<ChatMessage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuthStore();
  const { openCallPicker } = useCallStore();
  const { messages, sendTextMessage, sendVideoMessage } = useChatStore();

  // Keep messages strictly ordered from earliest (top) to latest (bottom)
  const channelMessages = useMemo(() => {
    return messages
      .filter((m) => !m.channelId || m.channelId === 'general')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  // Scroll to bottom on initial load and whenever messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [channelMessages.length]);

  const handleSendText = () => {
    if (!input.trim()) return;
    sendTextMessage({
      channelId: 'general',
      text: input.trim(),
      senderName: user?.name || 'You',
      senderRole: user?.role === 'resident_owner' ? 'Resident Owner' : 'Resident',
      senderFlat: user?.flatNumber || 'B-204',
    });
    setInput('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSendVideo = (payload: { videoUri: string; durationSec: number; caption?: string }) => {
    sendVideoMessage({
      channelId: 'general',
      videoUri: payload.videoUri,
      videoDurationSec: payload.durationSec,
      caption: payload.caption,
      senderName: user?.name || 'You',
      senderRole: user?.role === 'resident_owner' ? 'Resident Owner' : 'Resident',
      senderFlat: user?.flatNumber || 'B-204',
      recipientName: 'General Community',
    });
    setToastMessage('📹 Video note posted to General Chat!');
    setTimeout(() => setToastMessage(null), 4000);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'video') {
      return (
        <VideoMessageCard
          message={item}
          onPlayVideo={(msg) => setSelectedVideoMessage(msg)}
        />
      );
    }

    return (
      <View style={[styles.msgContainer, item.isOwn ? styles.msgOwn : styles.msgOther]}>
        {!item.isOwn && (
          <View style={styles.senderHeader}>
            <Text style={styles.senderAvatar}>{item.senderAvatar || '👤'}</Text>
            <Text style={styles.senderName}>{item.senderName}</Text>
            {item.senderFlat && (
              <View style={styles.senderFlatTag}>
                <Text style={styles.senderFlatTagText}>{item.senderFlat}</Text>
              </View>
            )}
          </View>
        )}
        <View style={[styles.bubble, item.isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.msgText, item.isOwn ? styles.msgTextOwn : styles.msgTextOther]}>
            {item.text}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{item.time}</Text>
          {item.isOwn && (
            <Ionicons
              name="checkmark-done"
              size={13}
              color={item.status === 'read' ? '#3B82F6' : '#94A3B8'}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="General Chat 💬"
        subtitle="142 members • Society Broadcast & Notes"
        rightElement={
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.headerCallBtn}
              onPress={() => openCallPicker(SOCIETY_CONTACTS[0], 'AUDIO')}
              activeOpacity={0.8}
              accessibilityLabel="Audio Call Gate"
            >
              <Ionicons name="call" size={17} color="#16A34A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerCallBtn, { backgroundColor: '#EEF2FF' }]}
              onPress={() => openCallPicker(SOCIETY_CONTACTS[0], 'VIDEO')}
              activeOpacity={0.8}
              accessibilityLabel="Video Call Gate"
            >
              <Ionicons name="videocam" size={18} color="#4338CA" />
            </TouchableOpacity>

            {/* Direct Quick Video Message Button in Header */}
            <TouchableOpacity
              style={[styles.headerCallBtn, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
              onPress={() => setIsRecorderOpen(true)}
              activeOpacity={0.8}
              accessibilityLabel="Record Video Note"
            >
              <Ionicons name="recording" size={17} color="#DC2626" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Success Toast Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#15803D" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={channelMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Bar with Video Note Recorder trigger */}
      <View style={styles.inputBar}>
        {/* Record Video Button */}
        <TouchableOpacity
          style={styles.recordVideoBtn}
          onPress={() => setIsRecorderOpen(true)}
          activeOpacity={0.8}
          accessibilityLabel="Record Video Message"
        >
          <Ionicons name="videocam" size={22} color="#DC2626" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message or tap 📹 to record video..."
          placeholderTextColor="#94A3B8"
          value={input}
          onChangeText={setInput}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={handleSendText}
          disabled={!input.trim()}
          activeOpacity={0.8}
          accessibilityLabel="Send Message"
        >
          <Ionicons name="paper-plane" size={19} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Video Message Recorder Modal */}
      <VideoMessageRecorderModal
        visible={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onSendVideo={handleSendVideo}
        recipientName="General Community Chat"
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        visible={!!selectedVideoMessage}
        message={selectedVideoMessage}
        onClose={() => setSelectedVideoMessage(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  msgContainer: {
    marginVertical: 6,
    maxWidth: '82%',
  },
  msgOwn: {
    alignSelf: 'flex-end',
  },
  msgOther: {
    alignSelf: 'flex-start',
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
    marginLeft: 4,
  },
  senderAvatar: {
    fontSize: 13,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  senderFlatTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  senderFlatTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleOwn: {
    backgroundColor: '#1B4FD8',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  msgTextOwn: {
    color: '#FFFFFF',
  },
  msgTextOther: {
    color: '#0F172A',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 3,
    marginRight: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  recordVideoBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 90,
    fontSize: 15,
    color: '#0F172A',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1B4FD8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
});
