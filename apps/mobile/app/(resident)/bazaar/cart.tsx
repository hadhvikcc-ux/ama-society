import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { BazaarGroupHeader } from '../../../components/bazaar/BazaarGroupHeader';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  useBazaarStore,
  ProductItem,
  CartItem,
  OrderPaymentMethod,
  OrderFulfillment,
  BazaarOrder,
} from '../../../stores/bazaarStore';
import { useAuthStore } from '../../../stores/authStore';
import { UpiPaymentScannerModal } from '../../../components/payment/UpiPaymentScannerModal';
import {
  downloadReceiptPdf,
  shareReceiptPdf,
  normalizeOrderItems,
  formatWhatsAppReceiptMessage,
} from '../../../utils/receiptPdfGenerator';
import { WhatsAppPdfModal } from '../../../components/bazaar/WhatsAppPdfModal';

const RESIDENT_FLATS = [
  { flat: 'Counter', name: 'Walk-in Customer', phone: '' },
  { flat: 'B-204', name: 'Aditya Sharma', phone: '+91 98765 43210' },
  { flat: 'A-101', name: 'Priya Sharma', phone: '+91 98451 23456' },
  { flat: 'C-302', name: 'Rahul Verma', phone: '+91 97412 34567' },
  { flat: 'D-404', name: 'Sunita Rao', phone: '+91 91234 56789' },
  { flat: 'E-501', name: 'Vikram Singh', phone: '+91 99887 76655' },
];

const QUICK_SKUS = [
  { code: 'MILK-001', name: 'Amul Milk 1L', price: 68, emoji: '🥛' },
  { code: 'EGG-012', name: 'Farm Eggs (12)', price: 95, emoji: '🥚' },
  { code: 'TOM-001', name: 'Tomatoes 1kg', price: 45, emoji: '🍅' },
  { code: 'BREAD-001', name: 'Brown Bread', price: 45, emoji: '🍞' },
  { code: 'MAGGI-001', name: 'Maggi 2-Min', price: 14, emoji: '🍜' },
  { code: 'LAYS-001', name: 'Lays Chips', price: 20, emoji: '🥔' },
  { code: 'COKE-001', name: 'Coca Cola 1.5L', price: 90, emoji: '🥤' },
  { code: 'BATTER-001', name: 'Idli Batter 1kg', price: 65, emoji: '🥞' },
];

interface CombinedBazaarProps {
  initialMode?: 'cart' | 'pos';
  embedded?: boolean;
}

