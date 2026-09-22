import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppAttachment, SAMPLE_ATTACHMENTS } from '../utils/filePicker';

export type PaymentCategory = 
  | 'MAINTENANCE' 
  | 'EVENT_CONTRIBUTION' 
  | 'REIMBURSEMENT' 
  | 'FACILITY_BOOKING' 
  | 'GENERAL';

export type PaymentMethod = 
  | 'UPI_GPAY' 
  | 'PHONEPE' 
  | 'PAYTM' 
  | 'BHIM' 
  | 'NETBANKING' 
  | 'CARD' 
  | 'CASH';

export interface PaymentRecord {
  id: string; // e.g. "UPI-2026-98124"
  amount: number;
  payeeName: string;
  payeeUpiId: string;
  payerName: string;
  payerFlat: string;
  category: PaymentCategory;
  referenceId?: string; // e.g. "INV-1" or "AMAEV00001"
  note: string;
  timestamp: string; // formatted date & time
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  method: PaymentMethod;
  attachments?: AppAttachment[];
}

interface PaymentState {
  records: PaymentRecord[];
  myUpiId: string;
  societyUpiId: string;
  societyPayeeName: string;
  eventFundUpiId: string;
  eventPayeeName: string;

  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'timestamp' | 'status'> & { id?: string; timestamp?: string; status?: 'SUCCESS' | 'PENDING' | 'FAILED' }) => PaymentRecord;
  setMyUpiId: (upiId: string) => void;
  getRecordsByRef: (refId: string) => PaymentRecord[];
  getTotalCollectedForRef: (refId: string) => number;
}

const initialRecords: PaymentRecord[] = [
  {
    id: 'UPI-2026-89412',
    amount: 4500,
    payeeName: 'AMA Resident Welfare Association',
    payeeUpiId: 'ama.society@icici',
    payerName: 'Aditya Sharma',
    payerFlat: 'B-204',
    category: 'MAINTENANCE',
    referenceId: 'INV-2',
    note: 'Aug 2023 Maintenance Fee',
    timestamp: '12 Aug 2026, 11:30 AM',
    status: 'SUCCESS',
    method: 'UPI_GPAY',
    attachments: [SAMPLE_ATTACHMENTS.GPAY_RECEIPT_SCREENSHOT],
  },
  {
    id: 'UPI-2026-89731',
    amount: 2000,
    payeeName: 'AMA Community Event Fund',
    payeeUpiId: 'ama.events@okhdfcbank',
    payerName: 'Aditya Sharma',
    payerFlat: 'B-204',
    category: 'EVENT_CONTRIBUTION',
    referenceId: 'AMAEV00001',
    note: 'Heritage Excursion Pool Share',
    timestamp: '15 Sep 2026, 04:15 PM',
    status: 'SUCCESS',
    method: 'UPI_GPAY',
  },
  {
    id: 'UPI-2026-90124',
    amount: 1750,
    payeeName: 'Aditya Sharma',
    payeeUpiId: 'aditya.sharma@okaxis',
    payerName: 'Rohan Mehra',
    payerFlat: 'C-501',
    category: 'REIMBURSEMENT',
    referenceId: 'AMAEV00001',
    note: 'Reimbursement for Bus Booking share',
    timestamp: '16 Sep 2026, 10:20 AM',
    status: 'SUCCESS',
    method: 'UPI_GPAY',
  },
];

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      records: initialRecords,
      myUpiId: 'aditya.sharma@okaxis',
      societyUpiId: 'ama.society@icici',
      societyPayeeName: 'AMA Resident Welfare Association',
      eventFundUpiId: 'ama.events@okhdfcbank',
      eventPayeeName: 'AMA Community Event Fund',

      recordPayment: (paymentData) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const newRecord: PaymentRecord = {
          id: paymentData.id || `UPI-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
          amount: paymentData.amount,
          payeeName: paymentData.payeeName,
          payeeUpiId: paymentData.payeeUpiId,
          payerName: paymentData.payerName,
          payerFlat: paymentData.payerFlat,
          category: paymentData.category,
          referenceId: paymentData.referenceId,
          note: paymentData.note,
          timestamp: paymentData.timestamp || `${dateStr}, ${timeStr}`,
          status: paymentData.status || 'SUCCESS',
          method: paymentData.method || 'UPI_GPAY',
        };

        set((state) => ({
          records: [newRecord, ...state.records],
        }));

        return newRecord;
      },

      setMyUpiId: (upiId: string) => set({ myUpiId: upiId.trim() }),

      getRecordsByRef: (refId: string) => {
        return get().records.filter((r) => r.referenceId === refId);
      },

      getTotalCollectedForRef: (refId: string) => {
        return get()
          .records.filter((r) => r.referenceId === refId && r.status === 'SUCCESS')
          .reduce((sum, r) => sum + r.amount, 0);
      },
    }),
    {
      name: 'ama-payment-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
