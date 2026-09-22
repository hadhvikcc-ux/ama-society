import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HelperCategory = 'Maid' | 'Cook' | 'Driver' | 'Car Cleaner' | 'Nanny' | 'Other';
export type HelperPresence = 'INSIDE_SOCIETY' | 'OUTSIDE';

export interface DomesticHelper {
  id: string; // e.g. "HLP-101"
  name: string;
  phone: string;
  category: HelperCategory;
  badgeNumber: string; // e.g. "HELP-042"
  assignedFlats: string[]; // e.g. ["B-204", "B-205"]
  presence: HelperPresence;
  lastCheckIn?: string;
  lastCheckOut?: string;
  currentGate?: string;
}

interface DomesticStaffState {
  helpers: DomesticHelper[];

  // Actions
  checkInHelper: (helperId: string, gate?: string) => void;
  checkOutHelper: (helperId: string) => void;
  getHelpersForFlat: (flatNumber: string) => DomesticHelper[];
  addHelper: (helper: Omit<DomesticHelper, 'id' | 'presence'>) => DomesticHelper;
  resetHelpers: () => void;
}

export const HELPER_CATEGORY_ICONS: Record<HelperCategory, { emoji: string; color: string; bg: string }> = {
  'Maid': { emoji: '🧹', color: '#0D9488', bg: '#CCFBF1' },
  'Cook': { emoji: '🍳', color: '#EA580C', bg: '#FFEDD5' },
  'Driver': { emoji: '🚗', color: '#2563EB', bg: '#DBEAFE' },
  'Car Cleaner': { emoji: '🧼', color: '#4338CA', bg: '#E0E7FF' },
  'Nanny': { emoji: '👶', color: '#BE123C', bg: '#FFE4E6' },
  'Other': { emoji: '👤', color: '#475569', bg: '#F1F5F9' },
};

const initialHelpers: DomesticHelper[] = [
  {
    id: 'HLP-101',
    name: 'Sunita Devi',
    phone: '9820155441',
    category: 'Maid',
    badgeNumber: 'HELP-042',
    assignedFlats: ['B-204', 'B-205', 'B-301'],
    presence: 'INSIDE_SOCIETY',
    lastCheckIn: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    currentGate: 'Gate 1 (Main Entrance)',
  },
  {
    id: 'HLP-102',
    name: 'Ram Singh',
    phone: '9820155442',
    category: 'Cook',
    badgeNumber: 'HELP-078',
    assignedFlats: ['B-204', 'A-102'],
    presence: 'OUTSIDE',
    lastCheckIn: new Date(Date.now() - 3600000 * 18).toISOString(),
    lastCheckOut: new Date(Date.now() - 3600000 * 14).toISOString(),
    currentGate: 'Gate 1 (Main Entrance)',
  },
  {
    id: 'HLP-103',
    name: 'Devendra Kumar',
    phone: '9820155443',
    category: 'Driver',
    badgeNumber: 'HELP-112',
    assignedFlats: ['C-305', 'B-204'],
    presence: 'INSIDE_SOCIETY',
    lastCheckIn: new Date(Date.now() - 3600000 * 4).toISOString(),
    currentGate: 'Gate 2 (Basement Entry)',
  },
];

export const useDomesticStaffStore = create<DomesticStaffState>()(
  persist(
    (set, get) => ({
      helpers: initialHelpers,

      checkInHelper: (helperId: string, gate = 'Gate 1 (Main Entrance)') => {
        set((state) => ({
          helpers: state.helpers.map((h) =>
            h.id === helperId
              ? {
                  ...h,
                  presence: 'INSIDE_SOCIETY',
                  lastCheckIn: new Date().toISOString(),
                  currentGate: gate,
                }
              : h
          ),
        }));
      },

      checkOutHelper: (helperId: string) => {
        set((state) => ({
          helpers: state.helpers.map((h) =>
            h.id === helperId
              ? {
                  ...h,
                  presence: 'OUTSIDE',
                  lastCheckOut: new Date().toISOString(),
                }
              : h
          ),
        }));
      },

      getHelpersForFlat: (flatNumber: string) => {
        const targetFlat = flatNumber.trim().toUpperCase();
        return get().helpers.filter((h) =>
          h.assignedFlats.some((f) => f.trim().toUpperCase() === targetFlat || targetFlat.includes(f))
        );
      },

      addHelper: (helperData) => {
        const id = `HLP-${Math.floor(100 + Math.random() * 900)}`;
        const newHelper: DomesticHelper = {
          ...helperData,
          id,
          presence: 'OUTSIDE',
        };

        set((state) => ({
          helpers: [newHelper, ...state.helpers],
        }));

        return newHelper;
      },

      resetHelpers: () => set({ helpers: initialHelpers }),
    }),
    {
      name: 'ama-domestic-staff-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
