import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum SupplierCategory {
  WATER_SUPPLY = 'WATER_SUPPLY',
  DIESEL_FUEL = 'DIESEL_FUEL',
  CHEMICALS_TREATMENT = 'CHEMICALS_TREATMENT',
  ELECTRICAL_HARDWARE = 'ELECTRICAL_HARDWARE',
  PLUMBING_HARDWARE = 'PLUMBING_HARDWARE',
  HOUSEKEEPING_BULK = 'HOUSEKEEPING_BULK',
  LANDSCAPING = 'LANDSCAPING',
  BAZAAR_WHOLESALE = 'BAZAAR_WHOLESALE',
}

export enum PurchaseOrderStatus {
  NEW_PO = 'NEW_PO',
  CONFIRMED = 'CONFIRMED',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  INVOICED = 'INVOICED',
  CANCELLED = 'CANCELLED',
}

export enum DeliveryChallanStatus {
  DISPATCHED = 'DISPATCHED',
  AT_GATE = 'AT_GATE',
  INSPECTED = 'INSPECTED',
  OFFLOADED = 'OFFLOADED',
  GATE_EXIT = 'GATE_EXIT',
}

export enum SupplierInvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface SupplierProfile {
  id: string;
  companyName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  category: SupplierCategory;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  verifiedSocietyCode: string;
}

export interface PurchaseOrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string; // 'Loads', 'Litres', 'KG', 'Units', 'Meters', 'Bags'
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  societyId: string;
  societyName: string;
  orderDate: string;
  deliveryDueDate: string;
  status: PurchaseOrderStatus;
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  items: PurchaseOrderItem[];
  subtotal: number;
  gstRate: number; // e.g. 18 for 18%
  gstAmount: number;
  totalAmount: number;
  deliveryLocation: string; // e.g. 'Underground Water Sump #3 (Basement 2)', 'DG Substation 1'
  specialInstructions?: string;
  linkedChallanId?: string;
  linkedInvoiceId?: string;
  acknowledgedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  poId: string;
  poNumber: string;
  passCode: string; // 6-digit inward code, e.g. 'INW-8291'
  qrCodeData: string;
  vehicleNumber: string; // e.g. 'KA-04-E-8821'
  vehicleType: string; // 'Water Tanker (12KL)', 'Diesel Bowser (1KL)', 'Flatbed Truck'
  driverName: string;
  driverPhone: string;
  materialsSummary: string;
  dispatchedAt: string;
  gateArrivedAt?: string;
  gateClearedAt?: string;
  meterStart?: string;
  meterEnd?: string;
  gateStatus: DeliveryChallanStatus;
  inspectedByGuard?: string;
  securityNotes?: string;
}

export interface SupplierCatalogItem {
  id: string;
  sku: string;
  name: string;
  category: SupplierCategory;
  unit: string;
  unitPrice: number;
  gstPercent: number;
  stockQuantity: number;
  moq: number; // Minimum Order Quantity
  leadTimeHours: number;
  isAvailable: boolean;
  specifications: string;
  imageUrl?: string;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'RAZORPAY';
  reference: string; // UTR or Cheque number
  notes?: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  poNumber: string;
  challanId?: string;
  issueDate: string;
  dueDate: string;
  societyName: string;
  societyGstin: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: SupplierInvoiceStatus;
  payments: InvoicePayment[];
}

export interface SupplierLedgerEntry {
  id: string;
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'ADVANCE';
  refNumber: string;
  description: string;
  debit: number; // Amount billed to society
  credit: number; // Amount paid by society
  runningBalance: number;
}

export interface SupplierRfq {
  id: string;
  rfqNumber: string;
  title: string;
  societyName: string;
  category: SupplierCategory;
  publishedDate: string;
  closingDate: string;
  estimatedValue: number;
  scopeDescription: string;
  contractDuration: string; // e.g. '12 Months Annual Rate Contract'
  quotationSubmitted: boolean;
  myQuotedAmount?: number;
  myQuoteDetails?: {
    ratePerUnit: number;
    paymentTerms: string;
    deliverySlaHours: number;
    validityDays: number;
    submittedAt: string;
    remarks: string;
  };
  bidStatus: 'OPEN_FOR_BID' | 'BID_SUBMITTED' | 'UNDER_REVIEW' | 'AWARDED' | 'SHORTLISTED' | 'REJECTED';
}

