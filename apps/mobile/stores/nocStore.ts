import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NocType = 'MOVE_IN' | 'MOVE_OUT';
export type NocStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface MoveNoc {
  id: string; // e.g. "NOC-0081"
  type: NocType;
  applicantName: string;
  applicantPhone: string;
  flatNumber: string;
  tower: string;
  moveDate: string; // e.g. "2026-09-25"
  timeSlot: string; // e.g. "10:00 AM - 02:00 PM"
  vehicleDetails: string; // e.g. "Packers & Movers Truck (MH 04 ER 8812)"
  duesCleared: boolean;
  liftReserved: boolean;
  depositPaid: boolean;
  status: NocStatus;
  gatePassCode: string; // e.g. "NOC-PASS-9142"
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

interface NocState {
  nocRequests: MoveNoc[];

  // Actions
  applyNoc: (params: {
    type: NocType;
    applicantName: string;
    applicantPhone: string;
    flatNumber: string;
    tower?: string;
    moveDate: string;
    timeSlot: string;
    vehicleDetails: string;
    notes?: string;
  }) => MoveNoc;

  approveNoc: (nocId: string, approverName?: string) => void;
  rejectNoc: (nocId: string, reason?: string) => void;
  getNocsForFlat: (flatNumber: string) => MoveNoc[];
  resetNocs: () => void;
}

const initialNocs: MoveNoc[] = [
  {
    id: 'NOC-0081',
    type: 'MOVE_IN',
    applicantName: 'Vikram Sethi (Tenant)',
    applicantPhone: '9820177889',
    flatNumber: 'A-304',
    tower: 'Tower A',
    moveDate: '2026-09-22',
    timeSlot: '10:00 AM - 02:00 PM',
    vehicleDetails: 'Agarwal Packers & Movers (KA 01 TR 4499)',
    duesCleared: true,
    liftReserved: true,
    depositPaid: true,
    status: 'PENDING_APPROVAL',
    gatePassCode: 'NOC-PASS-7841',
    notes: 'Owner consent letter verified. Security lift pads requested.',
  },
  {
    id: 'NOC-0079',
    type: 'MOVE_OUT',
    applicantName: 'Sanjay Deshmukh (Owner)',
    applicantPhone: '9820166554',
    flatNumber: 'D-502',
    tower: 'Tower D',
    moveDate: '2026-09-15',
    timeSlot: '02:00 PM - 06:00 PM',
    vehicleDetails: 'Eicher Canter (DL 01 AA 7722)',
    duesCleared: true,
    liftReserved: true,
    depositPaid: true,
    status: 'APPROVED',
    gatePassCode: 'NOC-PASS-3310',
    approvedBy: 'President Vikram Malhotra',
    approvedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    notes: 'Full society ledger reconciled. Handover complete.',
  },
];

export const useNocStore = create<NocState>()(
  persist(
    (set, get) => ({
      nocRequests: initialNocs,

      applyNoc: ({
        type,
        applicantName,
        applicantPhone,
        flatNumber,
        tower = 'Tower B',
        moveDate,
        timeSlot,
        vehicleDetails,
        notes,
      }) => {
        const id = `NOC-${Math.floor(1000 + Math.random() * 9000)}`;
        const gatePassCode = `NOC-PASS-${Math.floor(1000 + Math.random() * 9000)}`;

        const newNoc: MoveNoc = {
          id,
          type,
          applicantName,
          applicantPhone,
          flatNumber,
          tower,
          moveDate,
          timeSlot,
          vehicleDetails,
          duesCleared: true,
          liftReserved: true,
          depositPaid: true,
          status: 'PENDING_APPROVAL',
          gatePassCode,
          notes,
        };

        set((state) => ({
          nocRequests: [newNoc, ...state.nocRequests],
        }));

        return newNoc;
      },

      approveNoc: (nocId: string, approverName = 'President Vikram Malhotra') => {
        set((state) => ({
          nocRequests: state.nocRequests.map((n) =>
            n.id === nocId
              ? {
                  ...n,
                  status: 'APPROVED',
                  approvedBy: approverName,
                  approvedAt: new Date().toISOString(),
                }
              : n
          ),
        }));
      },

      rejectNoc: (nocId: string, reason = 'Pending maintenance dues or invalid documents') => {
        set((state) => ({
          nocRequests: state.nocRequests.map((n) =>
            n.id === nocId
              ? {
                  ...n,
                  status: 'REJECTED',
                  notes: n.notes ? `${n.notes} • Rejected: ${reason}` : `Rejected: ${reason}`,
                }
              : n
          ),
        }));
      },

      getNocsForFlat: (flatNumber: string) => {
        const targetFlat = flatNumber.trim().toUpperCase();
        return get().nocRequests.filter((n) => n.flatNumber.trim().toUpperCase() === targetFlat);
      },

      resetNocs: () => set({ nocRequests: initialNocs }),
    }),
    {
      name: 'ama-noc-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
