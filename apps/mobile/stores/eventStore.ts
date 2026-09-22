import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppAttachment, SAMPLE_ATTACHMENTS } from '../utils/filePicker';

export type EventCategory = 'Festival' | 'Sports' | 'Wellness' | 'Cultural' | 'Social' | 'Trip' | 'General';
export type EventStatus = 'OPEN' | 'VOTING' | 'CONFIRMED' | 'LOCKED' | 'COMPLETED';

export interface EventExpense {
  id: string;
  title: string;
  amount: number;
  category: 'Travel' | 'Food' | 'Venue' | 'Decor' | 'Equipment' | 'Other';
  paidBy: string; // Name of person who purchased
  paidByFlat: string; // Unit of purchaser
  date: string; // e.g. "16 Sep 2026"
  notes?: string;
  attachments?: AppAttachment[];
}

export interface EventContribution {
  id: string;
  contributorName: string;
  contributorFlat: string;
  amount: number;
  date: string;
  paymentMethod?: string; // e.g. "UPI / GPay", "Cash", "Card"
}

export interface EventPlaceVisit {
  id: string;
  placeName: string;
  address?: string;
  startTime: string; // e.g. "09:30 AM"
  endTime: string; // e.g. "12:30 PM"
  timeToSpend: string; // e.g. "3h 00m"
  actions: string; // Planned activities at this destination
  ticketCostPerPerson?: number; // e.g. 150
}

export interface SocietyEvent {
  id: string; // e.g. AMAEV00001
  title: string;
  category: EventCategory;
  description: string;
  date: string; // e.g. "Sun, 20 Sep 2026"
  time: string; // e.g. "07:00 AM"
  location: string; // e.g. "Clubhouse Lawn"
  status: EventStatus;
  organizerName: string;
  organizerFlat: string;
  attendeesCount: number;
  isUserRsvp: boolean;
  budget: {
    total: number;
    collected: number;
  };
  votes?: {
    approved: number;
    rejected: number;
    userVoted?: 'APPROVE' | 'REJECT' | null;
  };
  highlights?: string[];
  placesToVisit?: EventPlaceVisit[];
  expenses?: EventExpense[];
  contributions?: EventContribution[];
  createdAt: string;
}

interface EventState {
  events: SocietyEvent[];
  eventCounter: number;
  addEvent: (
    event: Omit<SocietyEvent, 'id' | 'createdAt' | 'attendeesCount' | 'isUserRsvp'>
  ) => string;
  getEventById: (id: string) => SocietyEvent | undefined;
  toggleRsvp: (id: string) => void;
  castVote: (id: string, approved: boolean) => void;
  contributeBudget: (id: string, amount: number) => void;
  addExpense: (eventId: string, expense: Omit<EventExpense, 'id'>) => string;
  addContribution: (eventId: string, contribution: Omit<EventContribution, 'id'>) => string;
  addPlaceVisit: (eventId: string, place: Omit<EventPlaceVisit, 'id'>) => string;
}

export function generateEventId(counter: number): string {
  return `AMAEV${String(counter).padStart(5, '0')}`;
}

