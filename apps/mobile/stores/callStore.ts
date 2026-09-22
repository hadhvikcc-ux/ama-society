import { create } from 'zustand';
import { Platform, Linking } from 'react-native';

export type CallType = 'AUDIO' | 'VIDEO';
export type CallChannel = 'IN_APP' | 'WHATSAPP' | 'CELLULAR';
export type CallStatus = 'DIALING' | 'RINGING' | 'CONNECTED' | 'ENDED';

export interface CallContact {
  id: string;
  name: string;
  role: string;
  flat?: string;
  phone: string;
  avatar?: string;
  status?: 'online' | 'busy' | 'offline';
  category: 'gate' | 'management' | 'technician' | 'vendor' | 'resident';
}

export interface ActiveCall {
  id: string;
  contact: CallContact;
  callType: CallType;
  channel: CallChannel;
  status: CallStatus;
  direction: 'OUTGOING' | 'INCOMING';
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  durationSeconds: number;
  startedAt?: string;
}

export interface CallHistoryItem {
  id: string;
  contact: CallContact;
  callType: CallType;
  channel: CallChannel;
  direction: 'OUTGOING' | 'INCOMING';
  durationSeconds: number;
  timestamp: string;
  status: 'COMPLETED' | 'MISSED' | 'DECLINED';
}

interface CallState {
  activeCall: ActiveCall | null;
  incomingCall: ActiveCall | null;
  callHistory: CallHistoryItem[];
  
  // Call picker sheet state
  callPickerVisible: boolean;
  selectedContact: CallContact | null;
  preferredCallType: CallType;

  // WhatsApp Guidance Modal State (for explaining WhatsApp chat & offering 1-tap in-app switch)
  whatsAppGuidance: {
    visible: boolean;
    contact: CallContact;
    callType: CallType;
  } | null;

  // Actions
  openCallPicker: (contact: CallContact, preferredType?: CallType) => void;
  closeCallPicker: () => void;
  openWhatsAppGuidance: (contact: CallContact, callType: CallType) => void;
  closeWhatsAppGuidance: () => void;
  startInAppCall: (contact: CallContact, type: CallType) => void;
  launchWhatsAppCall: (contact: CallContact, type: CallType) => Promise<boolean>;
  launchCellularCall: (contact: CallContact) => Promise<boolean>;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  flipCamera: () => void;
  upgradeToVideo: () => void;
  incrementDuration: () => void;
  simulateIncomingCall: (customContact?: Partial<CallContact>, type?: CallType) => void;
}

// Default seed directory contacts for the society
export const SOCIETY_CONTACTS: CallContact[] = [
  // 1. Security Gate Intercom
  {
    id: 'gate-1',
    name: 'Main Gate Security (Guard Ramesh)',
    role: 'Head Security Guard',
    phone: '9820199001',
    category: 'gate',
    status: 'online',
    avatar: '🛡️',
  },
  {
    id: 'gate-2',
    name: 'Back Gate & Visitor Bay (Guard Suresh)',
    role: 'Visitor Gate Guard',
    phone: '9820199002',
    category: 'gate',
    status: 'online',
    avatar: '👮',
  },
  {
    id: 'gate-emergency',
    name: 'Society Emergency Control Desk',
    role: '24/7 Gate Emergency',
    phone: '9820199999',
    category: 'gate',
    status: 'online',
    avatar: '🚨',
  },

  // 2. Management & Administration
  {
    id: 'mgmt-1',
    name: 'Anand Rao',
    role: 'Facility Manager',
    flat: 'Clubhouse Office',
    phone: '9820123451',
    category: 'management',
    status: 'online',
    avatar: '🏢',
  },
  {
    id: 'mgmt-2',
    name: 'Vikram Malhotra',
    role: 'RWA President',
    flat: 'Tower A-602',
    phone: '9820123452',
    category: 'management',
    status: 'online',
    avatar: '👔',
  },
  {
    id: 'mgmt-3',
    name: 'Sunita Roy',
    role: 'Association Secretary',
    flat: 'Tower B-301',
    phone: '9820123453',
    category: 'management',
    status: 'online',
    avatar: '📋',
  },

  // 3. Maintenance Technicians
  {
    id: 'tech-1',
    name: 'Raju (Society Plumber)',
    role: 'Duty Plumber',
    phone: '9820556601',
    category: 'technician',
    status: 'online',
    avatar: '🔧',
  },
  {
    id: 'tech-2',
    name: 'Manoj (Society Electrician)',
    role: 'Duty Electrician',
    phone: '9820556602',
    category: 'technician',
    status: 'online',
    avatar: '⚡',
  },
  {
    id: 'tech-3',
    name: 'KONE Lift Emergency Desk',
    role: 'Elevator Support',
    phone: '9820556603',
    category: 'technician',
    status: 'online',
    avatar: '🛗',
  },

  // 4. Bazaar & Mart
  {
    id: 'vendor-1',
    name: 'Society Mart Cashier & Delivery',
    role: 'Clubhouse Mart Desk',
    phone: '9820998811',
    category: 'vendor',
    status: 'online',
    avatar: '🛒',
  },
  {
    id: 'vendor-2',
    name: 'Daily Fresh Milk & Produce Desk',
    role: 'Morning Supply Mart',
    phone: '9820998822',
    category: 'vendor',
    status: 'online',
    avatar: '🥛',
  },

  // 5. Sample Resident Flats
  {
    id: 'res-a101',
    name: 'Aditya Sharma',
    flat: 'A-101',
    role: 'Flat Owner',
    phone: '9820112345',
    category: 'resident',
    status: 'online',
    avatar: '👤',
  },
  {
    id: 'res-a102',
    name: 'Priya Mehta',
    flat: 'A-102',
    role: 'Flat Tenant',
    phone: '9833445566',
    category: 'resident',
    status: 'online',
    avatar: '👩',
  },
  {
    id: 'res-b202',
    name: 'Vikram Singh',
    flat: 'B-202',
    role: 'Flat Owner',
    phone: '9769012345',
    category: 'resident',
    status: 'busy',
    avatar: '👨',
  },
  {
    id: 'res-b204',
    name: 'Aditya & Neha (Current User Flat)',
    flat: 'B-204',
    role: 'Flat Owner',
    phone: '9820445566',
    category: 'resident',
    status: 'online',
    avatar: '🏠',
  },
  {
    id: 'res-e501',
    name: 'Kavita Joshi',
    flat: 'E-501',
    role: 'Flat Tenant',
    phone: '9820334455',
    category: 'resident',
    status: 'offline',
    avatar: '👩',
  },
];

