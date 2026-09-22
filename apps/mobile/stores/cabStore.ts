import { create } from 'zustand';

export enum RideType {
  AUTO = 'AUTO',
  MINI = 'MINI',
  SEDAN = 'SEDAN',
  EV_GREEN = 'EV_GREEN',
}

export enum RideStatus {
  REQUESTED = 'REQUESTED',
  ASSIGNED = 'ASSIGNED',
  ARRIVED_AT_GATE = 'ARRIVED_AT_GATE',
  INSIDE_CAMPUS = 'INSIDE_CAMPUS',
  AT_PICKUP = 'AT_PICKUP',
  IN_TRIP = 'IN_TRIP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface RideTierInfo {
  type: RideType;
  title: string;
  subtitle: string;
  icon: string;
  emoji: string;
  baseFare: number;
  perKmRate: number;
  baseEtaMins: number;
  capacity: string;
}

export const RIDE_TIERS: Record<RideType, RideTierInfo> = {
  [RideType.AUTO]: {
    type: RideType.AUTO,
    title: 'Auto Rickshaw',
    subtitle: 'Fastest for city traffic • Local meter rate',
    icon: 'bicycle',
    emoji: '🛺',
    baseFare: 45,
    perKmRate: 14,
    baseEtaMins: 3,
    capacity: '3 Seats',
  },
  [RideType.MINI]: {
    type: RideType.MINI,
    title: 'Hatchback / Go',
    subtitle: 'Affordable AC hatchback (WagonR / Indica)',
    icon: 'car-sport',
    emoji: '🚗',
    baseFare: 80,
    perKmRate: 18,
    baseEtaMins: 4,
    capacity: '4 Seats',
  },
  [RideType.SEDAN]: {
    type: RideType.SEDAN,
    title: 'Prime Sedan',
    subtitle: 'Spacious boot & extra legroom (Dzire / Etios)',
    icon: 'car',
    emoji: '🚘',
    baseFare: 130,
    perKmRate: 22,
    baseEtaMins: 5,
    capacity: '4 Seats',
  },
  [RideType.EV_GREEN]: {
    type: RideType.EV_GREEN,
    title: 'Green EV Cab',
    subtitle: 'Zero emissions • Silent drive (Tigor EV / BluSmart)',
    icon: 'flash',
    emoji: '⚡',
    baseFare: 140,
    perKmRate: 24,
    baseEtaMins: 6,
    capacity: '4 Seats',
  },
};

export interface SocietyPickupPoint {
  id: string;
  name: string;
  landmark: string;
  gateRecommendation: string;
}

export const SOCIETY_PICKUP_POINTS: SocietyPickupPoint[] = [
  {
    id: 'TOWER_B_PORCH',
    name: 'Tower B - Main Porch',
    landmark: 'Outside Tower B Elevator Foyer (Flat B-204)',
    gateRecommendation: 'Gate 1 (North Main Gate)',
  },
  {
    id: 'TOWER_A_LOBBY',
    name: 'Tower A - Main Lobby',
    landmark: 'Near Tower A Reception & Visitors Lounge',
    gateRecommendation: 'Gate 1 (North Main Gate)',
  },
  {
    id: 'TOWER_C_DROP',
    name: 'Tower C - Drop Zone',
    landmark: 'Behind Children Play Area',
    gateRecommendation: 'Gate 2 (South Service Gate)',
  },
  {
    id: 'CLUBHOUSE',
    name: 'Clubhouse & Sports Arena',
    landmark: 'Olympic Pool & Badminton Arena Porch',
    gateRecommendation: 'Gate 1 (North Main Gate)',
  },
  {
    id: 'GATE_1_OUTSIDE',
    name: 'Main Security Gate 1',
    landmark: 'North Gate Visitor Parking & Boom Barrier',
    gateRecommendation: 'Gate 1 (North Main Gate)',
  },
  {
    id: 'GATE_2_OUTSIDE',
    name: 'Security Gate 2 (Service Gate)',
    landmark: 'South Access Road & Mart Delivery Bay',
    gateRecommendation: 'Gate 2 (South Service Gate)',
  },
];

