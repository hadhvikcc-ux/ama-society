import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssociationRole, User } from './authStore';

export interface SocietyMember {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: AssociationRole;
  roleCategory: 'owner' | 'tenant' | 'committee' | 'guard' | 'facility_manager' | 'technician' | 'vendor' | 'supplier';
  flat?: string;
  tower?: string;
  avatar?: string;
  status: 'active' | 'pending' | 'inactive';
  registeredAt: string;
  // Role-specific extensions:
  tenancyType?: 'Owner' | 'Tenant';
  shareCertNumber?: string;
  vehicleNumber?: string;
  ownerName?: string;
  leaseEndDate?: string;
  committeePosition?: string;
  designation?: string;
  badgeId?: string;
  shift?: string;
  gatePost?: string;
  agencyName?: string;
  tradeSpecialization?: string;
  shopName?: string;
  category?: string;
  stallNumber?: string;
  upiId?: string;
  companyName?: string;
  gstin?: string;
  supplierCategory?: string;
  emergencyContact?: string;
}

export interface SocietyFlat {
  id: string;
  flat: string;
  tower: string;
  floor: number;
  status: 'Owner Occupied' | 'Tenant Occupied' | 'Vacant';
  ownerName?: string;
  ownerPhone?: string;
  tenantName?: string;
  tenantPhone?: string;
}

interface SocietyState {
  societyId: string;
  societyName: string;
  societyAddress: string;
  totalFlatsCount: number;
  estYear: number;
  members: SocietyMember[];
  flats: SocietyFlat[];

  // Actions
  registerMember: (memberOrUser: Partial<SocietyMember> | User) => SocietyMember;
  updateMember: (id: string, partial: Partial<SocietyMember>) => void;
  deleteMember: (id: string) => void;
  getResidents: () => SocietyMember[];
  getStaff: () => SocietyMember[];
  getMembersByCategory: (category: SocietyMember['roleCategory']) => SocietyMember[];
}