interface SupplierState {
  profile: SupplierProfile;
  purchaseOrders: PurchaseOrder[];
  deliveryChallans: DeliveryChallan[];
  catalog: SupplierCatalogItem[];
  invoices: SupplierInvoice[];
  ledgerEntries: SupplierLedgerEntry[];
  rfqs: SupplierRfq[];

  // Actions
  updateProfile: (partial: Partial<SupplierProfile>) => void;
  confirmPurchaseOrder: (poId: string) => void;
  dispatchPurchaseOrder: (
    poId: string,
    challanData: {
      vehicleNumber: string;
      vehicleType: string;
      driverName: string;
      driverPhone: string;
      meterStart?: string;
    }
  ) => DeliveryChallan;
  createDeliveryChallan: (challan: Omit<DeliveryChallan, 'id' | 'passCode' | 'qrCodeData'>) => DeliveryChallan;
  updateChallanGateStatus: (challanId: string, status: DeliveryChallanStatus, guardName?: string, notes?: string) => void;
  findInwardPass: (codeOrVehicle: string) => DeliveryChallan | undefined;
  markOrderDelivered: (poId: string) => void;
  generateInvoiceFromPO: (poId: string) => SupplierInvoice;
  recordInvoicePayment: (invoiceId: string, payment: Omit<InvoicePayment, 'id'>) => void;
  addCatalogItem: (item: Omit<SupplierCatalogItem, 'id' | 'sku'>) => SupplierCatalogItem;
  updateCatalogItem: (id: string, partial: Partial<SupplierCatalogItem>) => void;
  deleteCatalogItem: (id: string) => void;
  submitRfqBid: (
    rfqId: string,
    quote: {
      ratePerUnit: number;
      totalAmount: number;
      paymentTerms: string;
      deliverySlaHours: number;
      validityDays: number;
      remarks: string;
    }
  ) => void;
}