export default function CombinedBazaarScreen({ initialMode, embedded = false }: CombinedBazaarProps) {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ mode?: string }>();
  
  // Active UI Mode: 'cart' (Resident Cart & Delivery) or 'pos' (Cashier POS Counter)
  const defaultMode = initialMode || (searchParams.mode === 'pos' ? 'pos' : 'cart');
  const [activeMode, setActiveMode] = useState<'cart' | 'pos'>(defaultMode);

  // Store bindings
  const {
    products,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    activePromoCode,
    discountAmount,
    applyPromo,
    removePromo,
    checkout,
    posCheckout,
    khataAccounts,
    addProduct,
    updateOrderDetails,
  } = useBazaarStore();

  // -------------------------------------------------------------
  // Resident Cart State
  // -------------------------------------------------------------
  const authUser = useAuthStore((s) => s.user);
  const [residentName, setResidentName] = useState(authUser?.name || 'Aditya Sharma');
  const [residentFlat, setResidentFlat] = useState(authUser?.flatNumber || 'B-204');
  const [residentPhone, setResidentPhone] = useState(authUser?.phone || '+91 98765 43210');

  useEffect(() => {
    if (authUser?.name) setResidentName(authUser.name);
    if (authUser?.flatNumber) setResidentFlat(authUser.flatNumber);
    if (authUser?.phone) setResidentPhone(authUser.phone);
  }, [authUser]);

  const [fulfillment, setFulfillment] = useState<OrderFulfillment>('DELIVERY');
  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null);
  const [cartPaymentMethod, setCartPaymentMethod] = useState<OrderPaymentMethod>('UPI');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat B-204, Orchid Towers, Tower B');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccessModal, setOrderSuccessModal] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<BazaarOrder | null>(null);

  // -------------------------------------------------------------
  // Cashier POS State
  // -------------------------------------------------------------
  const [selectedCustomer, setSelectedCustomer] = useState(RESIDENT_FLATS[1]); // Default B-204
  const [selectedDiscountPercent, setSelectedDiscountPercent] = useState<number>(0);
  const [flatDiscountRupees, setFlatDiscountRupees] = useState<number>(0);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [showCatalogShelf, setShowCatalogShelf] = useState(false);

  // Ad-hoc item modal state
  const [adhocModalVisible, setAdhocModalVisible] = useState(false);
  const [adhocName, setAdhocName] = useState('');
  const [adhocPrice, setAdhocPrice] = useState('');
  const [adhocUnit, setAdhocUnit] = useState('pcs');
  const [adhocCategory, setAdhocCategory] = useState('Produce');

  // Thermal Receipt Modal State
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [lastReceiptOrder, setLastReceiptOrder] = useState<BazaarOrder | null>(null);
  const [lastChangeDue, setLastChangeDue] = useState<number>(0);
  const [receiptViewType, setReceiptViewType] = useState<'thermal' | 'digital'>('thermal');

  // WhatsApp PDF Attachment Modal State
  const [whatsAppModalVisible, setWhatsAppModalVisible] = useState(false);
  const [activeWhatsAppOrder, setActiveWhatsAppOrder] = useState<BazaarOrder | null>(null);

  // Universal Modals & Toasts
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [pendingCheckoutOrigin, setPendingCheckoutOrigin] = useState<'cart' | 'pos'>('cart');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------
  // Calculations
  // -------------------------------------------------------------
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cart mode fees & total
  const deliveryFee = fulfillment === 'DELIVERY' ? (cartSubtotal >= 300 ? 0 : 25) : 0;
  const packagingFee = cartSubtotal > 0 ? (cartSubtotal >= 400 ? 0 : 10) : 0;
  const cartTax = Math.round(cartSubtotal * 0.05);
  const cartNetTotal = Math.max(0, cartSubtotal - discountAmount + deliveryFee + packagingFee);

  // POS mode calculations
  const percentDiscountAmt = Math.round((cartSubtotal * selectedDiscountPercent) / 100);
  const posDiscountTotal = percentDiscountAmt + flatDiscountRupees;
  const posNetPayable = Math.max(0, cartSubtotal - posDiscountTotal);
  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - posNetPayable);

  // Customer Flat Khata details
  const currentFlatKhata = khataAccounts[selectedCustomer.flat];
  const currentKhataBalance = currentFlatKhata ? currentFlatKhata.totalOutstanding : 0;

  // Categories & catalog filters
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery && p.active;
    });
  }, [products, activeCategory, searchQuery]);

  // -------------------------------------------------------------
  // Item Operations
  // -------------------------------------------------------------
  const handleAddItemToBill = (product: ProductItem, qty = 1) => {
    if (product.type === 'STOCK' && product.stockQuantity <= 0) {
      showToast('⚠️ ' + product.name + ' is Out of Stock!');
      return;
    }
    addToCart(product, qty);
    showToast('✓ Added ' + product.name);
  };

  const handleBarcodeInputSubmit = () => {
    const code = barcodeInput.trim();
    if (!code) return;

    // Search by exact barcode or partial SKU name
    const found = products.find(
      (p) =>
        p.active &&
        ((p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
          p.name.toLowerCase().includes(code.toLowerCase()))
    );

    if (found) {
      handleAddItemToBill(found, 1);
      setBarcodeInput('');
    } else {
      showToast('❌ Item not found for barcode: ' + code);
    }
  };

  const handleQuickSkuClick = (quick: typeof QUICK_SKUS[0]) => {
    const found = products.find((p) => p.name.toLowerCase().includes(quick.name.toLowerCase().split(' ')[0]));
    if (found) {
      handleAddItemToBill(found, 1);
    } else {
      // Create on-the-fly product
      const created = addProduct({
        name: quick.name,
        category: 'Quick SKU',
        price: quick.price,
        unit: 'pcs',
        type: 'STOCK',
        stockQuantity: 50,
        reorderLevel: 5,
        emoji: quick.emoji,
        active: true,
        barcode: quick.code,
      });
      addToCart(created, 1);
      showToast('✓ Added ' + quick.name);
    }
  };

  const handleAddAdhocItem = () => {
    if (!adhocName.trim() || !adhocPrice.trim()) {
      showToast('⚠️ Please enter item name and price');
      return;
    }
    const priceNum = parseFloat(adhocPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('⚠️ Please enter a valid price');
      return;
    }

    const newProd = addProduct({
      name: adhocName.trim(),
      category: adhocCategory,
      price: priceNum,
      unit: adhocUnit,
      type: 'NON_STOCK',
      stockQuantity: 999,
      reorderLevel: 0,
      emoji: adhocCategory === 'Services' ? '🔧' : adhocCategory === 'Produce' ? '🥬' : '📦',
      active: true,
      barcode: 'ADHOC-' + Date.now().toString().slice(-4),
      notes: 'Counter ad-hoc custom item',
    });

    addToCart(newProd, 1);
    setAdhocModalVisible(false);
    setAdhocName('');
    setAdhocPrice('');
    showToast('✓ Added custom ' + newProd.name + ' (₹' + newProd.price + ')');
  };

  // -------------------------------------------------------------
  // Promo Vouchers (Resident Cart Mode)
  // -------------------------------------------------------------
  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const res = applyPromo(promoInput);
    setPromoFeedback(res.message);
    setTimeout(() => setPromoFeedback(null), 4000);
    setPromoInput('');
  };

  // -------------------------------------------------------------
  // Resident Cart Checkout
  // -------------------------------------------------------------
  const handleResidentCheckout = () => {
    if (cart.length === 0) {
      showToast('⚠️ Cart is empty! Add items first.');
      return;
    }

    if (cartPaymentMethod === 'UPI') {
      setPendingCheckoutOrigin('cart');
      setUpiModalVisible(true);
      return;
    }

    executeResidentCheckout(cartPaymentMethod);
  };

  const executeResidentCheckout = (method: OrderPaymentMethod) => {
    const finalCustomerName = residentName.trim() || authUser?.name || selectedCustomer.name || 'Resident Customer';
    const finalCustomerFlat = residentFlat.trim() || authUser?.flatNumber || (selectedCustomer.flat === 'Counter' ? 'B-204' : selectedCustomer.flat);
    const finalCustomerPhone = residentPhone.trim() || authUser?.phone || selectedCustomer.phone || '+91 98765 43210';

    const order = checkout({
      customerName: finalCustomerName,
      customerFlat: finalCustomerFlat,
      customerPhone: finalCustomerPhone,
      fulfillmentType: fulfillment,
      deliveryAddress: fulfillment === 'DELIVERY' ? deliveryAddress : 'In-Store Counter Pickup',
      paymentMethod: method,
      notes: orderNotes,
    });

    setPlacedOrder(order);
    setOrderSuccessModal(true);
  };

  // -------------------------------------------------------------
  // Cashier POS Checkout
  // -------------------------------------------------------------
  const handlePosCheckout = (method: OrderPaymentMethod) => {
    if (cart.length === 0) {
      showToast('⚠️ Bill is empty! Scan or select items first.');
      return;
    }

    if (method === 'UPI') {
      setPendingCheckoutOrigin('pos');
      setUpiModalVisible(true);
      return;
    }

    executePosCheckout(method);
  };

  const executePosCheckout = (method: OrderPaymentMethod) => {
    const tenderAmount = method === 'CASH' ? tenderedNum : posNetPayable;
    const computedChange = method === 'CASH' ? changeDue : 0;

    const order = posCheckout({
      customerName: selectedCustomer.name,
      customerFlat: selectedCustomer.flat,
      items: [...cart],
      discountAmount: posDiscountTotal,
      paymentMethod: method,
      amountPaid: tenderAmount,
      notes: 'Counter POS sale • Tender: ' + method + (method === 'CASH' ? ' • Change returned: ₹' + computedChange : ''),
    });

    setLastReceiptOrder(order);
    setLastChangeDue(computedChange);
    setReceiptViewType('thermal');
    setReceiptModalVisible(true);

    // Reset cashier tender inputs
    setAmountTendered('');
    clearCart();
  };

  // UPI Modal Success Callback
  const handleUpiModalSuccess = () => {
    setUpiModalVisible(false);
    if (pendingCheckoutOrigin === 'pos') {
      executePosCheckout('UPI');
    } else {
      executeResidentCheckout('UPI');
    }
  };

  // -------------------------------------------------------------
  // Thermal Printing & WhatsApp Receipt Sharing
  // -------------------------------------------------------------
  const handlePrintThermalReceipt = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      Alert.alert(
        'Print Thermal Receipt',
        'Directing thermal print stream (ESC/POS 58mm/80mm) to connected Bluetooth/LAN thermal printer...'
      );
    }
  };

  const handleShareThermalReceiptWhatsApp = async (order: BazaarOrder, change: number) => {
    setActiveWhatsAppOrder(order);
    try {
      const res = await shareReceiptPdf(order);
      if (res.method === 'download-and-whatsapp' || res.method === 'clipboard-fallback') {
        setWhatsAppModalVisible(true);
      }
      showToast('✓ PDF generated & WhatsApp opened!');
    } catch (e) {
      setWhatsAppModalVisible(true);
    }
  };

  const handleShareResidentOrderWhatsApp = async (order: BazaarOrder) => {
    setActiveWhatsAppOrder(order);
    try {
      const res = await shareReceiptPdf(order);
      if (res.method === 'download-and-whatsapp' || res.method === 'clipboard-fallback') {
        setWhatsAppModalVisible(true);
      }
      showToast('✓ PDF generated & WhatsApp opened!');
    } catch (e) {
      setWhatsAppModalVisible(true);
    }
  };

  const handleCopyResidentOrderText = (order: BazaarOrder) => {
    const message = formatWhatsAppReceiptMessage(order);
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(message);
      showToast('📋 Order details copied to clipboard!');
    } else {
      Share.share({ message });
    }
  };

  const handleSaveResidentReceiptFile = (order: BazaarOrder) => {
    try {
      const fileName = downloadReceiptPdf(order);
      if (fileName) {
        showToast(`✓ Downloaded ${fileName}`);
      } else {
        router.push(`/receipts?orderId=${encodeURIComponent(order.orderNumber)}&download=pdf` as any);
      }
    } catch (e) {
      router.push(`/receipts?orderId=${encodeURIComponent(order.orderNumber)}&download=pdf` as any);
    }
  };

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <View style={styles.container}>
      {!embedded && (
        <BazaarGroupHeader
          activeTab="POS_CART"
          showBack
        />
      )}

      {/* Floating Toast Notice */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Mode Switcher Banner */}
      <View style={styles.modeBar}>
        <TouchableOpacity
          style={[styles.modePill, activeMode === 'cart' && styles.modePillActive]}
          onPress={() => setActiveMode('cart')}
        >
          <Ionicons
            name="cart"
            size={16}
            color={activeMode === 'cart' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[styles.modePillText, activeMode === 'cart' && styles.modePillTextActive]}>
            Resident Cart ({totalItemCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modePill, activeMode === 'pos' && styles.modePillActivePos]}
          onPress={() => setActiveMode('pos')}
        >
          <Ionicons
            name="calculator"
            size={16}
            color={activeMode === 'pos' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[styles.modePillText, activeMode === 'pos' && styles.modePillTextActive]}>
            Cashier POS Counter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Context Information Strip */}
      <View style={styles.contextStrip}>
        <Text style={styles.contextStripText}>
          {activeMode === 'cart'
            ? '🛒 Resident Delivery & Mart Pickup • Live cart synced with society counter'
            : '⚡ High-Speed POS Counter • Barcode search, quick SKUs & cash tender calculator'}
        </Text>
        <View style={styles.summaryTag}>
          <Text style={styles.summaryTagText}>
            {totalItemCount} items | ₹{cartSubtotal}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* ========================================================= */}
        {/* RESIDENT CART MODE CONTENT                                */}
        {/* ========================================================= */}
        {activeMode === 'cart' && (
          <View>
            {/* Fulfillment Selector */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Fulfillment Method</Text>
              <View style={styles.fulfillmentRow}>
                <TouchableOpacity
                  style={[
                    styles.fulfillmentOption,
                    fulfillment === 'DELIVERY' && styles.fulfillmentOptionActive,
                  ]}
                  onPress={() => setFulfillment('DELIVERY')}
                >
                  <Ionicons
                    name="bicycle"
                    size={22}
                    color={fulfillment === 'DELIVERY' ? '#059669' : '#6B7280'}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.fulfillmentTitle,
                        fulfillment === 'DELIVERY' && styles.fulfillmentTitleActive,
                      ]}
                    >
                      Society Delivery (₹25)
                    </Text>
                    <Text style={styles.fulfillmentSub}>Doorstep • 25-40 mins ETA</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.fulfillmentOption,
                    fulfillment === 'PICKUP' && styles.fulfillmentOptionActive,
                  ]}
                  onPress={() => setFulfillment('PICKUP')}
                >
                  <Ionicons
                    name="storefront"
                    size={22}
                    color={fulfillment === 'PICKUP' ? '#059669' : '#6B7280'}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.fulfillmentTitle,
                        fulfillment === 'PICKUP' && styles.fulfillmentTitleActive,
                      ]}
                    >
                      Mart Pickup (FREE)
                    </Text>
                    <Text style={styles.fulfillmentSub}>Ground Floor • Ready in 10m</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Delivery Address & Notes */}
              {fulfillment === 'DELIVERY' ? (
                <View style={styles.addressBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="location" size={16} color="#059669" />
                    <Text style={styles.addressLabel}>Delivering to:</Text>
                  </View>
                  <TextInput
                    style={styles.addressInput}
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    placeholder="Enter full flat address..."
                  />
                  <TextInput
                    style={styles.notesInput}
                    value={orderNotes}
                    onChangeText={setOrderNotes}
                    placeholder="Delivery instructions (e.g. leave at door, call on arrival)"
                  />
                </View>
              ) : (
                <View style={styles.pickupInfoBox}>
                  <Ionicons name="information-circle" size={18} color="#2563EB" />
                  <Text style={styles.pickupInfoText}>
                    Pick up your packed bag at Society Mart, Tower B Ground Floor. Show your
                    order confirmation QR or give your flat number.
                  </Text>
                </View>
              )}

              {/* Resident Customer Name & Contact for Bill / Receipt */}
              <View style={[styles.addressBox, { marginTop: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="person-circle" size={16} color="#059669" />
                  <Text style={styles.addressLabel}>Customer Name & Contact for Receipt:</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    style={[styles.addressInput, { flex: 2, marginBottom: 0 }]}
                    value={residentName}
                    onChangeText={setResidentName}
                    placeholder="Resident Full Name"
                  />
                  <TextInput
                    style={[styles.addressInput, { flex: 1, marginBottom: 0 }]}
                    value={residentFlat}
                    onChangeText={setResidentFlat}
                    placeholder="Flat No (e.g. B-204)"
                  />
                </View>
                <TextInput
                  style={[styles.addressInput, { marginBottom: 0 }]}
                  value={residentPhone}
                  onChangeText={setResidentPhone}
                  placeholder="WhatsApp Mobile Number for Receipt"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Cart Line Items */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionCardTitle}>Cart Items ({totalItemCount})</Text>
                {cart.length > 0 && (
                  <TouchableOpacity onPress={clearCart}>
                    <Text style={styles.clearCartText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {cart.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🛒</Text>
                  <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                  <Text style={styles.emptyCartSubtitle}>
                    Add groceries from the mart catalog or use the POS counter bar to scan items!
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      style={styles.browseCatalogBtn}
                      onPress={() => router.push('/(resident)/bazaar' as any)}
                    >
                      <Ionicons name="storefront" size={16} color="#FFFFFF" />
                      <Text style={styles.browseCatalogBtnText}>Browse Mart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.openPosBtn}
                      onPress={() => setActiveMode('pos')}
                    >
                      <Ionicons name="calculator" size={16} color="#4338CA" />
                      <Text style={styles.openPosBtnText}>Open POS Entry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  {cart.map((item) => (
                    <View key={item.productId} style={styles.cartItemRow}>
                      <View style={styles.cartItemEmojiBox}>
                        <Text style={styles.cartItemEmoji}>{item.emoji || '📦'}</Text>
                      </View>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemUnit}>
                          ₹{item.price} / {item.unit || 'unit'}
                        </Text>
                      </View>

                      {/* Stepper */}
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateCartQty(item.productId, -1)}
                        >
                          <Ionicons name="remove" size={14} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.stepperCount}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateCartQty(item.productId, 1)}
                        >
                          <Ionicons name="add" size={14} color="#374151" />
                        </TouchableOpacity>
                      </View>

                      {/* Price & Delete */}
                      <View style={styles.cartItemTotalCol}>
                        <Text style={styles.cartItemTotalText}>₹{item.price * item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => removeFromCart(item.productId)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Cart Action Buttons */}
                  <View style={styles.cartActionStrip}>
                    <TouchableOpacity
                      style={styles.cartActionPill}
                      onPress={() => router.push('/(resident)/bazaar' as any)}
                    >
                      <Ionicons name="add-circle-outline" size={16} color="#059669" />
                      <Text style={styles.cartActionPillText}>+ Add More Products</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cartActionPill, { borderColor: '#6366F1' }]}
                      onPress={() => setActiveMode('pos')}
                    >
                      <Ionicons name="scan-outline" size={16} color="#6366F1" />
                      <Text style={[styles.cartActionPillText, { color: '#6366F1' }]}>
                        ⚡ Fast Barcode Entry
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Promo Vouchers */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Apply Promo Voucher</Text>
              <View style={styles.promoInputRow}>
                <TextInput
                  style={styles.promoTextInput}
                  placeholder="Enter code (e.g. AMA50, GREEN10)"
                  value={promoInput}
                  onChangeText={setPromoInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.promoApplyBtn} onPress={handleApplyPromo}>
                  <Text style={styles.promoApplyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>

              {/* Promo Recommendation Chips */}
              <View style={styles.promoChipsRow}>
                <TouchableOpacity
                  style={styles.promoChip}
                  onPress={() => {
                    setPromoInput('AMA50');
                    applyPromo('AMA50');
                  }}
                >
                  <Text style={styles.promoChipCode}>AMA50</Text>
                  <Text style={styles.promoChipDesc}>₹50 Off (Min ₹199)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.promoChip}
                  onPress={() => {
                    setPromoInput('GREEN10');
                    applyPromo('GREEN10');
                  }}
                >
                  <Text style={styles.promoChipCode}>GREEN10</Text>
                  <Text style={styles.promoChipDesc}>10% Off Grocery</Text>
                </TouchableOpacity>
              </View>

              {promoFeedback && (
                <Text style={styles.promoFeedbackText}>{promoFeedback}</Text>
              )}

              {activePromoCode && (
                <View style={styles.activePromoCard}>
                  <Ionicons name="pricetag" size={16} color="#059669" />
                  <Text style={styles.activePromoText}>
                    Applied '{activePromoCode}': Saved ₹{discountAmount}
                  </Text>
                  <TouchableOpacity onPress={removePromo}>
                    <Text style={styles.removePromoText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Payment Method Selector */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Select Payment Method</Text>

              <TouchableOpacity
                style={[
                  styles.paymentOptionRow,
                  cartPaymentMethod === 'UPI' && styles.paymentOptionRowActive,
                ]}
                onPress={() => setCartPaymentMethod('UPI')}
              >
                <Ionicons
                  name="qr-code"
                  size={20}
                  color={cartPaymentMethod === 'UPI' ? '#059669' : '#6B7280'}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.paymentOptionTitle}>UPI / GPay / PhonePe / QR</Text>
                  <Text style={styles.paymentOptionSubtitle}>Instant verification with dynamic QR scanner</Text>
                </View>
                {cartPaymentMethod === 'UPI' && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOptionRow,
                  cartPaymentMethod === 'CASH' && styles.paymentOptionRowActive,
                ]}
                onPress={() => setCartPaymentMethod('CASH')}
              >
                <Ionicons
                  name="cash"
                  size={20}
                  color={cartPaymentMethod === 'CASH' ? '#059669' : '#6B7280'}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.paymentOptionTitle}>Cash on Delivery (COD)</Text>
                  <Text style={styles.paymentOptionSubtitle}>Pay at your door or upon pickup at mart counter</Text>
                </View>
                {cartPaymentMethod === 'CASH' && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOptionRow,
                  cartPaymentMethod === 'KHATA_FLAT' && styles.paymentOptionRowActive,
                ]}
                onPress={() => setCartPaymentMethod('KHATA_FLAT')}
              >
                <Ionicons
                  name="book"
                  size={20}
                  color={cartPaymentMethod === 'KHATA_FLAT' ? '#059669' : '#6B7280'}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.paymentOptionTitle}>Apartment Flat Khata (Udhar)</Text>
                    <View style={styles.khataBadge}>
                      <Text style={styles.khataBadgeText}>Ledger</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentOptionSubtitle}>
                    Charged to Flat {selectedCustomer.flat === 'Counter' ? 'B-204' : selectedCustomer.flat} • Current Balance: ₹{currentKhataBalance}
                  </Text>
                </View>
                {cartPaymentMethod === 'KHATA_FLAT' && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                )}
              </TouchableOpacity>
            </View>

            {/* Bill Summary Breakdown */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Bill Details</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Subtotal</Text>
                <Text style={styles.billVal}>₹{cartSubtotal}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Society Delivery Fee</Text>
                <Text style={[styles.billVal, deliveryFee === 0 && { color: '#059669' }]}>
                  {deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}
                </Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Eco-Friendly Bag & Packaging</Text>
                <Text style={[styles.billVal, packagingFee === 0 && { color: '#059669' }]}>
                  {packagingFee === 0 ? 'FREE' : '₹' + packagingFee}
                </Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes & GST (5% Incl.)</Text>
                <Text style={styles.billVal}>₹{cartTax}</Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: '#059669' }]}>
                    Promo Voucher ({activePromoCode})
                  </Text>
                  <Text style={[styles.billVal, { color: '#059669', fontWeight: 'bold' }]}>
                    -₹{discountAmount}
                  </Text>
                </View>
              )}

              <View style={styles.billDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>To Pay (Net Amount)</Text>
                <Text style={styles.totalVal}>₹{cartNetTotal}</Text>
              </View>
            </View>

            {/* Sticky Checkout CTA */}
            {cart.length > 0 && (
              <TouchableOpacity style={styles.residentCheckoutBtn} onPress={handleResidentCheckout}>
                <View>
                  <Text style={styles.checkoutBtnAmt}>₹{cartNetTotal}</Text>
                  <Text style={styles.checkoutBtnSub}>
                    {cartPaymentMethod === 'UPI'
                      ? 'Pay with UPI QR'
                      : cartPaymentMethod === 'KHATA_FLAT'
                      ? 'Charge to Flat Khata'
                      : 'Place COD Order'}
                  </Text>
                </View>
                <View style={styles.checkoutBtnRight}>
                  <Text style={styles.checkoutBtnAction}>Place Order</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* CASHIER POS COUNTER MODE CONTENT                         */}
        {/* ========================================================= */}
        {activeMode === 'pos' && (
          <View>
            {/* Customer Flat Selector */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionCardTitle}>Bill To / Resident Flat</Text>
                <Text style={styles.flatPhoneText}>{selectedCustomer.name}</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {RESIDENT_FLATS.map((f) => {
                    const isSelected = selectedCustomer.flat === f.flat;
                    const khata = khataAccounts[f.flat];
                    const bal = khata ? khata.totalOutstanding : 0;

                    return (
                      <TouchableOpacity
                        key={f.flat}
                        style={[styles.flatPill, isSelected && styles.flatPillActive]}
                        onPress={() => setSelectedCustomer(f)}
                      >
                        <Text style={[styles.flatPillText, isSelected && styles.flatPillTextActive]}>
                          {f.flat}
                        </Text>
                        {bal > 0 && (
                          <Text style={[styles.flatBalChip, isSelected && { color: '#FEE2E2' }]}>
                            ₹{bal}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {currentKhataBalance > 0 && (
                <View style={styles.khataAlertBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.khataAlertText}>
                    Flat {selectedCustomer.flat} has an existing Khata outstanding balance of ₹{currentKhataBalance}.
                  </Text>
                </View>
              )}
            </View>

            {/* Barcode & SKU Fast Search */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionCardTitle}>Barcode & SKU Lookup</Text>
                <TouchableOpacity
                  style={styles.adhocTriggerBtn}
                  onPress={() => setAdhocModalVisible(true)}
                >
                  <Ionicons name="add" size={14} color="#4338CA" />
                  <Text style={styles.adhocTriggerBtnText}>+ Custom Item</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.barcodeInputRow}>
                <Ionicons name="barcode-outline" size={22} color="#4B5563" />
                <TextInput
                  style={styles.barcodeTextInput}
                  placeholder="Scan barcode or type SKU (e.g. MILK-001)..."
                  value={barcodeInput}
                  onChangeText={setBarcodeInput}
                  onSubmitEditing={handleBarcodeInputSubmit}
                  returnKeyType="search"
                />
                <TouchableOpacity style={styles.barcodeAddBtn} onPress={handleBarcodeInputSubmit}>
                  <Text style={styles.barcodeAddBtnText}>Enter</Text>
                </TouchableOpacity>
              </View>

              {/* Demo Quick SKU Pills */}
              <Text style={styles.quickSkuLabel}>Quick Counter Tap (Demo SKUs):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {QUICK_SKUS.map((q) => (
                    <TouchableOpacity
                      key={q.code}
                      style={styles.quickSkuPill}
                      onPress={() => handleQuickSkuClick(q)}
                    >
                      <Text style={{ fontSize: 13 }}>{q.emoji}</Text>
                      <Text style={styles.quickSkuName}>{q.name}</Text>
                      <Text style={styles.quickSkuPrice}>₹{q.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Toggle Shelf */}
              <TouchableOpacity
                style={styles.toggleShelfBtn}
                onPress={() => setShowCatalogShelf(!showCatalogShelf)}
              >
                <Ionicons
                  name={showCatalogShelf ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#4338CA"
                />
                <Text style={styles.toggleShelfBtnText}>
                  {showCatalogShelf ? 'Hide Catalog Quick Shelf' : 'Show Catalog Quick Shelf (' + products.length + ' Items)'}
                </Text>
              </TouchableOpacity>

              {/* Catalog Shelf */}
              {showCatalogShelf && (
                <View style={{ marginTop: 10 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
                          onPress={() => setActiveCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.catPillText,
                              activeCategory === cat && styles.catPillTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.shelfGrid}>
                    {filteredProducts.slice(0, 8).map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.shelfCard}
                        onPress={() => handleAddItemToBill(p, 1)}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 20 }}>{p.emoji || '📦'}</Text>
                          <Text style={styles.shelfCardType}>
                            {p.type === 'NON_STOCK' ? 'Non-Stock' : p.stockQuantity + ' in stock'}
                          </Text>
                        </View>
                        <Text style={styles.shelfCardName} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <Text style={styles.shelfCardPrice}>₹{p.price}</Text>
                          <View style={styles.shelfCardAddBtn}>
                            <Text style={styles.shelfCardAddBtnText}>+ Add</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* POS Ticket Table (Line Items) */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionCardTitle}>
                  Current Sale Ticket ({totalItemCount} Units)
                </Text>
                {cart.length > 0 && (
                  <TouchableOpacity onPress={clearCart}>
                    <Text style={styles.clearCartText}>Reset Bill</Text>
                  </TouchableOpacity>
                )}
              </View>

              {cart.length === 0 ? (
                <View style={styles.emptyTicketBox}>
                  <Text style={{ fontSize: 32 }}>🧾</Text>
                  <Text style={styles.emptyTicketText}>No items added to current sale ticket.</Text>
                  <Text style={styles.emptyTicketSub}>
                    Tap demo SKUs above or scan barcodes to begin billing.
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 6 }}>
                  {/* Table Header */}
                  <View style={styles.ticketTableHeader}>
                    <Text style={[styles.ticketTh, { flex: 3 }]}>Item</Text>
                    <Text style={[styles.ticketTh, { flex: 2, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.ticketTh, { flex: 2, textAlign: 'right' }]}>Rate</Text>
                    <Text style={[styles.ticketTh, { flex: 2, textAlign: 'right' }]}>Total</Text>
                    <Text style={[styles.ticketTh, { width: 30 }]}></Text>
                  </View>

                  {cart.map((it) => (
                    <View key={it.productId} style={styles.ticketTableRow}>
                      <View style={{ flex: 3 }}>
                        <Text style={styles.ticketItemName} numberOfLines={1}>
                          {it.name}
                        </Text>
                        <Text style={styles.ticketItemSub}>
                          {it.unit || 'unit'} {it.type === 'NON_STOCK' ? '• Ad-hoc' : ''}
                        </Text>
                      </View>

                      {/* Stepper */}
                      <View style={[styles.posStepper, { flex: 2 }]}>
                        <TouchableOpacity
                          style={styles.posStepBtn}
                          onPress={() => updateCartQty(it.productId, -1)}
                        >
                          <Text style={styles.posStepBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.posStepQty}>{it.quantity}</Text>
                        <TouchableOpacity
                          style={styles.posStepBtn}
                          onPress={() => updateCartQty(it.productId, 1)}
                        >
                          <Text style={styles.posStepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.ticketItemRate, { flex: 2 }]}>₹{it.price}</Text>
                      <Text style={[styles.ticketItemAmount, { flex: 2 }]}>
                        ₹{it.price * it.quantity}
                      </Text>

                      <TouchableOpacity
                        style={{ width: 30, alignItems: 'center' }}
                        onPress={() => removeFromCart(it.productId)}
                      >
                        <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Cashier Discount Bar */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Counter Discount</Text>
              <View style={styles.discountRow}>
                {[
                  { label: 'None', pct: 0, flat: 0 },
                  { label: '5% Off', pct: 5, flat: 0 },
                  { label: '10% Off', pct: 10, flat: 0 },
                  { label: '₹50 Flat', pct: 0, flat: 50 },
                ].map((d, idx) => {
                  const active =
                    d.flat > 0
                      ? flatDiscountRupees === d.flat
                      : selectedDiscountPercent === d.pct && flatDiscountRupees === 0;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.discountPill, active && styles.discountPillActive]}
                      onPress={() => {
                        setSelectedDiscountPercent(d.pct);
                        setFlatDiscountRupees(d.flat);
                      }}
                    >
                      <Text style={[styles.discountPillText, active && styles.discountPillTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {posDiscountTotal > 0 && (
                <Text style={styles.discountSummaryText}>
                  Total Counter Discount Applied: -₹{posDiscountTotal}
                </Text>
              )}
            </View>

            {/* Cash Tender Calculator & Change Due */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionCardTitle}>Cash Tender & Change Calculator</Text>
                <Text style={styles.netDueText}>Net Due: ₹{posNetPayable}</Text>
              </View>

              <View style={styles.tenderInputRow}>
                <Text style={styles.rupeePrefix}>₹</Text>
                <TextInput
                  style={styles.tenderInput}
                  placeholder="Enter Cash Received from Customer..."
                  keyboardType="numeric"
                  value={amountTendered}
                  onChangeText={setAmountTendered}
                />
              </View>

              {/* Quick Cash Chips */}
              <View style={styles.cashChipsRow}>
                <TouchableOpacity
                  style={styles.cashChip}
                  onPress={() => setAmountTendered(posNetPayable.toString())}
                >
                  <Text style={styles.cashChipText}>Exact (₹{posNetPayable})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cashChip}
                  onPress={() => setAmountTendered('100')}
                >
                  <Text style={styles.cashChipText}>₹100</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cashChip}
                  onPress={() => setAmountTendered('200')}
                >
                  <Text style={styles.cashChipText}>₹200</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cashChip}
                  onPress={() => setAmountTendered('500')}
                >
                  <Text style={styles.cashChipText}>₹500</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cashChip}
                  onPress={() => setAmountTendered('1000')}
                >
                  <Text style={styles.cashChipText}>₹1000</Text>
                </TouchableOpacity>
              </View>

              {/* Live Change Due Banner */}
              {tenderedNum > 0 && (
                <View
                  style={[
                    styles.changeDueBanner,
                    tenderedNum >= posNetPayable
                      ? styles.changeDueSuccess
                      : styles.changeDueShort,
                  ]}
                >
                  {tenderedNum >= posNetPayable ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={22} color="#059669" />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.changeDueTitle}>CHANGE TO RETURN:</Text>
                        <Text style={styles.changeDueAmount}>₹{changeDue.toFixed(2)}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="warning" size={22} color="#D97706" />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.changeDueTitle, { color: '#92400E' }]}>
                          AMOUNT SHORT:
                        </Text>
                        <Text style={[styles.changeDueAmount, { color: '#B45309' }]}>
                          ₹{(posNetPayable - tenderedNum).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* POS Settlement Multi-Tender Actions */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Tender Settlement</Text>
              <View style={styles.posTenderActions}>
                <TouchableOpacity
                  style={[styles.posTenderBtn, { backgroundColor: '#059669' }]}
                  onPress={() => handlePosCheckout('CASH')}
                >
                  <Ionicons name="cash" size={20} color="#FFFFFF" />
                  <Text style={styles.posTenderBtnText}>Cash (₹{posNetPayable})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.posTenderBtn, { backgroundColor: '#2563EB' }]}
                  onPress={() => handlePosCheckout('UPI')}
                >
                  <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                  <Text style={styles.posTenderBtnText}>UPI / QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.posTenderBtn, { backgroundColor: '#7C3AED' }]}
                  onPress={() => handlePosCheckout('KHATA_FLAT')}
                >
                  <Ionicons name="book" size={20} color="#FFFFFF" />
                  <Text style={styles.posTenderBtnText}>Flat Khata</Text>
                </TouchableOpacity>
              </View>

              {/* View Last Receipt Button */}
              {lastReceiptOrder && (
                <TouchableOpacity
                  style={styles.viewLastReceiptBtn}
                  onPress={() => setReceiptModalVisible(true)}
                >
                  <Ionicons name="receipt-outline" size={16} color="#4B5563" />
                  <Text style={styles.viewLastReceiptBtnText}>
                    View Last Thermal Receipt ({lastReceiptOrder.orderNumber})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 1: AD-HOC CUSTOM NON-STOCK ITEM MODAL               */}
      {/* ========================================================= */}
      <Modal visible={adhocModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.adhocModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Add Custom Non-Stock Item</Text>
              <TouchableOpacity onPress={() => setAdhocModalVisible(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFieldLabel}>Item Description / Name</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Loose Coriander, Fresh Batter, Coconut..."
              value={adhocName}
              onChangeText={setAdhocName}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Price (₹)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="e.g. 25"
                  keyboardType="numeric"
                  value={adhocPrice}
                  onChangeText={setAdhocPrice}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Unit</Text>
                <View style={styles.unitRow}>
                  {['pcs', 'kg', 'packet', 'service'].map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitPill, adhocUnit === u && styles.unitPillActive]}
                      onPress={() => setAdhocUnit(u)}
                    >
                      <Text style={[styles.unitPillText, adhocUnit === u && styles.unitPillTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.modalFieldLabel}>Category</Text>
            <View style={styles.categoryPickerRow}>
              {['Produce', 'Bakery', 'Groceries', 'Services', 'Other'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPickPill, adhocCategory === cat && styles.catPickPillActive]}
                  onPress={() => setAdhocCategory(cat)}
                >
                  <Text style={[styles.catPickPillText, adhocCategory === cat && styles.catPickPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.addAdhocSubmitBtn} onPress={handleAddAdhocItem}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addAdhocSubmitBtnText}>Add Item to Active Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: DYNAMIC UPI QR SCANNER MODAL                     */}
      {/* ========================================================= */}
      <UpiPaymentScannerModal
        visible={upiModalVisible}
        onClose={() => setUpiModalVisible(false)}
        defaultAmount={activeMode === 'pos' ? posNetPayable : cartNetTotal}
        defaultPayeeName="AMA Society Fresh Mart"
        defaultPayeeVpa="ama.freshmart@icici"
        defaultNote={
          activeMode === 'pos'
            ? 'POS Counter Sale (' + selectedCustomer.flat + ')'
            : 'Society Mart Grocery Order'
        }
        onPaymentSuccess={handleUpiModalSuccess as any}
      />

      {/* ========================================================= */}
      {/* MODAL 3: 58mm/80mm THERMAL RECEIPT MODAL (POS & MART)      */}
      {/* ========================================================= */}
      <Modal visible={receiptModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModalContainer}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="receipt" size={20} color="#1F2937" />
                <Text style={[styles.modalHeaderTitle, { marginLeft: 8 }]}>Sale Receipt Slip</Text>
              </View>
              <TouchableOpacity onPress={() => setReceiptModalVisible(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {lastReceiptOrder && (
              <ScrollView style={styles.thermalReceiptScroll}>
                <View style={styles.thermalSlip}>
                  <Text style={styles.thermalCenter}>********************************</Text>
                  <Text style={[styles.thermalCenter, styles.thermalBold, { fontSize: 15 }]}>
                    AMA SOCIETY FRESH MART
                  </Text>
                  <Text style={styles.thermalCenter}>Tower B Ground Floor Lobby</Text>
                  <Text style={styles.thermalCenter}>Society Mart Reg: CHS/BLR/MART-04</Text>
                  <Text style={styles.thermalCenter}>GSTIN: 29AABCA8821K1ZM</Text>
                  <Text style={styles.thermalCenter}>Tel: +91 98765 43210</Text>
                  <Text style={styles.thermalCenter}>--------------------------------</Text>

                  <View style={styles.thermalMetaRow}>
                    <Text style={styles.thermalMono}>RCPT: {lastReceiptOrder.orderNumber}</Text>
                    <Text style={styles.thermalMono}>TERM: #01</Text>
                  </View>
                  <View style={styles.thermalMetaRow}>
                    <Text style={styles.thermalMono}>
                      DATE: {new Date(lastReceiptOrder.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.thermalMono}>
                      TIME: {new Date(lastReceiptOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.thermalMetaRow}>
                    <Text style={styles.thermalMono}>CUST: {lastReceiptOrder.customerName}</Text>
                    <Text style={styles.thermalMono}>FLAT: {lastReceiptOrder.customerFlat}</Text>
                  </View>
                  <Text style={styles.thermalCenter}>--------------------------------</Text>

                  {/* Header */}
                  <View style={styles.thermalMetaRow}>
                    <Text style={[styles.thermalMono, styles.thermalBold, { flex: 5 }]}>ITEM</Text>
                    <Text style={[styles.thermalMono, styles.thermalBold, { flex: 2, textAlign: 'center' }]}>QTY</Text>
                    <Text style={[styles.thermalMono, styles.thermalBold, { flex: 2, textAlign: 'right' }]}>RATE</Text>
                    <Text style={[styles.thermalMono, styles.thermalBold, { flex: 3, textAlign: 'right' }]}>AMT</Text>
                  </View>
                  <Text style={styles.thermalCenter}>--------------------------------</Text>

                  {normalizeOrderItems(lastReceiptOrder).map((item, idx) => {
                    const itName = item.name;
                    const itQty = item.quantity;
                    const itPrice = item.price;
                    const itTotal = item.total;
                    return (
                      <View key={idx} style={styles.thermalMetaRow}>
                        <Text style={[styles.thermalMono, { flex: 5 }]} numberOfLines={1}>
                          {itName}
                        </Text>
                        <Text style={[styles.thermalMono, { flex: 2, textAlign: 'center' }]}>
                          {itQty}
                        </Text>
                        <Text style={[styles.thermalMono, { flex: 2, textAlign: 'right' }]}>
                          {itPrice.toFixed(0)}
                        </Text>
                        <Text style={[styles.thermalMono, { flex: 3, textAlign: 'right' }]}>
                          {itTotal.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                  <Text style={styles.thermalCenter}>--------------------------------</Text>

                  <View style={styles.thermalMetaRow}>
                    <Text style={styles.thermalMono}>SUBTOTAL:</Text>
                    <Text style={styles.thermalMono}>₹{Number(lastReceiptOrder.subtotal || 0).toFixed(2)}</Text>
                  </View>
                  {lastReceiptOrder.discount > 0 && (
                    <View style={styles.thermalMetaRow}>
                      <Text style={styles.thermalMono}>DISCOUNT:</Text>
                      <Text style={styles.thermalMono}>-₹{Number(lastReceiptOrder.discount || 0).toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={styles.thermalMetaRow}>
                    <Text style={styles.thermalMono}>TAX (CGST+SGST 5%):</Text>
                    <Text style={styles.thermalMono}>₹{Number(lastReceiptOrder.tax || 0).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.thermalCenter}>================================</Text>
                  <View style={styles.thermalMetaRow}>
                    <Text style={[styles.thermalMono, styles.thermalBold, { fontSize: 14 }]}>
                      TOTAL PAID:
                    </Text>
                    <Text style={[styles.thermalMono, styles.thermalBold, { fontSize: 14 }]}>
                      ₹{Number(lastReceiptOrder.totalAmount || 0).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.thermalCenter}>================================</Text>

                  <View style={styles.thermalMetaRow}>
                    <Text style={styles.thermalMono}>TENDER TYPE:</Text>
                    <Text style={styles.thermalMono}>{lastReceiptOrder.paymentMethod}</Text>
                  </View>
                  {lastChangeDue > 0 && (
                    <View style={styles.thermalMetaRow}>
                      <Text style={styles.thermalMono}>CHANGE DUE:</Text>
                      <Text style={styles.thermalMono}>₹{lastChangeDue.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={styles.thermalMetaRow}>
                    <Text style={styles.thermalMono}>STATUS:</Text>
                    <Text style={styles.thermalMono}>{lastReceiptOrder.paymentStatus}</Text>
                  </View>

                  <Text style={[styles.thermalCenter, { marginTop: 10 }]}>
                    ||| | |||| ||| ||||| ||||| || |||
                  </Text>
                  <Text style={[styles.thermalCenter, { fontSize: 9 }]}>
                    {lastReceiptOrder.orderNumber}
                  </Text>

                  <Text style={[styles.thermalCenter, { marginTop: 8 }]}>
                    Thank You For Shopping!
                  </Text>
                  <Text style={styles.thermalCenter}>Please Retain For Any Returns</Text>
                  <Text style={styles.thermalCenter}>********************************</Text>
                </View>
              </ScrollView>
            )}

            {/* Receipt Modal Actions */}
            <View style={styles.thermalActionRow}>
              <TouchableOpacity
                style={styles.thermalPrintBtn}
                onPress={handlePrintThermalReceipt}
              >
                <Ionicons name="print" size={16} color="#FFFFFF" />
                <Text style={styles.thermalPrintBtnText}>Print</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.thermalPrintBtn, { backgroundColor: '#0F172A' }]}
                onPress={() => {
                  if (lastReceiptOrder) {
                    handleSaveResidentReceiptFile(lastReceiptOrder);
                  }
                }}
              >
                <Ionicons name="download" size={16} color="#FFFFFF" />
                <Text style={styles.thermalPrintBtnText}>PDF (.pdf)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.thermalShareBtn}
                onPress={() =>
                  lastReceiptOrder &&
                  handleShareThermalReceiptWhatsApp(lastReceiptOrder, lastChangeDue)
                }
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.thermalShareBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: RESIDENT DIGITAL ORDER CONFIRMATION MODAL        */}
      {/* ========================================================= */}
      <Modal visible={orderSuccessModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.orderSuccessCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Society Mart has received your order and is now packing your items.
            </Text>

            {placedOrder && (
              <View style={styles.successDetailsBox}>
                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Order ID:</Text>
                  <Text style={styles.successDetailVal}>{placedOrder.orderNumber}</Text>
                </View>

                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Customer Name:</Text>
                  <Text style={[styles.successDetailVal, { fontWeight: '700', color: '#1E293B' }]}>
                    {placedOrder.customerName} ({placedOrder.customerFlat})
                  </Text>
                </View>

                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Fulfillment:</Text>
                  <Text style={styles.successDetailVal}>
                    {placedOrder.fulfillmentType === 'DELIVERY'
                      ? '🛵 Society Home Delivery'
                      : '🏪 Self Pickup at Mart'}
                  </Text>
                </View>

                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Delivery Address:</Text>
                  <Text style={styles.successDetailVal}>{placedOrder.deliveryAddress}</Text>
                </View>

                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>Total Paid / Billed:</Text>
                  <Text style={[styles.successDetailVal, { color: '#059669', fontWeight: 'bold' }]}>
                    ₹{Number(placedOrder.totalAmount || 0).toFixed(2)} ({placedOrder.paymentMethod})
                  </Text>
                </View>

                {/* Itemized Order Details */}
                {placedOrder && normalizeOrderItems(placedOrder).length > 0 && (
                  <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                      Items Ordered ({normalizeOrderItems(placedOrder).length})
                    </Text>
                    {normalizeOrderItems(placedOrder).map((it, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                        <Text style={{ fontSize: 13, color: '#1E293B', flex: 1 }} numberOfLines={1}>
                          {it.emoji || '📦'} {it.name} <Text style={{ color: '#64748B' }}>x{it.quantity} {it.unit}</Text>
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 8 }}>
                          ₹{it.total.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={{ width: '100%', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.successWhatsAppBtn}
                onPress={() => placedOrder && handleShareResidentOrderWhatsApp(placedOrder)}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.successWhatsAppBtnText}>Send PDF to WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.successThermalBtn, { backgroundColor: '#4338CA', borderColor: '#4338CA' }]}
                onPress={() => placedOrder && handleSaveResidentReceiptFile(placedOrder)}
              >
                <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                <Text style={[styles.successThermalBtnText, { color: '#FFFFFF' }]}>
                  Download Official PDF Receipt (.PDF)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.successThermalBtn, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}
                onPress={() => placedOrder && handleCopyResidentOrderText(placedOrder)}
              >
                <Ionicons name="copy-outline" size={16} color="#1E293B" />
                <Text style={[styles.successThermalBtnText, { color: '#1E293B' }]}>
                  Copy Receipt Text to Clipboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.successThermalBtn, { backgroundColor: '#0F172A', borderColor: '#0F172A' }]}
                onPress={() => {
                  if (placedOrder) {
                    setOrderSuccessModal(false);
                    router.push(
                      `/receipts?orderId=${encodeURIComponent(placedOrder.orderNumber)}` as any
                    );
                  }
                }}
              >
                <Ionicons name="document-text" size={16} color="#FFFFFF" />
                <Text style={[styles.successThermalBtnText, { color: '#FFFFFF' }]}>
                  View & Download Official PDF Receipt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successThermalBtn}
                onPress={() => {
                  if (placedOrder) {
                    setLastReceiptOrder(placedOrder);
                    setLastChangeDue(0);
                    setOrderSuccessModal(false);
                    setReceiptModalVisible(true);
                  }
                }}
              >
                <Ionicons name="receipt-outline" size={16} color="#374151" />
                <Text style={styles.successThermalBtnText}>View 58mm Thermal Print Slip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successDoneBtn}
                onPress={() => {
                  setOrderSuccessModal(false);
                  router.push('/(resident)/bazaar' as any);
                }}
              >
                <Text style={styles.successDoneBtnText}>Done & Back to Mart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: WhatsApp PDF Attachment Guidance & Quick Actions */}
      <WhatsAppPdfModal
        visible={whatsAppModalVisible}
        onClose={() => setWhatsAppModalVisible(false)}
        order={activeWhatsAppOrder}
        onRedownloadPdf={() => activeWhatsAppOrder && handleSaveResidentReceiptFile(activeWhatsAppOrder)}
        onReopenWhatsApp={() => activeWhatsAppOrder && handleShareResidentOrderWhatsApp(activeWhatsAppOrder)}
        onCopyText={() => activeWhatsAppOrder && handleCopyResidentOrderText(activeWhatsAppOrder)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  toastBanner: {
    backgroundColor: '#1F2937',
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
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  modeBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  modePillActive: {
    backgroundColor: '#059669',
  },
  modePillActivePos: {
    backgroundColor: '#4338CA',
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  modePillTextActive: {
    color: '#FFFFFF',
  },
  contextStrip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  contextStripText: {
    fontSize: 11,
    color: '#3730A3',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  summaryTag: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  summaryTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fulfillmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  fulfillmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  fulfillmentOptionActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  fulfillmentTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  fulfillmentTitleActive: {
    color: '#059669',
  },
  fulfillmentSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  addressBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  addressInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1F2937',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1F2937',
    marginTop: 6,
  },
  pickupInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  pickupInfoText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
  },
  clearCartText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyCartBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptyCartSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  browseCatalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  browseCatalogBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  openPosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  openPosBtnText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cartItemEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemEmoji: {
    fontSize: 18,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  cartItemUnit: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginRight: 10,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 6,
  },
  cartItemTotalCol: {
    alignItems: 'flex-end',
    width: 60,
  },
  cartItemTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  cartActionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  cartActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  cartActionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  promoInputRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  promoTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1F2937',
  },
  promoApplyBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  promoApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  promoChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  promoChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  promoChipCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  promoChipDesc: {
    fontSize: 9,
    color: '#6B7280',
  },
  promoFeedbackText: {
    fontSize: 11,
    color: '#059669',
    marginTop: 6,
    fontWeight: '600',
  },
  activePromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  activePromoText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  removePromoText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  paymentOptionRowActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  paymentOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentOptionSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  khataBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  khataBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  billVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  residentCheckoutBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 6,
  },
  checkoutBtnAmt: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutBtnSub: {
    color: '#D1FAE5',
    fontSize: 11,
  },
  checkoutBtnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkoutBtnAction: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* POS Styles */
  flatPhoneText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  flatPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  flatPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  flatPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  flatPillTextActive: {
    color: '#FFFFFF',
  },
  flatBalChip: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2,
  },
  khataAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 6,
  },
  khataAlertText: {
    fontSize: 11,
    color: '#B91C1C',
    flex: 1,
    fontWeight: '600',
  },
  adhocTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 4,
  },
  adhocTriggerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  barcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4338CA',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  barcodeTextInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#1F2937',
  },
  barcodeAddBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  barcodeAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  quickSkuLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 10,
  },
  quickSkuPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
  },
  quickSkuName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  quickSkuPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  toggleShelfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  toggleShelfBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  catPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  shelfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shelfCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
  },
  shelfCardType: {
    fontSize: 9,
    color: '#6B7280',
  },
  shelfCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  shelfCardPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  shelfCardAddBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shelfCardAddBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyTicketBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyTicketText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 4,
  },
  emptyTicketSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketTableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
  },
  ticketTh: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
  },
  ticketTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ticketItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  ticketItemSub: {
    fontSize: 10,
    color: '#6B7280',
  },
  posStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  posStepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  posStepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  posStepQty: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F2937',
    paddingHorizontal: 4,
  },
  ticketItemRate: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'right',
  },
  ticketItemAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
  },
  discountRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  discountPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  discountPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  discountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  discountPillTextActive: {
    color: '#FFFFFF',
  },
  discountSummaryText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 6,
  },
  netDueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4338CA',
  },
  tenderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  rupeePrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B5563',
    marginRight: 6,
  },
  tenderInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 8,
  },
  cashChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  cashChip: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cashChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  changeDueBanner: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  changeDueSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  changeDueShort: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  changeDueTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  changeDueAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  posTenderActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  posTenderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  posTenderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  viewLastReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
    gap: 6,
  },
  viewLastReceiptBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  adhocModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    color: '#1F2937',
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 4,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#1F2937',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitPill: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unitPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  unitPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  unitPillTextActive: {
    color: '#FFFFFF',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  catPickPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  catPickPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  catPickPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  catPickPillTextActive: {
    color: '#FFFFFF',
  },
  addAdhocSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  addAdhocSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Thermal Receipt Styles */
  receiptModalContainer: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  thermalReceiptScroll: {
    maxHeight: 460,
    marginVertical: 8,
  },
  thermalSlip: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 6,
  },
  thermalCenter: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    textAlign: 'center',
    color: '#111827',
    lineHeight: 14,
  },
  thermalMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#111827',
    lineHeight: 14,
  },
  thermalBold: {
    fontWeight: 'bold',
  },
  thermalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  thermalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  thermalPrintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  thermalPrintBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  thermalShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  thermalShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Order Success Modal */
  orderSuccessCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successDetailLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  successDetailVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  successWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  successWhatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  successThermalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  successThermalBtnText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  successDoneBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successDoneBtnText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
});
