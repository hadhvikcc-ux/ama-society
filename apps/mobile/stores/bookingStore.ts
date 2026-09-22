import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Safe multi-tier storage adapter
const resilientStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(name);
      }
    } catch {
      // ignore
    }
    return null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(name, value);
      }
    } catch {
      // ignore
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
        return;
      }
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(name);
      }
    } catch {
      // ignore
    }
  },
};

export interface FacilityBooking {
  id: string; // e.g. AMABK00001
  facilityId: string;
  facilityName: string;
  facilityIcon: string;
  date: string; // e.g. "Today, 16 Sep 2026" or "Wed, 16 Sep 2026"
  slot: string;
  price: string;
  status: 'CONFIRMED' | 'ACTIVE' | 'CANCELLED';
  residentName: string;
  flatNumber: string;
  accessPin: string;
  createdAt: string;
}

interface BookingState {
  bookings: FacilityBooking[];
  bookingCounter: number;
  addBooking: (data: Omit<FacilityBooking, 'id' | 'createdAt' | 'accessPin'>) => string;
  cancelBooking: (id: string) => void;
  getBookingById: (id: string) => FacilityBooking | undefined;
  findBooking: (query: string) => FacilityBooking | undefined;
  syncResidentDetails: (details: { residentName: string; flatNumber: string }) => void;
  getBookingsForDate: (dateInput: Date | string) => FacilityBooking[];
  getAllBookedDateKeys: () => Record<string, { count: number; facilityNames: string[] }>;
}

export function generateBookingId(counter: number): string {
  return `AMABK${String(counter).padStart(5, '0')}`;
}

export function parseSlotTime(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.trim().split(' ');
  const time = parts[0];
  const modifier = parts[1] ? parts[1].toUpperCase() : 'AM';
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return { hours: hours || 0, minutes: minutes || 0 };
}

export function normalizeDateToKey(dateInput: Date | string): string {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Remove "Today, ", "Tomorrow, ", day names like "Wed, "
  const clean = str.replace(/^(Today|Tomorrow|[A-Za-z]+),\s*/i, '').trim();
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

export function formatDateToDisplay(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });

  const now = new Date();
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return `Today, ${day} ${month} ${year}`;
  }
  return `${weekday}, ${day} ${month} ${year}`;
}

export function isSlotInPast(slotStr: string, dateStr: string): boolean {
  const now = new Date();
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayMonth = now.toLocaleDateString('en-US', { month: 'short' });
  const todayYear = now.getFullYear();

  const isToday =
    dateStr.toLowerCase().startsWith('today') ||
    (dateStr.includes(todayDay) && dateStr.includes(todayMonth) && dateStr.includes(String(todayYear)));

  if (!isToday) {
    const cleanedDateStr = dateStr.replace(/^[A-Za-z]+,\s*/, '');
    const parsedDate = new Date(cleanedDateStr);
    if (!isNaN(parsedDate.getTime())) {
      const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetZero = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      if (targetZero < todayZero) return true;
    }
    return false;
  }

  // If it is today, check start time against current time
  const [startTimeStr] = slotStr.split(' - ');
  if (!startTimeStr) return false;

  const { hours, minutes } = parseSlotTime(startTimeStr);
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  if (hours < currentHours) return true;
  if (hours === currentHours && minutes <= currentMinutes) return true;
  return false;
}