const INITIAL_PROFILE: SupplierProfile = {
  id: 'sup-aquapure-01',
  companyName: 'AquaPure Infrastructure & Bulk Supplies Pvt Ltd',
  tradeName: 'AquaPure Bulk Water & Liquids',
  gstin: '29AAACA1234A1Z5',
  pan: 'AAACA1234A',
  category: SupplierCategory.WATER_SUPPLY,
  contactPerson: 'Devendra Reddy',
  phone: '+91 98450 12345',
  email: 'supplies@aquapurewater.co.in',
  address: 'Plot 42, Industrial Development Area, Phase 2',
  city: 'Bengaluru',
  pincode: '560068',
  bankName: 'ICICI Bank Ltd',
  accountNumber: '000205019842',
  ifsc: 'ICIC0000002',
  upiId: 'aquapure.orders@icici',
  verifiedSocietyCode: 'ORC123',
};

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-0812',
    poNumber: 'PO-2026-0812',
    societyId: 'orchid-towers-01',
    societyName: 'Orchid Towers AMA',
    orderDate: '2026-09-18T08:30:00.000Z',
    deliveryDueDate: '2026-09-19T10:00:00.000Z',
    status: PurchaseOrderStatus.NEW_PO,
    urgency: 'CRITICAL',
    items: [
      {
        id: 'poi-1',
        name: '12,000L Potable Water Tanker (TDS < 150)',
        description: 'RO filtered fresh water tanker for underground primary domestic sump',
        quantity: 3,
        unit: 'Loads',
        unitPrice: 9500,
        total: 28500,
      },
    ],
    subtotal: 28500,
    gstRate: 5,
    gstAmount: 1425,
    totalAmount: 29925,
    deliveryLocation: 'Underground Water Sump #3 (Basement 2)',
    specialInstructions: 'Urgent municipal water supply cut today. Tankers must arrive before 10:00 AM.',
  },
  {
    id: 'po-0808',
    poNumber: 'PO-2026-0808',
    societyId: 'orchid-towers-01',
    societyName: 'Orchid Towers AMA',
    orderDate: '2026-09-15T11:00:00.000Z',
    deliveryDueDate: '2026-09-16T14:00:00.000Z',
    status: PurchaseOrderStatus.DELIVERED,
    urgency: 'NORMAL',
    items: [
      {
        id: 'poi-2',
        name: 'High Speed Diesel (HSD) - Commercial Bulk',
        description: 'Fuel refilling for 3x 500kVA Cummins DG Backup Generators',
        quantity: 500,
        unit: 'Litres',
        unitPrice: 89,
        total: 44500,
      },
    ],
    subtotal: 44500,
    gstRate: 0, // Diesel zero-rated under GST
    gstAmount: 0,
    totalAmount: 44500,
    deliveryLocation: 'DG Substation Room #1 (Main Substation)',
    specialInstructions: 'Ensure static grounding wire connected during diesel decanting.',
    linkedChallanId: 'dc-1039',
    linkedInvoiceId: 'inv-042',
    acknowledgedAt: '2026-09-15T11:30:00.000Z',
    dispatchedAt: '2026-09-16T09:00:00.000Z',
    deliveredAt: '2026-09-16T13:30:00.000Z',
  },
  {
    id: 'po-0795',
    poNumber: 'PO-2026-0795',
    societyId: 'orchid-towers-01',
    societyName: 'Orchid Towers AMA',
    orderDate: '2026-09-02T10:00:00.000Z',
    deliveryDueDate: '2026-09-04T16:00:00.000Z',
    status: PurchaseOrderStatus.INVOICED,
    urgency: 'NORMAL',
    items: [
      {
        id: 'poi-3',
        name: 'Calcium Hypochlorite Chlorine Powder (65%) 50kg Drum',
        description: 'Swimming pool disinfection & STP chemical dosing',
        quantity: 2,
        unit: 'Drums',
        unitPrice: 6500,
        total: 13000,
      },
      {
        id: 'poi-4',
        name: 'STP Coagulant PAC (Poly Aluminium Chloride) 30kg',
        description: 'Sewage treatment water clarification agent',
        quantity: 1,
        unit: 'Can',
        unitPrice: 3200,
        total: 3200,
      },
    ],
    subtotal: 16200,
    gstRate: 18,
    gstAmount: 2916,
    totalAmount: 19116,
    deliveryLocation: 'STP Chemical Dosing Room (Clubhouse Basement)',
    linkedChallanId: 'dc-1025',
    linkedInvoiceId: 'inv-041',
    acknowledgedAt: '2026-09-02T10:30:00.000Z',
    dispatchedAt: '2026-09-03T11:00:00.000Z',
    deliveredAt: '2026-09-04T14:15:00.000Z',
  },
];

