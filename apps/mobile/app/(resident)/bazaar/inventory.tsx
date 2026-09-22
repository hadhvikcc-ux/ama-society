import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Platform,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { BazaarGroupHeader } from '../../../components/bazaar/BazaarGroupHeader';
import { Ionicons } from '@expo/vector-icons';
import { MetricTrendCard, TrendBarChart, TrendAreaLineChart } from '../../../components/charts';
import {
  useBazaarStore,
  ProductItem,
  ProductType,
  StockMovement,
  Supplier,
  PurchaseOrder,
} from '../../../stores/bazaarStore';

const INVENTORY_MONTHLY_TREND = [
  { label: 'Apr', series1: 42000, series2: 54000, series3: 12000, formatted1: '₹42K Inflow', formatted2: '₹54K Sales', formatted3: '+₹12K Margin', badge: '+28% Margin' },
  { label: 'May', series1: 48000, series2: 62000, series3: 14000, formatted1: '₹48K Inflow', formatted2: '₹62K Sales', formatted3: '+₹14K Margin', badge: '+29% Margin' },
  { label: 'Jun', series1: 52000, series2: 68000, series3: 16000, formatted1: '₹52K Inflow', formatted2: '₹68K Sales', formatted3: '+₹16K Margin', badge: '+30% Margin' },
  { label: 'Jul', series1: 58000, series2: 76000, series3: 18000, formatted1: '₹58K Inflow', formatted2: '₹76K Sales', formatted3: '+₹18K Margin', badge: '+31% Margin' },
  { label: 'Aug', series1: 55000, series2: 72000, series3: 17000, formatted1: '₹55K Inflow', formatted2: '₹72K Sales', formatted3: '+₹17K Margin', badge: '+30% Margin' },
  { label: 'Sep', series1: 50000, series2: 66000, series3: 16000, formatted1: '₹50K Inflow', formatted2: '₹66K Sales', formatted3: '+₹16K Margin', badge: '+32% Margin' },
];

const INVENTORY_VALUATION_AREA = [
  { label: 'Apr', value: 85000, secondaryValue: 54000, formattedValue: '₹85K Stock', formattedSecondary: '₹54K Sales', subText: 'Healthy Buffer' },
  { label: 'May', value: 92000, secondaryValue: 62000, formattedValue: '₹92K Stock', formattedSecondary: '₹62K Sales', subText: 'Healthy Buffer' },
  { label: 'Jun', value: 98000, secondaryValue: 68000, formattedValue: '₹98K Stock', formattedSecondary: '₹68K Sales', subText: 'Healthy Buffer' },
  { label: 'Jul', value: 108000, secondaryValue: 76000, formattedValue: '₹1.08L Stock', formattedSecondary: '₹76K Sales', subText: 'Peak Season' },
  { label: 'Aug', value: 104000, secondaryValue: 72000, formattedValue: '₹1.04L Stock', formattedSecondary: '₹72K Sales', subText: 'Peak Season' },
  { label: 'Sep', value: 99500, secondaryValue: 66000, formattedValue: '₹99.5K Stock', formattedSecondary: '₹66K Sales', subText: 'Current Capital' },
];