const initialEvents: SocietyEvent[] = [
  {
    id: 'AMAEV00001',
    title: 'Society Day Trip & Heritage Excursion 🚌',
    category: 'Trip',
    description:
      'Full-day community excursion to the historic Ramanagara Hills & Heritage Fort. Includes luxury AC bus transportation, guided historical walk, traditional thali lunch, and outdoor botanical park visit.',
    date: 'Sat, 10 Oct 2026',
    time: '07:00 AM - 08:00 PM',
    location: 'Society Main Gate (Bus Departure)',
    status: 'CONFIRMED',
    organizerName: 'Aditya Sharma',
    organizerFlat: 'B-204',
    attendeesCount: 36,
    isUserRsvp: true,
    budget: { total: 45000, collected: 37800 },
    highlights: [
      '38-Seater Luxury AC Volvo Coach',
      'Authentic Regional Lunch Buffet Included',
      'Guided Archaeological Tour',
      'First-aid & Emergency Kit on board',
    ],
    placesToVisit: [
      {
        id: 'pv-1',
        placeName: 'Society Main Gate (Assembly Point)',
        address: 'AMA Society Gate 1',
        startTime: '07:00 AM',
        endTime: '07:30 AM',
        timeToSpend: '30m',
        actions: 'Attendance roll call, board AC Volvo Bus, distribution of breakfast snack boxes & water bottles',
        ticketCostPerPerson: 0,
      },
      {
        id: 'pv-2',
        placeName: 'Heritage Fort & Archaeological Site',
        address: 'Ramanagara Historical Reserve',
        startTime: '09:30 AM',
        endTime: '12:30 PM',
        timeToSpend: '3h 00m',
        actions: 'Guided historical walk, group photography at panoramic view point, visit to stone architecture pavilion',
        ticketCostPerPerson: 150,
      },
      {
        id: 'pv-3',
        placeName: 'Lakeside Thal Heritage Restaurant',
        address: 'Kamat Highway Resort',
        startTime: '01:00 PM',
        endTime: '02:30 PM',
        timeToSpend: '1h 30m',
        actions: 'Unlimited traditional vegetarian buffet lunch, rest & networking session for families',
        ticketCostPerPerson: 400,
      },
      {
        id: 'pv-4',
        placeName: 'Botanical Gardens & Adventure Park',
        address: 'Eco Tourism Park, West Gate',
        startTime: '03:00 PM',
        endTime: '05:30 PM',
        timeToSpend: '2h 30m',
        actions: 'Boating on the lake, herbal garden exploration, fun games & outdoor play for kids',
        ticketCostPerPerson: 100,
      },
      {
        id: 'pv-5',
        placeName: 'Return Departure & Arrival at Society',
        address: 'AMA Society Gate 1',
        startTime: '06:00 PM',
        endTime: '08:00 PM',
        timeToSpend: '2h 00m',
        actions: 'Evening tea and banana chips stop, return journey, final drop-off at AMA complex',
        ticketCostPerPerson: 0,
      },
    ],
    expenses: [
      {
        id: 'exp-1',
        title: 'AC Volvo Coach Bus Booking (38 Pax)',
        amount: 18000,
        category: 'Travel',
        paidBy: 'Aditya Sharma',
        paidByFlat: 'B-204',
        date: '12 Sep 2026',
        notes: 'Paid 50% advance to SRS Travels, balance on trip day.',
        attachments: [SAMPLE_ATTACHMENTS.TAX_INVOICE_PDF, SAMPLE_ATTACHMENTS.WORK_ESTIMATE_EXCEL],
      },
      {
        id: 'exp-2',
        title: 'Pre-booked Group Lunch at Kamat Resort',
        amount: 14400,
        category: 'Food',
        paidBy: 'Vikram Malhotra',
        paidByFlat: 'B-104',
        date: '14 Sep 2026',
        notes: '36 buffet meals @ ₹400/head.',
        attachments: [SAMPLE_ATTACHMENTS.TAX_INVOICE_PDF],
      },
      {
        id: 'exp-3',
        title: 'Fort & Botanical Garden Entry Passes',
        amount: 5400,
        category: 'Venue',
        paidBy: 'Dr. Sunita Rao',
        paidByFlat: 'B-501',
        date: '15 Sep 2026',
        notes: 'Bulk advance tickets with guide charges.',
        attachments: [SAMPLE_ATTACHMENTS.GPAY_RECEIPT_SCREENSHOT],
      },
      {
        id: 'exp-4',
        title: 'Morning Snacks & Bottled Water Crates',
        amount: 4200,
        category: 'Food',
        paidBy: 'Rahul V.',
        paidByFlat: 'A-101',
        date: '15 Sep 2026',
        notes: 'Haldirams snack boxes, fruit juice & 40 water bottles.',
      },
    ],
    contributions: [
      {
        id: 'c-1',
        contributorName: 'Ramesh K.',
        contributorFlat: 'A-102',
        amount: 2100,
        date: '13 Sep 2026',
        paymentMethod: 'UPI / GPay',
      },
      {
        id: 'c-2',
        contributorName: 'Kavita Menon',
        contributorFlat: 'C-304',
        amount: 2100,
        date: '13 Sep 2026',
        paymentMethod: 'UPI / PhonePe',
      },
      {
        id: 'c-3',
        contributorName: 'Ananya Deshmukh',
        contributorFlat: 'B-301',
        amount: 2100,
        date: '14 Sep 2026',
        paymentMethod: 'UPI / GPay',
      },
      {
        id: 'c-4',
        contributorName: 'Rajesh Nair',
        contributorFlat: 'A-702',
        amount: 2100,
        date: '14 Sep 2026',
        paymentMethod: 'Card',
      },
      {
        id: 'c-5',
        contributorName: 'Suresh Verma',
        contributorFlat: 'B-201',
        amount: 2100,
        date: '15 Sep 2026',
        paymentMethod: 'UPI / Paytm',
      },
      {
        id: 'c-6',
        contributorName: 'Priya Sharma',
        contributorFlat: 'A-302',
        amount: 2100,
        date: '15 Sep 2026',
        paymentMethod: 'Cash',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'AMAEV00002',
    title: 'Weekend Yoga & Mindfulness 🧘',
    category: 'Wellness',
    description:
      'Outdoor morning yoga, pranayama, and guided silent meditation on the Clubhouse Lawn. Suitable for all skill levels. Bring your own yoga mat.',
    date: 'Sun, 20 Sep 2026',
    time: '07:00 AM',
    location: 'Clubhouse Lawn',
    status: 'CONFIRMED',
    organizerName: 'Priya Sharma',
    organizerFlat: 'A-302',
    attendeesCount: 24,
    isUserRsvp: true,
    budget: { total: 3000, collected: 3000 },
    highlights: ['Complimentary Herbal Tea', 'Guided Meditation', 'Mats available on request'],
    placesToVisit: [
      {
        id: 'y-1',
        placeName: 'Clubhouse Lawn (Assembly)',
        address: 'Clubhouse Lawn',
        startTime: '06:45 AM',
        endTime: '07:05 AM',
        timeToSpend: '20m',
        actions: 'Attendee registration, distribution of complimentary organic herbal tea',
        ticketCostPerPerson: 0,
      },
      {
        id: 'y-2',
        placeName: 'Outdoor Yoga Pavilion',
        address: 'Central Green Amphitheatre',
        startTime: '07:05 AM',
        endTime: '08:15 AM',
        timeToSpend: '1h 10m',
        actions: 'Surya Namaskar, therapeutic back-strengthening asanas, and deep pranayama',
        ticketCostPerPerson: 0,
      },
      {
        id: 'y-3',
        placeName: 'Lakeside Gazebo',
        address: 'Clubhouse Poolside Gazebo',
        startTime: '08:15 AM',
        endTime: '08:45 AM',
        timeToSpend: '30m',
        actions: 'Guided mindfulness meditation, sound bowl healing, and wellness Q&A session',
        ticketCostPerPerson: 0,
      },
    ],
    expenses: [
      {
        id: 'exp-y1',
        title: 'Herbal Infusion Tea & Detox Snacks',
        amount: 1200,
        category: 'Food',
        paidBy: 'Priya Sharma',
        paidByFlat: 'A-302',
        date: '18 Sep 2026',
        notes: 'Organic lemongrass and ginger brew with almonds.',
      },
      {
        id: 'exp-y2',
        title: 'Portable Sound Speaker & Mic',
        amount: 800,
        category: 'Equipment',
        paidBy: 'Aditya Sharma',
        paidByFlat: 'B-204',
        date: '18 Sep 2026',
        notes: 'Bluetooth amplifier battery recharge & aux cable.',
      },
      {
        id: 'exp-y3',
        title: 'Extra Yoga Mats & Sanitation Wipes',
        amount: 1000,
        category: 'Equipment',
        paidBy: 'Ramesh K.',
        paidByFlat: 'A-102',
        date: '19 Sep 2026',
        notes: '10 spare non-slip mats for visiting residents.',
      },
    ],
    contributions: [
      {
        id: 'c-y1',
        contributorName: 'Priya Sharma',
        contributorFlat: 'A-302',
        amount: 500,
        date: '18 Sep 2026',
        paymentMethod: 'UPI',
      },
      {
        id: 'c-y2',
        contributorName: 'Ramesh K.',
        contributorFlat: 'A-102',
        amount: 500,
        date: '18 Sep 2026',
        paymentMethod: 'UPI',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'AMAEV00003',
    title: 'Navratri Dandiya & Garba Night 🪔',
    category: 'Festival',
    description:
      'Annual society grand celebration with live DJ, authentic Gujarati food stalls, best traditional dress awards, and Dandiya sticks provided for all residents and kids!',
    date: 'Fri, 09 Oct 2026',
    time: '07:00 PM',
    location: 'Central Lawn',
    status: 'VOTING',
    organizerName: 'Cultural Committee',
    organizerFlat: 'B-101',
    attendeesCount: 110,
    isUserRsvp: false,
    budget: { total: 45000, collected: 28000 },
    votes: { approved: 42, rejected: 3, userVoted: null },
    highlights: ['Live Dhol & DJ setup', 'Food Stalls', 'Prizes for Best Couple & Kids Attire'],
    placesToVisit: [
      {
        id: 'nd-1',
        placeName: 'Central Lawn Main Stage',
        address: 'Central Society Grounds',
        startTime: '07:00 PM',
        endTime: '08:00 PM',
        timeToSpend: '1h 00m',
        actions: 'Aarti ceremony, registration, distribution of wooden dandiya sticks',
        ticketCostPerPerson: 0,
      },
      {
        id: 'nd-2',
        placeName: 'Amphitheatre Garba Circle',
        address: 'Central Amphitheatre',
        startTime: '08:00 PM',
        endTime: '10:30 PM',
        timeToSpend: '2h 30m',
        actions: 'Traditional 3-Taali Garba, Live Dhol Beats, Free-style Dandiya Raas',
        ticketCostPerPerson: 0,
      },
      {
        id: 'nd-3',
        placeName: 'Food & Chaat Street',
        address: 'Boulevard Walkway',
        startTime: '09:00 PM',
        endTime: '11:00 PM',
        timeToSpend: '2h 00m',
        actions: 'Festive food stalls, award ceremony for Best Traditional Dress',
        ticketCostPerPerson: 0,
      },
    ],
    expenses: [
      {
        id: 'exp-nd1',
        title: 'Dhol & Professional Sound Setup',
        amount: 15000,
        category: 'Equipment',
        paidBy: 'Cultural Committee',
        paidByFlat: 'B-101',
        date: '10 Sep 2026',
        notes: 'Advance paid to DJ SoundWorks.',
      },
      {
        id: 'exp-nd2',
        title: 'Wooden Dandiya Sticks (150 Pairs)',
        amount: 6000,
        category: 'Decor',
        paidBy: 'Ananya Deshmukh',
        paidByFlat: 'B-301',
        date: '11 Sep 2026',
        notes: 'Bulk purchase from wholesale market.',
      },
    ],
    contributions: [],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'AMAEV00004',
    title: 'Diwali Mega Mela & Food Carnival 🎆',
    category: 'Festival',
    description:
      'A grand Diwali extravaganza featuring home-chef stalls, handicraft bazaar, games for children, light show, and society fireworks zone.',
    date: 'Sat, 07 Nov 2026',
    time: '05:30 PM',
    location: 'Amphitheatre & Main Boulevard',
    status: 'OPEN',
    organizerName: 'Aditya Sharma',
    organizerFlat: 'B-204',
    attendeesCount: 165,
    isUserRsvp: true,
    budget: { total: 80000, collected: 52000 },
    highlights: ['Over 20 food & craft stalls', 'Eco-friendly Diya lighting', 'Live acoustic music'],
    placesToVisit: [
      {
        id: 'dm-1',
        placeName: 'Diya & Rangoli Exhibition',
        address: 'Boulevard Walk',
        startTime: '05:30 PM',
        endTime: '07:00 PM',
        timeToSpend: '1h 30m',
        actions: 'Rangoli competition judging, lighting 1,000 clay diyas',
        ticketCostPerPerson: 0,
      },
      {
        id: 'dm-2',
        placeName: 'Food Carnival & Home-Chef Stalls',
        address: 'Central Lawn',
        startTime: '07:00 PM',
        endTime: '09:30 PM',
        timeToSpend: '2h 30m',
        actions: 'Sampling regional cuisines, games stalls, children magic show',
        ticketCostPerPerson: 0,
      },
      {
        id: 'dm-3',
        placeName: 'Eco-Laser Light & Music Show',
        address: 'Amphitheatre',
        startTime: '09:30 PM',
        endTime: '10:30 PM',
        timeToSpend: '1h 00m',
        actions: 'Laser light choreography, musical concert, community wishes',
        ticketCostPerPerson: 0,
      },
    ],
    expenses: [
      {
        id: 'exp-dm1',
        title: 'Laser Lighting & LED Canopy Rental',
        amount: 25000,
        category: 'Decor',
        paidBy: 'Aditya Sharma',
        paidByFlat: 'B-204',
        date: '10 Sep 2026',
        notes: 'Includes power generator backup.',
      },
      {
        id: 'exp-dm2',
        title: 'Stage & Acoustic Audio System',
        amount: 18000,
        category: 'Equipment',
        paidBy: 'Rajesh Nair',
        paidByFlat: 'A-702',
        date: '11 Sep 2026',
        notes: 'Microphones, mixer, and monitors.',
      },
    ],
    contributions: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: initialEvents,
      eventCounter: 5,

      addEvent: (data) => {
        const counter = get().eventCounter;
        const newId = generateEventId(counter);
        const newEvent: SocietyEvent = {
          ...data,
          id: newId,
          attendeesCount: 1, // creator attends by default
          isUserRsvp: true,
          placesToVisit: data.placesToVisit || [],
          expenses: data.expenses || [],
          contributions: data.contributions || [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          events: [newEvent, ...state.events],
          eventCounter: state.eventCounter + 1,
        }));
        return newId;
      },

      getEventById: (id) => {
        return get().events.find((e) => e.id.toUpperCase() === id.toUpperCase());
      },

      toggleRsvp: (id) => {
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id.toUpperCase() === id.toUpperCase()) {
              const nextRsvp = !e.isUserRsvp;
              return {
                ...e,
                isUserRsvp: nextRsvp,
                attendeesCount: nextRsvp ? e.attendeesCount + 1 : Math.max(0, e.attendeesCount - 1),
              };
            }
            return e;
          }),
        }));
      },

      castVote: (id, approved) => {
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id.toUpperCase() === id.toUpperCase()) {
              const currentVotes = e.votes || { approved: 0, rejected: 0, userVoted: null };
              if (currentVotes.userVoted) return e; // already voted

              return {
                ...e,
                votes: {
                  approved: approved ? currentVotes.approved + 1 : currentVotes.approved,
                  rejected: !approved ? currentVotes.rejected + 1 : currentVotes.rejected,
                  userVoted: approved ? 'APPROVE' : 'REJECT',
                },
              };
            }
            return e;
          }),
        }));
      },

      contributeBudget: (id, amount) => {
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id.toUpperCase() === id.toUpperCase()) {
              const newCollected = e.budget.collected + amount;
              return {
                ...e,
                budget: {
                  ...e.budget,
                  collected: newCollected,
                },
              };
            }
            return e;
          }),
        }));
      },

      addExpense: (eventId, expenseData) => {
        const newExpenseId = `exp-${Date.now()}`;
        const newExpense: EventExpense = {
          ...expenseData,
          id: newExpenseId,
        };

        set((state) => ({
          events: state.events.map((e) => {
            if (e.id.toUpperCase() === eventId.toUpperCase()) {
              const existingExpenses = e.expenses || [];
              return {
                ...e,
                expenses: [...existingExpenses, newExpense],
              };
            }
            return e;
          }),
        }));
        return newExpenseId;
      },

      addContribution: (eventId, contributionData) => {
        const newContributionId = `cnt-${Date.now()}`;
        const newContribution: EventContribution = {
          ...contributionData,
          id: newContributionId,
        };

        set((state) => ({
          events: state.events.map((e) => {
            if (e.id.toUpperCase() === eventId.toUpperCase()) {
              const existingContributions = e.contributions || [];
              return {
                ...e,
                budget: {
                  ...e.budget,
                  collected: e.budget.collected + contributionData.amount,
                },
                contributions: [...existingContributions, newContribution],
              };
            }
            return e;
          }),
        }));
        return newContributionId;
      },

      addPlaceVisit: (eventId, placeData) => {
        const newPlaceId = `pv-${Date.now()}`;
        const newPlace: EventPlaceVisit = {
          ...placeData,
          id: newPlaceId,
        };

        set((state) => ({
          events: state.events.map((e) => {
            if (e.id.toUpperCase() === eventId.toUpperCase()) {
              const existingPlaces = e.placesToVisit || [];
              return {
                ...e,
                placesToVisit: [...existingPlaces, newPlace],
              };
            }
            return e;
          }),
        }));
        return newPlaceId;
      },
    }),
    {
      name: 'ama-society-events-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