export const useCallStore = create<CallState>((set, get) => ({
  activeCall: null,
  incomingCall: null,
  callHistory: [
    {
      id: 'h-1',
      contact: SOCIETY_CONTACTS[0],
      callType: 'AUDIO',
      channel: 'IN_APP',
      direction: 'OUTGOING',
      durationSeconds: 94,
      timestamp: 'Today, 02:15 PM',
      status: 'COMPLETED',
    },
    {
      id: 'h-2',
      contact: SOCIETY_CONTACTS[3],
      callType: 'VIDEO',
      channel: 'IN_APP',
      direction: 'INCOMING',
      durationSeconds: 185,
      timestamp: 'Yesterday, 11:30 AM',
      status: 'COMPLETED',
    },
  ],

  callPickerVisible: false,
  selectedContact: null,
  preferredCallType: 'AUDIO',
  whatsAppGuidance: null,

  openCallPicker: (contact: CallContact, preferredType: CallType = 'AUDIO') => {
    set({
      callPickerVisible: true,
      selectedContact: contact,
      preferredCallType: preferredType,
    });
  },

  closeCallPicker: () => {
    set({
      callPickerVisible: false,
      selectedContact: null,
    });
  },

  openWhatsAppGuidance: (contact: CallContact, callType: CallType) => {
    set({
      whatsAppGuidance: {
        visible: true,
        contact,
        callType,
      },
    });
  },

  closeWhatsAppGuidance: () => {
    set({ whatsAppGuidance: null });
  },

  startInAppCall: (contact: CallContact, type: CallType) => {
    const newCall: ActiveCall = {
      id: `call-${Date.now()}`,
      contact,
      callType: type,
      channel: 'IN_APP',
      status: 'DIALING',
      direction: 'OUTGOING',
      isMuted: false,
      isVideoEnabled: type === 'VIDEO',
      isSpeakerOn: type === 'VIDEO',
      isFrontCamera: true,
      durationSeconds: 0,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set({
      activeCall: newCall,
      callPickerVisible: false,
      selectedContact: null,
      whatsAppGuidance: null, // close guidance if switching to in-app
    });

    // Simulate connection flow: Dialing (1s) -> Ringing (2s) -> Connected
    setTimeout(() => {
      const current = get().activeCall;
      if (current && current.id === newCall.id && current.status === 'DIALING') {
        set({ activeCall: { ...current, status: 'RINGING' } });
      }
    }, 1200);

    setTimeout(() => {
      const current = get().activeCall;
      if (current && current.id === newCall.id && (current.status === 'RINGING' || current.status === 'DIALING')) {
        set({ activeCall: { ...current, status: 'CONNECTED' } });
      }
    }, 3200);
  },

  launchWhatsAppCall: async (contact: CallContact, type: CallType): Promise<boolean> => {
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    
    // Format message / call intent with clear instruction to recipient
    const actionText = type === 'VIDEO'
      ? `📹 *AMA SOCIETY VIDEO CALL REQUEST*\n\nHello ${contact.name},\nCalling you via AMA Grand Residences Society Intercom.\n\n👉 *Please tap the 📹 Video Camera icon at the top right of this WhatsApp chat to connect our video call now.*\n\n• Unit: ${contact.flat || 'Society Resident'}\n• Role: ${contact.role}`
      : `📞 *AMA SOCIETY AUDIO CALL REQUEST*\n\nHello ${contact.name},\nCalling you via AMA Grand Residences Society Intercom.`;

    // WhatsApp schemes
    const waNativeCallUrl = `whatsapp://call?phone=+${targetPhone}`;
    const waNativeSendUrl = `whatsapp://send?phone=${targetPhone}&text=${encodeURIComponent(actionText)}`;
    const waChatUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(actionText)}`;

    // Log to call history
    const historyItem: CallHistoryItem = {
      id: `h-${Date.now()}`,
      contact,
      callType: type,
      channel: 'WHATSAPP',
      direction: 'OUTGOING',
      durationSeconds: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'COMPLETED',
    };

    // Close picker, save history, and if VIDEO, open WhatsApp guidance modal
    set(state => ({
      callHistory: [historyItem, ...state.callHistory],
      callPickerVisible: false,
      selectedContact: null,
      whatsAppGuidance: type === 'VIDEO' ? { visible: true, contact, callType: type } : null,
    }));

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(waChatUrl, '_blank');
      return true;
    }

    try {
      if (type === 'AUDIO') {
        const canCall = await Linking.canOpenURL(waNativeCallUrl);
        if (canCall) {
          await Linking.openURL(waNativeCallUrl);
          return true;
        }
      }
      // On mobile native, try native whatsapp://send first
      const canSendNative = await Linking.canOpenURL('whatsapp://send');
      if (canSendNative) {
        await Linking.openURL(waNativeSendUrl);
        return true;
      }
      await Linking.openURL(waChatUrl);
      return true;
    } catch (err) {
      try {
        await Linking.openURL(waChatUrl);
        return true;
      } catch {
        return false;
      }
    }
  },

  launchCellularCall: async (contact: CallContact): Promise<boolean> => {
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    const telUrl = `tel:${cleanPhone}`;

    const historyItem: CallHistoryItem = {
      id: `h-${Date.now()}`,
      contact,
      callType: 'AUDIO',
      channel: 'CELLULAR',
      direction: 'OUTGOING',
      durationSeconds: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'COMPLETED',
    };

    set(state => ({
      callHistory: [historyItem, ...state.callHistory],
      callPickerVisible: false,
      selectedContact: null,
    }));

    try {
      await Linking.openURL(telUrl);
      return true;
    } catch {
      return false;
    }
  },

  acceptIncomingCall: () => {
    const inc = get().incomingCall;
    if (!inc) return;

    const acceptedCall: ActiveCall = {
      ...inc,
      status: 'CONNECTED',
      durationSeconds: 0,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set({
      activeCall: acceptedCall,
      incomingCall: null,
    });
  },

  declineIncomingCall: () => {
    const inc = get().incomingCall;
    if (inc) {
      const historyItem: CallHistoryItem = {
        id: `h-${Date.now()}`,
        contact: inc.contact,
        callType: inc.callType,
        channel: inc.channel,
        direction: 'INCOMING',
        durationSeconds: 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'DECLINED',
      };

      set(state => ({
        incomingCall: null,
        callHistory: [historyItem, ...state.callHistory],
      }));
    }
  },

  endCall: () => {
    const current = get().activeCall;
    if (current) {
      const historyItem: CallHistoryItem = {
        id: `h-${Date.now()}`,
        contact: current.contact,
        callType: current.callType,
        channel: current.channel,
        direction: current.direction,
        durationSeconds: current.durationSeconds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED',
      };

      set(state => ({
        activeCall: null,
        callHistory: [historyItem, ...state.callHistory],
      }));
    }
  },

  toggleMute: () => {
    const current = get().activeCall;
    if (current) {
      set({ activeCall: { ...current, isMuted: !current.isMuted } });
    }
  },

  toggleVideo: () => {
    const current = get().activeCall;
    if (current) {
      set({ activeCall: { ...current, isVideoEnabled: !current.isVideoEnabled } });
    }
  },

  toggleSpeaker: () => {
    const current = get().activeCall;
    if (current) {
      set({ activeCall: { ...current, isSpeakerOn: !current.isSpeakerOn } });
    }
  },

  flipCamera: () => {
    const current = get().activeCall;
    if (current) {
      set({ activeCall: { ...current, isFrontCamera: !current.isFrontCamera } });
    }
  },

  upgradeToVideo: () => {
    const current = get().activeCall;
    if (current) {
      set({
        activeCall: {
          ...current,
          callType: 'VIDEO',
          isVideoEnabled: true,
          isSpeakerOn: true,
        },
      });
    }
  },

  incrementDuration: () => {
    const current = get().activeCall;
    if (current && current.status === 'CONNECTED') {
      set({ activeCall: { ...current, durationSeconds: current.durationSeconds + 1 } });
    }
  },

  simulateIncomingCall: (customContact?: Partial<CallContact>, type: CallType = 'VIDEO') => {
    const defaultCaller = SOCIETY_CONTACTS[0]; // Main Gate Guard
    const contact: CallContact = {
      ...defaultCaller,
      ...customContact,
    };

    const incoming: ActiveCall = {
      id: `inc-${Date.now()}`,
      contact,
      callType: type,
      channel: 'IN_APP',
      status: 'RINGING',
      direction: 'INCOMING',
      isMuted: false,
      isVideoEnabled: type === 'VIDEO',
      isSpeakerOn: type === 'VIDEO',
      isFrontCamera: true,
      durationSeconds: 0,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set({ incomingCall: incoming });
  },
}));
