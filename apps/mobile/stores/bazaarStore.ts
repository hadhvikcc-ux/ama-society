import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductType = 'STOCK' | 'NON_STOCK';

export type StockMovementType =
  | 'PURCHASE_RECEIPT'
  | 'POS_SALE'
  | 'DAMAGE_SPOILAGE'
  | 'AUDIT_CORRECTION'
  | 'CUSTOMER_RETURN'
  | 'MANUAL_ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantityChange: number; // e.g. +25, -2
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
  referenceId?: string; // e.g. PO-2026-039 or BZR-ORD-1041
  performedBy?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  phone: string;
  contactPerson: string;
  leadTimeDays: number;
  rating: number;
  address?: string;
  active: boolean;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  unit: string;
  quantityOrdered: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  items: PurchaseOrderItem[];
  totalEstimatedCost: number;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  createdAt: string;
  expectedDeliveryDate: string;
  notes?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string; // 'pcs' | 'kg' | 'gm' | 'litre' | 'packet' | 'service'
  type: ProductType; // STOCK (tracked) vs NON_STOCK (loose / weighed / on-demand / service)
  stockQuantity: number; // 0 for NON_STOCK or unlimited
  reorderLevel: number; // alert threshold (e.g. 5)
  costPrice?: number;
  barcode?: string;
  emoji: string;
  active: boolean;
  notes?: string;
  // Advanced Inventory Attributes
  batchNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  manufacturingDate?: string;
  supplierId?: string;
  supplierName?: string;
  storageLocation?: string; // e.g. "Chiller 1 • Milk Rack", "Aisle 2 • Shelf B"
  minOrderQty?: number;
  velocityClass?: 'FAST' | 'MEDIUM' | 'SLOW'; // ABC Analysis
}

export interface CartItem {
  productId: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  type: ProductType;
  emoji: string;
  customNote?: string;
}

export interface BazaarOrderItem {
  productId: string;
  productName: string;
  name?: string;
  price: number;
  quantity: number;
  unit: string;
  total: number;
  emoji: string;
  type: ProductType;
}

export type OrderPaymentMethod = 'UPI' | 'CASH' | 'CARD' | 'KHATA_FLAT';
export type OrderFulfillment = 'DELIVERY' | 'PICKUP';
export type OrderStatus = 'PENDING' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface BazaarOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerFlat: string;
  customerPhone?: string;
  items: BazaarOrderItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: 'PAID' | 'OUTSTANDING' | 'PARTIALLY_PAID';
  fulfillmentType: OrderFulfillment;
  status: OrderStatus;
  deliveryAddress?: string;
  notes?: string;
}

export interface KhataEntry {
  id: string;
  date: string;
  type: 'PURCHASE' | 'PAYMENT';
  amount: number;
  description: string;
  orderId?: string;
}

export interface KhataAccount {
  flatNumber: string;
  residentName: string;
  residentPhone: string;
  totalOutstanding: number;
  lastUpdated: string;
  entries: KhataEntry[];
}

interface BazaarState {
  products: ProductItem[];
  cart: CartItem[];
  orders: BazaarOrder[];
  khataAccounts: Record<string, KhataAccount>; // key: flatNumber
  activePromoCode: string | null;
  discountAmount: number;

  // Inventory Management State
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];

  // Cart actions
  addToCart: (product: ProductItem, quantity?: number) => void;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyPromo: (code: string) => { success: boolean; message: string; discount: number };
  removePromo: () => void;

  // Checkout actions
  checkout: (orderData: {
    customerName: string;
    customerFlat: string;
    customerPhone?: string;
    fulfillmentType: OrderFulfillment;
    deliveryAddress?: string;
    paymentMethod: OrderPaymentMethod;
    notes?: string;
  }) => BazaarOrder;

  // POS Direct Checkout
  posCheckout: (saleData: {
    customerName: string;
    customerFlat: string;
    items: CartItem[];
    discountAmount: number;
    paymentMethod: OrderPaymentMethod;
    amountPaid?: number;
    notes?: string;
  }) => BazaarOrder;

  // Order Management
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderDetails: (
    orderId: string,
    updates: {
      customerName?: string;
      customerFlat?: string;
      customerPhone?: string;
      deliveryAddress?: string;
      notes?: string;
      status?: OrderStatus;
      paymentStatus?: 'PAID' | 'OUTSTANDING' | 'PARTIALLY_PAID';
    }
  ) => void;
  cancelOrder: (orderId: string) => void;

  // Inventory Management Actions
  addProduct: (product: Omit<ProductItem, 'id'>) => ProductItem;
  updateProduct: (id: string, updates: Partial<ProductItem>) => void;
  adjustStock: (id: string, quantityChange: number, reason?: string, referenceId?: string, performedBy?: string) => void;
  reconcileStockCount: (productId: string, physicalCount: number, reason?: string, performedBy?: string) => void;
  writeOffStock: (productId: string, quantity: number, reason: 'EXPIRED' | 'DAMAGED' | 'THEFT' | 'OTHER', notes?: string, performedBy?: string) => void;
  createPurchaseOrder: (poData: {
    supplierId: string;
    supplierName: string;
    supplierPhone: string;
    items: PurchaseOrderItem[];
    expectedDeliveryDate: string;
    notes?: string;
  }) => PurchaseOrder;
  updatePurchaseOrderStatus: (poId: string, status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED') => void;
  receivePurchaseOrder: (poId: string, receivedBy?: string) => void;
  addSupplier: (supplierData: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  toggleProductActive: (id: string) => void;
  deleteProduct: (id: string) => void;
  bulkImportStock: (rows: Array<{
    barcode?: string;
    name: string;
    category?: string;
    price: number;
    costPrice?: number;
    unit?: string;
    type?: ProductType;
    stockQuantity: number;
    reorderLevel?: number;
    batchNumber?: string;
    expiryDate?: string;
    storageLocation?: string;
    supplierName?: string;
  }>, reason?: string) => { added: number; updated: number };

  // Khata Actions
  recordKhataPurchase: (flatNumber: string, residentName: string, residentPhone: string, amount: number, orderId: string) => void;
  settleKhataPayment: (flatNumber: string, amount: number, note?: string) => void;
}

// Initial Seed Suppliers
const initialSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Metro Cash & Carry Wholesale',
    category: 'FMCG & Groceries',
    phone: '+91 98450 11223',
    contactPerson: 'Ramesh Gowda',
    leadTimeDays: 1,
    rating: 4.8,
    address: 'Yeshwanthpur Wholesale Hub, Bengaluru',
    active: true,
  },
  {
    id: 'sup-2',
    name: 'Amul Bangalore Milk Union (BAMUL)',
    category: 'Dairy & Cold Chain',
    phone: '+91 99801 44556',
    contactPerson: 'Suresh Patil',
    leadTimeDays: 1,
    rating: 4.9,
    address: 'Dairy Circle, Bannerghatta Road, Bengaluru',
    active: true,
  },
  {
    id: 'sup-3',
    name: 'Karnataka Farm Fresh Mandi',
    category: 'Fresh Produce & Fruits',
    phone: '+91 94482 77889',
    contactPerson: 'Muniraju K',
    leadTimeDays: 1,
    rating: 4.7,
    address: 'APMC Yard, Singena Agrahara, Bengaluru',
    active: true,
  },
  {
    id: 'sup-4',
    name: 'Modern Food & Bakery Depot',
    category: 'Bakery & Confectionery',
    phone: '+91 97311 33221',
    contactPerson: 'David Fernandes',
    leadTimeDays: 2,
    rating: 4.6,
    address: 'Peenya Industrial Estate Phase 2, Bengaluru',
    active: true,
  },
];