export interface PopularDestination {
  id: string;
  title: string;
  subtitle: string;
  distanceKm: number;
  durationMins: number;
  icon: string;
}

export const POPULAR_DESTINATIONS: PopularDestination[] = [
  {
    id: 'AIRPORT_BLR',
    title: "Kempegowda Int'l Airport (BLR)",
    subtitle: 'Terminal 1 & Terminal 2 Departure Gates',
    distanceKm: 34,
    durationMins: 45,
    icon: 'airplane',
  },
  {
    id: 'METRO_STATION',
    title: 'Baiyappanahalli Metro Station',
    subtitle: 'Purple Line Metro Connection (Exit Gate 2)',
    distanceKm: 4.5,
    durationMins: 12,
    icon: 'train',
  },
  {
    id: 'TECH_PARK',
    title: 'Manyata Embassy Business Park',
    subtitle: 'Gate 1 & Gate 2 Technology Hub',
    distanceKm: 7.2,
    durationMins: 18,
    icon: 'business',
  },
  {
    id: 'RAILWAY_STATION',
    title: 'K.R. Puram Railway Station',
    subtitle: 'Platform 1 Main Entrance & Taxi Stand',
    distanceKm: 9.8,
    durationMins: 22,
    icon: 'subway',
  },
  {
    id: 'HOSPITAL',
    title: 'Columbia Asia Hospital (Hebbal)',
    subtitle: 'Emergency OPD & Main Entrance',
    distanceKm: 8.4,
    durationMins: 20,
    icon: 'medkit',
  },
  {
    id: 'COMMERCIAL_STREET',
    title: 'Indiranagar 100ft Road',
    subtitle: '12th Main Junction & Shopping District',
    distanceKm: 6.5,
    durationMins: 16,
    icon: 'basket',
  },
];

export interface DriverInfo {
  name: string;
  phone: string;
  rating: number;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleColor: string;
  photoEmoji: string;
  currentEtaMins: number;
}

export interface CabBooking {
  id: string;
  bookingCode: string; // e.g. "CAB-2026-8812"
  passCode: string; // e.g. "CP-8812"
  gatePin: string; // 4-digit driver gate PIN e.g. "4821"
  rideType: RideType;
  pickupPoint: SocietyPickupPoint;
  destination: string;
  distanceKm: number;
  estimatedFare: number;
  estimatedDurationMins: number;
  residentName: string;
  residentFlat: string;
  residentPhone: string;
  driver: DriverInfo;
  status: RideStatus;
  transitWindowMinutes: number; // default 15
  admittedAt?: string;
  transitExpiresAt?: string;
  guardName?: string;
  guardGate?: string;
  createdAt: string;
  completedAt?: string;
  cancellationReason?: string;
}

interface CabStoreState {
  bookings: CabBooking[];
  activeBookingId: string | null;
  selectedRideType: RideType;
  selectedPickupId: string;
  customDestination: string;
  selectedDestinationId: string | null;

  // Actions
  setSelectedRideType: (type: RideType) => void;
  setSelectedPickupId: (id: string) => void;
  setSelectedDestinationId: (id: string | null) => void;
  setCustomDestination: (dest: string) => void;
  
  bookRide: (params: {
    rideType?: RideType;
    pickupPointId?: string;
    destinationName?: string;
    distanceKm?: number;
    residentName?: string;
    residentFlat?: string;
    residentPhone?: string;
  }) => CabBooking;

  cancelBooking: (bookingId: string, reason?: string) => void;
  updateBookingStatus: (bookingId: string, status: RideStatus) => void;
  findCabPass: (query: string) => CabBooking | undefined;
  verifyGateInward: (passCodeOrPlate: string, guardName?: string, gate?: string) => CabBooking | null;
  completeRide: (bookingId: string) => void;
  getActiveBooking: () => CabBooking | null;
  resetStore: () => void;
}