const INITIAL_MEMBERS: SocietyMember[] = [
  // 1. Registered Flat Owners
  {
    id: 'mem-owner-1',
    name: 'Aditya Sharma',
    email: 'aditya.sharma@example.com',
    phone: '+91 98765 43210',
    role: 'resident_owner',
    roleCategory: 'owner',
    flat: 'B-204',
    tower: 'Tower B',
    avatar: '👨‍💼',
    status: 'active',
    registeredAt: '2026-01-15T10:00:00.000Z',
    tenancyType: 'Owner',
    shareCertNumber: 'SC-88214',
    vehicleNumber: 'KA-01-MJ-4412',
  },
  {
    id: 'mem-owner-2',
    name: 'Priya Mehta',
    email: 'priya.mehta@example.com',
    phone: '+91 98112 34567',
    role: 'resident_owner',
    roleCategory: 'owner',
    flat: 'A-404',
    tower: 'Tower A',
    avatar: '👩‍💼',
    status: 'active',
    registeredAt: '2026-02-10T14:30:00.000Z',
    tenancyType: 'Owner',
    shareCertNumber: 'SC-40119',
    vehicleNumber: 'HR-26-DK-9021',
  },
  {
    id: 'mem-owner-3',
    name: 'Vikram Malhotra',
    email: 'vikram.president@orchid.org',
    phone: '+91 98100 12345',
    role: 'admin',
    roleCategory: 'committee',
    flat: 'A-101',
    tower: 'Tower A',
    avatar: '👔',
    status: 'active',
    registeredAt: '2025-11-01T09:00:00.000Z',
    tenancyType: 'Owner',
    committeePosition: 'President',
    designation: 'RWA President & Flat Owner',
    shareCertNumber: 'SC-10010',
    vehicleNumber: 'DL-01-AA-0001',
  },
  {
    id: 'mem-owner-4',
    name: 'Rajesh Gupta',
    email: 'rajesh.gupta@example.com',
    phone: '+91 98450 99887',
    role: 'resident_owner',
    roleCategory: 'owner',
    flat: 'C-301',
    tower: 'Tower C',
    avatar: '👨‍💻',
    status: 'active',
    registeredAt: '2026-01-20T11:00:00.000Z',
    tenancyType: 'Owner',
    shareCertNumber: 'SC-30122',
    vehicleNumber: 'KA-05-NB-7788',
  },
  {
    id: 'mem-owner-5',
    name: 'Sunita Rao',
    email: 'sunita.rao@example.com',
    phone: '+91 98711 55443',
    role: 'resident_owner',
    roleCategory: 'owner',
    flat: 'B-302',
    tower: 'Tower B',
    avatar: '👩‍🏫',
    status: 'active',
    registeredAt: '2026-03-05T16:00:00.000Z',
    tenancyType: 'Owner',
    shareCertNumber: 'SC-22108',
  },

  // 2. Registered Tenants
  {
    id: 'mem-tenant-1',
    name: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    phone: '+91 98991 22334',
    role: 'resident_tenant',
    roleCategory: 'tenant',
    flat: 'A-402',
    tower: 'Tower A',
    avatar: '👨‍🎓',
    status: 'active',
    registeredAt: '2026-04-01T12:00:00.000Z',
    tenancyType: 'Tenant',
    ownerName: 'Vikram Malhotra',
    leaseEndDate: '31-Dec-2026',
    vehicleNumber: 'HR-26-CV-1122',
  },
  {
    id: 'mem-tenant-2',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@example.com',
    phone: '+91 98200 44556',
    role: 'resident_tenant',
    roleCategory: 'tenant',
    flat: 'B-102',
    tower: 'Tower B',
    avatar: '👩‍⚕️',
    status: 'active',
    registeredAt: '2026-03-15T10:30:00.000Z',
    tenancyType: 'Tenant',
    ownerName: 'Aditya Sharma',
    leaseEndDate: '30-Nov-2026',
    vehicleNumber: 'MH-02-EE-3344',
  },
  {
    id: 'mem-tenant-3',
    name: 'Amit Desai',
    email: 'amit.desai@example.com',
    phone: '+91 99887 66554',
    role: 'resident_tenant',
    roleCategory: 'tenant',
    flat: 'C-204',
    tower: 'Tower C',
    avatar: '👨‍🔬',
    status: 'active',
    registeredAt: '2026-05-10T15:00:00.000Z',
    tenancyType: 'Tenant',
    ownerName: 'Rajesh Gupta',
    leaseEndDate: '31-Mar-2027',
  },

  // 3. Registered Security Guards
  {
    id: 'mem-guard-1',
    name: 'Ramesh Singh',
    email: 'guard.ramesh@sis.in',
    phone: '+91 98201 11001',
    role: 'guard',
    roleCategory: 'guard',
    flat: 'Main Gate 1',
    avatar: '🛡️',
    status: 'active',
    registeredAt: '2025-10-01T08:00:00.000Z',
    badgeId: 'SEC-01',
    gatePost: 'Main Gate 1 (Inbound & Outbound)',
    shift: 'Morning Shift (8:00 AM - 8:00 PM)',
    agencyName: 'SIS Security Solutions',
  },
  {
    id: 'mem-guard-2',
    name: 'Suresh Kumar',
    email: 'guard.suresh@sis.in',
    phone: '+91 98201 11002',
    role: 'guard',
    roleCategory: 'guard',
    flat: 'Back Gate 2',
    avatar: '👮‍♂️',
    status: 'active',
    registeredAt: '2025-10-01T08:00:00.000Z',
    badgeId: 'SEC-02',
    gatePost: 'Back Gate 2 (Service & Commercial)',
    shift: 'Night Shift (8:00 PM - 8:00 AM)',
    agencyName: 'SIS Security Solutions',
  },
  {
    id: 'mem-guard-3',
    name: 'Manoj Yadav',
    email: 'guard.manoj@sis.in',
    phone: '+91 98201 11003',
    role: 'guard',
    roleCategory: 'guard',
    flat: 'Basement & Clubhouse',
    avatar: '🛡️',
    status: 'active',
    registeredAt: '2026-01-10T08:00:00.000Z',
    badgeId: 'SEC-03',
    gatePost: 'Clubhouse & Visitor Parking Desk',
    shift: 'General Shift (9:00 AM - 6:00 PM)',
    agencyName: 'SIS Security Solutions',
  },

  // 4. Facility Managers
  {
    id: 'mem-fm-1',
    name: 'Amit Joshi',
    email: 'amit.joshi@cbre.com',
    phone: '+91 98190 22001',
    role: 'facility_manager',
    roleCategory: 'facility_manager',
    flat: 'Estate Office',
    avatar: '🏢',
    status: 'active',
    registeredAt: '2025-09-01T09:00:00.000Z',
    badgeId: 'FM-01',
    designation: 'Head of Facility Management & Operations',
    shift: 'General (9:00 AM - 6:00 PM)',
    agencyName: 'CBRE Property Management',
  },

  // 5. Registered Technicians
  {
    id: 'mem-tech-1',
    name: 'Raju Sharma',
    email: 'raju.electric@orchid.org',
    phone: '+91 98201 99001',
    role: 'technician',
    roleCategory: 'technician',
    flat: 'Maintenance Workshop',
    avatar: '⚡',
    status: 'active',
    registeredAt: '2025-11-15T09:00:00.000Z',
    badgeId: 'TECH-01',
    tradeSpecialization: 'Licensed Society Electrician & DG Backup',
    shift: 'General (9:00 AM - 6:00 PM)',
    agencyName: 'Urban Maintenance Services',
  },
  {
    id: 'mem-tech-2',
    name: 'Shankar Lal',
    email: 'shankar.plumbing@orchid.org',
    phone: '+91 98201 99002',
    role: 'technician',
    roleCategory: 'technician',
    flat: 'Pump House',
    avatar: '🔧',
    status: 'active',
    registeredAt: '2025-11-15T09:00:00.000Z',
    badgeId: 'TECH-02',
    tradeSpecialization: 'Master Plumber & Water Tank Specialist',
    shift: 'General (9:00 AM - 6:00 PM)',
    agencyName: 'Urban Maintenance Services',
  },
  {
    id: 'mem-tech-3',
    name: 'Anil Verma',
    email: 'anil.lift@otis.com',
    phone: '+91 98201 99003',
    role: 'technician',
    roleCategory: 'technician',
    flat: 'Lift Control Room',
    avatar: '🛗',
    status: 'active',
    registeredAt: '2026-02-01T10:00:00.000Z',
    badgeId: 'TECH-03',
    tradeSpecialization: 'Otis Certified Lift & Escalator Engineer',
    shift: 'On-Call 24x7 Emergency',
    agencyName: 'Otis Elevator AMC',
  },

  // 6. Registered Vendors
  {
    id: 'mem-vendor-1',
    name: 'Orchid SuperMart (Rakesh)',
    email: 'mart@orchidbazaar.in',
    phone: '+91 98201 88001',
    role: 'vendor',
    roleCategory: 'vendor',
    flat: 'Commercial Stall #01',
    avatar: '🛒',
    status: 'active',
    registeredAt: '2025-12-01T08:00:00.000Z',
    shopName: 'Orchid SuperMart',
    category: 'Groceries, Dairy & Essentials',
    stallNumber: 'Commercial Stall #01',
    upiId: 'orchidmart@icici',
  },
  {
    id: 'mem-vendor-2',
    name: 'Fresh Farm Produce (Sanjay)',
    email: 'freshproduce@orchidbazaar.in',
    phone: '+91 98201 88002',
    role: 'vendor',
    roleCategory: 'vendor',
    flat: 'Commercial Stall #02',
    avatar: '🥦',
    status: 'active',
    registeredAt: '2026-01-05T07:00:00.000Z',
    shopName: 'Fresh Farm Produce',
    category: 'Organic Fruits & Vegetables',
    stallNumber: 'Commercial Stall #02',
    upiId: 'freshfarm@upi',
  },
];