// Initial Seed Purchase Orders
const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-2026-039',
    poNumber: 'PO-2026-039',
    supplierId: 'sup-2',
    supplierName: 'Amul Bangalore Milk Union (BAMUL)',
    supplierPhone: '+91 99801 44556',
    items: [
      {
        productId: 'prod-1',
        productName: 'Amul Taaza Toned Milk 1L',
        unit: 'litre',
        quantityOrdered: 40,
        unitCost: 62,
        totalCost: 2480,
      },
    ],
    totalEstimatedCost: 2480,
    status: 'RECEIVED',
    createdAt: 'Yesterday, 04:00 PM',
    expectedDeliveryDate: 'Today, 06:30 AM',
    notes: 'Morning daily dairy delivery - verified at gate',
  },
  {
    id: 'PO-2026-040',
    poNumber: 'PO-2026-040',
    supplierId: 'sup-1',
    supplierName: 'Metro Cash & Carry Wholesale',
    supplierPhone: '+91 98450 11223',
    items: [
      {
        productId: 'prod-5',
        productName: 'Fortune Sunlite Sunflower Oil 1L',
        unit: 'litre',
        quantityOrdered: 20,
        unitCost: 130,
        totalCost: 2600,
      },
      {
        productId: 'prod-7',
        productName: 'Surf Excel Quick Wash Detergent 1kg',
        unit: 'packet',
        quantityOrdered: 15,
        unitCost: 122,
        totalCost: 1830,
      },
    ],
    totalEstimatedCost: 4430,
    status: 'SENT',
    createdAt: 'Today, 08:30 AM',
    expectedDeliveryDate: 'Tomorrow, 11:00 AM',
    notes: 'Urgent restocking for depleted pantry & cleaning goods',
  },
];

// Initial Seed Stock Movements
const initialStockMovements: StockMovement[] = [
  {
    id: 'stk-mov-101',
    productId: 'prod-1',
    productName: 'Amul Taaza Toned Milk 1L',
    type: 'PURCHASE_RECEIPT',
    quantityChange: 40,
    previousStock: 0,
    newStock: 40,
    reason: 'GRN Received for PO-2026-039',
    timestamp: 'Today, 06:30 AM',
    referenceId: 'PO-2026-039',
    performedBy: 'Suresh (Gate Receiver)',
  },
  {
    id: 'stk-mov-102',
    productId: 'prod-1',
    productName: 'Amul Taaza Toned Milk 1L',
    type: 'POS_SALE',
    quantityChange: -12,
    previousStock: 40,
    newStock: 28,
    reason: 'Morning Resident POS Sales Batch',
    timestamp: 'Today, 09:15 AM',
    referenceId: 'POS-BATCH-01',
    performedBy: 'Mart Cashier Desk',
  },
  {
    id: 'stk-mov-103',
    productId: 'prod-5',
    productName: 'Fortune Sunlite Sunflower Oil 1L',
    type: 'DAMAGE_SPOILAGE',
    quantityChange: -1,
    previousStock: 3,
    newStock: 2,
    reason: 'Write-off: Pouch puncture during shelf placement',
    timestamp: 'Yesterday, 05:00 PM',
    performedBy: 'Mart Staff (Anand)',
  },
  {
    id: 'stk-mov-104',
    productId: 'prod-3',
    productName: 'Aashirvaad Shudh Chakki Atta 5kg',
    type: 'AUDIT_CORRECTION',
    quantityChange: -2,
    previousStock: 14,
    newStock: 12,
    reason: 'Weekly Physical Count Reconciliation (Shrinkage: -2)',
    timestamp: 'Yesterday, 08:00 PM',
    performedBy: 'Internal Audit Lead',
  },
];

