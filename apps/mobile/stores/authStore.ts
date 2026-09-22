import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AssociationRole =
  | 'resident'
  | 'resident_owner'
  | 'resident_tenant'
  | 'admin'
  | 'committee'
  | 'facility_manager'
  | 'guard'
  | 'technician'
  | 'vendor'
  | 'supplier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: AssociationRole;
  flatNumber?: string;
  phone?: string;
  tower?: string;
  emergencyContact?: string;
  societyCode?: string;
  // Role-specific extensions
  designation?: string;         // Admin / Committee / Facility Manager
  committeePosition?: string;   // President, Secretary, Treasurer, Committee Member
  regNumber?: string;           // Admin
  totalUnits?: number;          // Admin
  agencyName?: string;          // Guard / Facility Manager
  badgeId?: string;             // Guard / Technician
  gatePost?: string;            // Guard
  shift?: string;               // Guard / Facility Manager
  tradeSpecialization?: string; // Technician: Electrical, Plumbing, Lift, Carpentry
  shopName?: string;            // Vendor
  category?: string;            // Vendor
  stallNumber?: string;         // Vendor
  upiId?: string;               // Vendor / Supplier
  companyName?: string;         // Supplier
  gstin?: string;               // Supplier
  supplierCategory?: string;    // Supplier
  bankAccount?: string;         // Supplier
  vehicleFleet?: string[];      // Supplier
  tenancyType?: 'Owner' | 'Tenant'; // Resident
  vehicleNumber?: string;       // Resident
  leaseEndDate?: string;        // Tenant
  ownerName?: string;           // Tenant
  shareCertNumber?: string;     // Owner
  agreedToTerms?: boolean;      // Mandatory Terms of Service
  agreedToPrivacy?: boolean;    // Mandatory Apartment Privacy Policy
  agreedAt?: string;            // Timestamp of legal agreement
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

// Multi-tier storage adapter for Web, React Native, and SSR/Node runtimes
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
      return null;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('auth-storage');
            window.localStorage.removeItem('access_token');
            window.localStorage.removeItem('refresh_token');
          }
        } catch {
          // ignore
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => resilientStorage),
    }
  )
);