const MOCK_DRIVERS: Record<RideType, DriverInfo[]> = {
  [RideType.AUTO]: [
    {
      name: 'Santosh Gowda',
      phone: '+91 98450 12891',
      rating: 4.9,
      vehicleModel: 'Bajaj RE Auto Rickshaw',
      vehicleNumber: 'KA-03-AA-4921',
      vehicleColor: 'Yellow & Green',
      photoEmoji: '👨‍✈️',
      currentEtaMins: 3,
    },
    {
      name: 'Manjunath Swamy',
      phone: '+91 98452 77192',
      rating: 4.8,
      vehicleModel: 'Piaggio Ape City',
      vehicleNumber: 'KA-04-AK-3312',
      vehicleColor: 'Yellow & Green',
      photoEmoji: '🧔',
      currentEtaMins: 4,
    },
  ],
  [RideType.MINI]: [
    {
      name: 'Ramesh Kumar',
      phone: '+91 98860 44211',
      rating: 4.85,
      vehicleModel: 'Maruti Suzuki WagonR (AC)',
      vehicleNumber: 'KA-04-ME-8822',
      vehicleColor: 'Silky Silver',
      photoEmoji: '👨‍💼',
      currentEtaMins: 4,
    },
  ],
  [RideType.SEDAN]: [
    {
      name: 'Kiran Reddy',
      phone: '+91 97420 55910',
      rating: 4.95,
      vehicleModel: 'Maruti Suzuki Dzire (Prime)',
      vehicleNumber: 'KA-51-MD-1094',
      vehicleColor: 'Pearl Arctic White',
      photoEmoji: '👨‍💼',
      currentEtaMins: 5,
    },
  ],
  [RideType.EV_GREEN]: [
    {
      name: 'Anand Varma',
      phone: '+91 96110 33812',
      rating: 4.92,
      vehicleModel: 'Tata Tigor EV (BluGreen)',
      vehicleNumber: 'KA-01-EV-2048',
      vehicleColor: 'Ocean Teal Blue',
      photoEmoji: '⚡',
      currentEtaMins: 5,
    },
  ],
};

export function calculateEstimatedFare(type: RideType, distanceKm: number): number {
  const tier = RIDE_TIERS[type];
  if (!tier) return 0;
  const validDist = typeof distanceKm === 'number' && !isNaN(distanceKm) && distanceKm > 0 ? distanceKm : 0;
  const calculated = tier.baseFare + Math.round(validDist * tier.perKmRate);
  return Math.max(tier.baseFare, calculated);
}