// Initial Seed Products (Stock + Non-Stock) with Advanced Inventory Attributes
const initialProducts: ProductItem[] = [
  // Stock Items (Physical tracked inventory)
  {
    id: 'prod-1',
    name: 'Amul Taaza Toned Milk 1L',
    category: 'Dairy',
    price: 68,
    unit: 'litre',
    type: 'STOCK',
    stockQuantity: 28,
    reorderLevel: 8,
    costPrice: 62,
    barcode: '890123456789',
    emoji: '🥛',
    active: true,
    notes: 'Pasteurized homogenized toned milk pouch',
    batchNumber: 'BAMUL-2026-09A',
    expiryDate: '2026-09-18', // Expiring in 2 days!
    manufacturingDate: '2026-09-15',
    supplierId: 'sup-2',
    supplierName: 'Amul BAMUL',
    storageLocation: 'Chiller 1 • Milk Tray',
    minOrderQty: 30,
    velocityClass: 'FAST',
  },
  {
    id: 'prod-2',
    name: 'Farm Fresh White Eggs (12 pcs)',
    category: 'Dairy',
    price: 95,
    unit: 'packet',
    type: 'STOCK',
    stockQuantity: 15,
    reorderLevel: 6,
    costPrice: 82,
    barcode: '890123456790',
    emoji: '🥚',
    active: true,
    notes: 'High protein sanitized table eggs',
    batchNumber: 'POUL-2026-09B',
    expiryDate: '2026-09-25',
    manufacturingDate: '2026-09-14',
    supplierId: 'sup-3',
    supplierName: 'Karnataka Mandi',
    storageLocation: 'Rack A • Shelf 1',
    minOrderQty: 10,
    velocityClass: 'FAST',
  },
  {
    id: 'prod-3',
    name: 'Aashirvaad Shudh Chakki Atta 5kg',
    category: 'Pantry',
    price: 250,
    unit: 'packet',
    type: 'STOCK',
    stockQuantity: 12,
    reorderLevel: 5,
    costPrice: 225,
    barcode: '890987654321',
    emoji: '🌾',
    active: true,
    notes: '100% whole wheat flour with 0% maida',
    batchNumber: 'ITC-2026-08',
    expiryDate: '2027-02-15',
    manufacturingDate: '2026-08-01',
    supplierId: 'sup-1',
    supplierName: 'Metro Wholesale',
    storageLocation: 'Aisle 2 • Bottom Pallet',
    minOrderQty: 10,
    velocityClass: 'MEDIUM',
  },
  {
    id: 'prod-4',
    name: 'Modern White Sandwich Bread 400g',
    category: 'Bakery',
    price: 45,
    unit: 'packet',
    type: 'STOCK',
    stockQuantity: 18,
    reorderLevel: 5,
    costPrice: 38,
    barcode: '890112233445',
    emoji: '🍞',
    active: true,
    notes: 'Daily fresh soft sliced bread',
    batchNumber: 'MOD-2026-09C',
    expiryDate: '2026-09-20', // Near expiry
    manufacturingDate: '2026-09-15',
    supplierId: 'sup-4',
    supplierName: 'Modern Bakery',
    storageLocation: 'Counter Rack • Shelf 2',
    minOrderQty: 15,
    velocityClass: 'FAST',
  },
  {
    id: 'prod-5',
    name: 'Fortune Sunlite Sunflower Oil 1L',
    category: 'Pantry',
    price: 145,
    unit: 'litre',
    type: 'STOCK',
    stockQuantity: 2, // LOW STOCK ALERT
    reorderLevel: 6,
    costPrice: 130,
    barcode: '890556677889',
    emoji: '🌻',
    active: true,
    notes: 'Refined sunflower cooking oil pouch',
    batchNumber: 'AWL-2026-07',
    expiryDate: '2027-04-10',
    manufacturingDate: '2026-07-10',
    supplierId: 'sup-1',
    supplierName: 'Metro Wholesale',
    storageLocation: 'Aisle 1 • Shelf 3',
    minOrderQty: 20,
    velocityClass: 'MEDIUM',
  },
  {
    id: 'prod-6',
    name: 'Maggi 2-Minute Masala Noodles 70g',
    category: 'Snacks',
    price: 14,
    unit: 'pcs',
    type: 'STOCK',
    stockQuantity: 65,
    reorderLevel: 15,
    costPrice: 12,
    barcode: '890778899001',
    emoji: '🍜',
    active: true,
    notes: 'Instant noodles with authentic tastemaker',
    batchNumber: 'NST-2026-08',
    expiryDate: '2027-05-30',
    manufacturingDate: '2026-08-12',
    supplierId: 'sup-1',
    supplierName: 'Metro Wholesale',
    storageLocation: 'Aisle 3 • Shelf 1',
    minOrderQty: 48,
    velocityClass: 'FAST',
  },
  {
    id: 'prod-7',
    name: 'Surf Excel Quick Wash Detergent 1kg',
    category: 'Household',
    price: 140,
    unit: 'packet',
    type: 'STOCK',
    stockQuantity: 0, // OUT OF STOCK
    reorderLevel: 4,
    costPrice: 122,
    barcode: '890334455667',
    emoji: '🧼',
    active: true,
    notes: 'Washing powder for top load & handwash',
    batchNumber: 'HUL-2026-06',
    expiryDate: '2028-01-01',
    manufacturingDate: '2026-06-01',
    supplierId: 'sup-1',
    supplierName: 'Metro Wholesale',
    storageLocation: 'Aisle 4 • Shelf 2',
    minOrderQty: 15,
    velocityClass: 'SLOW',
  },
  {
    id: 'prod-8',
    name: 'Coca-Cola Original Taste 1.5L',
    category: 'Beverages',
    price: 90,
    unit: 'bottle',
    type: 'STOCK',
    stockQuantity: 8,
    reorderLevel: 4,
    costPrice: 78,
    barcode: '890223344556',
    emoji: '🥤',
    active: true,
    notes: 'Sparkling soft drink chilled PET bottle',
    batchNumber: 'CCB-2026-08',
    expiryDate: '2027-02-28',
    manufacturingDate: '2026-08-20',
    supplierId: 'sup-1',
    supplierName: 'Metro Wholesale',
    storageLocation: 'Chiller 2 • Bottle Rack',
    minOrderQty: 12,
    velocityClass: 'MEDIUM',
  },

  // Non-Stock Items (Loose produce weighed per kg, on-demand foods, and services)
  {
    id: 'prod-9',
    name: 'Fresh Farm Tomato (Loose)',
    category: 'Vegetables',
    price: 40,
    unit: 'kg',
    type: 'NON_STOCK',
    stockQuantity: 0,
    reorderLevel: 0,
    costPrice: 32,
    barcode: 'NONSTOCK-TOMATO',
    emoji: '🍅',
    active: true,
    notes: 'Ripe country tomatoes weighed at mart counter scale',
    storageLocation: 'Fresh Produce Bin 1',
    supplierName: 'Karnataka Mandi',
    velocityClass: 'FAST',
  },
  {
    id: 'prod-10',
    name: 'Nashik Red Onion (Loose)',
    category: 'Vegetables',
    price: 35,
    unit: 'kg',
    type: 'NON_STOCK',
    stockQuantity: 0,
    reorderLevel: 0,
    costPrice: 28,
    barcode: 'NONSTOCK-ONION',
    emoji: '🧅',
    active: true,
    notes: 'Medium sized clean dry red onions weighed on scale',
    storageLocation: 'Fresh Produce Bin 2',
    supplierName: 'Karnataka Mandi',
    velocityClass: 'FAST',
  },
  {
    id: 'prod-11',
    name: 'Hassan Jyoti Potato (Loose)',
    category: 'Vegetables',
    price: 30,
    unit: 'kg',
    type: 'NON_STOCK',
    stockQuantity: 0,
    reorderLevel: 0,
    costPrice: 24,
    barcode: 'NONSTOCK-POTATO',
    emoji: '🥔',
    active: true,
    notes: 'Freshly harvested firm cooking potatoes',
    storageLocation: 'Fresh Produce Bin 3',
    supplierName: 'Karnataka Mandi',
    velocityClass: 'FAST',
  },
  {
    id: 'prod-12',
    name: 'Fresh Ground Idli & Dosa Batter 1kg',
    category: 'Fresh Food',
    price: 55,
    unit: 'packet',
    type: 'NON_STOCK',
    stockQuantity: 0,
    reorderLevel: 0,
    costPrice: 42,
    barcode: 'NONSTOCK-BATTER',
    emoji: '🥞',
    active: true,
    notes: 'Natural fermented crispy batter without soda',
    storageLocation: 'Chiller 1 • Batter Tray',
    supplierName: 'Local Kitchen Vendor',
    velocityClass: 'FAST',
  },
  {
    id: 'prod-13',
    name: 'Pollachi Tender Coconut (Fresh Cut)',
    category: 'Fresh Food',
    price: 50,
    unit: 'pcs',
    type: 'NON_STOCK',
    stockQuantity: 0,
    reorderLevel: 0,
    costPrice: 38,
    barcode: 'NONSTOCK-COCONUT',
    emoji: '🥥',
    active: true,
    notes: 'Sweet tender coconut punched fresh on customer order',
    storageLocation: 'Entrance Coconut Stall',
    supplierName: 'Local Vendor',
    velocityClass: 'MEDIUM',
  },
  {
    id: 'prod-14',
    name: 'Fresh Coriander & Mint Bunch',
    category: 'Vegetables',
    price: 15,
    unit: 'pcs',
    type: 'NON_STOCK',
    stockQuantity: 0,
    reorderLevel: 0,
    costPrice: 8,
    barcode: 'NONSTOCK-HERBS',
    emoji: '🌿',
    active: true,
    notes: 'Fresh aromatic cooking herbs bunch',
    storageLocation: 'Produce Mist Cooler',
    supplierName: 'Karnataka Mandi',
    velocityClass: 'FAST',
  },
  {
    id: 'prod-15',
    name: 'Steam Laundry & Ironing (Per Cloth)',
    category: 'Services',
    price: 12,
    unit: 'service',
    type: 'NON_STOCK',
    stockQuantity: 0,
    reorderLevel: 0,
    costPrice: 6,
    barcode: 'SERVICE-IRONING',
    emoji: '👔',
    active: true,
    notes: 'Same-day wrinkle-free steam press service by mart partner',
    storageLocation: 'Lobby Service Counter',
    supplierName: 'Society Mart Partner',
    velocityClass: 'MEDIUM',
  },
];

