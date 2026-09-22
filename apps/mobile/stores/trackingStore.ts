import { create } from 'zustand';

export type TrackingTripType = 'CAB' | 'AUTO' | 'DELIVERY_MART' | 'DELIVERY_PARCEL';
export type MapStyle = 'STANDARD' | 'SATELLITE' | 'DARK';
export type VehicleMarkerType = 'AUTO' | 'SEDAN' | 'HATCHBACK' | 'EV' | 'SCOOTER' | 'BIKE';

export interface GPSPoint {
  lat: number;
  lng: number;
  label?: string;
  street: string;
  speedLimitKmh?: number;
}

export interface TrackingTrip {
  id: string;
  tripType: TrackingTripType;
  title: string;
  subtitle: string;
  source: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  waypoints: GPSPoint[];
  totalDistanceKm: number;
  totalDurationMins: number;
  vehicleType: VehicleMarkerType;
  driverOrRider: {
    name: string;
    phone: string;
    rating: number;
    vehicleNumber: string;
    vehicleModel: string;
    photoEmoji: string;
  };
  orderOrPassCode: string;
  itemsSummary?: string;
  gatePin?: string;
}

export interface LiveTelemetry {
  currentLat: number;
  currentLng: number;
  bearing: number; // 0 to 360 degrees
  currentStreet: string;
  currentSpeedKmh: number;
  remainingDistanceKm: number;
  remainingEtaMins: number;
  progressPercent: number; // 0 to 100
  segmentIndex: number;
}

interface TrackingStoreState {
  trips: TrackingTrip[];
  activeTripId: string;
  progress: number; // 0.0 to 1.0
  isPlaying: boolean;
  playbackSpeed: 1 | 2 | 5;
  mapStyle: MapStyle;
  showTraffic: boolean;
  zoomLevel: number; // 1 to 5 (default 3)
  centeredOnVehicle: boolean;

  // Actions
  setActiveTripId: (tripId: string) => void;
  setProgress: (progress: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: 1 | 2 | 5) => void;
  setMapStyle: (style: MapStyle) => void;
  toggleTraffic: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setCenteredOnVehicle: (centered: boolean) => void;
  stepSimulation: (deltaSeconds?: number) => void;
  resetTrip: () => void;

  // Selectors
  getActiveTrip: () => TrackingTrip;
  getLiveTelemetry: () => LiveTelemetry;
}