const INITIAL_DELIVERY_CHALLANS: DeliveryChallan[] = [
  {
    id: 'dc-1044',
    challanNumber: 'DC-2026-1044',
    poId: 'po-0812',
    poNumber: 'PO-2026-0812',
    passCode: 'INW-8291',
    qrCodeData: JSON.stringify({
      type: 'SUPPLIER_INWARD',
      code: 'INW-8291',
      vehicle: 'KA-04-E-8821',
      supplier: 'AquaPure Bulk Water',
      po: 'PO-2026-0812',
    }),
    vehicleNumber: 'KA-04-E-8821',
    vehicleType: 'Water Tanker (12,000 Litres)',
    driverName: 'Suresh Yadav',
    driverPhone: '+91 98860 77123',
    materialsSummary: '12,000L Potable Water Load #1',
    dispatchedAt: '2026-09-19T06:30:00.000Z',
    gateStatus: DeliveryChallanStatus.DISPATCHED,
  },
  {
    id: 'dc-1039',
    challanNumber: 'DC-2026-1039',
    poId: 'po-0808',
    poNumber: 'PO-2026-0808',
    passCode: 'INW-7105',
    qrCodeData: JSON.stringify({
      type: 'SUPPLIER_INWARD',
      code: 'INW-7105',
      vehicle: 'KA-51-B-9910',
      supplier: 'AquaPure Diesel',
      po: 'PO-2026-0808',
    }),
    vehicleNumber: 'KA-51-B-9910',
    vehicleType: 'Diesel Bowser (1,000 Litres)',
    driverName: 'Ramesh Patil',
    driverPhone: '+91 98860 55432',
    materialsSummary: '500 Litres High Speed Diesel for DG Sets',
    dispatchedAt: '2026-09-16T09:00:00.000Z',
    gateArrivedAt: '2026-09-16T11:45:00.000Z',
    gateClearedAt: '2026-09-16T13:40:00.000Z',
    meterStart: '45,820 L',
    meterEnd: '46,320 L (500L net)',
    gateStatus: DeliveryChallanStatus.OFFLOADED,
    inspectedByGuard: 'Bahadur Singh (Main Gate)',
    securityNotes: 'Dip test verified. Zero leakage, safety grounding connected.',
  },
];

const INITIAL_CATALOG: SupplierCatalogItem[] = [
  {
    id: 'cat-1',
    sku: 'WT-12K-RO',
    name: '12,000L Potable Water Tanker (TDS < 150)',
    category: SupplierCategory.WATER_SUPPLY,
    unit: 'Loads',
    unitPrice: 9500,
    gstPercent: 5,
    stockQuantity: 45,
    moq: 1,
    leadTimeHours: 2,
    isAvailable: true,
    specifications: 'Reverse Osmosis treated water certified for residential drinking sumps. Lab report provided on demand.',
  },
  {
    id: 'cat-2',
    sku: 'WT-06K-RO',
    name: '6,000L Potable Water Tanker (TDS < 150)',
    category: SupplierCategory.WATER_SUPPLY,
    unit: 'Loads',
    unitPrice: 5200,
    gstPercent: 5,
    stockQuantity: 30,
    moq: 1,
    leadTimeHours: 2,
    isAvailable: true,
    specifications: 'Compact 6KL tanker suitable for societies with narrow internal driveways and low height clearances.',
  },
  {
    id: 'cat-3',
    sku: 'DSL-HSD-BULK',
    name: 'High Speed Diesel (HSD) - Commercial Bulk',
    category: SupplierCategory.DIESEL_FUEL,
    unit: 'Litres',
    unitPrice: 89,
    gstPercent: 0,
    stockQuantity: 12000,
    moq: 200,
    leadTimeHours: 4,
    isAvailable: true,
    specifications: 'PESO approved mobile bowser delivery directly to DG set day tanks. Calibrated digital flow meter.',
  },
  {
    id: 'cat-4',
    sku: 'CHM-CL-50KG',
    name: 'Calcium Hypochlorite Chlorine (65%) 50kg Drum',
    category: SupplierCategory.CHEMICALS_TREATMENT,
    unit: 'Drums',
    unitPrice: 6500,
    gstPercent: 18,
    stockQuantity: 80,
    moq: 1,
    leadTimeHours: 12,
    isAvailable: true,
    specifications: 'High-grade granular chlorine for swimming pool sanitization and STP effluent disinfection.',
  },
  {
    id: 'cat-5',
    sku: 'CHM-PAC-30KG',
    name: 'STP Coagulant PAC (Poly Aluminium Chloride) 30kg',
    category: SupplierCategory.CHEMICALS_TREATMENT,
    unit: 'Cans',
    unitPrice: 3200,
    gstPercent: 18,
    stockQuantity: 65,
    moq: 2,
    leadTimeHours: 24,
    isAvailable: true,
    specifications: 'Liquid coagulant for suspended solids settlement in sewage treatment plant secondary clarifiers.',
  },
  {
    id: 'cat-6',
    sku: 'ELC-LED-150W',
    name: 'Industrial LED Floodlight 150W IP66',
    category: SupplierCategory.ELECTRICAL_HARDWARE,
    unit: 'Units',
    unitPrice: 2800,
    gstPercent: 18,
    stockQuantity: 50,
    moq: 4,
    leadTimeHours: 24,
    isAvailable: true,
    specifications: 'Surge protected 4kV, 50,000 burning hours warranty for perimeter boundary and sports arena.',
  },
  {
    id: 'cat-7',
    sku: 'PLM-PUMP-5HP',
    name: 'Submersible Sump Dewatering Pump 5HP CPVC',
    category: SupplierCategory.PLUMBING_HARDWARE,
    unit: 'Units',
    unitPrice: 32000,
    gstPercent: 18,
    stockQuantity: 12,
    moq: 1,
    leadTimeHours: 24,
    isAvailable: true,
    specifications: 'Heavy duty vortex impeller pump for basement stormwater pits and STP equalization tanks.',
  },
  {
    id: 'cat-8',
    sku: 'HSK-BAG-100',
    name: 'Extra Large Garbage Bin Liners 45x55 (100 pack)',
    category: SupplierCategory.HOUSEKEEPING_BULK,
    unit: 'Packs',
    unitPrice: 850,
    gstPercent: 18,
    stockQuantity: 150,
    moq: 5,
    leadTimeHours: 12,
    isAvailable: true,
    specifications: 'Virgin heavy gauge 60 microns biodegradable black liners for society tower garbage chutes.',
  },
];