// Initial Seed Orders
const initialOrders: BazaarOrder[] = [
  {
    id: 'BZR-ORD-1041',
    orderNumber: 'BZR-1041',
    createdAt: 'Today, 10:15 AM',
    customerName: 'Aditya Sharma',
    customerFlat: 'B-204',
    customerPhone: '+91 98765 43210',
    items: [
      {
        productId: 'prod-1',
        productName: 'Amul Taaza Toned Milk 1L',
        price: 68,
        quantity: 2,
        unit: 'litre',
        total: 136,
        emoji: '🥛',
        type: 'STOCK',
      },
      {
        productId: 'prod-4',
        productName: 'Modern White Sandwich Bread 400g',
        price: 45,
        quantity: 1,
        unit: 'packet',
        total: 45,
        emoji: '🍞',
        type: 'STOCK',
      },
      {
        productId: 'prod-9',
        productName: 'Fresh Farm Tomato (Loose)',
        price: 40,
        quantity: 1,
        unit: 'kg',
        total: 40,
        emoji: '🍅',
        type: 'NON_STOCK',
      },
    ],
    subtotal: 221,
    discount: 0,
    tax: 0,
    deliveryFee: 20,
    totalAmount: 241,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    fulfillmentType: 'DELIVERY',
    status: 'PENDING',
    deliveryAddress: 'Flat B-204, 2nd Floor, Tower B, Green Glen Palms',
    notes: 'Please deliver before 11:30 AM',
  },
  {
    id: 'BZR-ORD-1042',
    orderNumber: 'BZR-1042',
    createdAt: 'Today, 09:40 AM',
    customerName: 'Priya Sharma',
    customerFlat: 'A-101',
    customerPhone: '+91 98451 23456',
    items: [
      {
        productId: 'prod-3',
        productName: 'Aashirvaad Shudh Chakki Atta 5kg',
        price: 250,
        quantity: 1,
        unit: 'packet',
        total: 250,
        emoji: '🌾',
        type: 'STOCK',
      },
      {
        productId: 'prod-12',
        productName: 'Fresh Ground Idli & Dosa Batter 1kg',
        price: 55,
        quantity: 1,
        unit: 'packet',
        total: 55,
        emoji: '🥞',
        type: 'NON_STOCK',
      },
    ],
    subtotal: 305,
    discount: 0,
    tax: 0,
    deliveryFee: 0,
    totalAmount: 305,
    paymentMethod: 'KHATA_FLAT',
    paymentStatus: 'OUTSTANDING',
    fulfillmentType: 'DELIVERY',
    status: 'PACKED',
    deliveryAddress: 'Flat A-101, 1st Floor, Tower A',
    notes: 'Leave at security if door not answered',
  },
  {
    id: 'BZR-ORD-1043',
    orderNumber: 'BZR-1043',
    createdAt: 'Today, 08:20 AM',
    customerName: 'Rahul Verma',
    customerFlat: 'C-302',
    customerPhone: '+91 97412 34567',
    items: [
      {
        productId: 'prod-6',
        productName: 'Maggi 2-Minute Masala Noodles 70g',
        price: 14,
        quantity: 5,
        unit: 'pcs',
        total: 70,
        emoji: '🍜',
        type: 'STOCK',
      },
      {
        productId: 'prod-8',
        productName: 'Coca-Cola Original Taste 1.5L',
        price: 90,
        quantity: 1,
        unit: 'bottle',
        total: 90,
        emoji: '🥤',
        type: 'STOCK',
      },
    ],
    subtotal: 160,
    discount: 0,
    tax: 0,
    deliveryFee: 0,
    totalAmount: 160,
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    fulfillmentType: 'PICKUP',
    status: 'DELIVERED',
    deliveryAddress: 'In-Store Counter Pickup',
    notes: 'Customer collected bag at counter',
  },
];