const initialBookings: FacilityBooking[] = [
  {
    id: 'AMABK00001',
    facilityId: '1',
    facilityName: 'Clubhouse 🏛️',
    facilityIcon: 'business-outline',
    date: 'Today, 16 Sep 2026',
    slot: '07:00 AM - 08:00 AM',
    price: '₹500/hr',
    status: 'CONFIRMED',
    residentName: 'Aditya Sharma',
    flatNumber: 'B-204',
    accessPin: '5821',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'AMABK00002',
    facilityId: '1',
    facilityName: 'Clubhouse 🏛️',
    facilityIcon: 'business-outline',
    date: 'Today, 16 Sep 2026',
    slot: '05:00 PM - 06:00 PM',
    price: '₹500/hr',
    status: 'CONFIRMED',
    residentName: 'Aditya Sharma',
    flatNumber: 'B-204',
    accessPin: '9134',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'AMABK00003',
    facilityId: '4',
    facilityName: 'Tennis Court 🎾',
    facilityIcon: 'tennisball-outline',
    date: 'Thu, 17 Sep 2026',
    slot: '06:00 PM - 07:00 PM',
    price: '₹100/hr',
    status: 'CONFIRMED',
    residentName: 'Aditya Sharma',
    flatNumber: 'B-204',
    accessPin: '3412',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'AMABK00004',
    facilityId: '5',
    facilityName: 'Badminton Court 🏸',
    facilityIcon: 'fitness-outline',
    date: 'Sat, 19 Sep 2026',
    slot: '08:00 AM - 09:00 AM',
    price: '₹150/hr',
    status: 'CONFIRMED',
    residentName: 'Priya Sharma',
    flatNumber: 'A-101',
    accessPin: '6745',
    createdAt: new Date(Date.now() - 36000000).toISOString(),
  },
  {
    id: 'AMABK00005',
    facilityId: '1',
    facilityName: 'Clubhouse 🏛️',
    facilityIcon: 'business-outline',
    date: 'Sun, 20 Sep 2026',
    slot: '04:00 PM - 05:00 PM',
    price: '₹500/hr',
    status: 'CONFIRMED',
    residentName: 'Rahul Verma',
    flatNumber: 'C-302',
    accessPin: '8210',
    createdAt: new Date(Date.now() - 28000000).toISOString(),
  },
  {
    id: 'AMABK00006',
    facilityId: '2',
    facilityName: 'Swimming Pool 🏊',
    facilityIcon: 'water-outline',
    date: 'Tue, 22 Sep 2026',
    slot: '06:00 AM - 07:00 AM',
    price: 'Free',
    status: 'CONFIRMED',
    residentName: 'Vikram Singh',
    flatNumber: 'E-501',
    accessPin: '4198',
    createdAt: new Date(Date.now() - 20000000).toISOString(),
  },
  {
    id: 'AMABK00007',
    facilityId: '4',
    facilityName: 'Tennis Court 🎾',
    facilityIcon: 'tennisball-outline',
    date: 'Fri, 25 Sep 2026',
    slot: '05:00 PM - 06:00 PM',
    price: '₹100/hr',
    status: 'CONFIRMED',
    residentName: 'Sunita Rao',
    flatNumber: 'D-404',
    accessPin: '7351',
    createdAt: new Date(Date.now() - 15000000).toISOString(),
  },
  {
    id: 'AMABK00008',
    facilityId: '1',
    facilityName: 'Clubhouse 🏛️',
    facilityIcon: 'business-outline',
    date: 'Fri, 02 Oct 2026',
    slot: '09:00 AM - 10:00 AM',
    price: '₹500/hr',
    status: 'CONFIRMED',
    residentName: 'Society Management Committee',
    flatNumber: 'Admin Office',
    accessPin: '1002',
    createdAt: new Date(Date.now() - 10000000).toISOString(),
  },
];

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      bookings: initialBookings,
      bookingCounter: 9,
      addBooking: (data) => {
        if (isSlotInPast(data.slot, data.date)) {
          throw new Error('Cannot book a facility slot in the past. Please choose an upcoming time slot.');
        }
        const counter = get().bookingCounter;
        const newId = generateBookingId(counter);
        const accessPin = String(Math.floor(1000 + Math.random() * 9000));
        const newBooking: FacilityBooking = {
          ...data,
          id: newId,
          accessPin,
          createdAt: new Date().toISOString(),
          status: 'CONFIRMED',
        };
        set((state) => ({
          bookings: [newBooking, ...state.bookings],
          bookingCounter: state.bookingCounter + 1,
        }));
        return newId;
      },
      cancelBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id.toUpperCase() === id.toUpperCase() ? { ...b, status: 'CANCELLED' } : b
          ),
        }));
      },
      getBookingById: (id) => {
        return get().bookings.find((b) => b.id.toUpperCase() === id.toUpperCase());
      },
      findBooking: (query) => {
        if (!query) return undefined;
        const q = query.trim().toUpperCase();
        return get().bookings.find(
          (b) =>
            b.id.toUpperCase() === q ||
            b.accessPin === q ||
            b.id.toUpperCase().endsWith(q) ||
            q.includes(b.id.toUpperCase())
        );
      },
      syncResidentDetails: (details) => {
        set((state) => ({
          bookings: state.bookings.map((b) => ({
            ...b,
            residentName: details.residentName || b.residentName,
            flatNumber: details.flatNumber || b.flatNumber,
          })),
        }));
      },
      getBookingsForDate: (dateInput) => {
        const targetKey = normalizeDateToKey(dateInput);
        if (!targetKey) return [];
        return get().bookings.filter((b) => {
          const bKey = normalizeDateToKey(b.date);
          return bKey === targetKey;
        });
      },
      getAllBookedDateKeys: () => {
        const map: Record<string, { count: number; facilityNames: string[] }> = {};
        get().bookings.forEach((b) => {
          if (b.status === 'CANCELLED') return;
          const k = normalizeDateToKey(b.date);
          if (!k) return;
          if (!map[k]) {
            map[k] = { count: 0, facilityNames: [] };
          }
          map[k].count++;
          if (!map[k].facilityNames.includes(b.facilityName)) {
            map[k].facilityNames.push(b.facilityName);
          }
        });
        return map;
      },
    }),
    {
      name: 'ama-facility-bookings-storage',
      storage: createJSONStorage(() => resilientStorage as any),
    }
  )
);