const INITIAL_INVOICES: SupplierInvoice[] = [
  {
    id: 'inv-041',
    invoiceNumber: 'INV-B2B-2026-041',
    poId: 'po-0795',
    poNumber: 'PO-2026-0795',
    challanId: 'dc-1025',
    issueDate: '2026-09-04T15:00:00.000Z',
    dueDate: '2026-09-19T23:59:59.000Z',
    societyName: 'Orchid Towers AMA',
    societyGstin: '29AAABO9988C1Z3',
    subtotal: 16200,
    cgst: 1458,
    sgst: 1458,
    totalAmount: 19116,
    paidAmount: 19116,
    balanceAmount: 0,
    status: SupplierInvoiceStatus.PAID,
    payments: [
      {
        id: 'pay-01',
        date: '2026-09-10T11:20:00.000Z',
        amount: 19116,
        method: 'NEFT',
        reference: 'NEFT-HDFC88992144',
        notes: 'Full settlement via Net Banking by Treasurer',
      },
    ],
  },
  {
    id: 'inv-042',
    invoiceNumber: 'INV-B2B-2026-042',
    poId: 'po-0808',
    poNumber: 'PO-2026-0808',
    challanId: 'dc-1039',
    issueDate: '2026-09-16T16:00:00.000Z',
    dueDate: '2026-09-30T23:59:59.000Z',
    societyName: 'Orchid Towers AMA',
    societyGstin: '29AAABO9988C1Z3',
    subtotal: 44500,
    cgst: 0,
    sgst: 0,
    totalAmount: 44500,
    paidAmount: 0,
    balanceAmount: 44500,
    status: SupplierInvoiceStatus.ISSUED,
    payments: [],
  },
];

const INITIAL_LEDGER: SupplierLedgerEntry[] = [
  {
    id: 'led-1',
    date: '2026-09-04T15:00:00.000Z',
    type: 'INVOICE',
    refNumber: 'INV-B2B-2026-041',
    description: 'B2B GST Tax Invoice for Pool & STP Chemicals',
    debit: 19116,
    credit: 0,
    runningBalance: 19116,
  },
  {
    id: 'led-2',
    date: '2026-09-10T11:20:00.000Z',
    type: 'PAYMENT',
    refNumber: 'NEFT-HDFC88992144',
    description: 'Society Payment received via NEFT settlement',
    debit: 0,
    credit: 19116,
    runningBalance: 0,
  },
  {
    id: 'led-3',
    date: '2026-09-16T16:00:00.000Z',
    type: 'INVOICE',
    refNumber: 'INV-B2B-2026-042',
    description: 'B2B Invoice for 500L DG High Speed Diesel refilling',
    debit: 44500,
    credit: 0,
    runningBalance: 44500,
  },
];