// 4 realistic Bangalore routes with GPS coordinates:
export const PRESET_TRIPS: TrackingTrip[] = [
  {
    id: 'trip-cab-airport',
    tripType: 'CAB',
    title: 'Airport Prime Sedan (BLR Terminal 1)',
    subtitle: 'AMA Grand Estate Porch -> Kempegowda Int\'l Airport',
    source: {
      name: 'AMA Grand Estate (Tower B Porch)',
      address: 'Outer Ring Road, Hebbal, Bengaluru',
      lat: 13.0358,
      lng: 77.597,
    },
    destination: {
      name: 'Kempegowda Int\'l Airport (BLR)',
      address: 'Departures Ramp, Terminal 1, Devanahalli',
      lat: 13.1986,
      lng: 77.7066,
    },
    totalDistanceKm: 34.0,
    totalDurationMins: 42,
    vehicleType: 'SEDAN',
    driverOrRider: {
      name: 'Kiran Reddy',
      phone: '+91 97420 55910',
      rating: 4.95,
      vehicleModel: 'Maruti Suzuki Dzire (Prime Sedan)',
      vehicleNumber: 'KA-51-MD-1094',
      photoEmoji: '👨‍💼',
    },
    orderOrPassCode: 'CP-8921',
    gatePin: '4821',
    waypoints: [
      { lat: 13.0358, lng: 77.597, street: 'AMA Society Internal Drive', speedLimitKmh: 15 },
      { lat: 13.0385, lng: 77.5952, street: 'Security Gate 1 Boom Barrier', speedLimitKmh: 20 },
      { lat: 13.0462, lng: 77.5935, street: 'Hebbal Flyover Access Ramp', speedLimitKmh: 50 },
      { lat: 13.0612, lng: 77.5921, street: 'Bellary Road / NH 44 Expressway', speedLimitKmh: 75 },
      { lat: 13.0825, lng: 77.5962, street: 'Jakkur Aerodrome Flyover', speedLimitKmh: 80 },
      { lat: 13.1008, lng: 77.6045, street: 'Yelahanka Bypass (NH 44)', speedLimitKmh: 80 },
      { lat: 13.1315, lng: 77.6321, street: 'Chikkajala Junction', speedLimitKmh: 70 },
      { lat: 13.1652, lng: 77.6685, street: 'Navayuga Devanahalli Toll Plaza', speedLimitKmh: 40 },
      { lat: 13.1824, lng: 77.6912, street: 'Airport Trumpet Interchange', speedLimitKmh: 60 },
      { lat: 13.1986, lng: 77.7066, street: 'Terminal 1 Departure Drop-off', speedLimitKmh: 25 },
    ],
  },
  {
    id: 'trip-auto-metro',
    tripType: 'AUTO',
    title: 'Metro Connect Auto Rickshaw',
    subtitle: 'AMA Grand Estate Gate 1 -> Baiyappanahalli Metro',
    source: {
      name: 'AMA Grand Estate (Gate 1 Auto Stand)',
      address: 'North Access Road, Bengaluru',
      lat: 13.0385,
      lng: 77.5952,
    },
    destination: {
      name: 'Baiyappanahalli Metro Station',
      address: 'Purple Line Exit 2, Swami Vivekananda Rd',
      lat: 12.9904,
      lng: 77.6525,
    },
    totalDistanceKm: 4.8,
    totalDurationMins: 14,
    vehicleType: 'AUTO',
    driverOrRider: {
      name: 'Santosh Gowda',
      phone: '+91 98450 12891',
      rating: 4.9,
      vehicleModel: 'Bajaj RE Auto Rickshaw',
      vehicleNumber: 'KA-03-AA-4921',
      photoEmoji: '🛺',
    },
    orderOrPassCode: 'CP-7719',
    gatePin: '5821',
    waypoints: [
      { lat: 13.0385, lng: 77.5952, street: 'AMA Gate 1 North Exit', speedLimitKmh: 20 },
      { lat: 13.0295, lng: 77.6082, street: 'Nagawara Main Road', speedLimitKmh: 35 },
      { lat: 13.0182, lng: 77.6215, street: 'Kammanahalli 80ft Road', speedLimitKmh: 30 },
      { lat: 13.0075, lng: 77.6358, street: 'Banaswadi Ring Road', speedLimitKmh: 40 },
      { lat: 12.9982, lng: 77.6452, street: 'Old Madras Road Junction', speedLimitKmh: 35 },
      { lat: 12.9904, lng: 77.6525, street: 'Metro Station Passenger Drop Bay', speedLimitKmh: 15 },
    ],
  },
  {
    id: 'trip-delivery-mart',
    tripType: 'DELIVERY_MART',
    title: 'Orchid Mart 15-Min Express Delivery',
    subtitle: 'Orchid Supermarket Hub -> Flat B-204 (Tower B)',
    source: {
      name: 'Orchid Central Mart (Superstore Hub)',
      address: 'Commercial Block A, Gate 2, Bengaluru',
      lat: 13.0312,
      lng: 77.6045,
    },
    destination: {
      name: 'Aditya Sharma (Flat B-204)',
      address: 'Tower B, 2nd Floor, AMA Grand Estate',
      lat: 13.0358,
      lng: 77.597,
    },
    totalDistanceKm: 1.8,
    totalDurationMins: 8,
    vehicleType: 'SCOOTER',
    driverOrRider: {
      name: 'Vikram Delivery Partner',
      phone: '+91 98860 11244',
      rating: 4.92,
      vehicleModel: 'Ather 450X Electric Scooter',
      vehicleNumber: 'KA-04-EV-9912',
      photoEmoji: '🛵',
    },
    orderOrPassCode: 'BZR-ORD-8812',
    gatePin: '9142',
    itemsSummary: 'Farm Fresh Organic Milk (2L), Sourdough Bread, Eggs, Fresh Bananas (Total: ₹380)',
    waypoints: [
      { lat: 13.0312, lng: 77.6045, street: 'Orchid Mart Dispatch Bay', speedLimitKmh: 15 },
      { lat: 13.0335, lng: 77.6015, street: 'Society Service Access Road', speedLimitKmh: 25 },
      { lat: 13.0372, lng: 77.5978, street: 'Main Security Gate 1 Boom Barrier', speedLimitKmh: 15 },
      { lat: 13.0365, lng: 77.5972, street: 'Internal Boulevard (Clubhouse Road)', speedLimitKmh: 15 },
      { lat: 13.0358, lng: 77.597, street: 'Tower B Entrance Porch (Elevator Lobby)', speedLimitKmh: 10 },
    ],
  },
  {
    id: 'trip-delivery-food',
    tripType: 'DELIVERY_PARCEL',
    title: 'Hot Food Delivery (Biryani & Tandoori)',
    subtitle: 'Spice Kitchen (Manyata) -> Flat B-204',
    source: {
      name: 'Spice Kitchen & Grill (Tech Park Hub)',
      address: 'Manyata Embassy Park Food Court',
      lat: 13.0475,
      lng: 77.62,
    },
    destination: {
      name: 'Flat B-204 (Tower B)',
      address: 'AMA Grand Estate, Hebbal, Bengaluru',
      lat: 13.0358,
      lng: 77.597,
    },
    totalDistanceKm: 6.2,
    totalDurationMins: 18,
    vehicleType: 'BIKE',
    driverOrRider: {
      name: 'Karthik R (Zomato/Swiggy Express)',
      phone: '+91 98440 22919',
      rating: 4.88,
      vehicleModel: 'Hero Splendor Plus',
      vehicleNumber: 'KA-04-HX-4411',
      photoEmoji: '🏍️',
    },
    orderOrPassCode: 'PCL-5591',
    gatePin: '3312',
    itemsSummary: 'Dum Biryani Feast Combo + Mint Raita (Hot & Fresh)',
    waypoints: [
      { lat: 13.0475, lng: 77.62, street: 'Manyata Park Gate 2 Exit', speedLimitKmh: 25 },
      { lat: 13.0442, lng: 77.6115, street: 'Outer Ring Road (ORR Flyover)', speedLimitKmh: 45 },
      { lat: 13.0398, lng: 77.6025, street: 'Nagawara Junction Underpass', speedLimitKmh: 35 },
      { lat: 13.0372, lng: 77.5978, street: 'AMA Society Gate 1 Security Check', speedLimitKmh: 15 },
      { lat: 13.0358, lng: 77.597, street: 'Tower B Porch Arrival', speedLimitKmh: 10 },
    ],
  },
];