const INITIAL_FLATS: SocietyFlat[] = [
  { id: 'f1', flat: 'A-101', tower: 'Tower A', floor: 1, status: 'Owner Occupied', ownerName: 'Vikram Malhotra', ownerPhone: '+91 98100 12345' },
  { id: 'f2', flat: 'A-102', tower: 'Tower A', floor: 1, status: 'Owner Occupied', ownerName: 'Deepak Sharma', ownerPhone: '+91 98100 55441' },
  { id: 'f3', flat: 'A-201', tower: 'Tower A', floor: 2, status: 'Vacant' },
  { id: 'f4', flat: 'A-202', tower: 'Tower A', floor: 2, status: 'Owner Occupied', ownerName: 'Kavita Joshi', ownerPhone: '+91 98100 77889' },
  { id: 'f5', flat: 'A-301', tower: 'Tower A', floor: 3, status: 'Tenant Occupied', ownerName: 'Sanjay Dutt', tenantName: 'Manish Pandey', tenantPhone: '+91 98100 99001' },
  { id: 'f6', flat: 'A-402', tower: 'Tower A', floor: 4, status: 'Tenant Occupied', ownerName: 'Vikram Malhotra', tenantName: 'Rahul Verma', tenantPhone: '+91 98991 22334' },
  { id: 'f7', flat: 'A-404', tower: 'Tower A', floor: 4, status: 'Owner Occupied', ownerName: 'Priya Mehta', ownerPhone: '+91 98112 34567' },
  { id: 'f8', flat: 'B-101', tower: 'Tower B', floor: 1, status: 'Owner Occupied', ownerName: 'Kunal Nayyar', ownerPhone: '+91 98765 11223' },
  { id: 'f9', flat: 'B-102', tower: 'Tower B', floor: 1, status: 'Tenant Occupied', ownerName: 'Aditya Sharma', tenantName: 'Neha Kapoor', tenantPhone: '+91 98200 44556' },
  { id: 'f10', flat: 'B-204', tower: 'Tower B', floor: 2, status: 'Owner Occupied', ownerName: 'Aditya Sharma', ownerPhone: '+91 98765 43210' },
  { id: 'f11', flat: 'B-302', tower: 'Tower B', floor: 3, status: 'Owner Occupied', ownerName: 'Sunita Rao', ownerPhone: '+91 98711 55443' },
  { id: 'f12', flat: 'B-401', tower: 'Tower B', floor: 4, status: 'Vacant' },
  { id: 'f13', flat: 'C-101', tower: 'Tower C', floor: 1, status: 'Owner Occupied', ownerName: 'Vikas Swarup', ownerPhone: '+91 98450 11223' },
  { id: 'f14', flat: 'C-204', tower: 'Tower C', floor: 2, status: 'Tenant Occupied', ownerName: 'Rajesh Gupta', tenantName: 'Amit Desai', tenantPhone: '+91 99887 66554' },
  { id: 'f15', flat: 'C-301', tower: 'Tower C', floor: 3, status: 'Owner Occupied', ownerName: 'Rajesh Gupta', ownerPhone: '+91 98450 99887' },
  { id: 'f16', flat: 'C-402', tower: 'Tower C', floor: 4, status: 'Vacant' },
];

