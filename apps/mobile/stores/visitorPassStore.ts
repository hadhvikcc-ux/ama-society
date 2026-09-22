import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseSlotTime } from './bookingStore';

export type VisitorCategory = 'Guest' | 'Delivery' | 'Cab' | 'Maintenance' | 'Other';
export type PassStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface VisitorPass {
  id: string; // e.g. AMAVP00001
  visitorName: string;
  visitorPhone?: string;
  category: VisitorCategory;
  validDate: string; // e.g. "Today, 16 Sep 2026"
  validDateRaw: string; // "2026-09-16"
  startTime: string; // e.g. "02:00 PM"
  endTime: string; // e.g. "06:00 PM"
  timeSlotLabel: string; // e.g. "Afternoon (02:00 PM - 06:00 PM)"
  flatNumber: string;
  tower: string;
  residentName: string;
  residentPhone?: string;
  accessPin: string; // 6-digit OTP/PIN e.g. "582194"
  vehicleNumber?: string;
  status: PassStatus;
  createdAt: string;
}

interface VisitorPassState {
  passes: VisitorPass[];
  passCounter: number;
  addPass: (
    data: Omit<VisitorPass, 'id' | 'createdAt' | 'accessPin' | 'status'>
  ) => string;
  cancelPass: (id: string) => void;
  markPassUsed: (id: string) => void;
  getPassById: (id: string) => VisitorPass | undefined;
  findPass: (query: string) => VisitorPass | undefined;
  syncHostDetails: (host: {
    residentName: string;
    flatNumber: string;
    tower: string;
    residentPhone?: string;
  }) => void;
}

export function generatePassId(counter: number): string {
  return `AMAVP${String(counter).padStart(5, '0')}`;
}

export function checkPassTimingValidity(pass: VisitorPass): {
  isValid: boolean;
  statusText: string;
  isToday: boolean;
  canAdmit: boolean;
} {
  const now = new Date();
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayMonth = now.toLocaleDateString('en-US', { month: 'short' });

  const isToday =
    pass.validDate.toLowerCase().startsWith('today') ||
    (pass.validDate.includes(todayDay) && pass.validDate.includes(todayMonth));

  if (pass.status === 'CANCELLED') {
    return { isValid: false, statusText: 'Cancelled by Resident', isToday, canAdmit: false };
  }
  if (pass.status === 'USED') {
    return { isValid: false, statusText: 'Already Used / Admitted', isToday, canAdmit: false };
  }

  // Date verification
  const cleanedDate = pass.validDate.replace(/^[A-Za-z]+,\s*/, '').trim();
  const parsedDate = new Date(cleanedDate);
  if (!isNaN(parsedDate.getTime())) {
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetZero = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    if (targetZero < todayZero) {
      return { isValid: false, statusText: 'Expired (Past Date)', isToday: false, canAdmit: false };
    }
    if (targetZero > todayZero) {
      return { isValid: true, statusText: `Scheduled for ${pass.validDate}`, isToday: false, canAdmit: false };
    }
  }

  // Timing check for Today
  if (isToday) {
    const { hours: startH, minutes: startM } = parseSlotTime(pass.startTime);
    const { hours: endH, minutes: endM } = parseSlotTime(pass.endTime);
    const curH = now.getHours();
    const curM = now.getMinutes();

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const curTotal = curH * 60 + curM;

    if (curTotal < startTotal) {
      return {
        isValid: false,
        statusText: `Not Yet Active (Valid from ${pass.startTime})`,
        isToday: true,
        canAdmit: false,
      };
    }
    if (curTotal > endTotal) {
      return {
        isValid: false,
        statusText: `Expired at ${pass.endTime}`,
        isToday: true,
        canAdmit: false,
      };
    }

    return { isValid: true, statusText: 'Valid Now', isToday: true, canAdmit: true };
  }

  return { isValid: true, statusText: 'Active', isToday: false, canAdmit: false };
}

const initialPasses: VisitorPass[] = [
  {
    id: 'AMAVP00001',
    visitorName: 'Suresh Verma (Guest)',
    visitorPhone: '9876543210',
    category: 'Guest',
    validDate: 'Today, 16 Sep 2026',
    validDateRaw: '2026-09-16',
    startTime: '12:01 AM',
    endTime: '11:59 PM',
    timeSlotLabel: 'All Day (12:01 AM - 11:59 PM)',
    flatNumber: 'B-204',
    tower: 'Tower B',
    residentName: 'Aditya Sharma',
    residentPhone: '+91 98765 43210',
    accessPin: '492810',
    vehicleNumber: 'KA 03 MX 4412',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'AMAVP00002',
    visitorName: 'BlueDart Courier',
    category: 'Delivery',
    validDate: 'Today, 16 Sep 2026',
    validDateRaw: '2026-09-16',
    startTime: '11:00 AM',
    endTime: '04:00 PM',
    timeSlotLabel: 'Mid-Day (11:00 AM - 04:00 PM)',
    flatNumber: 'B-204',
    tower: 'Tower B',
    residentName: 'Aditya Sharma',
    residentPhone: '+91 98765 43210',
    accessPin: '731502',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'AMAVP00003',
    visitorName: 'Urban Company AC Service',
    category: 'Maintenance',
    validDate: 'Thu, 17 Sep 2026',
    validDateRaw: '2026-09-17',
    startTime: '02:00 PM',
    endTime: '06:00 PM',
    timeSlotLabel: 'Afternoon (02:00 PM - 06:00 PM)',
    flatNumber: 'B-204',
    tower: 'Tower B',
    residentName: 'Aditya Sharma',
    residentPhone: '+91 98765 43210',
    accessPin: '184920',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export const useVisitorPassStore = create<VisitorPassState>()(
  persist(
    (set, get) => ({
      passes: initialPasses,
      passCounter: 4,
      addPass: (data) => {
        const counter = get().passCounter;
        const newId = generatePassId(counter);
        const accessPin = String(Math.floor(100000 + Math.random() * 900000));
        const newPass: VisitorPass = {
          ...data,
          id: newId,
          accessPin,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          passes: [newPass, ...state.passes],
          passCounter: state.passCounter + 1,
        }));
        return newId;
      },
      cancelPass: (id) => {
        set((state) => ({
          passes: state.passes.map((p) =>
            p.id.toUpperCase() === id.toUpperCase() ? { ...p, status: 'CANCELLED' } : p
          ),
        }));
      },
      markPassUsed: (id) => {
        set((state) => ({
          passes: state.passes.map((p) =>
            p.id.toUpperCase() === id.toUpperCase() ? { ...p, status: 'USED' } : p
          ),
        }));
      },
      getPassById: (id) => {
        return get().passes.find((p) => p.id.toUpperCase() === id.toUpperCase());
      },
      findPass: (query) => {
        if (!query) return undefined;
        const q = query.trim().toUpperCase();
        return get().passes.find(
          (p) =>
            p.id.toUpperCase() === q ||
            p.accessPin === q ||
            p.id.toUpperCase().endsWith(q) ||
            q.includes(p.id.toUpperCase()) ||
            q.includes(p.accessPin)
        );
      },
      syncHostDetails: (host) => {
        set((state) => ({
          passes: state.passes.map((p) => ({
            ...p,
            residentName: host.residentName || p.residentName,
            flatNumber: host.flatNumber || p.flatNumber,
            tower: host.tower || p.tower,
            residentPhone: host.residentPhone || p.residentPhone,
          })),
        }));
      },
    }),
    {
      name: 'ama-visitor-passes-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
