import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VehicleType = 'CAR' | 'TWO_WHEELER' | 'EV_CAR' | 'OTHER';

export interface RegisteredVehicle {
  id: string; // e.g. "VEH-101"
  plateNumber: string; // e.g. "DL 08 CC 9988"
  normalizedPlate: string; // e.g. "DL08CC9988"
  vehicleType: VehicleType;
  makeModel: string; // e.g. "Honda City (Pearl White)"
  flatNumber: string; // e.g. "B-204"
  tower: string;
  ownerName: string;
  ownerPhone: string;
  allottedSlot: string; // e.g. "Basement 1 - Slot B-P14"
  stickerIssued: boolean;
}

export interface ParkingAlert {
  id: string;
  reportedByFlat: string;
  reportedByPhone: string;
  slotNumber: string;
  offendingPlate: string;
  reportedAt: string;
  status: 'PENDING' | 'GUARD_NOTIFIED' | 'RESOLVED';
  notes?: string;
}

interface VehicleState {
  vehicles: RegisteredVehicle[];
  parkingAlerts: ParkingAlert[];

  // Actions
  registerVehicle: (params: {
    plateNumber: string;
    vehicleType: VehicleType;
    makeModel: string;
    flatNumber: string;
    tower?: string;
    ownerName: string;
    ownerPhone: string;
    allottedSlot?: string;
    stickerIssued?: boolean;
  }) => RegisteredVehicle;

  searchByPlate: (plateQuery: string) => RegisteredVehicle | undefined;
  getVehiclesForFlat: (flatNumber: string) => RegisteredVehicle[];
  getAllottedSlotForFlat: (flatNumber: string) => string | undefined;

  reportWrongParking: (params: {
    reportedByFlat: string;
    reportedByPhone?: string;
    slotNumber: string;
    offendingPlate: string;
    notes?: string;
  }) => ParkingAlert;

  resolveParkingAlert: (alertId: string) => void;
  resetVehicles: () => void;
}

const initialVehicles: RegisteredVehicle[] = [
  {
    id: 'VEH-001',
    plateNumber: 'DL 08 CC 9988',
    normalizedPlate: 'DL08CC9988',
    vehicleType: 'CAR',
    makeModel: 'Honda City (Pearl White)',
    flatNumber: 'B-204',
    tower: 'Tower B',
    ownerName: 'Aditya Sharma',
    ownerPhone: '9820199001',
    allottedSlot: 'B1-P14',
    stickerIssued: true,
  },
  {
    id: 'VEH-002',
    plateNumber: 'KA 01 MG 4421',
    normalizedPlate: 'KA01MG4421',
    vehicleType: 'EV_CAR',
    makeModel: 'Tata Nexon EV (Teal Blue)',
    flatNumber: 'B-204',
    tower: 'Tower B',
    ownerName: 'Aditya Sharma',
    ownerPhone: '9820199001',
    allottedSlot: 'B1-P15',
    stickerIssued: true,
  },
  {
    id: 'VEH-003',
    plateNumber: 'MH 12 QX 5120',
    normalizedPlate: 'MH12QX5120',
    vehicleType: 'TWO_WHEELER',
    makeModel: 'Ather 450X (Space Grey)',
    flatNumber: 'A-102',
    tower: 'Tower A',
    ownerName: 'Meera Nair',
    ownerPhone: '9820199002',
    allottedSlot: 'B1-2W-08',
    stickerIssued: true,
  },
  {
    id: 'VEH-004',
    plateNumber: 'DL 04 KK 1122',
    normalizedPlate: 'DL04KK1122',
    vehicleType: 'CAR',
    makeModel: 'Hyundai Creta (Black)',
    flatNumber: 'C-305',
    tower: 'Tower C',
    ownerName: 'Kavita Chawla',
    ownerPhone: '9820111222',
    allottedSlot: 'B2-P32',
    stickerIssued: true,
  },
];

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: initialVehicles,
      parkingAlerts: [],

      registerVehicle: ({
        plateNumber,
        vehicleType,
        makeModel,
        flatNumber,
        tower = 'Tower B',
        ownerName,
        ownerPhone,
        allottedSlot = 'Basement 1 - Open',
        stickerIssued = true,
      }) => {
        const id = `VEH-${Math.floor(100 + Math.random() * 900)}`;
        const normalizedPlate = plateNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        const newVehicle: RegisteredVehicle = {
          id,
          plateNumber: plateNumber.toUpperCase().trim(),
          normalizedPlate,
          vehicleType,
          makeModel,
          flatNumber,
          tower,
          ownerName,
          ownerPhone,
          allottedSlot,
          stickerIssued,
        };

        set((state) => ({
          vehicles: [newVehicle, ...state.vehicles],
        }));

        return newVehicle;
      },

      searchByPlate: (plateQuery: string) => {
        const clean = plateQuery.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (!clean) return undefined;
        return get().vehicles.find((v) => v.normalizedPlate.includes(clean) || clean.includes(v.normalizedPlate));
      },

      getVehiclesForFlat: (flatNumber: string) => {
        const targetFlat = flatNumber.trim().toUpperCase();
        return get().vehicles.filter((v) => v.flatNumber.trim().toUpperCase() === targetFlat);
      },

      getAllottedSlotForFlat: (flatNumber: string) => {
        const targetFlat = flatNumber.trim().toUpperCase();
        const found = get().vehicles.find((v) => v.flatNumber.trim().toUpperCase() === targetFlat);
        return found?.allottedSlot || 'B1-P14 (Basement 1)';
      },

      reportWrongParking: ({
        reportedByFlat,
        reportedByPhone = '9820199001',
        slotNumber,
        offendingPlate,
        notes,
      }) => {
        const id = `PRK-${Math.floor(1000 + Math.random() * 9000)}`;
        const alert: ParkingAlert = {
          id,
          reportedByFlat,
          reportedByPhone,
          slotNumber,
          offendingPlate: offendingPlate.toUpperCase().trim(),
          reportedAt: new Date().toISOString(),
          status: 'GUARD_NOTIFIED',
          notes,
        };

        set((state) => ({
          parkingAlerts: [alert, ...state.parkingAlerts],
        }));

        return alert;
      },

      resolveParkingAlert: (alertId: string) => {
        set((state) => ({
          parkingAlerts: state.parkingAlerts.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' } : a)),
        }));
      },

      resetVehicles: () => set({ vehicles: initialVehicles, parkingAlerts: [] }),
    }),
    {
      name: 'ama-vehicle-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