function determineCategory(role: string): SocietyMember['roleCategory'] {
  const r = role.toLowerCase();
  if (r.includes('owner')) return 'owner';
  if (r.includes('tenant')) return 'tenant';
  if (r.includes('admin') || r.includes('committee')) return 'committee';
  if (r.includes('guard')) return 'guard';
  if (r.includes('facility') || r.includes('manager')) return 'facility_manager';
  if (r.includes('tech')) return 'technician';
  if (r.includes('vendor')) return 'vendor';
  if (r.includes('supplier')) return 'supplier';
  return 'owner';
}

export const useSocietyStore = create<SocietyState>()(
  persist(
    (set, get) => ({
      societyId: 'orchid-towers-01',
      societyName: 'Orchid Towers',
      societyAddress: 'Sector 45, Gurugram, Haryana - 122003',
      totalFlatsCount: 120,
      estYear: 2015,
      members: INITIAL_MEMBERS,
      flats: INITIAL_FLATS,

      registerMember: (memberOrUser) => {
        const existingMembers = get().members;
        const role = (memberOrUser.role || 'resident_owner') as AssociationRole;
        const roleCategory = (memberOrUser as any).roleCategory || determineCategory(role);

        // Check if member with matching phone or email already exists
        const existingIndex = existingMembers.findIndex(
          (m) =>
            (memberOrUser.phone && m.phone.replace(/\D/g, '') === memberOrUser.phone?.replace(/\D/g, '')) ||
            (memberOrUser.email && m.email?.toLowerCase() === memberOrUser.email?.toLowerCase()) ||
            (memberOrUser.id && m.id === memberOrUser.id)
        );

        const newMember: SocietyMember = {
          id: memberOrUser.id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: memberOrUser.name || 'Resident Member',
          email: memberOrUser.email,
          phone: memberOrUser.phone || '',
          role,
          roleCategory,
          flat: (memberOrUser as any).flat || (memberOrUser as any).flatNumber,
          tower:
            (memberOrUser as any).tower ||
            ((memberOrUser as any).flat ? `Tower ${(memberOrUser as any).flat.charAt(0)}` : 'Tower A'),
          avatar:
            roleCategory === 'owner' ? '🏡' :
            roleCategory === 'tenant' ? '🔑' :
            roleCategory === 'guard' ? '🛡️' :
            roleCategory === 'facility_manager' ? '🏢' :
            roleCategory === 'technician' ? '🔧' :
            roleCategory === 'vendor' ? '🛒' :
            roleCategory === 'supplier' ? '🚛' : '👤',
          status: 'active',
          registeredAt: new Date().toISOString(),
          // Extensions
          tenancyType: (memberOrUser as any).tenancyType || (roleCategory === 'owner' ? 'Owner' : 'Tenant'),
          shareCertNumber: (memberOrUser as any).shareCertNumber,
          vehicleNumber: (memberOrUser as any).vehicleNumber,
          ownerName: (memberOrUser as any).ownerName,
          leaseEndDate: (memberOrUser as any).leaseEndDate,
          committeePosition: (memberOrUser as any).committeePosition,
          designation: (memberOrUser as any).designation,
          badgeId: (memberOrUser as any).badgeId,
          shift: (memberOrUser as any).shift,
          gatePost: (memberOrUser as any).gatePost,
          agencyName: (memberOrUser as any).agencyName,
          tradeSpecialization: (memberOrUser as any).tradeSpecialization,
          shopName: (memberOrUser as any).shopName,
          category: (memberOrUser as any).category || (memberOrUser as any).supplierCategory,
          stallNumber: (memberOrUser as any).stallNumber,
          upiId: (memberOrUser as any).upiId,
          companyName: (memberOrUser as any).companyName,
          gstin: (memberOrUser as any).gstin,
          supplierCategory: (memberOrUser as any).supplierCategory,
          emergencyContact: memberOrUser.emergencyContact,
        };

        if (existingIndex >= 0) {
          // Update in place
          const updated = [...existingMembers];
          updated[existingIndex] = { ...updated[existingIndex], ...newMember };
          set({ members: updated });
          return updated[existingIndex];
        } else {
          // Prepend new member so President immediately sees them at top!
          set({ members: [newMember, ...existingMembers] });
          return newMember;
        }
      },

      updateMember: (id, partial) => {
        set((state) => ({
          members: state.members.map((m) => (m.id === id ? { ...m, ...partial } : m)),
        }));
      },

      deleteMember: (id) => {
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        }));
      },

      getResidents: () => {
        return get().members.filter(
          (m) => m.roleCategory === 'owner' || m.roleCategory === 'tenant' || m.roleCategory === 'committee'
        );
      },

      getStaff: () => {
        return get().members.filter(
          (m) =>
            m.roleCategory === 'guard' ||
            m.roleCategory === 'facility_manager' ||
            m.roleCategory === 'technician' ||
            m.roleCategory === 'vendor' ||
            m.roleCategory === 'supplier'
        );
      },

      getMembersByCategory: (category) => {
        return get().members.filter((m) => m.roleCategory === category);
      },
    }),
    {
      name: 'ama-society-registry-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