// Initial Seed Khata Accounts
const initialKhataAccounts: Record<string, KhataAccount> = {
  'B-204': {
    flatNumber: 'B-204',
    residentName: 'Aditya Sharma',
    residentPhone: '+91 98765 43210',
    totalOutstanding: 420,
    lastUpdated: '12 Sep 2026',
    entries: [
      {
        id: 'kht-101',
        date: '12 Sep 2026',
        type: 'PURCHASE',
        amount: 250,
        description: 'Atta 5kg & Fresh Milk (Order #BZR-982)',
        orderId: 'BZR-982',
      },
      {
        id: 'kht-102',
        date: '10 Sep 2026',
        type: 'PURCHASE',
        amount: 170,
        description: 'Eggs, Bread & Tomatoes (Order #BZR-941)',
        orderId: 'BZR-941',
      },
    ],
  },
  'A-101': {
    flatNumber: 'A-101',
    residentName: 'Priya Sharma',
    residentPhone: '+91 98451 23456',
    totalOutstanding: 310,
    lastUpdated: 'Today',
    entries: [
      {
        id: 'kht-201',
        date: 'Today',
        type: 'PURCHASE',
        amount: 305,
        description: 'Order #BZR-1042 Atta & Idli Batter',
        orderId: 'BZR-1042',
      },
      {
        id: 'kht-202',
        date: '08 Sep 2026',
        type: 'PURCHASE',
        amount: 155,
        description: 'Groceries & Cold Drinks',
        orderId: 'BZR-890',
      },
      {
        id: 'kht-203',
        date: '09 Sep 2026',
        type: 'PAYMENT',
        amount: 150,
        description: 'UPI Payment via GPay ref: UPI/88219',
      },
    ],
  },
  'C-302': {
    flatNumber: 'C-302',
    residentName: 'Rahul Verma',
    residentPhone: '+91 97412 34567',
    totalOutstanding: 850,
    lastUpdated: '05 Sep 2026',
    entries: [
      {
        id: 'kht-301',
        date: '05 Sep 2026',
        type: 'PURCHASE',
        amount: 850,
        description: 'Monthly pantry supplies & cooking oil',
        orderId: 'BZR-840',
      },
    ],
  },
};

