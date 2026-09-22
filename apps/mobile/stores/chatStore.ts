import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  channelId: string; // 'general' or specific contact id
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  senderFlat?: string;
  isOwn: boolean;
  type: 'text' | 'video';
  text?: string;
  videoUri?: string;
  videoDurationSec?: number;
  videoThumbnail?: string;
  caption?: string;
  createdAt: string;
  time: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  recipientName?: string;
}

interface ChatState {
  messages: ChatMessage[];
  activeChannelId: string;
  setActiveChannelId: (channelId: string) => void;
  sendTextMessage: (params: {
    channelId?: string;
    text: string;
    senderName?: string;
    senderRole?: string;
    senderFlat?: string;
  }) => ChatMessage;
  sendVideoMessage: (params: {
    channelId?: string;
    videoUri: string;
    videoDurationSec: number;
    caption?: string;
    senderName?: string;
    senderRole?: string;
    senderFlat?: string;
    recipientName?: string;
  }) => ChatMessage;
  deleteMessage: (id: string) => void;
  clearChannel: (channelId: string) => void;
  getMessagesForChannel: (channelId: string) => ChatMessage[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    channelId: 'general',
    senderName: 'Rahul Verma',
    senderRole: 'Resident',
    senderFlat: 'A-402',
    senderAvatar: '👨‍💼',
    isOwn: false,
    type: 'text',
    text: 'Hi everyone, is the gym and clubhouse open today?',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    time: '10:00 AM',
    status: 'read',
  },
  {
    id: 'msg-init-2',
    channelId: 'general',
    senderName: 'You',
    senderRole: 'Resident Owner',
    senderFlat: 'B-204',
    senderAvatar: '👤',
    isOwn: true,
    type: 'text',
    text: 'Yes! It opened at 6 AM as usual. The AC was serviced yesterday.',
    createdAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    time: '10:05 AM',
    status: 'read',
  },
  {
    id: 'msg-init-3',
    channelId: 'general',
    senderName: 'Suresh Kumar (Gate Guard)',
    senderRole: 'Security Head',
    senderFlat: 'Main Gate 1',
    senderAvatar: '🛡️',
    isOwn: false,
    type: 'video',
    text: '',
    videoUri: 'simulated://gate-delivery-note.mp4',
    videoDurationSec: 8,
    caption: '📦 Amazon & BlueDart parcels received at Main Gate desk for Tower B residents.',
    createdAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    time: '10:15 AM',
    status: 'read',
  },
  {
    id: 'msg-init-4',
    channelId: 'general',
    senderName: 'Vikram Malhotra',
    senderRole: 'RWA President',
    senderFlat: 'A-101',
    senderAvatar: '👔',
    isOwn: false,
    type: 'text',
    text: 'Reminder: The Annual Society Maintenance meeting is scheduled for this Sunday at 11 AM.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    time: '10:30 AM',
    status: 'read',
  },
];

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: INITIAL_MESSAGES,
      activeChannelId: 'general',

      setActiveChannelId: (channelId: string) => set({ activeChannelId: channelId }),

      sendTextMessage: ({
        channelId = 'general',
        text,
        senderName = 'You',
        senderRole = 'Resident Owner',
        senderFlat = 'B-204',
      }) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          channelId,
          senderName,
          senderRole,
          senderFlat,
          senderAvatar: '👤',
          isOwn: true,
          type: 'text',
          text: text.trim(),
          createdAt: now.toISOString(),
          time: timeStr,
          status: 'delivered',
        };

        set((state) => ({
          messages: [...state.messages, newMsg],
        }));

        return newMsg;
      },

      sendVideoMessage: ({
        channelId = 'general',
        videoUri,
        videoDurationSec,
        caption,
        senderName = 'You',
        senderRole = 'Resident Owner',
        senderFlat = 'B-204',
        recipientName,
      }) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: ChatMessage = {
          id: `vid-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          channelId,
          senderName,
          senderRole,
          senderFlat,
          senderAvatar: '👤',
          isOwn: true,
          type: 'video',
          videoUri,
          videoDurationSec,
          caption: caption ? caption.trim() : undefined,
          createdAt: now.toISOString(),
          time: timeStr,
          status: 'delivered',
          recipientName,
        };

        set((state) => ({
          messages: [...state.messages, newMsg],
        }));

        return newMsg;
      },

      deleteMessage: (id: string) => {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id),
        }));
      },

      clearChannel: (channelId: string) => {
        set((state) => ({
          messages: state.messages.filter((m) => m.channelId !== channelId),
        }));
      },

      getMessagesForChannel: (channelId: string) => {
        return get()
          .messages.filter(
            (m) =>
              m.channelId === channelId ||
              (channelId === 'general' && (!m.channelId || m.channelId === 'general'))
          )
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },
    }),
    {
      name: 'ama-chat-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
