import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EmergencyType = 'MEDICAL' | 'FIRE' | 'LIFT_STUCK' | 'SECURITY' | 'OTHER';
export type EmergencyStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED';

export interface SosAlert {
  id: string; // e.g. "SOS-9821"
  type: EmergencyType;
  status: EmergencyStatus;
  residentId: string;
  residentName: string;
  flatNumber: string;
  tower: string;
  phone: string;
  notes?: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

interface SosState {
  activeAlert: SosAlert | null;
  alertHistory: SosAlert[];
  isSirenActive: boolean;

  // Actions
  triggerEmergency: (params: {
    type: EmergencyType;
    residentName?: string;
    flatNumber?: string;
    tower?: string;
    phone?: string;
    notes?: string;
  }) => SosAlert;
  acknowledgeAlert: (responderName?: string) => void;
  resolveAlert: (responderName?: string, resolutionNotes?: string) => void;
  cancelAlert: (reason?: string) => void;
  dismissSiren: () => void;
  resetSos: () => void;
}

export const EMERGENCY_TYPE_INFO: Record<EmergencyType, { title: string; emoji: string; color: string; bg: string }> = {
  MEDICAL: { title: 'Medical Emergency', emoji: '🚑', color: '#BE123C', bg: '#FFE4E6' },
  FIRE: { title: 'Fire Threat', emoji: '🔥', color: '#C2410C', bg: '#FFEDD5' },
  LIFT_STUCK: { title: 'Elevator / Lift Trapped', emoji: '🛗', color: '#B45309', bg: '#FEF3C7' },
  SECURITY: { title: 'Security / Intruder Alert', emoji: '🚨', color: '#991B1B', bg: '#FEE2E2' },
  OTHER: { title: 'Emergency Assistance', emoji: '⚠️', color: '#7C2D12', bg: '#FFEDD5' },
};

export const useSosStore = create<SosState>()(
  persist(
    (set, get) => ({
      activeAlert: null,
      alertHistory: [
        {
          id: 'SOS-0012',
          type: 'LIFT_STUCK',
          status: 'RESOLVED',
          residentId: 'usr-demo-1',
          residentName: 'Kavita Chawla',
          flatNumber: 'C-305',
          tower: 'Tower C',
          phone: '9820111222',
          notes: 'Lift 2 stopped between 3rd & 4th floor.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
          acknowledgedAt: new Date(Date.now() - 3600000 * 24 * 3 + 120000).toISOString(),
          acknowledgedBy: 'Main Gate Guard Ramesh',
          resolvedAt: new Date(Date.now() - 3600000 * 24 * 3 + 600000).toISOString(),
          resolvedBy: 'OTIS Technician Suresh',
          resolutionNotes: 'Manual crank brake released safely, passenger exited at 3rd floor.',
        },
      ],
      isSirenActive: false,

      triggerEmergency: ({ type, residentName = 'Aditya Sharma', flatNumber = 'B-204', tower = 'Tower B', phone = '9820199001', notes }) => {
        const id = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
        const alert: SosAlert = {
          id,
          type,
          status: 'TRIGGERED',
          residentId: `res-${Date.now()}`,
          residentName,
          flatNumber,
          tower,
          phone,
          notes,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          activeAlert: alert,
          alertHistory: [alert, ...state.alertHistory],
          isSirenActive: true,
        }));

        return alert;
      },

      acknowledgeAlert: (responderName = 'Main Gate Security') => {
        const { activeAlert, alertHistory } = get();
        if (!activeAlert) return;

        const updated: SosAlert = {
          ...activeAlert,
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: responderName,
        };

        set({
          activeAlert: updated,
          alertHistory: alertHistory.map((a) => (a.id === updated.id ? updated : a)),
          isSirenActive: false,
        });
      },

      resolveAlert: (responderName = 'Main Gate Security', resolutionNotes = 'Verified on site. Situation resolved.') => {
        const { activeAlert, alertHistory } = get();
        if (!activeAlert) return;

        const updated: SosAlert = {
          ...activeAlert,
          status: 'RESOLVED',
          resolvedAt: new Date().toISOString(),
          resolvedBy: responderName,
          resolutionNotes,
        };

        set({
          activeAlert: null,
          alertHistory: alertHistory.map((a) => (a.id === updated.id ? updated : a)),
          isSirenActive: false,
        });
      },

      cancelAlert: (reason = 'Cancelled by resident (False alarm)') => {
        const { activeAlert, alertHistory } = get();
        if (!activeAlert) return;

        const updated: SosAlert = {
          ...activeAlert,
          status: 'CANCELLED',
          resolvedAt: new Date().toISOString(),
          resolvedBy: 'Resident Self-Cancel',
          resolutionNotes: reason,
        };

        set({
          activeAlert: null,
          alertHistory: alertHistory.map((a) => (a.id === updated.id ? updated : a)),
          isSirenActive: false,
        });
      },

      dismissSiren: () => set({ isSirenActive: false }),

      resetSos: () => set({ activeAlert: null, isSirenActive: false }),
    }),
    {
      name: 'ama-sos-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