export const useBazaarStore = create<BazaarState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      cart: [
        {
          productId: 'prod-1',
          name: 'Amul Taaza Toned Milk 1L',
          category: 'Dairy',
          price: 68,
          unit: 'litre',
          quantity: 2,
          type: 'STOCK',
          emoji: '🥛',
        },
        {
          productId: 'prod-4',
          name: 'Modern White Sandwich Bread 400g',
          category: 'Bakery',
          price: 45,
          unit: 'packet',
          quantity: 1,
          type: 'STOCK',
          emoji: '🍞',
        },
        {
          productId: 'prod-9',
          name: 'Fresh Farm Tomato (Loose)',
          category: 'Vegetables',
          price: 40,
          unit: 'kg',
          quantity: 1,
          type: 'NON_STOCK',
          emoji: '🍅',
        },
      ],
      orders: initialOrders,
      khataAccounts: initialKhataAccounts,
      activePromoCode: null,
      discountAmount: 0,
      stockMovements: initialStockMovements,
      suppliers: initialSuppliers,
      purchaseOrders: initialPurchaseOrders,

      // Cart Operations
      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.cart.findIndex((item) => item.productId === product.id);
          if (existingIndex > -1) {
            const updated = [...state.cart];
            updated[existingIndex].quantity += quantity;
            return { cart: updated };
          }
          return {
            cart: [
              ...state.cart,
              {
                productId: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                unit: product.unit,
                quantity,
                type: product.type,
                emoji: product.emoji,
              },
            ],
          };
        });
      },

      updateCartQty: (productId, delta) => {
        set((state) => {
          const updated = state.cart
            .map((item) => {
              if (item.productId === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[];
          return { cart: updated };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.productId !== productId),
        }));
      },

      clearCart: () => {
        set({ cart: [], activePromoCode: null, discountAmount: 0 });
      },

      applyPromo: (code) => {
        const clean = code.trim().toUpperCase();
        if (clean === 'AMA50') {
          set({ activePromoCode: 'AMA50', discountAmount: 50 });
          return { success: true, message: '🎉 ₹50 Discount Applied!', discount: 50 };
        }
        if (clean === 'GREEN10') {
          const subtotal = get().cart.reduce((s, i) => s + i.price * i.quantity, 0);
          const disc = Math.round(subtotal * 0.1);
          set({ activePromoCode: 'GREEN10', discountAmount: disc });
          return { success: true, message: '🎉 10% Off Applied!', discount: disc };
        }
        return { success: false, message: 'Invalid code. Try AMA50 or GREEN10', discount: 0 };
      },

      removePromo: () => {
        set({ activePromoCode: null, discountAmount: 0 });
      },

      // Checkout
      checkout: (orderData) => {
        const state = get();
        const subtotal = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
        const discount = state.discountAmount;
        const deliveryFee = orderData.fulfillmentType === 'DELIVERY' ? 25 : 0;
        const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

        const orderNumSeq = 1044 + state.orders.length;
        const orderId = 'BZR-ORD-' + orderNumSeq;

        const items: BazaarOrderItem[] = state.cart.map((c) => {
          const itemName = (c as any).productName || c.name || 'Item';
          const itemPrice = Number(c.price) || 0;
          const itemQty = Number(c.quantity) || 1;
          return {
            productId: c.productId,
            productName: itemName,
            name: itemName,
            price: itemPrice,
            quantity: itemQty,
            unit: c.unit || 'pcs',
            total: itemPrice * itemQty,
            emoji: c.emoji || '📦',
            type: c.type || 'STOCK',
          };
        });

        const newOrder: BazaarOrder = {
          id: orderId,
          orderNumber: 'BZR-' + orderNumSeq,
          createdAt: 'Just now',
          customerName: orderData.customerName,
          customerFlat: orderData.customerFlat,
          customerPhone: orderData.customerPhone || '+91 98765 43210',
          items,
          subtotal,
          discount,
          discountCode: state.activePromoCode || undefined,
          tax: 0,
          deliveryFee,
          totalAmount,
          paymentMethod: orderData.paymentMethod,
          paymentStatus: orderData.paymentMethod === 'KHATA_FLAT' ? 'OUTSTANDING' : 'PAID',
          fulfillmentType: orderData.fulfillmentType,
          status: 'PENDING',
          deliveryAddress: orderData.deliveryAddress,
          notes: orderData.notes,
        };

        // Decrement stock for stock items
        state.cart.forEach((c) => {
          if (c.type === 'STOCK') {
            get().adjustStock(c.productId, -c.quantity, 'Resident Order #' + newOrder.orderNumber);
          }
        });

        // Record Khata if payment is flat credit
        if (orderData.paymentMethod === 'KHATA_FLAT') {
          get().recordKhataPurchase(
            orderData.customerFlat,
            orderData.customerName,
            orderData.customerPhone || '',
            totalAmount,
            newOrder.orderNumber
          );
        }

        set((s) => ({
          orders: [newOrder, ...s.orders],
          cart: [],
          activePromoCode: null,
          discountAmount: 0,
        }));

        return newOrder;
      },

      // POS Direct Checkout
      posCheckout: (saleData) => {
        const state = get();
        const subtotal = saleData.items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
        const discount = saleData.discountAmount || 0;
        const totalAmount = Math.max(0, subtotal - discount);

        const orderNumSeq = 2001 + state.orders.length;
        const orderId = 'POS-ORD-' + orderNumSeq;

        const items: BazaarOrderItem[] = saleData.items.map((c) => {
          const itemName = (c as any).productName || c.name || 'Item';
          const itemPrice = Number(c.price) || 0;
          const itemQty = Number(c.quantity) || 1;
          return {
            productId: c.productId,
            productName: itemName,
            name: itemName,
            price: itemPrice,
            quantity: itemQty,
            unit: c.unit || 'pcs',
            total: itemPrice * itemQty,
            emoji: c.emoji || '📦',
            type: c.type || 'STOCK',
          };
        });

        const newOrder: BazaarOrder = {
          id: orderId,
          orderNumber: 'POS-' + orderNumSeq,
          createdAt: 'Just now',
          customerName: saleData.customerName || 'Walk-in Customer',
          customerFlat: saleData.customerFlat || 'Counter',
          items,
          subtotal,
          discount,
          tax: 0,
          deliveryFee: 0,
          totalAmount,
          paymentMethod: saleData.paymentMethod,
          paymentStatus: saleData.paymentMethod === 'KHATA_FLAT' ? 'OUTSTANDING' : 'PAID',
          fulfillmentType: 'PICKUP',
          status: 'DELIVERED',
          notes: saleData.notes,
        };

        // Deduct stock for stock items
        saleData.items.forEach((c) => {
          if (c.type === 'STOCK') {
            get().adjustStock(c.productId, -c.quantity, 'POS Sale #' + newOrder.orderNumber);
          }
        });

        // If charged to Khata, record credit
        if (saleData.paymentMethod === 'KHATA_FLAT' && saleData.customerFlat !== 'Counter') {
          get().recordKhataPurchase(
            saleData.customerFlat,
            saleData.customerName,
            '',
            totalAmount,
            newOrder.orderNumber
          );
        }

        set((s) => ({
          orders: [newOrder, ...s.orders],
        }));

        return newOrder;
      },

      // Order Status Lifecycle
      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, status } : o)),
        }));
      },

      updateOrderDetails: (orderId, updates) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId || o.orderNumber === orderId ? { ...o, ...updates } : o
          ),
        }));
      },

      cancelOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o)),
        }));
      },

      // Inventory Operations
      addProduct: (productData) => {
        const newProduct: ProductItem = {
          ...productData,
          id: 'prod-' + Date.now(),
          active: true,
        };

        const movement: StockMovement = {
          id: 'stk-mov-' + Date.now(),
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'PURCHASE_RECEIPT',
          quantityChange: newProduct.stockQuantity,
          previousStock: 0,
          newStock: newProduct.stockQuantity,
          reason: 'Initial Product Cataloging',
          timestamp: 'Just now',
          performedBy: 'Mart Manager',
        };

        set((state) => ({
          products: [newProduct, ...state.products],
          stockMovements: newProduct.type === 'STOCK' ? [movement, ...state.stockMovements] : state.stockMovements,
        }));
        return newProduct;
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      adjustStock: (id, quantityChange, reason = 'Stock Adjustment', referenceId, performedBy = 'Mart Staff') => {
        set((state) => {
          const prod = state.products.find((p) => p.id === id);
          if (!prod || prod.type !== 'STOCK') return state;

          const previousStock = prod.stockQuantity;
          const newStock = Math.max(0, previousStock + quantityChange);

          const movement: StockMovement = {
            id: 'stk-mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            productId: id,
            productName: prod.name,
            type: quantityChange >= 0 ? 'PURCHASE_RECEIPT' : 'MANUAL_ADJUSTMENT',
            quantityChange,
            previousStock,
            newStock,
            reason,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
            referenceId,
            performedBy,
          };

          return {
            products: state.products.map((p) => (p.id === id ? { ...p, stockQuantity: newStock } : p)),
            stockMovements: [movement, ...state.stockMovements],
          };
        });
      },

      reconcileStockCount: (productId, physicalCount, reason = 'Cycle Count Physical Audit', performedBy = 'Mart Auditor') => {
        set((state) => {
          const prod = state.products.find((p) => p.id === productId);
          if (!prod || prod.type !== 'STOCK') return state;

          const previousStock = prod.stockQuantity;
          const quantityChange = physicalCount - previousStock;
          const newStock = Math.max(0, physicalCount);

          const movement: StockMovement = {
            id: 'stk-mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            productId,
            productName: prod.name,
            type: 'AUDIT_CORRECTION',
            quantityChange,
            previousStock,
            newStock,
            reason: reason + (quantityChange < 0 ? ' (Shrinkage: ' + quantityChange + ')' : ' (Surplus: +' + quantityChange + ')'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
            performedBy,
          };

          return {
            products: state.products.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p)),
            stockMovements: [movement, ...state.stockMovements],
          };
        });
      },

      writeOffStock: (productId, quantity, reason, notes = '', performedBy = 'Mart Manager') => {
        set((state) => {
          const prod = state.products.find((p) => p.id === productId);
          if (!prod || prod.type !== 'STOCK') return state;

          const previousStock = prod.stockQuantity;
          const actualDeduct = Math.min(previousStock, quantity);
          const newStock = previousStock - actualDeduct;

          const movement: StockMovement = {
            id: 'stk-mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            productId,
            productName: prod.name,
            type: 'DAMAGE_SPOILAGE',
            quantityChange: -actualDeduct,
            previousStock,
            newStock,
            reason: 'Write-off: ' + reason + (notes ? ' (' + notes + ')' : ''),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
            performedBy,
          };

          return {
            products: state.products.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p)),
            stockMovements: [movement, ...state.stockMovements],
          };
        });
      },

      createPurchaseOrder: (poData) => {
        const state = get();
        const poSeq = 41 + state.purchaseOrders.length;
        const poNumber = 'PO-2026-0' + poSeq;
        const totalEstimatedCost = poData.items.reduce((s, it) => s + it.totalCost, 0);

        const newPo: PurchaseOrder = {
          id: poNumber,
          poNumber,
          supplierId: poData.supplierId,
          supplierName: poData.supplierName,
          supplierPhone: poData.supplierPhone,
          items: poData.items,
          totalEstimatedCost,
          status: 'SENT',
          createdAt: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          expectedDeliveryDate: poData.expectedDeliveryDate,
          notes: poData.notes,
        };

        set((s) => ({
          purchaseOrders: [newPo, ...s.purchaseOrders],
        }));

        return newPo;
      },

      updatePurchaseOrderStatus: (poId, status) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((p) => (p.id === poId ? { ...p, status } : p)),
        }));
      },

      receivePurchaseOrder: (poId, receivedBy = 'Mart Receiver') => {
        set((state) => {
          const po = state.purchaseOrders.find((p) => p.id === poId);
          if (!po || po.status === 'RECEIVED') return state;

          const updatedProducts = [...state.products];
          const newMovements: StockMovement[] = [];

          po.items.forEach((item) => {
            const pIdx = updatedProducts.findIndex((p) => p.id === item.productId);
            if (pIdx > -1 && updatedProducts[pIdx].type === 'STOCK') {
              const prev = updatedProducts[pIdx].stockQuantity;
              const newQty = prev + item.quantityOrdered;
              updatedProducts[pIdx] = { ...updatedProducts[pIdx], stockQuantity: newQty };

              newMovements.push({
                id: 'stk-mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                productId: item.productId,
                productName: item.productName,
                type: 'PURCHASE_RECEIPT',
                quantityChange: item.quantityOrdered,
                previousStock: prev,
                newStock: newQty,
                reason: 'GRN Received for ' + po.poNumber + ' from ' + po.supplierName,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
                referenceId: po.poNumber,
                performedBy: receivedBy,
              });
            }
          });

          const updatedOrders = state.purchaseOrders.map((p) =>
            p.id === poId ? { ...p, status: 'RECEIVED' as const } : p
          );

          return {
            products: updatedProducts,
            purchaseOrders: updatedOrders,
            stockMovements: [...newMovements, ...state.stockMovements],
          };
        });
      },

      addSupplier: (supplierData) => {
        const newSup: Supplier = {
          ...supplierData,
          id: 'sup-' + Date.now(),
          active: true,
        };
        set((state) => ({
          suppliers: [...state.suppliers, newSup],
        }));
        return newSup;
      },

      updateSupplier: (id, updates) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },

      toggleProductActive: (id) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      bulkImportStock: (rows, reason = 'Bulk Excel / CSV Import') => {
        let addedCount = 0;
        let updatedCount = 0;
        const nowTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString();

        set((state) => {
          const updatedProducts = [...state.products];
          const newMovements: StockMovement[] = [];

          rows.forEach((row) => {
            const existingIndex = updatedProducts.findIndex(
              (p) =>
                (row.barcode && p.barcode && p.barcode.trim().toLowerCase() === row.barcode.trim().toLowerCase()) ||
                p.name.trim().toLowerCase() === row.name.trim().toLowerCase()
            );

            if (existingIndex > -1) {
              const prev = updatedProducts[existingIndex];
              const previousStock = prev.stockQuantity;
              const newStock = (row.type || prev.type) === 'STOCK' ? row.stockQuantity : 0;
              const delta = newStock - previousStock;

              updatedProducts[existingIndex] = {
                ...prev,
                price: row.price > 0 ? row.price : prev.price,
                costPrice: row.costPrice !== undefined && row.costPrice > 0 ? row.costPrice : prev.costPrice,
                stockQuantity: newStock,
                reorderLevel: row.reorderLevel !== undefined ? row.reorderLevel : prev.reorderLevel,
                category: row.category || prev.category,
                unit: row.unit || prev.unit,
                type: row.type || prev.type,
                batchNumber: row.batchNumber || prev.batchNumber,
                expiryDate: row.expiryDate || prev.expiryDate,
                storageLocation: row.storageLocation || prev.storageLocation,
                supplierName: row.supplierName || prev.supplierName,
              };
              updatedCount++;

              if (delta !== 0 && prev.type === 'STOCK') {
                newMovements.push({
                  id: 'stk-mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                  productId: prev.id,
                  productName: prev.name,
                  type: delta > 0 ? 'PURCHASE_RECEIPT' : 'AUDIT_CORRECTION',
                  quantityChange: delta,
                  previousStock,
                  newStock,
                  reason: reason + (delta > 0 ? ' (Restock via Excel)' : ' (Adjustment via Excel)'),
                  timestamp: nowTimestamp,
                  referenceId: 'EXCEL-IMPORT',
                  performedBy: 'Excel Bulk Import',
                });
              }
            } else {
              const newId = 'prod-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
              const newProd: ProductItem = {
                id: newId,
                name: row.name,
                category: row.category || 'General',
                price: row.price,
                costPrice: row.costPrice || Math.round(row.price * 0.8),
                unit: row.unit || 'pcs',
                type: row.type || 'STOCK',
                stockQuantity: (row.type || 'STOCK') === 'STOCK' ? row.stockQuantity : 0,
                reorderLevel: row.reorderLevel || 5,
                barcode: row.barcode || '890' + Math.floor(100000000 + Math.random() * 900000000),
                emoji: row.category === 'Produce' || row.category === 'Vegetables' ? '🥬' : row.category === 'Dairy' ? '🥛' : '📦',
                active: true,
                batchNumber: row.batchNumber,
                expiryDate: row.expiryDate,
                storageLocation: row.storageLocation || 'Aisle 1',
                supplierName: row.supplierName,
              };
              updatedProducts.push(newProd);
              addedCount++;

              if (newProd.type === 'STOCK' && newProd.stockQuantity > 0) {
                newMovements.push({
                  id: 'stk-mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                  productId: newId,
                  productName: newProd.name,
                  type: 'PURCHASE_RECEIPT',
                  quantityChange: newProd.stockQuantity,
                  previousStock: 0,
                  newStock: newProd.stockQuantity,
                  reason: reason + ' (New Item via Excel)',
                  timestamp: nowTimestamp,
                  referenceId: 'EXCEL-IMPORT',
                  performedBy: 'Excel Bulk Import',
                });
              }
            }
          });

          return {
            products: updatedProducts,
            stockMovements: [...newMovements, ...state.stockMovements],
          };
        });

        return { added: addedCount, updated: updatedCount };
      },

      // Khata (Apartment Flat Credit Ledger)
      recordKhataPurchase: (flatNumber, residentName, residentPhone, amount, orderId) => {
        set((state) => {
          const currentAccount = state.khataAccounts[flatNumber] || {
            flatNumber,
            residentName: residentName || ('Flat ' + flatNumber),
            residentPhone: residentPhone || '',
            totalOutstanding: 0,
            lastUpdated: 'Today',
            entries: [],
          };

          const newEntry: KhataEntry = {
            id: 'kht-entry-' + Date.now(),
            date: 'Today',
            type: 'PURCHASE',
            amount,
            description: 'Order #' + orderId,
            orderId,
          };

          const updatedAccount: KhataAccount = {
            ...currentAccount,
            totalOutstanding: currentAccount.totalOutstanding + amount,
            lastUpdated: 'Today',
            entries: [newEntry, ...currentAccount.entries],
          };

          return {
            khataAccounts: {
              ...state.khataAccounts,
              [flatNumber]: updatedAccount,
            },
          };
        });
      },

      settleKhataPayment: (flatNumber, amount, note = 'Cash / UPI Settlement') => {
        set((state) => {
          const currentAccount = state.khataAccounts[flatNumber];
          if (!currentAccount) return state;

          const newEntry: KhataEntry = {
            id: 'kht-entry-' + Date.now(),
            date: 'Today',
            type: 'PAYMENT',
            amount,
            description: note,
          };

          const newTotal = Math.max(0, currentAccount.totalOutstanding - amount);
          const updatedAccount: KhataAccount = {
            ...currentAccount,
            totalOutstanding: newTotal,
            lastUpdated: 'Today',
            entries: [newEntry, ...currentAccount.entries],
          };

          return {
            khataAccounts: {
              ...state.khataAccounts,
              [flatNumber]: updatedAccount,
            },
          };
        });
      },
    }),
    {
      name: 'ama-bazaar-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage;
        }
        if (AsyncStorage && typeof (AsyncStorage as any).setItem === 'function') {
          return AsyncStorage;
        }
        const memoryMap = new Map<string, string>();
        return {
          getItem: (key: string) => memoryMap.get(key) || null,
          setItem: (key: string, value: string) => {
            memoryMap.set(key, value);
          },
          removeItem: (key: string) => {
            memoryMap.delete(key);
          },
        };
      }),
    }
  )
);