const INITIAL_BOOKINGS: CabBooking[] = [
  {
    id: 'cab-seed-1',
    bookingCode: 'CAB-2026-7719',
    passCode: 'CP-7719',
    gatePin: '5821',
    rideType: RideType.AUTO,
    pickupPoint: SOCIETY_PICKUP_POINTS[0], // Tower B
    destination: "Kempegowda Int'l Airport (BLR)",
    distanceKm: 34,
    estimatedFare: calculateEstimatedFare(RideType.AUTO, 34),
    estimatedDurationMins: 45,
    residentName: 'Aditya Sharma',
    residentFlat: 'B-204',
    residentPhone: '+91 98765 43210',
    driver: MOCK_DRIVERS[RideType.AUTO][0],
    status: RideStatus.ASSIGNED,
    transitWindowMinutes: 15,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

export const useCabStore = create<CabStoreState>((set, get) => ({
  bookings: INITIAL_BOOKINGS,
  activeBookingId: 'cab-seed-1',
  selectedRideType: RideType.AUTO,
  selectedPickupId: 'TOWER_B_PORCH',
  selectedDestinationId: 'AIRPORT_BLR',
  customDestination: '',

  setSelectedRideType: (type) => set({ selectedRideType: type }),
  setSelectedPickupId: (id) => set({ selectedPickupId: id }),
  setSelectedDestinationId: (id) => set({ selectedDestinationId: id }),
  setCustomDestination: (dest) => set({ customDestination: dest }),

  bookRide: (params) => {
    const state = get();
    const type = params.rideType || state.selectedRideType;
    const pickup = SOCIETY_PICKUP_POINTS.find((p) => p.id === (params.pickupPointId || state.selectedPickupId)) || SOCIETY_PICKUP_POINTS[0];
    
    let destTitle = params.destinationName || state.customDestination;
    let distKm = params.distanceKm || 6.5;
    let durMins = 18;

    if (state.selectedDestinationId && !params.destinationName) {
      const pop = POPULAR_DESTINATIONS.find((d) => d.id === state.selectedDestinationId);
      if (pop) {
        destTitle = pop.title;
        distKm = pop.distanceKm;
        durMins = pop.durationMins;
      }
    }

    if (!destTitle) {
      destTitle = "Kempegowda Int'l Airport (BLR)";
      distKm = 34;
      durMins = 45;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `CAB-2026-${randomNum}`;
    const passCode = `CP-${randomNum}`;
    const gatePin = String(Math.floor(1000 + Math.random() * 9000));

    const driverPool = MOCK_DRIVERS[type];
    const driver = driverPool[Math.floor(Math.random() * driverPool.length)];

    const newBooking: CabBooking = {
      id: `cab-${Date.now()}`,
      bookingCode,
      passCode,
      gatePin,
      rideType: type,
      pickupPoint: pickup,
      destination: destTitle,
      distanceKm: distKm,
      estimatedFare: calculateEstimatedFare(type, distKm),
      estimatedDurationMins: durMins,
      residentName: params.residentName || 'Aditya Sharma',
      residentFlat: params.residentFlat || 'B-204',
      residentPhone: params.residentPhone || '+91 98765 43210',
      driver: { ...driver },
      status: RideStatus.ASSIGNED,
      transitWindowMinutes: 15,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      bookings: [newBooking, ...s.bookings],
      activeBookingId: newBooking.id,
    }));

    return newBooking;
  },

  cancelBooking: (bookingId, reason = 'Cancelled by resident') => {
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, status: RideStatus.CANCELLED, cancellationReason: reason, completedAt: new Date().toISOString() }
          : b
      ),
      activeBookingId: s.activeBookingId === bookingId ? null : s.activeBookingId,
    }));
  },

  updateBookingStatus: (bookingId, status) => {
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status,
              completedAt: status === RideStatus.COMPLETED ? new Date().toISOString() : b.completedAt,
            }
          : b
      ),
      activeBookingId: status === RideStatus.COMPLETED || status === RideStatus.CANCELLED
        ? (s.activeBookingId === bookingId ? null : s.activeBookingId)
        : s.activeBookingId,
    }));
  },

  findCabPass: (query) => {
    if (!query) return undefined;
    const clean = query.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const cleanRaw = query.trim().toUpperCase();

    return get().bookings.find((b) => {
      const matchPass = b.passCode.toUpperCase() === clean || b.passCode.toUpperCase() === cleanRaw;
      const matchBooking = b.bookingCode.toUpperCase() === clean || b.bookingCode.toUpperCase() === cleanRaw;
      const matchPin = b.gatePin === query.trim();
      const matchVehicle = b.driver.vehicleNumber.replace(/[^A-Z0-9]/g, '') === clean.replace(/[^A-Z0-9]/g, '');
      const matchId = b.id === query.trim();

      return matchPass || matchBooking || matchPin || matchVehicle || matchId;
    });
  },

  verifyGateInward: (passCodeOrPlate, guardName = 'Bahadur Singh (Gate 1)', gate = 'Gate 1') => {
    const booking = get().findCabPass(passCodeOrPlate);
    if (!booking) return null;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    const updated: CabBooking = {
      ...booking,
      status: RideStatus.INSIDE_CAMPUS,
      admittedAt: now.toISOString(),
      transitExpiresAt: expiresAt,
      guardName,
      guardGate: gate,
    };

    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === booking.id ? updated : b)),
    }));

    return updated;
  },

  completeRide: (bookingId) => {
    get().updateBookingStatus(bookingId, RideStatus.COMPLETED);
  },

  getActiveBooking: () => {
    const state = get();
    if (!state.activeBookingId) return null;
    const active = state.bookings.find((b) => b.id === state.activeBookingId);
    if (active && active.status !== RideStatus.COMPLETED && active.status !== RideStatus.CANCELLED) {
      return active;
    }
    return null;
  },

  resetStore: () => {
    set({
      bookings: INITIAL_BOOKINGS,
      activeBookingId: 'cab-seed-1',
      selectedRideType: RideType.AUTO,
      selectedPickupId: 'TOWER_B_PORCH',
      selectedDestinationId: 'AIRPORT_BLR',
      customDestination: '',
    });
  },
}));