const INITIAL_RFQS: SupplierRfq[] = [
  {
    id: 'rfq-03',
    rfqNumber: 'RFQ-2026-03',
    title: 'Annual High-Speed Diesel Supply Contract for 3x 500kVA DG Sets',
    societyName: 'Orchid Towers AMA',
    category: SupplierCategory.DIESEL_FUEL,
    publishedDate: '2026-09-10T09:00:00.000Z',
    closingDate: '2026-09-25T18:00:00.000Z',
    estimatedValue: 520000,
    scopeDescription: 'Supplying approximately 6,000 Litres of commercial grade HSD over 12 months with 3-hour emergency delivery SLA.',
    contractDuration: '12 Months Annual Rate Contract (ARC)',
    quotationSubmitted: false,
    bidStatus: 'OPEN_FOR_BID',
  },
  {
    id: 'rfq-02',
    rfqNumber: 'RFQ-2026-02',
    title: 'Annual Supply Contract for STP, WTP & Swimming Pool Treatment Chemicals',
    societyName: 'Orchid Towers AMA',
    category: SupplierCategory.CHEMICALS_TREATMENT,
    publishedDate: '2026-08-25T10:00:00.000Z',
    closingDate: '2026-09-08T17:00:00.000Z',
    estimatedValue: 180000,
    scopeDescription: 'Monthly delivery of Chlorine 65%, PAC 30%, Algaecide and Sodium Hypochlorite 10% drums with batch test certificates.',
    contractDuration: '12 Months ARC',
    quotationSubmitted: true,
    myQuotedAmount: 168000,
    myQuoteDetails: {
      ratePerUnit: 14000,
      paymentTerms: 'Net 30 Days from invoice submission',
      deliverySlaHours: 12,
      validityDays: 60,
      submittedAt: '2026-09-05T14:30:00.000Z',
      remarks: 'Bulk pricing discount applied. Dedicated delivery vehicle allocated.',
    },
    bidStatus: 'SHORTLISTED',
  },
];

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      profile: INITIAL_PROFILE,
      purchaseOrders: INITIAL_PURCHASE_ORDERS,
      deliveryChallans: INITIAL_DELIVERY_CHALLANS,
      catalog: INITIAL_CATALOG,
      invoices: INITIAL_INVOICES,
      ledgerEntries: INITIAL_LEDGER,
      rfqs: INITIAL_RFQS,

      updateProfile: (partial) => {
        set((state) => ({
          profile: { ...state.profile, ...partial },
        }));
      },

      confirmPurchaseOrder: (poId) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  status: PurchaseOrderStatus.CONFIRMED,
                  acknowledgedAt: new Date().toISOString(),
                }
              : po
          ),
        }));
      },

      dispatchPurchaseOrder: (poId, challanData) => {
        const po = get().purchaseOrders.find((p) => p.id === poId);
        const passCode = `INW-${Math.floor(1000 + Math.random() * 9000)}`;
        const challanId = `dc-${Date.now().toString().slice(-4)}`;
        const challanNumber = `DC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const newChallan: DeliveryChallan = {
          id: challanId,
          challanNumber,
          poId,
          poNumber: po?.poNumber || 'PO-2026-XXXX',
          passCode,
          qrCodeData: JSON.stringify({
            type: 'SUPPLIER_INWARD',
            code: passCode,
            vehicle: challanData.vehicleNumber,
            supplier: get().profile.tradeName,
            po: po?.poNumber,
          }),
          vehicleNumber: challanData.vehicleNumber,
          vehicleType: challanData.vehicleType,
          driverName: challanData.driverName,
          driverPhone: challanData.driverPhone,
          meterStart: challanData.meterStart,
          materialsSummary: po?.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ') || 'Bulk Supplies',
          dispatchedAt: new Date().toISOString(),
          gateStatus: DeliveryChallanStatus.DISPATCHED,
        };

        set((state) => ({
          deliveryChallans: [newChallan, ...state.deliveryChallans],
          purchaseOrders: state.purchaseOrders.map((p) =>
            p.id === poId
              ? {
                  ...p,
                  status: PurchaseOrderStatus.DISPATCHED,
                  dispatchedAt: new Date().toISOString(),
                  linkedChallanId: challanId,
                }
              : p
          ),
        }));

        return newChallan;
      },

      createDeliveryChallan: (challanInput) => {
        const passCode = `INW-${Math.floor(1000 + Math.random() * 9000)}`;
        const challanId = `dc-${Date.now().toString().slice(-4)}`;
        const newChallan: DeliveryChallan = {
          ...challanInput,
          id: challanId,
          passCode,
          qrCodeData: JSON.stringify({
            type: 'SUPPLIER_INWARD',
            code: passCode,
            vehicle: challanInput.vehicleNumber,
            supplier: get().profile.tradeName,
            po: challanInput.poNumber,
          }),
        };

        set((state) => ({
          deliveryChallans: [newChallan, ...state.deliveryChallans],
        }));

        return newChallan;
      },

      updateChallanGateStatus: (challanId, status, guardName, notes) => {
        set((state) => ({
          deliveryChallans: state.deliveryChallans.map((dc) => {
            if (dc.id === challanId || dc.passCode === challanId) {
              const now = new Date().toISOString();
              return {
                ...dc,
                gateStatus: status,
                inspectedByGuard: guardName || dc.inspectedByGuard,
                securityNotes: notes || dc.securityNotes,
                gateArrivedAt: status === DeliveryChallanStatus.AT_GATE ? now : dc.gateArrivedAt,
                gateClearedAt:
                  status === DeliveryChallanStatus.OFFLOADED || status === DeliveryChallanStatus.GATE_EXIT
                    ? now
                    : dc.gateClearedAt,
              };
            }
            return dc;
          }),
        }));
      },

      findInwardPass: (codeOrVehicle) => {
        const query = codeOrVehicle.trim().toUpperCase();
        return get().deliveryChallans.find(
          (dc) =>
            dc.passCode.toUpperCase() === query ||
            dc.vehicleNumber.replace(/\s|-/g, '').toUpperCase() === query.replace(/\s|-/g, '') ||
            dc.challanNumber.toUpperCase() === query
        );
      },

      markOrderDelivered: (poId) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  status: PurchaseOrderStatus.DELIVERED,
                  deliveredAt: new Date().toISOString(),
                }
              : po
          ),
        }));
      },

      generateInvoiceFromPO: (poId) => {
        const po = get().purchaseOrders.find((p) => p.id === poId);
        if (!po) throw new Error(`PO not found: ${poId}`);

        const invoiceId = `inv-${Date.now().toString().slice(-4)}`;
        const invoiceNumber = `INV-B2B-2026-${Math.floor(100 + Math.random() * 900)}`;
        const cgst = Math.round((po.gstAmount / 2) * 100) / 100;
        const sgst = Math.round((po.gstAmount / 2) * 100) / 100;

        const newInvoice: SupplierInvoice = {
          id: invoiceId,
          invoiceNumber,
          poId,
          poNumber: po.poNumber,
          challanId: po.linkedChallanId,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          societyName: po.societyName,
          societyGstin: '29AAABO9988C1Z3',
          subtotal: po.subtotal,
          cgst,
          sgst,
          totalAmount: po.totalAmount,
          paidAmount: 0,
          balanceAmount: po.totalAmount,
          status: SupplierInvoiceStatus.ISSUED,
          payments: [],
        };

        const currentLedger = get().ledgerEntries;
        const lastBalance = currentLedger.length > 0 ? currentLedger[currentLedger.length - 1].runningBalance : 0;
        const newLedgerEntry: SupplierLedgerEntry = {
          id: `led-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString(),
          type: 'INVOICE',
          refNumber: invoiceNumber,
          description: `B2B GST Invoice against ${po.poNumber} (${po.items[0]?.name})`,
          debit: po.totalAmount,
          credit: 0,
          runningBalance: lastBalance + po.totalAmount,
        };

        set((state) => ({
          invoices: [newInvoice, ...state.invoices],
          ledgerEntries: [...state.ledgerEntries, newLedgerEntry],
          purchaseOrders: state.purchaseOrders.map((p) =>
            p.id === poId
              ? {
                  ...p,
                  status: PurchaseOrderStatus.INVOICED,
                  linkedInvoiceId: invoiceId,
                }
              : p
          ),
        }));

        return newInvoice;
      },

      recordInvoicePayment: (invoiceId, paymentData) => {
        const payment: InvoicePayment = {
          ...paymentData,
          id: `pay-${Date.now().toString().slice(-4)}`,
        };

        const invoice = get().invoices.find((i) => i.id === invoiceId);
        if (!invoice) return;

        const updatedPaid = invoice.paidAmount + payment.amount;
        const updatedBalance = Math.max(0, invoice.totalAmount - updatedPaid);
        const newStatus =
          updatedBalance === 0
            ? SupplierInvoiceStatus.PAID
            : SupplierInvoiceStatus.PARTIALLY_PAID;

        const currentLedger = get().ledgerEntries;
        const lastBalance = currentLedger.length > 0 ? currentLedger[currentLedger.length - 1].runningBalance : 0;
        const newLedgerEntry: SupplierLedgerEntry = {
          id: `led-${Date.now().toString().slice(-4)}`,
          date: payment.date || new Date().toISOString(),
          type: 'PAYMENT',
          refNumber: payment.reference,
          description: `Payment received for ${invoice.invoiceNumber} via ${payment.method}`,
          debit: 0,
          credit: payment.amount,
          runningBalance: Math.max(0, lastBalance - payment.amount),
        };

        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === invoiceId
              ? {
                  ...inv,
                  paidAmount: updatedPaid,
                  balanceAmount: updatedBalance,
                  status: newStatus,
                  payments: [...inv.payments, payment],
                }
              : inv
          ),
          ledgerEntries: [...state.ledgerEntries, newLedgerEntry],
        }));
      },

      addCatalogItem: (itemData) => {
        const sku = `${itemData.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const newItem: SupplierCatalogItem = {
          ...itemData,
          id: `cat-${Date.now().toString().slice(-4)}`,
          sku,
        };

        set((state) => ({
          catalog: [newItem, ...state.catalog],
        }));

        return newItem;
      },

      updateCatalogItem: (id, partial) => {
        set((state) => ({
          catalog: state.catalog.map((item) => (item.id === id ? { ...item, ...partial } : item)),
        }));
      },

      deleteCatalogItem: (id) => {
        set((state) => ({
          catalog: state.catalog.filter((item) => item.id !== id),
        }));
      },

      submitRfqBid: (rfqId, quote) => {
        set((state) => ({
          rfqs: state.rfqs.map((rfq) =>
            rfq.id === rfqId
              ? {
                  ...rfq,
                  quotationSubmitted: true,
                  myQuotedAmount: quote.totalAmount,
                  myQuoteDetails: {
                    ratePerUnit: quote.ratePerUnit,
                    paymentTerms: quote.paymentTerms,
                    deliverySlaHours: quote.deliverySlaHours,
                    validityDays: quote.validityDays,
                    submittedAt: new Date().toISOString(),
                    remarks: quote.remarks,
                  },
                  bidStatus: 'BID_SUBMITTED',
                }
              : rfq
          ),
        }));
      },
    }),
    {
      name: 'ama-supplier-portal-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
