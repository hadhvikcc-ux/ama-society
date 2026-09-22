import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CourierCompany =
  | 'Amazon'
  | 'Flipkart'
  | 'Swiggy Instamart'
  | 'Zomato / Blinkit'
  | 'BlueDart'
  | 'India Post'
  | 'Courier / Other';

export type ParcelStatus = 'HELD_AT_GATE' | 'COLLECTED' | 'RETURNED_TO_COURIER';

export interface GateParcel {
  id: string; // e.g. "PCL-4819"
  courier: CourierCompany;
  flatNumber: string;
  tower: string;
  recipientName: string;
  itemCount: number;
  pickupPin: string; // 4-digit code e.g. "5821"
  status: ParcelStatus;
  notes?: string;
  intakeTime: string;
  intakeGuard: string;
  collectedTime?: string;
  collectedBy?: string;
}

interface ParcelState {
  parcels: GateParcel[];

  // Actions
  logParcel: (params: {
    courier: CourierCompany;
    flatNumber: string;
    tower?: string;
    recipientName?: string;
    itemCount?: number;
    notes?: string;
    intakeGuard?: string;
  }) => GateParcel;

  verifyAndHandover: (
    parcelId: string,
    enteredPin: string,
    collectedBy?: string
  ) => { success: boolean; message: string };

  getParcelsForFlat: (flatNumber: string) => GateParcel[];
  getPendingCountForFlat: (flatNumber: string) => number;
  markReturned: (parcelId: string, reason?: string) => void;
  resetParcels: () => void;
}

export const COURIER_ICONS: Record<CourierCompany, { emoji: string; color: string; bg: string }> = {
  'Amazon': { emoji: '📦', color: '#EA580C', bg: '#FFEDD5' },
  'Flipkart': { emoji: '🛍️', color: '#2563EB', bg: '#DBEAFE' },
  'Swiggy Instamart': { emoji: '⚡', color: '#EA580C', bg: '#FFEDD5' },
  'Zomato / Blinkit': { emoji: '🛵', color: '#E11D48', bg: '#FFE4E6' },
  'BlueDart': { emoji: '✈️', color: '#4338CA', bg: '#E0E7FF' },
  'India Post': { emoji: '📮', color: '#DC2626', bg: '#FEE2E2' },
  'Courier / Other': { emoji: '📫', color: '#475569', bg: '#F1F5F9' },
};

const initialParcels: GateParcel[] = [
  {
    id: 'PCL-1042',
    courier: 'Amazon',
    flatNumber: 'B-204',
    tower: 'Tower B',
    recipientName: 'Aditya Sharma',
    itemCount: 2,
    pickupPin: '5821',
    status: 'HELD_AT_GATE',
    notes: 'Brown cardboard box & polybag placed on Locker Shelf B2',
    intakeTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    intakeGuard: 'Guard Ramesh',
  },
  {
    id: 'PCL-1039',
    courier: 'BlueDart',
    flatNumber: 'A-102',
    tower: 'Tower A',
    recipientName: 'Meera Nair',
    itemCount: 1,
    pickupPin: '3194',
    status: 'COLLECTED',
    notes: 'Confidential envelope',
    intakeTime: new Date(Date.now() - 3600000 * 6).toISOString(),
    intakeGuard: 'Guard Ramesh',
    collectedTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    collectedBy: 'Self (Meera Nair)',
  },
];

export const useParcelStore = create<ParcelState>()(
  persist(
    (set, get) => ({
      parcels: initialParcels,

      logParcel: ({
        courier,
        flatNumber,
        tower = 'Tower B',
        recipientName = 'Resident',
        itemCount = 1,
        notes,
        intakeGuard = 'Main Gate Desk',
      }) => {
        const id = `PCL-${Math.floor(1000 + Math.random() * 9000)}`;
        const pickupPin = String(Math.floor(1000 + Math.random() * 9000));

        const newParcel: GateParcel = {
          id,
          courier,
          flatNumber,
          tower,
          recipientName,
          itemCount,
          pickupPin,
          status: 'HELD_AT_GATE',
          notes,
          intakeTime: new Date().toISOString(),
          intakeGuard,
        };

        set((state) => ({
          parcels: [newParcel, ...state.parcels],
        }));

        return newParcel;
      },

      verifyAndHandover: (parcelId: string, enteredPin: string, collectedBy = 'Resident / Helper') => {
        const { parcels } = get();
        const target = parcels.find((p) => p.id === parcelId);

        if (!target) {
          return { success: false, message: 'Parcel not found.' };
        }

        if (target.status === 'COLLECTED') {
          return { success: false, message: 'Parcel has already been collected.' };
        }

        if (target.pickupPin.trim() !== enteredPin.trim()) {
          return { success: false, message: 'Invalid 4-digit Pickup PIN. Please check resident app.' };
        }

        const updated: GateParcel = {
          ...target,
          status: 'COLLECTED',
          collectedTime: new Date().toISOString(),
          collectedBy,
        };

        set({
          parcels: parcels.map((p) => (p.id === parcelId ? updated : p)),
        });

        return { success: true, message: `Handover verified successfully to ${collectedBy}!` };
      },

      getParcelsForFlat: (flatNumber: string) => {
        const targetFlat = flatNumber.trim().toUpperCase();
        return get().parcels.filter(
          (p) => p.flatNumber.trim().toUpperCase() === targetFlat || p.flatNumber.includes(targetFlat)
        );
      },

      getPendingCountForFlat: (flatNumber: string) => {
        const targetFlat = flatNumber.trim().toUpperCase();
        return get().parcels.filter(
          (p) =>
            (p.flatNumber.trim().toUpperCase() === targetFlat || p.flatNumber.includes(targetFlat)) &&
            p.status === 'HELD_AT_GATE'
        ).length;
      },

      markReturned: (parcelId: string, reason = 'Not collected within 7 days') => {
        set((state) => ({
          parcels: state.parcels.map((p) =>
            p.id === parcelId
              ? {
                  ...p,
                  status: 'RETURNED_TO_COURIER',
                  notes: p.notes ? `${p.notes} • Returned: ${reason}` : `Returned: ${reason}`,
                }
              : p
          ),
        }));
      },

      resetParcels: () => set({ parcels: initialParcels }),
    }),
    {
      name: 'ama-parcel-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
