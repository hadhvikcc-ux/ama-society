import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket } from '../components/tickets/TicketCard';
import { AppAttachment, SAMPLE_ATTACHMENTS } from '../utils/filePicker';

export interface DetailedTicket extends Ticket {
  location?: string;
  vendorName?: string;
  comments?: Array<{ id: string; author: string; text: string; time: string }>;
  flat?: string;
  raisedBy?: string;
  attachments?: AppAttachment[];
}

interface TicketState {
  tickets: DetailedTicket[];
  ticketCounter: number;
  addTicket: (ticket: Omit<DetailedTicket, 'id' | 'createdAt'>) => string;
  getTicketById: (id: string) => DetailedTicket | undefined;
  updateTicketStatus: (id: string, status: Ticket['status']) => void;
  updateTicketAttachments: (id: string, attachments: AppAttachment[]) => void;
  addTicketAttachments: (id: string, attachments: AppAttachment[]) => void;
}

export function generateTicketId(counter: number): string {
  return `AMA${String(counter).padStart(5, '0')}`;
}

const initialTickets: DetailedTicket[] = [
  {
    id: 'AMA00001',
    category: 'Plumbing',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'Leaking tap in master bathroom washroom needs repair or replacement',
    location: 'Master Washroom',
    vendorName: 'Ramesh Kumar (Plumber)',
    flat: 'B-204',
    raisedBy: 'Aditya Resident',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    attachments: [
      SAMPLE_ATTACHMENTS.LEAKAGE_PHOTO,
      SAMPLE_ATTACHMENTS.INSPECTION_VIDEO,
      SAMPLE_ATTACHMENTS.WORK_ESTIMATE_EXCEL,
    ],
    comments: [
      { id: 'c1', author: 'Ramesh Kumar (Vendor)', text: 'I have inspected the washer and ordered replacement parts.', time: 'Yesterday, 03:30 PM' },
      { id: 'c2', author: 'Admin', text: 'Assigned to Ramesh Kumar.', time: 'Yesterday, 11:15 AM' },
    ],
  },
  {
    id: 'AMA00002',
    category: 'Electrical',
    priority: 'MEDIUM',
    status: 'CLOSED',
    description: 'Ceiling fan regulator not working in guest bedroom',
    location: 'Guest Bedroom',
    vendorName: 'Sri Electricals',
    flat: 'B-204',
    raisedBy: 'Aditya Resident',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    comments: [
      { id: 'c3', author: 'Sri Electricals', text: 'Replaced faulty capacitor and switch.', time: '2 days ago' },
    ],
  },
  {
    id: 'AMA00003',
    category: 'Carpentry',
    priority: 'URGENT',
    status: 'OPEN',
    description: 'Main entrance door lock latch stuck and loose',
    location: 'Main Door',
    flat: 'A-101',
    raisedBy: 'Rahul Verma',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: initialTickets,
      ticketCounter: 4, // Next submitted ticket will be AMA00004
      addTicket: (newTicketData) => {
        const counter = get().ticketCounter;
        const newId = generateTicketId(counter);
        const newTicket: DetailedTicket = {
          ...newTicketData,
          id: newId,
          createdAt: new Date().toISOString(),
          status: newTicketData.status || 'OPEN',
          comments: newTicketData.comments || [
            { id: `c-${Date.now()}`, author: 'System', text: `Ticket #${newId} logged into AMA system.`, time: 'Just now' },
          ],
        };
        set((state) => ({
          tickets: [newTicket, ...state.tickets],
          ticketCounter: state.ticketCounter + 1,
        }));
        return newId;
      },
      getTicketById: (id: string) => {
        const found = get().tickets.find((t) => t.id.toUpperCase() === id.toUpperCase());
        if (found) return found;
        // Fallback for any dynamic id
        return {
          id: id.startsWith('AMA') ? id : `AMA${id.padStart(5, '0')}`,
          status: 'OPEN',
          category: 'Plumbing',
          description: 'Ticket details loaded from society database.',
          location: 'Main Flat',
          priority: 'MEDIUM',
          createdAt: new Date().toISOString(),
          vendorName: 'Assigned Vendor',
          flat: 'B-204',
        };
      },
      updateTicketStatus: (id: string, status: Ticket['status']) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id.toUpperCase() === id.toUpperCase() ? { ...t, status } : t
          ),
        }));
      },
      updateTicketAttachments: (id: string, attachments: AppAttachment[]) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id.toUpperCase() === id.toUpperCase() ? { ...t, attachments } : t
          ),
        }));
      },
      addTicketAttachments: (id: string, newAttachments: AppAttachment[]) => {
        set((state) => ({
          tickets: state.tickets.map((t) => {
            if (t.id.toUpperCase() !== id.toUpperCase()) return t;
            const existing = t.attachments || [];
            const existingIds = new Set(existing.map((a) => a.id));
            const uniqueNew = newAttachments.filter((a) => !existingIds.has(a.id));
            return { ...t, attachments: [...existing, ...uniqueNew] };
          }),
        }));
      },
    }),
    {
      name: 'ama-tickets-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