/**
 * Calculates bearing heading angle in degrees between two GPS points.
 */
export function calculateBearing(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  if (typeof fromLat !== 'number' || typeof fromLng !== 'number' || typeof toLat !== 'number' || typeof toLng !== 'number') {
    return 0;
  }
  if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
    return 0;
  }
  if (fromLat === toLat && fromLng === toLng) {
    return 0;
  }
  const rad = Math.PI / 180;
  const lat1 = fromLat * rad;
  const lat2 = toLat * rad;
  const dLng = (toLng - fromLng) * rad;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  if (isNaN(brng)) return 0;
  return (brng + 360) % 360;
}

export const useTrackingStore = create<TrackingStoreState>((set, get) => ({
  trips: PRESET_TRIPS,
  activeTripId: 'trip-cab-airport',
  progress: 0.38, // Start 38% along route for instant dynamic visual
  isPlaying: true,
  playbackSpeed: 1,
  mapStyle: 'STANDARD',
  showTraffic: true,
  zoomLevel: 3,
  centeredOnVehicle: true,

  setActiveTripId: (tripId) => {
    set({
      activeTripId: tripId,
      progress: 0.25,
      isPlaying: true,
      centeredOnVehicle: true,
    });
  },

  setProgress: (progress) => {
    const raw = Number(progress);
    const clamped = !isNaN(raw) && isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0;
    set({ progress: clamped });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setMapStyle: (style) => set({ mapStyle: style }),

  toggleTraffic: () => set((s) => ({ showTraffic: !s.showTraffic })),

  zoomIn: () => set((s) => ({ zoomLevel: Math.min(5, s.zoomLevel + 1) })),

  zoomOut: () => set((s) => ({ zoomLevel: Math.max(1, s.zoomLevel - 1) })),

  setCenteredOnVehicle: (centered) => set({ centeredOnVehicle: centered }),

  stepSimulation: (deltaSeconds = 1) => {
    const state = get();
    if (!state.isPlaying) return;

    const trip = state.getActiveTrip();
    const durationMins = trip?.totalDurationMins && trip.totalDurationMins > 0 ? trip.totalDurationMins : 15;
    const totalTripSecs = Math.max(60, durationMins * 60);
    const speed = state.playbackSpeed || 1;
    const stepRatio = (deltaSeconds * speed) / totalTripSecs;

    const currentP = typeof state.progress === 'number' && !isNaN(state.progress) ? state.progress : 0;
    let nextProgress = currentP + stepRatio;
    if (nextProgress >= 1.0) {
      nextProgress = 1.0;
      set({ progress: 1.0, isPlaying: false });
    } else {
      set({ progress: nextProgress });
    }
  },

  resetTrip: () => set({ progress: 0, isPlaying: true }),

  getActiveTrip: () => {
    const state = get();
    const trips = state.trips && state.trips.length > 0 ? state.trips : PRESET_TRIPS;
    return trips.find((t) => t.id === state.activeTripId) || trips[0] || PRESET_TRIPS[0];
  },

  getLiveTelemetry: () => {
    const state = get();
    const trip = state.getActiveTrip() || PRESET_TRIPS[0];
    const wps = trip?.waypoints && Array.isArray(trip.waypoints) && trip.waypoints.length > 0
      ? trip.waypoints
      : (PRESET_TRIPS[0]?.waypoints || []);

    // Ensure progress is always a valid finite number between 0 and 1
    const rawP = Number(state.progress);
    const p = !isNaN(rawP) && isFinite(rawP) ? Math.max(0, Math.min(1, rawP)) : 0;

    const defaultLat = trip?.source?.lat ?? 13.0358;
    const defaultLng = trip?.source?.lng ?? 77.597;
    const defaultStreet = trip?.source?.name ?? 'AMA Grand Estate';

    if (wps.length < 2) {
      return {
        currentLat: defaultLat,
        currentLng: defaultLng,
        bearing: 0,
        currentStreet: defaultStreet,
        currentSpeedKmh: 20,
        remainingDistanceKm: trip?.totalDistanceKm ?? 5,
        remainingEtaMins: trip?.totalDurationMins ?? 15,
        progressPercent: Math.round(p * 100),
        segmentIndex: 0,
      };
    }

    // Determine segment based on progress
    const totalSegments = Math.max(1, wps.length - 1);
    const globalT = p * totalSegments;
    const floorT = Math.floor(globalT);
    const segIdx = Math.max(0, Math.min(totalSegments - 1, isNaN(floorT) ? 0 : floorT));
    const localT = Math.max(0, Math.min(1, globalT - segIdx)); // 0.0 to 1.0 within this segment

    const pA = wps[segIdx] || wps[0] || { lat: defaultLat, lng: defaultLng, street: defaultStreet, speedLimitKmh: 40 };
    const pB = wps[segIdx + 1] || wps[wps.length - 1] || pA;

    const pALat = typeof pA?.lat === 'number' && !isNaN(pA.lat) ? pA.lat : defaultLat;
    const pALng = typeof pA?.lng === 'number' && !isNaN(pA.lng) ? pA.lng : defaultLng;
    const pBLat = typeof pB?.lat === 'number' && !isNaN(pB.lat) ? pB.lat : pALat;
    const pBLng = typeof pB?.lng === 'number' && !isNaN(pB.lng) ? pB.lng : pALng;

    const currentLat = pALat + (pBLat - pALat) * localT;
    const currentLng = pALng + (pBLng - pALng) * localT;

    const bearing = calculateBearing(pALat, pALng, pBLat, pBLng);

    // Remaining distance & ETA
    const totalDist = trip?.totalDistanceKm ?? 5;
    const totalMins = trip?.totalDurationMins ?? 15;
    const remainingDist = Math.max(0, parseFloat((totalDist * (1 - p)).toFixed(1)));
    const remainingMins = Math.max(1, Math.round(totalMins * (1 - p)));

    // Speed calculation
    const baseSpeed = pB?.speedLimitKmh || 40;
    const speedVariation = Math.sin(localT * Math.PI) * 4;
    const currentSpeedKmh = p >= 0.98 ? 0 : Math.max(12, Math.round(baseSpeed + speedVariation));

    const currentStreet = localT < 0.5 ? (pA?.street || defaultStreet) : (pB?.street || defaultStreet);

    return {
      currentLat,
      currentLng,
      bearing: Math.round(bearing) || 0,
      currentStreet,
      currentSpeedKmh,
      remainingDistanceKm: remainingDist,
      remainingEtaMins: remainingMins,
      progressPercent: Math.round(p * 100),
      segmentIndex: segIdx,
    };
  },
}));