export default function InventoryScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const fileInputRef = useRef<any>(null);

  const {
    products,
    stockMovements,
    suppliers,
    purchaseOrders,
    addProduct,
    updateProduct,
    adjustStock,
    reconcileStockCount,
    writeOffStock,
    createPurchaseOrder,
    receivePurchaseOrder,
    toggleProductActive,
    deleteProduct,
    bulkImportStock,
  } = useBazaarStore();

  // Active Main Tab: 'PRODUCTS' | 'ANALYTICS' | 'LOGS' | 'SUPPLIERS' | 'AUDIT'
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ANALYTICS' | 'LOGS' | 'SUPPLIERS' | 'AUDIT'>('PRODUCTS');
  const [inventoryChartType, setInventoryChartType] = useState<'area' | 'bar'>('bar');

  // Filter & Search State for Products
  const [productFilterType, setProductFilterType] = useState<'ALL' | 'STOCK' | 'NON_STOCK' | 'LOW_STOCK' | 'EXPIRING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // Modals State
  // -------------------------------------------------------------
  // 1. Add Product Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Pantry');
  const [formPrice, setFormPrice] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formType, setFormType] = useState<ProductType>('STOCK');
  const [formStockQty, setFormStockQty] = useState('25');
  const [formReorderLevel, setFormReorderLevel] = useState('5');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formEmoji, setFormEmoji] = useState('📦');
  const [formBatch, setFormBatch] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formLocation, setFormLocation] = useState('Aisle 1 • Shelf A');
  const [formSupplier, setFormSupplier] = useState('Metro Cash & Carry Wholesale');
  const [formMinOrder, setFormMinOrder] = useState('10');
  const [formNotes, setFormNotes] = useState('');

  // 2. Quick Restock Modal
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [restockProduct, setRestockProduct] = useState<ProductItem | null>(null);
  const [restockQty, setRestockQty] = useState('20');
  const [restockReason, setRestockReason] = useState('Wholesale Supplier Delivery');

  // 3. Movement History for Product Modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<ProductItem | null>(null);

  // 4. Damage & Spoilage Write-Off Modal
  const [writeOffModalVisible, setWriteOffModalVisible] = useState(false);
  const [writeOffProduct, setWriteOffProduct] = useState<ProductItem | null>(null);
  const [writeOffQty, setWriteOffQty] = useState('1');
  const [writeOffReason, setWriteOffReason] = useState<'EXPIRED' | 'DAMAGED' | 'THEFT' | 'OTHER'>('EXPIRED');
  const [writeOffNotes, setWriteOffNotes] = useState('');

  // 5. Create Purchase Order Modal
  const [poModalVisible, setPoModalVisible] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || 'sup-1');
  const [poSelectedItems, setPoSelectedItems] = useState<Record<string, number>>({});
  const [poExpectedDate, setPoExpectedDate] = useState('Tomorrow, 10:00 AM');
  const [poNotes, setPoNotes] = useState('Deliver to Society Mart Loading Bay');

  // 6. Print Shelf Tag Modal
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tagProduct, setTagProduct] = useState<ProductItem | null>(null);

  // 7. Physical Audit Counts Input State
  const [auditCounts, setAuditCounts] = useState<Record<string, string>>({});

  // 8. Excel Download / Upload Modal State
  const [excelModalVisible, setExcelModalVisible] = useState(false);
  const [excelInputMode, setExcelInputMode] = useState<'FILE' | 'PASTE' | 'GUIDE'>('FILE');
  const [pastedCsvText, setPastedCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ total: number; updates: number; newItems: number } | null>(null);

  // -------------------------------------------------------------
  // Calculations & Analytics
  // -------------------------------------------------------------
  const totalProducts = products.length;
  const stockProducts = products.filter((p) => p.type === 'STOCK');
  const nonStockProducts = products.filter((p) => p.type === 'NON_STOCK');

  const lowStockProducts = stockProducts.filter((p) => p.stockQuantity <= p.reorderLevel);

  // Near-expiry calculation
  const expiringSoonProducts = stockProducts.filter((p) => {
    if (!p.expiryDate) return false;
    const exp = new Date(p.expiryDate).getTime();
    const now = new Date('2026-09-16').getTime();
    const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 15;
  });

  // Financial Metrics
  const totalCostValuation = stockProducts.reduce(
    (sum, p) => sum + (p.costPrice || p.price * 0.8) * p.stockQuantity,
    0
  );
  const totalRetailValuation = stockProducts.reduce(
    (sum, p) => sum + p.price * p.stockQuantity,
    0
  );
  const projectedGrossProfit = Math.max(0, totalRetailValuation - totalCostValuation);
  const grossMarginPercent =
    totalRetailValuation > 0
      ? Math.round((projectedGrossProfit / totalRetailValuation) * 100)
      : 0;

  // Categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productFilterType === 'STOCK' && p.type !== 'STOCK') return false;
      if (productFilterType === 'NON_STOCK' && p.type !== 'NON_STOCK') return false;
      if (productFilterType === 'LOW_STOCK' && (p.type !== 'STOCK' || p.stockQuantity > p.reorderLevel)) {
        return false;
      }
      if (productFilterType === 'EXPIRING' && !expiringSoonProducts.some((ep) => ep.id === p.id)) {
        return false;
      }

      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBarcode = p.barcode && p.barcode.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchLoc = p.storageLocation && p.storageLocation.toLowerCase().includes(q);
        if (!matchName && !matchBarcode && !matchCat && !matchLoc) return false;
      }

      return true;
    });
  }, [products, productFilterType, selectedCategory, searchQuery, expiringSoonProducts]);

  // -------------------------------------------------------------
  // Excel File Helper Functions (Download & Upload)
  // -------------------------------------------------------------
  const downloadBlob = (content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob(['\uFEFF' + content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      Share.share({
        title: filename,
        message: content,
      });
    }
  };

  // 1. Download Blank Excel Template
  const handleDownloadExcelTemplate = () => {
    const headers = [
      'Barcode_SKU',
      'Product_Name',
      'Category',
      'Selling_Price',
      'Cost_Price',
      'Unit',
      'Type',
      'Stock_Quantity',
      'Reorder_Level',
      'Batch_Number',
      'Expiry_Date',
      'Storage_Location',
      'Supplier_Name',
    ].join(',');

    const sampleRow1 = '890123456789,Amul Taaza Toned Milk 1L,Dairy,68,62,litre,STOCK,40,8,BAMUL-2026-09A,2026-09-28,Chiller 1 • Milk Tray,Amul BAMUL';
    const sampleRow2 = '890987654321,Aashirvaad Shudh Chakki Atta 5kg,Pantry,250,225,packet,STOCK,25,5,ITC-2026-08,2027-02-15,Aisle 2 • Bottom Pallet,Metro Wholesale';
    const sampleRow3 = 'NONSTOCK-TOMATO,Fresh Farm Tomato (Loose),Vegetables,40,32,kg,NON_STOCK,0,0,,,Fresh Produce Bin 1,Karnataka Mandi';

    const csvContent = [headers, sampleRow1, sampleRow2, sampleRow3].join('\n');
    downloadBlob(csvContent, 'AMA_Mart_Stock_Template.csv');
    showToast('📥 Downloaded "AMA_Mart_Stock_Template.csv"! Edit in Excel & re-upload.');
  };

  // 2. Export Full Current Live Inventory as Excel / CSV
  const handleExportLiveInventory = () => {
    const headers = [
      'Barcode_SKU',
      'Product_Name',
      'Category',
      'Selling_Price',
      'Cost_Price',
      'Unit',
      'Type',
      'Stock_Quantity',
      'Reorder_Level',
      'Batch_Number',
      'Expiry_Date',
      'Storage_Location',
      'Supplier_Name',
    ].join(',');

    const rows = products.map((p) => {
      return [
        p.barcode || '',
        '"' + (p.name || '').replace(/"/g, '""') + '"',
        p.category || '',
        p.price,
        p.costPrice || Math.round(p.price * 0.8),
        p.unit || 'pcs',
        p.type,
        p.type === 'STOCK' ? p.stockQuantity : 0,
        p.type === 'STOCK' ? p.reorderLevel : 0,
        p.batchNumber || '',
        p.expiryDate || '',
        '"' + (p.storageLocation || '').replace(/"/g, '""') + '"',
        '"' + (p.supplierName || '').replace(/"/g, '""') + '"',
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const filename = 'AMA_Live_Inventory_' + new Date().toISOString().split('T')[0] + '.csv';
    downloadBlob(csvContent, filename);
    showToast('📊 Exported ' + products.length + ' products to "' + filename + '"!');
  };

  // 3. Parse CSV / TSV text into structured rows
  const parseSpreadsheetData = (text: string) => {
    if (!text || !text.trim()) {
      showToast('⚠️ No spreadsheet text found to parse');
      return;
    }

    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      showToast('⚠️ Spreadsheet needs at least a header row and 1 data row');
      return;
    }

    // Determine delimiter: tab vs comma
    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    const parseLine = (line: string) => {
      if (delimiter === '\t') {
        return line.split('\t').map((s) => s.trim().replace(/^"|"$/g, ''));
      }
      // Regex for CSV with quoted strings
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headerCols = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const parsed: any[] = [];
    let updateCount = 0;
    let newCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const rowLine = lines[i].trim();
      if (!rowLine) continue;

      const cols = parseLine(rowLine);
      const rowObj: any = {};

      headerCols.forEach((header, idx) => {
        const val = cols[idx] || '';
        if (header.includes('name') || header.includes('product') || header.includes('item')) {
          rowObj.name = val;
        } else if (header.includes('barcode') || header.includes('sku')) {
          rowObj.barcode = val;
        } else if (header.includes('category') || header.includes('cat')) {
          rowObj.category = val;
        } else if (header.includes('selling') || header === 'price' || header.includes('mrp')) {
          rowObj.price = parseFloat(val) || 0;
        } else if (header.includes('cost')) {
          rowObj.costPrice = parseFloat(val) || 0;
        } else if (header.includes('unit')) {
          rowObj.unit = val || 'pcs';
        } else if (header.includes('type')) {
          rowObj.type = val.toUpperCase().includes('NON') ? 'NON_STOCK' : 'STOCK';
        } else if (header.includes('stock') || header.includes('qty') || header.includes('quantity')) {
          rowObj.stockQuantity = parseInt(val, 10) || 0;
        } else if (header.includes('reorder') || header.includes('alert') || header.includes('level')) {
          rowObj.reorderLevel = parseInt(val, 10) || 5;
        } else if (header.includes('batch') || header.includes('lot')) {
          rowObj.batchNumber = val;
        } else if (header.includes('exp') || header.includes('expiry')) {
          rowObj.expiryDate = val;
        } else if (header.includes('loc') || header.includes('aisle') || header.includes('shelf') || header.includes('bin')) {
          rowObj.storageLocation = val;
        } else if (header.includes('supplier') || header.includes('vendor')) {
          rowObj.supplierName = val;
        }
      });

      // Basic validation
      if (rowObj.name) {
        if (!rowObj.type) rowObj.type = 'STOCK';
        if (!rowObj.unit) rowObj.unit = 'pcs';
        if (!rowObj.price) rowObj.price = 50;

        const isExisting = products.some(
          (p) =>
            (rowObj.barcode && p.barcode && p.barcode.toLowerCase() === rowObj.barcode.toLowerCase()) ||
            p.name.toLowerCase() === rowObj.name.toLowerCase()
        );

        rowObj.isExisting = isExisting;
        if (isExisting) {
          updateCount++;
        } else {
          newCount++;
        }

        parsed.push(rowObj);
      }
    }

    setParsedRows(parsed);
    setImportSummary({ total: parsed.length, updates: updateCount, newItems: newCount });
    showToast('✓ Parsed ' + parsed.length + ' rows from Excel (' + updateCount + ' updates, ' + newCount + ' new)!');
  };

  // Web File Picker Change Handler
  const handleFileChange = (e: any) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt: any) => {
      const text = evt.target.result;
      parseSpreadsheetData(text);
    };
    reader.readAsText(file);
  };

  // Commit Parsed Rows into Store
  const handleCommitBulkImport = () => {
    if (parsedRows.length === 0) {
      showToast('⚠️ No valid rows to import. Please select a file or paste data first.');
      return;
    }

    const result = bulkImportStock(parsedRows, 'Bulk Excel Import: ' + (uploadedFileName || 'Pasted Spreadsheet'));
    setExcelModalVisible(false);
    setParsedRows([]);
    setImportSummary(null);
    setUploadedFileName(null);
    setPastedCsvText('');

    showToast('🎉 Stock Updated! ' + result.updated + ' existing items updated, ' + result.added + ' new items added.');
  };

  // -------------------------------------------------------------
  // Operations Handlers
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setFormName('');
    setFormCategory('Pantry');
    setFormPrice('');
    setFormUnit('pcs');
    setFormType('STOCK');
    setFormStockQty('25');
    setFormReorderLevel('5');
    setFormBarcode('890' + Math.floor(100000000 + Math.random() * 900000000));
    setFormCostPrice('');
    setFormEmoji('📦');
    setFormBatch('BAT-' + new Date().getFullYear() + '-' + Math.floor(10 + Math.random() * 90));
    setFormExpiry('2027-06-30');
    setFormLocation('Aisle 1 • Shelf B');
    setFormSupplier('Metro Cash & Carry Wholesale');
    setFormMinOrder('10');
    setFormNotes('');
    setAddModalVisible(true);
  };

  const handleSaveNewProduct = () => {
    const priceNum = parseFloat(formPrice);
    if (!formName.trim() || isNaN(priceNum) || priceNum <= 0) {
      showToast('⚠️ Please enter a valid product name & selling price');
      return;
    }

    const stockNum = formType === 'STOCK' ? parseInt(formStockQty, 10) || 0 : 0;
    const reorderNum = formType === 'STOCK' ? parseInt(formReorderLevel, 10) || 5 : 0;
    const costNum = parseFloat(formCostPrice) || Math.round(priceNum * 0.85);

    const created = addProduct({
      name: formName.trim(),
      category: formCategory,
      price: priceNum,
      unit: formUnit,
      type: formType,
      stockQuantity: stockNum,
      reorderLevel: reorderNum,
      costPrice: costNum,
      barcode: formBarcode.trim() || undefined,
      emoji: formEmoji || (formType === 'STOCK' ? '📦' : '⚡'),
      active: true,
      batchNumber: formBatch.trim() || undefined,
      expiryDate: formExpiry.trim() || undefined,
      storageLocation: formLocation.trim() || undefined,
      supplierName: formSupplier,
      minOrderQty: parseInt(formMinOrder, 10) || 10,
      notes: formNotes.trim() || undefined,
    });

    setAddModalVisible(false);
    showToast('✓ Added ' + created.name + ' to inventory');
  };

  const handleOpenRestock = (product: ProductItem) => {
    setRestockProduct(product);
    setRestockQty(product.minOrderQty ? product.minOrderQty.toString() : '20');
    setRestockReason('Supplier Delivery');
    setRestockModalVisible(true);
  };

  const handleConfirmRestock = () => {
    if (!restockProduct) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('⚠️ Please enter a valid restock quantity');
      return;
    }

    adjustStock(restockProduct.id, qty, restockReason, undefined, 'Mart Staff');
    setRestockModalVisible(false);
    showToast('✓ Restocked +' + qty + ' ' + restockProduct.unit + ' of ' + restockProduct.name);
  };

  const handleOpenWriteOff = (product: ProductItem) => {
    setWriteOffProduct(product);
    setWriteOffQty('1');
    setWriteOffReason('EXPIRED');
    setWriteOffNotes('');
    setWriteOffModalVisible(true);
  };

  const handleConfirmWriteOff = () => {
    if (!writeOffProduct) return;
    const qty = parseInt(writeOffQty, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('⚠️ Please enter a valid quantity');
      return;
    }

    writeOffStock(writeOffProduct.id, qty, writeOffReason, writeOffNotes, 'Mart Auditor');
    setWriteOffModalVisible(false);
    showToast('✓ Wrote off -' + qty + ' ' + writeOffProduct.unit + ' (' + writeOffReason + ')');
  };

  const handleOpenTag = (product: ProductItem) => {
    setTagProduct(product);
    setTagModalVisible(true);
  };

  const handleOpenHistory = (product: ProductItem) => {
    setHistoryProduct(product);
    setHistoryModalVisible(true);
  };

  // PO WhatsApp Dispatch
  const handleSharePoWhatsApp = (po: PurchaseOrder) => {
    const itemsText = po.items
      .map((it) => '• ' + it.productName + ' (' + it.quantityOrdered + ' ' + it.unit + ') @ ₹' + it.unitCost + ' = ₹' + it.totalCost)
      .join('\n');

    const msg =
      '*AMA SOCIETY MART — OFFICIAL PURCHASE ORDER*\n' +
      'PO Number: *' + po.poNumber + '*\n' +
      'To: ' + po.supplierName + ' (' + po.supplierPhone + ')\n' +
      'Date: ' + po.createdAt + '\n' +
      'Expected Delivery: ' + po.expectedDeliveryDate + '\n' +
      'Delivery Location: Society Mart Loading Bay, Tower B Ground Floor\n' +
      '------------------------------------\n' +
      'REQUIREMENTS:\n' +
      itemsText + '\n' +
      '------------------------------------\n' +
      '*TOTAL ESTIMATED COST: ₹' + po.totalEstimatedCost + '*\n' +
      'Notes: ' + (po.notes || 'Deliver with invoice copy for gate verification') + '\n\n' +
      'Authorized By: Mart Manager (+91 98765 43210)';

    const url = 'https://api.whatsapp.com/send?phone=' + po.supplierPhone.replace(/\D/g, '') + '&text=' + encodeURIComponent(msg);
    Linking.openURL(url).catch(() => {
      Share.share({ message: msg });
    });
  };

  const handleReceivePo = (po: PurchaseOrder) => {
    receivePurchaseOrder(po.id, 'Mart Storekeeper');
    showToast('✓ Goods Receipt Note (GRN) confirmed! All items added to inventory.');
  };

  // Physical Audit Count Handlers
  const handleApplyAuditReconciliation = () => {
    let correctedCount = 0;
    stockProducts.forEach((p) => {
      const enteredStr = auditCounts[p.id];
      if (enteredStr !== undefined && enteredStr.trim() !== '') {
        const count = parseInt(enteredStr, 10);
        if (!isNaN(count) && count !== p.stockQuantity) {
          reconcileStockCount(p.id, count, 'Physical Cycle Count', 'Mart Auditor');
          correctedCount++;
        }
      }
    });

    if (correctedCount > 0) {
      showToast('✓ Reconciled ' + correctedCount + ' product counts. Stock audit logged.');
      setAuditCounts({});
    } else {
      showToast('No count discrepancies entered to reconcile.');
    }
  };

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Hidden Web File Input for Excel/CSV Upload */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .txt, .tsv, .xls, .xlsx, text/csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      {!embedded && (
        <BazaarGroupHeader
          activeTab="INVENTORY"
          showBack
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Stock & Master Catalog</Text>
          <Text style={{ fontSize: 11, color: '#64748B' }}>{products.length} products tracked • Real-time valuation</Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenAddModal}
          style={{ backgroundColor: '#1D4ED8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Toast Notice */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Excel / Bulk Stock Operations Banner */}
      <View style={styles.excelOperationsStrip}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="document-attach" size={16} color="#059669" />
            <Text style={styles.excelStripTitle}>Excel Stock Hub</Text>
          </View>
          <Text style={styles.excelStripSub}>
            Download CSV/Excel templates, edit bulk quantities, or upload inventory updates.
          </Text>
        </View>

        <View style={styles.excelButtonsRow}>
          <TouchableOpacity
            style={styles.excelBtnTemplate}
            onPress={handleDownloadExcelTemplate}
          >
            <Ionicons name="download-outline" size={14} color="#065F46" />
            <Text style={styles.excelBtnTemplateText}>Template</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.excelBtnExport}
            onPress={handleExportLiveInventory}
          >
            <Ionicons name="cloud-download-outline" size={14} color="#1E40AF" />
            <Text style={styles.excelBtnExportText}>Export All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.excelBtnUpload}
            onPress={() => setExcelModalVisible(true)}
          >
            <Ionicons name="cloud-upload" size={14} color="#FFFFFF" />
            <Text style={styles.excelBtnUploadText}>Upload Stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Executive 5-Card Inventory KPI Strip */}
      <View style={styles.kpiContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {/* Card 1: Catalog Size */}
          <View style={styles.kpiCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.kpiEmoji}>📦</Text>
              <Text style={styles.kpiSubPill}>{stockProducts.length} Stock • {nonStockProducts.length} Loose</Text>
            </View>
            <Text style={styles.kpiValue}>{totalProducts}</Text>
            <Text style={styles.kpiLabel}>Total Products</Text>
          </View>

          {/* Card 2: Capital Invested */}
          <View style={[styles.kpiCard, { borderColor: '#E2E8F0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.kpiEmoji}>💰</Text>
              <Text style={[styles.kpiSubPill, { color: '#475569' }]}>Cost Basis</Text>
            </View>
            <Text style={styles.kpiValue}>₹{totalCostValuation.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Capital Invested</Text>
          </View>

          {/* Card 3: Potential Retail Revenue & Margin */}
          <View style={[styles.kpiCard, { borderColor: '#BBF7D0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.kpiEmoji}>📈</Text>
              <Text style={[styles.kpiSubPill, { color: '#16A34A', backgroundColor: '#DCFCE7' }]}>
                +{grossMarginPercent}% Margin
              </Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>₹{totalRetailValuation.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Potential Sales (₹{projectedGrossProfit} Profit)</Text>
          </View>

          {/* Card 4: Low Stock Warnings */}
          <TouchableOpacity
            style={[styles.kpiCard, lowStockProducts.length > 0 && { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
            onPress={() => {
              setActiveTab('PRODUCTS');
              setProductFilterType('LOW_STOCK');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.kpiEmoji}>⚠️</Text>
              <Text style={[styles.kpiSubPill, { color: '#DC2626' }]}>Reorder Now</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{lowStockProducts.length}</Text>
            <Text style={styles.kpiLabel}>Low Stock Alerts</Text>
          </TouchableOpacity>

          {/* Card 5: Near Expiry Warnings */}
          <TouchableOpacity
            style={[styles.kpiCard, expiringSoonProducts.length > 0 && { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' }]}
            onPress={() => {
              setActiveTab('PRODUCTS');
              setProductFilterType('EXPIRING');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.kpiEmoji}>⏳</Text>
              <Text style={[styles.kpiSubPill, { color: '#EA580C' }]}>≤15 Days</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#EA580C' }]}>{expiringSoonProducts.length}</Text>
            <Text style={styles.kpiLabel}>Near Expiry Alert</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Primary Functional Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'PRODUCTS' && styles.mainTabActive]}
            onPress={() => setActiveTab('PRODUCTS')}
          >
            <Ionicons name="cube-outline" size={16} color={activeTab === 'PRODUCTS' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.mainTabText, activeTab === 'PRODUCTS' && styles.mainTabTextActive]}>
              Products ({totalProducts})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'ANALYTICS' && styles.mainTabActive]}
            onPress={() => setActiveTab('ANALYTICS')}
          >
            <Ionicons name="bar-chart-outline" size={16} color={activeTab === 'ANALYTICS' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.mainTabText, activeTab === 'ANALYTICS' && styles.mainTabTextActive]}>
              Valuation & ABC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'LOGS' && styles.mainTabActive]}
            onPress={() => setActiveTab('LOGS')}
          >
            <Ionicons name="document-text-outline" size={16} color={activeTab === 'LOGS' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.mainTabText, activeTab === 'LOGS' && styles.mainTabTextActive]}>
              Audit Ledger ({stockMovements.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'SUPPLIERS' && styles.mainTabActive]}
            onPress={() => setActiveTab('SUPPLIERS')}
          >
            <Ionicons name="bus-outline" size={16} color={activeTab === 'SUPPLIERS' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.mainTabText, activeTab === 'SUPPLIERS' && styles.mainTabTextActive]}>
              Suppliers & POs ({purchaseOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'AUDIT' && styles.mainTabActive]}
            onPress={() => setActiveTab('AUDIT')}
          >
            <Ionicons name="checkbox-outline" size={16} color={activeTab === 'AUDIT' ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.mainTabText, activeTab === 'AUDIT' && styles.mainTabTextActive]}>
              Physical Stock Take
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* ========================================================= */}
        {/* TAB 1: PRODUCTS & CATALOG                                */}
        {/* ========================================================= */}
        {activeTab === 'PRODUCTS' && (
          <View>
            {/* Search & Barcode Scan Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products by name, SKU, location..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => showToast('Point camera at product barcode...')}>
                  <Ionicons name="barcode-outline" size={20} color="#2563EB" />
                </TouchableOpacity>
              )}
            </View>

            {/* Type Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  { key: 'ALL', label: 'All Items' },
                  { key: 'STOCK', label: '📦 Stock Tracked' },
                  { key: 'NON_STOCK', label: '⚡ Loose & Services' },
                  { key: 'LOW_STOCK', label: '⚠️ Low Stock (' + lowStockProducts.length + ')' },
                  { key: 'EXPIRING', label: '⏳ Near Expiry (' + expiringSoonProducts.length + ')' },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterPill, productFilterType === f.key && styles.filterPillActive]}
                    onPress={() => setProductFilterType(f.key as any)}
                  >
                    <Text style={[styles.filterPillText, productFilterType === f.key && styles.filterPillTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.catPillText, selectedCategory === cat && styles.catPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Product Cards List */}
            {filteredProducts.map((p) => {
              const isLow = p.type === 'STOCK' && p.stockQuantity <= p.reorderLevel;
              const isOut = p.type === 'STOCK' && p.stockQuantity === 0;

              return (
                <View key={p.id} style={[styles.productCard, !p.active && styles.productCardInactive]}>
                  {/* Top Bar */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.productEmojiBox}>
                      <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.productCardName}>{p.name}</Text>
                        <Switch
                          value={p.active}
                          onValueChange={() => toggleProductActive(p.id)}
                          trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                          thumbColor={p.active ? '#2563EB' : '#94A3B8'}
                        />
                      </View>

                      <Text style={styles.productCardCategory}>
                        {p.category} • {p.type === 'NON_STOCK' ? 'Non-Stock / Loose' : 'SKU: ' + (p.barcode || 'N/A')}
                      </Text>

                      {/* Storage Location & Batch */}
                      <View style={styles.locationBadgeRow}>
                        {p.storageLocation && (
                          <View style={styles.locBadge}>
                            <Ionicons name="location-outline" size={11} color="#475569" />
                            <Text style={styles.locBadgeText}>{p.storageLocation}</Text>
                          </View>
                        )}
                        {p.batchNumber && (
                          <View style={styles.batchBadge}>
                            <Text style={styles.batchBadgeText}>Lot: {p.batchNumber}</Text>
                          </View>
                        )}
                        {p.expiryDate && (
                          <View style={[styles.expiryBadge, p.expiryDate <= '2026-09-22' && { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.expiryBadgeText, p.expiryDate <= '2026-09-22' && { color: '#DC2626' }]}>
                              Exp: {p.expiryDate}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Financial Valuation & Stock Status Row */}
                  <View style={styles.cardFinancialRow}>
                    <View>
                      <Text style={styles.finLabel}>Selling / Cost Price</Text>
                      <Text style={styles.finPriceVal}>
                        ₹{p.price} <Text style={{ fontSize: 11, color: '#64748B' }}>/{p.unit}</Text>{' '}
                        {p.costPrice && (
                          <Text style={styles.costPriceVal}> (Cost: ₹{p.costPrice})</Text>
                        )}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.finLabel}>Inventory On-Hand</Text>
                      {p.type === 'NON_STOCK' ? (
                        <View style={styles.stockTagNonStock}>
                          <Text style={styles.stockTagNonStockText}>⚡ On-Demand / Scale</Text>
                        </View>
                      ) : isOut ? (
                        <View style={styles.stockTagOut}>
                          <Text style={styles.stockTagOutText}>⚠️ Out of Stock (0 {p.unit})</Text>
                        </View>
                      ) : isLow ? (
                        <View style={styles.stockTagLow}>
                          <Text style={styles.stockTagLowText}>
                            ⚠️ Low Stock: {p.stockQuantity} {p.unit} (≤{p.reorderLevel})
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.stockTagGood}>
                          <Text style={styles.stockTagGoodText}>
                            ✓ {p.stockQuantity} {p.unit} in stock
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Operational Action Buttons Strip */}
                  <View style={styles.productActionsRow}>
                    {p.type === 'STOCK' && (
                      <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => handleOpenRestock(p)}
                      >
                        <Ionicons name="add-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.actionBtnPrimaryText}>+ Restock</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => handleOpenTag(p)}
                    >
                      <Ionicons name="pricetag-outline" size={14} color="#2563EB" />
                      <Text style={styles.actionBtnSecondaryText}>Shelf Tag</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => handleOpenHistory(p)}
                    >
                      <Ionicons name="time-outline" size={14} color="#475569" />
                      <Text style={[styles.actionBtnSecondaryText, { color: '#475569' }]}>History</Text>
                    </TouchableOpacity>

                    {p.type === 'STOCK' && p.stockQuantity > 0 && (
                      <TouchableOpacity
                        style={styles.actionBtnDanger}
                        onPress={() => handleOpenWriteOff(p)}
                      >
                        <Ionicons name="trash-bin-outline" size={14} color="#DC2626" />
                        <Text style={styles.actionBtnDangerText}>Write-Off</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 2: VALUATION & ABC MARGIN ANALYTICS                  */}
        {/* ========================================================= */}
        {activeTab === 'ANALYTICS' && (
          <View>
            {/* 6-Month Inventory Inflow vs Sales & Valuation Trend */}
            <MetricTrendCard
              title="6-Month Inventory Turnover & Stock Dynamics"
              subtitle="Wholesale Stock Purchases (Inflow) vs Customer Sales (Outflow) & Profit Spread"
              icon="cube-outline"
              iconColor="#0D9488"
              chartTypeToggle
              chartType={inventoryChartType}
              onChangeChartType={setInventoryChartType}
              metrics={[
                { label: '6M Restock Inflow', value: '₹3.05L', subText: 'Wholesale POs' },
                { label: '6M Retail Sales', value: '₹3.96L', color: '#16A34A', subText: 'Counter & Online' },
                { label: 'Gross Spread', value: '+₹91.0K', color: '#0D9488', subText: '30% Avg Margin' },
              ]}
              footerNote="Inventory turns over every 14 days on average. Fast-moving staples reordered automatically."
            >
              {inventoryChartType === 'bar' ? (
                <TrendBarChart
                  data={INVENTORY_MONTHLY_TREND}
                  height={195}
                  series1Label="Inflow"
                  series1Color="#0D9488"
                  series2Label="Sales"
                  series2Color="#10B981"
                  series3Label="Margin"
                  series3Color="#6366F1"
                  yAxisPrefix="₹"
                />
              ) : (
                <TrendAreaLineChart
                  data={INVENTORY_VALUATION_AREA}
                  height={185}
                  primaryColor="#0D9488"
                  primaryLabel="Stock Valuation"
                  secondaryColor="#10B981"
                  secondaryLabel="Monthly Sales"
                  showSecondaryLine
                  yAxisPrefix="₹"
                />
              )}
            </MetricTrendCard>

            <View style={styles.analyticsSummaryCard}>
              <Text style={styles.analyticsTitle}>Inventory Valuation & Return on Capital</Text>
              <Text style={styles.analyticsSub}>
                Current capital tied up in society mart inventory vs realizable customer sales.
              </Text>

              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsGridCol}>
                  <Text style={styles.analyticsColLabel}>Total Capital Invested</Text>
                  <Text style={styles.analyticsColValue}>₹{totalCostValuation.toLocaleString()}</Text>
                  <Text style={styles.analyticsColHint}>Wholesale Acquisition Cost</Text>
                </View>

                <View style={styles.analyticsGridCol}>
                  <Text style={styles.analyticsColLabel}>Projected Retail Sales</Text>
                  <Text style={[styles.analyticsColValue, { color: '#16A34A' }]}>
                    ₹{totalRetailValuation.toLocaleString()}
                  </Text>
                  <Text style={styles.analyticsColHint}>Realizable Sales Revenue</Text>
                </View>
              </View>

              <View style={styles.marginBarBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.marginBarTitle}>Gross Profit Spread</Text>
                  <Text style={styles.marginBarVal}>
                    +₹{projectedGrossProfit.toLocaleString()} ({grossMarginPercent}% Margin)
                  </Text>
                </View>
                <View style={styles.marginBarTrack}>
                  <View style={[styles.marginBarFill, { width: `${grossMarginPercent}%` as any }]} />
                </View>
              </View>
            </View>

            {/* ABC Velocity Turnover Analysis */}
            <View style={styles.analyticsSectionCard}>
              <Text style={styles.analyticsSectionTitle}>ABC Inventory Velocity Classification</Text>
              <Text style={styles.analyticsSectionSub}>
                Prioritize inventory replenishment based on sales frequency and turnover.
              </Text>

              {/* Class A */}
              <View style={styles.abcCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.abcBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.abcBadgeText, { color: '#15803D' }]}>CLASS A</Text>
                    </View>
                    <Text style={styles.abcTitle}>High Turnover Staples (70% Volume)</Text>
                  </View>
                  <Text style={styles.abcCount}>
                    {products.filter((p) => p.velocityClass === 'FAST').length} Items
                  </Text>
                </View>
                <Text style={styles.abcDesc}>
                  Daily fresh dairy, table eggs, bakery breads, and loose produce. Requires daily monitoring & automated POs.
                </Text>
              </View>

              {/* Class B */}
              <View style={styles.abcCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.abcBadge, { backgroundColor: '#E0E7FF' }]}>
                      <Text style={[styles.abcBadgeText, { color: '#4338CA' }]}>CLASS B</Text>
                    </View>
                    <Text style={styles.abcTitle}>Moderate Velocity Groceries (20% Volume)</Text>
                  </View>
                  <Text style={styles.abcCount}>
                    {products.filter((p) => p.velocityClass === 'MEDIUM').length} Items
                  </Text>
                </View>
                <Text style={styles.abcDesc}>
                  Packaged chakki atta, sunflower oil, instant noodles, and soft drinks. Weekly supplier replenishment.
                </Text>
              </View>

              {/* Class C */}
              <View style={styles.abcCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.abcBadge, { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[styles.abcBadgeText, { color: '#475569' }]}>CLASS C</Text>
                    </View>
                    <Text style={styles.abcTitle}>Slow-Moving Household Items (10% Volume)</Text>
                  </View>
                  <Text style={styles.abcCount}>
                    {products.filter((p) => p.velocityClass === 'SLOW').length} Items
                  </Text>
                </View>
                <Text style={styles.abcDesc}>
                  Detergent powders, cleaning agents, and long shelf-life supplies. Bi-weekly or monthly orders.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STOCK AUDIT LOG (INVENTORY LEDGER)                */}
        {/* ========================================================= */}
        {activeTab === 'LOGS' && (
          <View>
            <View style={styles.auditLogHeaderCard}>
              <Text style={styles.auditLogTitle}>Immutable Stock Movement Ledger</Text>
              <Text style={styles.auditLogSub}>
                Every stock addition, resident POS checkout, damage write-off, and physical count audit is cryptographically logged.
              </Text>
            </View>

            {stockMovements.map((mov) => {
              const isPositive = mov.quantityChange > 0;
              const isZero = mov.quantityChange === 0;

              let typeColor = '#2563EB';
              let typeBg = '#EFF6FF';
              let typeLabel: string = mov.type;

              if (mov.type === 'PURCHASE_RECEIPT') {
                typeColor = '#16A34A';
                typeBg = '#DCFCE7';
                typeLabel = '📥 GOODS RECEIPT';
              } else if (mov.type === 'POS_SALE') {
                typeColor = '#2563EB';
                typeBg = '#EFF6FF';
                typeLabel = '🛒 POS SALE';
              } else if (mov.type === 'DAMAGE_SPOILAGE') {
                typeColor = '#DC2626';
                typeBg = '#FEE2E2';
                typeLabel = '⚠️ WRITE-OFF';
              } else if (mov.type === 'AUDIT_CORRECTION') {
                typeColor = '#7C3AED';
                typeBg = '#EDE9FE';
                typeLabel = '⚖️ PHYSICAL AUDIT';
              }

              return (
                <View key={mov.id} style={styles.movementCard}>
                  <View style={styles.movementTopRow}>
                    <View style={[styles.movementTypeTag, { backgroundColor: typeBg }]}>
                      <Text style={[styles.movementTypeTagText, { color: typeColor }]}>{typeLabel}</Text>
                    </View>
                    <Text style={styles.movementTime}>{mov.timestamp}</Text>
                  </View>

                  <View style={styles.movementBodyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.movementProductName}>{mov.productName}</Text>
                      <Text style={styles.movementReason}>{mov.reason}</Text>
                      <Text style={styles.movementUser}>By: {mov.performedBy || 'System'}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.movementDelta,
                          isPositive ? { color: '#16A34A' } : isZero ? { color: '#64748B' } : { color: '#DC2626' },
                        ]}
                      >
                        {isPositive ? '+' + mov.quantityChange : mov.quantityChange}
                      </Text>
                      <Text style={styles.movementBalance}>
                        {mov.previousStock} ➔ {mov.newStock} units
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SUPPLIERS & PURCHASE ORDERS                       */}
        {/* ========================================================= */}
        {activeTab === 'SUPPLIERS' && (
          <View>
            {/* Action Bar */}
            <View style={styles.poActionBar}>
              <Text style={styles.poSectionTitle}>Wholesale Purchase Orders</Text>
              <TouchableOpacity style={styles.createPoBtn} onPress={() => setPoModalVisible(true)}>
                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                <Text style={styles.createPoBtnText}>+ Create Purchase Order</Text>
              </TouchableOpacity>
            </View>

            {/* Purchase Orders List */}
            {purchaseOrders.map((po) => (
              <View key={po.id} style={styles.poCard}>
                <View style={styles.poHeaderRow}>
                  <View>
                    <Text style={styles.poNumber}>{po.poNumber}</Text>
                    <Text style={styles.poSupplier}>{po.supplierName}</Text>
                  </View>

                  <View
                    style={[
                      styles.poStatusPill,
                      po.status === 'RECEIVED'
                        ? { backgroundColor: '#DCFCE7' }
                        : po.status === 'SENT'
                        ? { backgroundColor: '#EFF6FF' }
                        : { backgroundColor: '#F1F5F9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.poStatusPillText,
                        po.status === 'RECEIVED'
                          ? { color: '#15803D' }
                          : po.status === 'SENT'
                          ? { color: '#1D4ED8' }
                          : { color: '#475569' },
                      ]}
                    >
                      {po.status === 'RECEIVED' ? '✓ RECEIVED (RESTOCKED)' : po.status === 'SENT' ? '🚚 SENT / EN ROUTE' : 'DRAFT'}
                    </Text>
                  </View>
                </View>

                {/* Items Ordered */}
                <View style={styles.poItemsBox}>
                  {po.items.map((it, idx) => (
                    <View key={idx} style={styles.poItemLine}>
                      <Text style={styles.poItemName}>
                        {it.productName} ({it.quantityOrdered} {it.unit})
                      </Text>
                      <Text style={styles.poItemPrice}>₹{it.totalCost}</Text>
                    </View>
                  ))}
                </View>

                {/* Meta details */}
                <View style={styles.poMetaRow}>
                  <Text style={styles.poMetaText}>Expected: {po.expectedDeliveryDate}</Text>
                  <Text style={styles.poTotalVal}>Total: ₹{po.totalEstimatedCost}</Text>
                </View>

                {/* PO Actions */}
                <View style={styles.poActionButtonsRow}>
                  <TouchableOpacity
                    style={styles.poWhatsAppBtn}
                    onPress={() => handleSharePoWhatsApp(po)}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    <Text style={styles.poWhatsAppBtnText}>Send PO on WhatsApp</Text>
                  </TouchableOpacity>

                  {po.status !== 'RECEIVED' && (
                    <TouchableOpacity
                      style={styles.poReceiveBtn}
                      onPress={() => handleReceivePo(po)}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                      <Text style={styles.poReceiveBtnText}>Receive Delivery (GRN)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Wholesale Supplier Directory */}
            <Text style={[styles.poSectionTitle, { marginTop: 20, marginBottom: 10 }]}>
              Verified Wholesale Distributors ({suppliers.length})
            </Text>

            {suppliers.map((sup) => (
              <View key={sup.id} style={styles.supplierCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.supName}>{sup.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{sup.rating}</Text>
                  </View>
                </View>

                <Text style={styles.supCategory}>{sup.category} • Lead Time: {sup.leadTimeDays} Day(s)</Text>
                <Text style={styles.supContact}>Contact: {sup.contactPerson} ({sup.phone})</Text>

                <View style={styles.supActionRow}>
                  <TouchableOpacity
                    style={styles.supCallBtn}
                    onPress={() => Linking.openURL('tel:' + sup.phone.replace(/\D/g, ''))}
                  >
                    <Ionicons name="call" size={14} color="#2563EB" />
                    <Text style={styles.supCallBtnText}>Call Supplier</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supPoOrderBtn}
                    onPress={() => {
                      setPoSupplierId(sup.id);
                      setPoModalVisible(true);
                    }}
                  >
                    <Ionicons name="document-text" size={14} color="#FFFFFF" />
                    <Text style={styles.supPoOrderBtnText}>Draft PO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PHYSICAL STOCK TAKE / CYCLE COUNT                  */}
        {/* ========================================================= */}
        {activeTab === 'AUDIT' && (
          <View>
            <View style={styles.auditInfoCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="clipboard" size={24} color="#7C3AED" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditInfoTitle}>Physical Inventory Count Audit</Text>
                  <Text style={styles.auditInfoSub}>
                    Enter actual physical counts on shelves to identify shrinkage, leaks, or unaccounted stock.
                  </Text>
                </View>
              </View>
            </View>

            {/* Audit Table */}
            <View style={styles.auditTableCard}>
              <View style={styles.auditTableHeader}>
                <Text style={[styles.auditTh, { flex: 3 }]}>Product</Text>
                <Text style={[styles.auditTh, { flex: 1.5, textAlign: 'center' }]}>System</Text>
                <Text style={[styles.auditTh, { flex: 2, textAlign: 'center' }]}>Physical Count</Text>
                <Text style={[styles.auditTh, { flex: 1.5, textAlign: 'right' }]}>Variance</Text>
              </View>

              {stockProducts.map((p) => {
                const entered = auditCounts[p.id];
                const countNum = entered !== undefined && entered !== '' ? parseInt(entered, 10) : p.stockQuantity;
                const variance = countNum - p.stockQuantity;

                return (
                  <View key={p.id} style={styles.auditTableRow}>
                    <View style={{ flex: 3 }}>
                      <Text style={styles.auditItemName}>{p.name}</Text>
                      <Text style={styles.auditItemLoc}>{p.storageLocation || 'Mart Shelf'}</Text>
                    </View>

                    <Text style={[styles.auditItemSystem, { flex: 1.5 }]}>
                      {p.stockQuantity} {p.unit}
                    </Text>

                    <View style={{ flex: 2, alignItems: 'center' }}>
                      <TextInput
                        style={styles.auditInput}
                        keyboardType="numeric"
                        placeholder={p.stockQuantity.toString()}
                        value={auditCounts[p.id] !== undefined ? auditCounts[p.id] : ''}
                        onChangeText={(txt) => setAuditCounts({ ...auditCounts, [p.id]: txt })}
                      />
                    </View>

                    <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.auditVarianceText,
                          variance < 0 ? { color: '#DC2626' } : variance > 0 ? { color: '#16A34A' } : { color: '#64748B' },
                        ]}
                      >
                        {variance > 0 ? '+' + variance : variance}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Reconcile Action Button */}
            <TouchableOpacity style={styles.applyAuditBtn} onPress={handleApplyAuditReconciliation}>
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.applyAuditBtnText}>Reconcile & Apply Stock Corrections</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 0: EXCEL / CSV BULK STOCK UPLOAD & RECONCILIATION   */}
      {/* ========================================================= */}
      <Modal visible={excelModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.excelModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-attach" size={20} color="#059669" />
                <Text style={styles.modalHeaderTitle}>Upload Stock via Excel / CSV</Text>
              </View>
              <TouchableOpacity onPress={() => setExcelModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Upload Sub-Tabs */}
            <View style={styles.excelSubTabBar}>
              <TouchableOpacity
                style={[styles.excelSubTab, excelInputMode === 'FILE' && styles.excelSubTabActive]}
                onPress={() => setExcelInputMode('FILE')}
              >
                <Ionicons name="document" size={14} color={excelInputMode === 'FILE' ? '#059669' : '#64748B'} />
                <Text style={[styles.excelSubTabText, excelInputMode === 'FILE' && styles.excelSubTabTextActive]}>
                  Select File
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.excelSubTab, excelInputMode === 'PASTE' && styles.excelSubTabActive]}
                onPress={() => setExcelInputMode('PASTE')}
              >
                <Ionicons name="clipboard" size={14} color={excelInputMode === 'PASTE' ? '#059669' : '#64748B'} />
                <Text style={[styles.excelSubTabText, excelInputMode === 'PASTE' && styles.excelSubTabTextActive]}>
                  Paste Spreadsheet
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.excelSubTab, excelInputMode === 'GUIDE' && styles.excelSubTabActive]}
                onPress={() => setExcelInputMode('GUIDE')}
              >
                <Ionicons name="help-circle" size={14} color={excelInputMode === 'GUIDE' ? '#059669' : '#64748B'} />
                <Text style={[styles.excelSubTabText, excelInputMode === 'GUIDE' && styles.excelSubTabTextActive]}>
                  Format Guide
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {/* Mode 1: File Upload */}
              {excelInputMode === 'FILE' && (
                <View>
                  <TouchableOpacity
                    style={styles.fileDropZone}
                    onPress={() => {
                      if (Platform.OS === 'web' && fileInputRef.current) {
                        fileInputRef.current.click();
                      } else {
                        showToast('Please paste data in "Paste Spreadsheet" tab on mobile');
                      }
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={42} color="#059669" />
                    <Text style={styles.dropZoneTitle}>
                      {uploadedFileName ? 'Selected: ' + uploadedFileName : 'Click to Browse Excel / CSV File'}
                    </Text>
                    <Text style={styles.dropZoneSub}>
                      Supports .csv, .tsv, .xlsx exported files. Click to select from your computer.
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={styles.downloadTemplateLinkBtn}
                      onPress={handleDownloadExcelTemplate}
                    >
                      <Ionicons name="download-outline" size={14} color="#059669" />
                      <Text style={styles.downloadTemplateLinkText}>Need a template? Download here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Mode 2: Paste Spreadsheet Cells */}
              {excelInputMode === 'PASTE' && (
                <View>
                  <Text style={styles.formLabel}>Paste copied cells from Excel / Google Sheets:</Text>
                  <TextInput
                    style={styles.pasteTextarea}
                    multiline
                    numberOfLines={8}
                    placeholder="Paste CSV or Tab-Separated table directly from Excel here..."
                    value={pastedCsvText}
                    onChangeText={setPastedCsvText}
                  />

                  <TouchableOpacity
                    style={styles.parsePastedBtn}
                    onPress={() => parseSpreadsheetData(pastedCsvText)}
                  >
                    <Ionicons name="code-working" size={16} color="#FFFFFF" />
                    <Text style={styles.parsePastedBtnText}>Parse & Validate Pasted Rows</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Mode 3: Format Guide */}
              {excelInputMode === 'GUIDE' && (
                <View style={styles.guideBox}>
                  <Text style={styles.guideTitle}>Expected Column Headers:</Text>
                  <Text style={styles.guideCode}>
                    Barcode_SKU, Product_Name, Category, Selling_Price, Cost_Price, Unit, Type, Stock_Quantity, Reorder_Level, Batch_Number, Expiry_Date, Storage_Location, Supplier_Name
                  </Text>
                  <Text style={styles.guideHelp}>
                    • If a row's Barcode or Product Name matches an existing product in the catalog, its stock count, price, and location will be updated.\n
                    • If the product does not exist, it will be automatically added as a new item.\n
                    • An audit movement log is created for all updated and new products.
                  </Text>
                </View>
              )}

              {/* Parsed Reconciliation Preview */}
              {parsedRows.length > 0 && importSummary && (
                <View style={styles.parsedSummaryCard}>
                  <Text style={styles.parsedSummaryTitle}>Validation & Reconciliation Summary</Text>
                  <View style={styles.summaryMetricsRow}>
                    <View style={styles.summaryMetricPill}>
                      <Text style={styles.summaryMetricVal}>{importSummary.total}</Text>
                      <Text style={styles.summaryMetricLabel}>Total Valid Rows</Text>
                    </View>
                    <View style={[styles.summaryMetricPill, { backgroundColor: '#EFF6FF' }]}>
                      <Text style={[styles.summaryMetricVal, { color: '#1D4ED8' }]}>{importSummary.updates}</Text>
                      <Text style={styles.summaryMetricLabel}>Stock Updates</Text>
                    </View>
                    <View style={[styles.summaryMetricPill, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.summaryMetricVal, { color: '#15803D' }]}>{importSummary.newItems}</Text>
                      <Text style={styles.summaryMetricLabel}>New Products</Text>
                    </View>
                  </View>

                  {/* Preview First 4 Rows */}
                  <Text style={[styles.formLabel, { marginTop: 10 }]}>Preview Items to be Applied:</Text>
                  <View style={{ gap: 4 }}>
                    {parsedRows.slice(0, 5).map((r, idx) => (
                      <View key={idx} style={styles.previewRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.previewName}>{r.name}</Text>
                          <Text style={styles.previewSub}>
                            {r.category || 'General'} • ₹{r.price} • {r.storageLocation || 'Aisle 1'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.previewStock}>Stock: {r.stockQuantity} {r.unit}</Text>
                          <Text style={[styles.previewBadge, r.isExisting ? { color: '#2563EB' } : { color: '#16A34A' }]}>
                            {r.isExisting ? 'Update Stock' : '+ New Item'}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {parsedRows.length > 5 && (
                      <Text style={styles.moreRowsText}>+ {parsedRows.length - 5} more items in this upload</Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Commit Button */}
            {parsedRows.length > 0 && (
              <TouchableOpacity style={styles.commitUploadBtn} onPress={handleCommitBulkImport}>
                <Ionicons name="cloud-done" size={18} color="#FFFFFF" />
                <Text style={styles.commitUploadBtnText}>
                  Confirm & Apply {parsedRows.length} Items to Inventory
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT PRODUCT MODAL                         */}
      {/* ========================================================= */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Add New Product to Mart</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }}>
              <Text style={styles.formLabel}>Product Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Amul Butter 500g"
                value={formName}
                onChangeText={setFormName}
              />

              {/* Type Selection */}
              <Text style={styles.formLabel}>Inventory Tracking Type</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <TouchableOpacity
                  style={[styles.typeSelectPill, formType === 'STOCK' && styles.typeSelectPillActive]}
                  onPress={() => setFormType('STOCK')}
                >
                  <Text style={[styles.typeSelectText, formType === 'STOCK' && styles.typeSelectTextActive]}>
                    📦 Stock Tracked (Unit Counts)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeSelectPill, formType === 'NON_STOCK' && styles.typeSelectPillActiveNonStock]}
                  onPress={() => setFormType('NON_STOCK')}
                >
                  <Text style={[styles.typeSelectText, formType === 'NON_STOCK' && styles.typeSelectTextActive]}>
                    ⚡ Loose / Weighable / Service
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Selling Price (₹) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 260"
                    keyboardType="numeric"
                    value={formPrice}
                    onChangeText={setFormPrice}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Wholesale Cost (₹)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 235"
                    keyboardType="numeric"
                    value={formCostPrice}
                    onChangeText={setFormCostPrice}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Category</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Dairy, Pantry"
                    value={formCategory}
                    onChangeText={setFormCategory}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Unit (pcs, kg, litre...)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="pcs"
                    value={formUnit}
                    onChangeText={setFormUnit}
                  />
                </View>
              </View>

              {formType === 'STOCK' && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Initial Stock</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="25"
                      keyboardType="numeric"
                      value={formStockQty}
                      onChangeText={setFormStockQty}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Reorder Alert Level</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="5"
                      keyboardType="numeric"
                      value={formReorderLevel}
                      onChangeText={setFormReorderLevel}
                    />
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Storage Location (Aisle/Bin)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Chiller 1 • Shelf 2"
                    value={formLocation}
                    onChangeText={setFormLocation}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Batch / Lot #</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="BAT-2026-09"
                    value={formBatch}
                    onChangeText={setFormBatch}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Expiry Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="2027-06-30"
                    value={formExpiry}
                    onChangeText={setFormExpiry}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Barcode / SKU</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="890123456789"
                    value={formBarcode}
                    onChangeText={setFormBarcode}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitFormBtn} onPress={handleSaveNewProduct}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitFormBtnText}>Save Product to Inventory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: QUICK RESTOCK MODAL                              */}
      {/* ========================================================= */}
      <Modal visible={restockModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.restockModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Restock Product Units</Text>
              <TouchableOpacity onPress={() => setRestockModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {restockProduct && (
              <View>
                <Text style={styles.restockProductName}>
                  {restockProduct.emoji} {restockProduct.name}
                </Text>
                <Text style={styles.restockCurrentStock}>
                  Current Stock: {restockProduct.stockQuantity} {restockProduct.unit}
                </Text>

                <Text style={styles.formLabel}>Quantity to Add *</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={restockQty}
                  onChangeText={setRestockQty}
                />

                {/* Quick Addition Pills */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 10 }}>
                  {['10', '25', '50', '100'].map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={styles.quickAddPill}
                      onPress={() => setRestockQty(q)}
                    >
                      <Text style={styles.quickAddPillText}>+{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Restock Reason / PO Reference</Text>
                <TextInput
                  style={styles.formInput}
                  value={restockReason}
                  onChangeText={setRestockReason}
                />

                <TouchableOpacity style={styles.confirmRestockBtn} onPress={handleConfirmRestock}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmRestockBtnText}>Confirm Restock & Update Stock</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: PRODUCT STOCK MOVEMENT HISTORY                   */}
      {/* ========================================================= */}
      <Modal visible={historyModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.historyModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Movement History</Text>
                {historyProduct && (
                  <Text style={styles.historyProductSub}>{historyProduct.name}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {historyProduct &&
                stockMovements
                  .filter((m) => m.productId === historyProduct.id)
                  .map((m) => (
                    <View key={m.id} style={styles.historyItemCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.historyItemType}>{m.type}</Text>
                        <Text
                          style={[
                            styles.historyItemDelta,
                            m.quantityChange > 0 ? { color: '#16A34A' } : { color: '#DC2626' },
                          ]}
                        >
                          {m.quantityChange > 0 ? '+' + m.quantityChange : m.quantityChange}
                        </Text>
                      </View>
                      <Text style={styles.historyItemReason}>{m.reason}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={styles.historyItemBalance}>
                          {m.previousStock} ➔ {m.newStock} units
                        </Text>
                        <Text style={styles.historyItemDate}>{m.timestamp}</Text>
                      </View>
                    </View>
                  ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: DAMAGE & SPOILAGE WRITE-OFF                      */}
      {/* ========================================================= */}
      <Modal visible={writeOffModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.writeOffModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Write-Off Damaged / Expired Stock</Text>
              <TouchableOpacity onPress={() => setWriteOffModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {writeOffProduct && (
              <View>
                <Text style={styles.writeOffProductTitle}>
                  {writeOffProduct.emoji} {writeOffProduct.name}
                </Text>
                <Text style={styles.writeOffCurrentStock}>
                  Available on Shelf: {writeOffProduct.stockQuantity} {writeOffProduct.unit}
                </Text>

                <Text style={styles.formLabel}>Quantity to Write Off *</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={writeOffQty}
                  onChangeText={setWriteOffQty}
                />

                <Text style={styles.formLabel}>Reason for Write-Off</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {[
                    { key: 'EXPIRED', label: 'Expired ⏳' },
                    { key: 'DAMAGED', label: 'Damaged Packaging 💥' },
                    { key: 'THEFT', label: 'Shrinkage / Missing 🔍' },
                    { key: 'OTHER', label: 'Quality Reject ❌' },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.writeOffPill, writeOffReason === r.key && styles.writeOffPillActive]}
                      onPress={() => setWriteOffReason(r.key as any)}
                    >
                      <Text style={[styles.writeOffPillText, writeOffReason === r.key && styles.writeOffPillTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Audit Note / Explanation</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Broken seal, carton water damaged..."
                  value={writeOffNotes}
                  onChangeText={setWriteOffNotes}
                />

                <TouchableOpacity style={styles.confirmWriteOffBtn} onPress={handleConfirmWriteOff}>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmWriteOffBtnText}>Record Write-Off & Deduct Stock</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 5: CREATE PURCHASE ORDER                            */}
      {/* ========================================================= */}
      <Modal visible={poModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.poModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Create Wholesale Purchase Order</Text>
              <TouchableOpacity onPress={() => setPoModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              <Text style={styles.formLabel}>Select Supplier</Text>
              <View style={{ gap: 6, marginBottom: 10 }}>
                {suppliers.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.supSelectPill, poSupplierId === s.id && styles.supSelectPillActive]}
                    onPress={() => setPoSupplierId(s.id)}
                  >
                    <Text style={[styles.supSelectTitle, poSupplierId === s.id && styles.supSelectTitleActive]}>
                      {s.name}
                    </Text>
                    <Text style={styles.supSelectSub}>{s.category} • Lead Time: {s.leadTimeDays}d</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Select Items to Order</Text>
              <View style={{ gap: 6 }}>
                {stockProducts.slice(0, 6).map((p) => {
                  const qty = poSelectedItems[p.id] || 0;
                  return (
                    <View key={p.id} style={styles.poItemSelectRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.poItemSelectName}>{p.name}</Text>
                        <Text style={styles.poItemSelectPrice}>Wholesale: ₹{p.costPrice || p.price * 0.8} / {p.unit}</Text>
                      </View>
                      <View style={styles.poItemStepper}>
                        <TouchableOpacity
                          style={styles.poStepBtn}
                          onPress={() =>
                            setPoSelectedItems({
                              ...poSelectedItems,
                              [p.id]: Math.max(0, qty - 10),
                            })
                          }
                        >
                          <Text style={styles.poStepBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.poStepQtyText}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.poStepBtn}
                          onPress={() =>
                            setPoSelectedItems({
                              ...poSelectedItems,
                              [p.id]: qty + 10,
                            })
                          }
                        >
                          <Text style={styles.poStepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.formLabel, { marginTop: 12 }]}>Expected Delivery</Text>
              <TextInput
                style={styles.formInput}
                value={poExpectedDate}
                onChangeText={setPoExpectedDate}
              />

              <Text style={styles.formLabel}>Delivery Instructions</Text>
              <TextInput
                style={styles.formInput}
                value={poNotes}
                onChangeText={setPoNotes}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.submitPoBtn}
              onPress={() => {
                const supplier = suppliers.find((s) => s.id === poSupplierId) || suppliers[0];
                const poItems = Object.entries(poSelectedItems)
                  .filter(([_, q]) => q > 0)
                  .map(([pId, q]) => {
                    const prod = products.find((p) => p.id === pId);
                    const unitCost = prod?.costPrice || (prod ? Math.round(prod.price * 0.8) : 50);
                    return {
                      productId: pId,
                      productName: prod?.name || 'Product',
                      unit: prod?.unit || 'pcs',
                      quantityOrdered: q,
                      unitCost,
                      totalCost: unitCost * q,
                    };
                  });

                if (poItems.length === 0) {
                  showToast('⚠️ Please select at least one item quantity to order');
                  return;
                }

                const createdPo = createPurchaseOrder({
                  supplierId: supplier.id,
                  supplierName: supplier.name,
                  supplierPhone: supplier.phone,
                  items: poItems,
                  expectedDeliveryDate: poExpectedDate,
                  notes: poNotes,
                });

                setPoModalVisible(false);
                setPoSelectedItems({});
                showToast('✓ Created ' + createdPo.poNumber + '!');
                handleSharePoWhatsApp(createdPo);
              }}
            >
              <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
              <Text style={styles.submitPoBtnText}>Generate PO & Send on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 6: SHELF PRICE TAG & BARCODE PRINT MODAL            */}
      {/* ========================================================= */}
      <Modal visible={tagModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.shelfTagCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Retail Shelf Price Tag</Text>
              <TouchableOpacity onPress={() => setTagModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {tagProduct && (
              <View style={styles.shelfTagSlip}>
                <View style={styles.shelfTagTop}>
                  <Text style={styles.shelfTagMart}>AMA SOCIETY FRESH MART</Text>
                  <Text style={styles.shelfTagLoc}>{tagProduct.storageLocation || 'Aisle 1'}</Text>
                </View>

                <Text style={styles.shelfTagProductName}>{tagProduct.name}</Text>
                <Text style={styles.shelfTagNet}>Net Quantity: 1 {tagProduct.unit}</Text>

                <View style={styles.shelfTagPriceRow}>
                  <View>
                    <Text style={styles.shelfTagMrp}>MRP: ₹{Math.round(tagProduct.price * 1.15)}</Text>
                    <Text style={styles.shelfTagDiscount}>Save 15% at Mart</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.shelfTagOfferLabel}>MART OFFER PRICE</Text>
                    <Text style={styles.shelfTagPrice}>₹{tagProduct.price}</Text>
                  </View>
                </View>

                {/* Barcode Graphic Monospace */}
                <View style={styles.shelfTagBarcodeBox}>
                  <Text style={styles.barcodeLines}>||| | |||| ||| ||||| ||||| || |||</Text>
                  <Text style={styles.barcodeText}>{tagProduct.barcode || '890123456789'}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.printTagBtn}
              onPress={() => {
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.print();
                } else {
                  Alert.alert('Print Shelf Tag', 'Directing ESC/POS label tag to Bluetooth label printer...');
                }
              }}
            >
              <Ionicons name="print" size={16} color="#FFFFFF" />
              <Text style={styles.printTagBtnText}>Print Shelf Price Label</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toastBanner: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 99,
  },
  toastText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  excelOperationsStrip: {
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  excelStripTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  excelStripSub: {
    fontSize: 10,
    color: '#047857',
    marginTop: 1,
  },
  excelButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  excelBtnTemplate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  excelBtnTemplateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  excelBtnExport: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  excelBtnExportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  excelBtnUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 5,
    shadowColor: '#059669',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  excelBtnUploadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  kpiContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  kpiCard: {
    width: 145,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
  },
  kpiEmoji: {
    fontSize: 18,
  },
  kpiSubPill: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mainTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  mainTabActive: {
    backgroundColor: '#2563EB',
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  mainTabTextActive: {
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardInactive: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  productCardCategory: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  locationBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  locBadgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  batchBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  batchBadgeText: {
    fontSize: 10,
    color: '#3730A3',
    fontWeight: '600',
  },
  expiryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiryBadgeText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '700',
  },
  cardFinancialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  finLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  finPriceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  costPriceVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stockTagGood: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  stockTagGoodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  stockTagLow: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  stockTagLowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  stockTagOut: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  stockTagOutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  stockTagNonStock: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  stockTagNonStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
  },
  productActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnSecondaryText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnDangerText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Analytics Tab Styles */
  analyticsSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  analyticsSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  analyticsGridCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  analyticsColLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  analyticsColValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  analyticsColHint: {
    fontSize: 10,
    color: '#94A3B8',
  },
  marginBarBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  marginBarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  marginBarVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  marginBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  marginBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  analyticsSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  analyticsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  analyticsSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  abcCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  abcBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  abcBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  abcTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  abcCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  abcDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },

  /* Audit Log Styles */
  auditLogHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  auditLogTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  auditLogSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  movementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  movementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  movementTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  movementTypeTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  movementTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  movementBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movementProductName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  movementReason: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  movementUser: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  movementDelta: {
    fontSize: 16,
    fontWeight: '900',
  },
  movementBalance: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  /* Suppliers & POs Styles */
  poActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  poSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  createPoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  createPoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  poCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  poHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  poNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  poSupplier: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  poStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  poStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  poItemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    gap: 4,
  },
  poItemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poItemName: {
    fontSize: 11,
    color: '#334155',
  },
  poItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  poMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  poMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  poTotalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  poActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  poWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  poWhatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  poReceiveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  poReceiveBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  supplierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  supCategory: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  supContact: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  supActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  supCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  supCallBtnText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  supPoOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  supPoOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Physical Count Audit Styles */
  auditInfoCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  auditInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B21A8',
  },
  auditInfoSub: {
    fontSize: 11,
    color: '#7E22CE',
    marginTop: 2,
    lineHeight: 16,
  },
  auditTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  auditTableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  auditTh: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  auditTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  auditItemLoc: {
    fontSize: 10,
    color: '#64748B',
  },
  auditItemSystem: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },
  auditInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    textAlign: 'center',
    paddingVertical: 4,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  auditVarianceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  applyAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  applyAuditBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  formModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  restockModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  historyModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  writeOffModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  poModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  shelfTagCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  typeSelectPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  typeSelectPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeSelectPillActiveNonStock: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  typeSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  typeSelectTextActive: {
    color: '#FFFFFF',
  },
  submitFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  submitFormBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  restockProductName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  restockCurrentStock: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  quickAddPill: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickAddPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  confirmRestockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  confirmRestockBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyProductSub: {
    fontSize: 12,
    color: '#64748B',
  },
  historyItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  historyItemType: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  historyItemDelta: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyItemReason: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
  },
  historyItemBalance: {
    fontSize: 10,
    color: '#64748B',
  },
  historyItemDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  writeOffProductTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  writeOffCurrentStock: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  writeOffPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  writeOffPillActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  writeOffPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  writeOffPillTextActive: {
    color: '#FFFFFF',
  },
  confirmWriteOffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  confirmWriteOffBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  supSelectPill: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  supSelectPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  supSelectTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  supSelectTitleActive: {
    color: '#2563EB',
  },
  supSelectSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  poItemSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  poItemSelectName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  poItemSelectPrice: {
    fontSize: 10,
    color: '#64748B',
  },
  poItemStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  poStepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  poStepBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  poStepQtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    paddingHorizontal: 6,
  },
  submitPoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  submitPoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shelfTagSlip: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 14,
    marginVertical: 10,
  },
  shelfTagTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingBottom: 4,
    marginBottom: 8,
  },
  shelfTagMart: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350F',
  },
  shelfTagLoc: {
    fontSize: 9,
    color: '#92400E',
    fontWeight: '700',
  },
  shelfTagProductName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
  },
  shelfTagNet: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  shelfTagPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  shelfTagMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  shelfTagDiscount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  shelfTagOfferLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  shelfTagPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#B45309',
  },
  shelfTagBarcodeBox: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  barcodeLines: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    letterSpacing: 2,
    color: '#1E293B',
  },
  barcodeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  printTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
    gap: 6,
  },
  printTagBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Excel Modal Styles */
  excelModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  excelSubTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  excelSubTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  excelSubTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  excelSubTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  excelSubTabTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  fileDropZone: {
    borderWidth: 2,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 8,
    textAlign: 'center',
  },
  dropZoneSub: {
    fontSize: 10,
    color: '#047857',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  downloadTemplateLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadTemplateLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textDecorationLine: 'underline',
  },
  pasteTextarea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 11,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
  },
  parsePastedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  parsePastedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  guideBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  guideCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: 6,
    borderRadius: 4,
    lineHeight: 14,
  },
  guideHelp: {
    fontSize: 11,
    color: '#475569',
    marginTop: 8,
    lineHeight: 16,
  },
  parsedSummaryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  parsedSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  summaryMetricPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryMetricVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryMetricLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewSub: {
    fontSize: 10,
    color: '#64748B',
  },
  previewStock: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewBadge: {
    fontSize: 9,
    fontWeight: '800',
  },
  moreRowsText: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  commitUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  commitUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
