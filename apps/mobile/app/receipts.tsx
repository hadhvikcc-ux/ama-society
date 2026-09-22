import React, { useState, useEffect, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useBazaarStore } from '../stores/bazaarStore';
import { useAuthStore } from '../stores/authStore';
import {
  downloadReceiptPdf,
  shareReceiptPdf,
  formatWhatsAppReceiptMessage,
  normalizeOrderItems,
} from '../utils/receiptPdfGenerator';
import { WhatsAppPdfModal } from '../components/bazaar/WhatsAppPdfModal';

// Standalone HTML Receipt Document Generator for Direct File Download & Printing
function generateReceiptHtmlString(order: any): string {
  const itemsRows = normalizeOrderItems(order)
    .map((item, idx) => {
      const name = item.name;
      const qty = item.quantity;
      const unit = item.unit;
      const rate = item.price;
      const total = item.total;
      const emoji = item.emoji;
      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-size: 13px;">
            <span style="margin-right: 6px;">${emoji}</span>
            <strong>${name}</strong>
            <span style="color: #64748B; font-size: 11px; margin-left: 4px;">(${unit})</span>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 13px;">${qty}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 13px;">₹${rate.toFixed(2)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 13px; font-weight: 600;">₹${total.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${order.orderNumber} - AMA Society Fresh Mart</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #F8FAFC;
      color: #0F172A;
    }
    .receipt-box {
      max-width: 680px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 32px;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header-tag {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .badge-primary { background: #EEF2FF; color: #4338CA; }
    .badge-paid { background: #ECFDF5; color: #059669; }
    .store-info {
      text-align: center;
      padding-bottom: 16px;
      border-bottom: 2px dashed #CBD5E1;
      margin-bottom: 20px;
    }
    .store-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 8px 0 4px 0;
      color: #0F172A;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 12px;
      line-height: 1.6;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .table-container th {
      background: #F1F5F9;
      padding: 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.5px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
      color: #475569;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0 6px 0;
      border-top: 2px solid #0F172A;
      margin-top: 8px;
    }
    .print-btn-bar {
      margin-top: 24px;
      text-align: center;
    }
    .btn {
      background: #4338CA;
      color: #FFFFFF;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .receipt-box { box-shadow: none; border: 1px solid #000; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header-tag">
      <span class="badge badge-primary">OFFICIAL TAX INVOICE & CASH MEMO</span>
      <span class="badge badge-paid">● ${order.paymentStatus || 'PAID'}</span>
    </div>
    <div class="store-info">
      <div style="font-size: 28px;">🛒</div>
      <div class="store-title">AMA SOCIETY FRESH MART</div>
      <div style="font-size: 12px; color: #64748B;">Ground Floor Lobby, Tower B • Green Glen Palms Residents Society</div>
      <div style="font-size: 11px; color: #64748B; margin-top: 4px;">GSTIN: 29AABCA8821K1ZM • Reg No: CHS/BLR/MART-04</div>
      <div style="font-size: 11px; color: #64748B;">Helpdesk & Support: +91 98765 43210 | mart@greenglen.society</div>
    </div>
    <div class="meta-grid">
      <div>
        <div><strong>RECEIPT NO:</strong> ${order.orderNumber}</div>
        <div><strong>DATE & TIME:</strong> ${order.createdAt}</div>
        <div><strong>FULFILLMENT:</strong> ${order.fulfillmentType === 'DELIVERY' ? '🛵 Doorstep Society Delivery' : '🏪 Mart Counter Pickup'}</div>
      </div>
      <div style="text-align: right;">
        <div><strong>BILLED TO:</strong> ${order.customerName}</div>
        <div><strong>FLAT:</strong> ${order.customerFlat}</div>
        <div><strong>PHONE:</strong> ${order.customerPhone || 'N/A'}</div>
        ${order.deliveryAddress ? `<div><strong>ADDRESS:</strong> ${order.deliveryAddress}</div>` : ''}
      </div>
    </div>

    <table class="table-container">
      <thead>
        <tr>
          <th style="width: 50%;">Item & Spec</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 15%; text-align: right;">Rate</th>
          <th style="width: 20%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div style="border-top: 2px dashed #CBD5E1; padding-top: 14px;">
      <div class="calc-row">
        <span>Item Subtotal:</span>
        <span>₹${Number(order.subtotal || 0).toFixed(2)}</span>
      </div>
      ${order.discount > 0 ? `
      <div class="calc-row" style="color: #059669;">
        <span>Promo Discount ${order.discountCode ? '(' + order.discountCode + ')' : ''}:</span>
        <span>-₹${Number(order.discount).toFixed(2)}</span>
      </div>` : ''}
      ${order.deliveryFee > 0 ? `
      <div class="calc-row">
        <span>Doorstep Delivery Fee:</span>
        <span>₹${Number(order.deliveryFee).toFixed(2)}</span>
      </div>` : ''}
      <div class="calc-row">
        <span>Taxes (CGST 2.5% + SGST 2.5%):</span>
        <span>₹${Number(order.tax || 0).toFixed(2)}</span>
      </div>
      <div class="grand-total-row">
        <div>
          <div style="font-size: 16px; font-weight: 800; color: #0F172A;">GRAND TOTAL</div>
          <div style="font-size: 11px; color: #64748B;">Payment: ${order.paymentMethod} • Status: ${order.paymentStatus}</div>
        </div>
        <div style="font-size: 22px; font-weight: 800; color: #059669;">₹${Number(order.totalAmount || 0).toFixed(2)}</div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B;">
      <div style="font-family: monospace; letter-spacing: 4px; font-size: 14px; margin-bottom: 4px;">|||| | ||||| || |||||| | |||| ||||| ||| |</div>
      <div>REF: ${order.orderNumber} • VERIFIED SOCIETY MART DIGITAL RECEIPT</div>
      <div style="margin-top: 6px;">Thank you for shopping at AMA Society Mart! Queries & Returns: +91 98765 43210</div>
    </div>

    <div class="print-btn-bar no-print">
      <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;
}

export default function ReceiptScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ orderId?: string; download?: string }>();
  const { orders, updateOrderDetails } = useBazaarStore();
  const authUser = useAuthStore((s) => s.user);

  const [whatsAppModalVisible, setWhatsAppModalVisible] = useState(false);

  // Find targeted order or default to latest with local storage hydration check
  const orderIdParam = searchParams.orderId;
  const currentOrder = useMemo(() => {
    let orderList = [...(orders || [])];
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('ama-bazaar-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.orders?.length > 0) {
            const storedOrders: any[] = parsed.state.orders;
            const existingIds = new Set(orderList.map((o) => o.id));
            storedOrders.forEach((so) => {
              if (!existingIds.has(so.id)) {
                orderList.unshift(so);
              }
            });
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (orderIdParam && orderList && orderList.length > 0) {
      const cleanParam = decodeURIComponent(orderIdParam).trim();
      const cleanParamLower = cleanParam.toLowerCase();
      const cleanParamDigits = cleanParam.replace(/\D/g, '');

      const found = orderList.find((o) => {
        if (!o) return false;
        const idMatch = o.id && (o.id === cleanParam || o.id.toLowerCase() === cleanParamLower);
        const numMatch = o.orderNumber && (o.orderNumber === cleanParam || o.orderNumber.toLowerCase() === cleanParamLower);
        const containsMatch = (o.orderNumber && cleanParam.includes(o.orderNumber)) || (o.id && cleanParam.includes(o.id));
        const reverseContains = (o.orderNumber && o.orderNumber.toLowerCase().includes(cleanParamLower));
        const digitsMatch = cleanParamDigits.length >= 3 && o.orderNumber && o.orderNumber.includes(cleanParamDigits);
        return idMatch || numMatch || containsMatch || reverseContains || digitsMatch;
      });
      if (found) return found;
    }
    return (orderList && orderList[0]) || null;
  }, [orders, orderIdParam]);

  // Edit Customer Details Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(currentOrder?.customerName || '');
  const [editFlat, setEditFlat] = useState(currentOrder?.customerFlat || '');
  const [editPhone, setEditPhone] = useState(currentOrder?.customerPhone || '');
  const [editAddress, setEditAddress] = useState(currentOrder?.deliveryAddress || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrder) {
      setEditName(currentOrder.customerName);
      setEditFlat(currentOrder.customerFlat);
      setEditPhone(currentOrder.customerPhone || '');
      setEditAddress(currentOrder.deliveryAddress || '');
    }
  }, [currentOrder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Auto-download trigger if ?download=pdf or ?download=true
  useEffect(() => {
    if (searchParams.download && Platform.OS === 'web') {
      const timer = setTimeout(() => {
        handleDownloadDirectPdf();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [searchParams.download, currentOrder]);

  // Handle True Vector PDF Download (.pdf file)
  const handleDownloadDirectPdf = () => {
    if (!currentOrder) return;
    try {
      const fileName = downloadReceiptPdf(currentOrder);
      if (fileName) {
        showToast(`✓ Downloaded ${fileName}`);
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('PDF download error:', e);
      window.print();
    }
  };

  // Handle Save / Print via Browser Dialog
  const handlePrintPdfDialog = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    } else {
      Alert.alert(
        'Receipt PDF Ready',
        `Receipt #${currentOrder?.orderNumber} has been formatted for printing.`
      );
    }
  };

  // Handle WhatsApp Receipt with PDF attachment & instructions modal
  const handleShareWhatsApp = async () => {
    if (!currentOrder) return;
    try {
      const res = await shareReceiptPdf(currentOrder);
      if (res.method === 'download-and-whatsapp' || res.method === 'clipboard-fallback') {
        setWhatsAppModalVisible(true);
      }
      showToast('✓ PDF generated & WhatsApp opened!');
    } catch (e) {
      console.warn('WhatsApp share error:', e);
      setWhatsAppModalVisible(true);
    }
  };



  // Handle 1-Click Copy Receipt Text to Clipboard
  const handleCopyReceiptText = () => {
    if (!currentOrder) return;
    const msg = formatWhatsAppReceiptMessage(currentOrder);

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      showToast('📋 Full receipt text copied to clipboard! Ready to paste into WhatsApp.');
    } else {
      Share.share({ message: msg });
    }
  };

  // Handle Save Edits
  const handleSaveDetails = () => {
    if (!currentOrder) return;
    if (!editName.trim()) {
      showToast('⚠️ Customer name cannot be empty');
      return;
    }

    updateOrderDetails(currentOrder.id, {
      customerName: editName.trim(),
      customerFlat: editFlat.trim() || currentOrder.customerFlat,
      customerPhone: editPhone.trim() || currentOrder.customerPhone,
      deliveryAddress: editAddress.trim() || currentOrder.deliveryAddress,
    });

    setEditModalVisible(false);
    showToast('✓ Order customer details updated successfully!');
  };

  if (!currentOrder) {
    return (
      <View style={styles.fallbackContainer}>
        <Ionicons name="receipt-outline" size={64} color="#94A3B8" />
        <Text style={styles.fallbackTitle}>Receipt Not Found</Text>
        <Text style={styles.fallbackSub}>
          No order was found matching identifier "{orderIdParam || 'N/A'}".
        </Text>
        <TouchableOpacity
          style={styles.fallbackBtn}
          onPress={() => router.push('/(resident)/bazaar' as any)}
        >
          <Ionicons name="storefront-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.fallbackBtnText}>Return to Society Mart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Web Print Stylesheet Injection */}
      {Platform.OS === 'web' && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body {
                  background-color: #FFFFFF !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .no-print, header, nav, [role="navigation"] {
                  display: none !important;
                }
                .receipt-printable-card {
                  box-shadow: none !important;
                  border: 1px solid #000000 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 16px !important;
                }
              }
            `,
          }}
        />
      )}

      {/* Top Floating Toast */}
      {toastMessage && (
        <View style={styles.toastWrap}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Screen Header Bar (Hidden in Print) */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/(resident)/bazaar' as any)}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
          <Text style={styles.backBtnText}>Back to Mart</Text>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={16} color="#4338CA" />
            <Text style={styles.editHeaderBtnText}>Edit Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappHeaderBtn} onPress={handleShareWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
            <Text style={styles.whatsappHeaderBtnText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.printHeaderBtn} onPress={handleDownloadDirectPdf}>
            <Ionicons name="download-outline" size={16} color="#FFFFFF" />
            <Text style={styles.printHeaderBtnText}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Printable Receipt Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptPaper}>
          {/* Header Badge */}
          <View style={styles.headerBadgeRow}>
            <View style={styles.taxInvoiceTag}>
              <Text style={styles.taxInvoiceTagText}>OFFICIAL TAX INVOICE / CASH MEMO</Text>
            </View>
            <View
              style={[
                styles.paidTag,
                currentOrder.paymentStatus === 'PAID' ? styles.paidTagGreen : styles.paidTagAmber,
              ]}
            >
              <Text
                style={[
                  styles.paidTagText,
                  currentOrder.paymentStatus === 'PAID'
                    ? styles.paidTagTextGreen
                    : styles.paidTagTextAmber,
                ]}
              >
                ● {currentOrder.paymentStatus}
              </Text>
            </View>
          </View>

          {/* Store Brand Header */}
          <View style={styles.storeHeader}>
            <View style={styles.martLogoCircle}>
              <Text style={{ fontSize: 24 }}>🛒</Text>
            </View>
            <Text style={styles.storeTitle}>AMA SOCIETY FRESH MART</Text>
            <Text style={styles.storeAddress}>
              Ground Floor Lobby, Tower B • Green Glen Palms Residents Society
            </Text>
            <View style={styles.storeTaxRow}>
              <Text style={styles.storeTaxText}>GSTIN: 29AABCA8821K1ZM</Text>
              <Text style={styles.storeTaxDivider}>•</Text>
              <Text style={styles.storeTaxText}>Reg No: CHS/BLR/MART-04</Text>
            </View>
            <Text style={styles.storeHelpdesk}>
              Helpdesk & Delivery Desk: +91 98765 43210 | mart@greenglen.society
            </Text>
          </View>

          <View style={styles.dashedDivider} />

          {/* Receipt Meta & Customer Block */}
          <View style={styles.metaContainer}>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>RECEIPT NO:</Text>
              <Text style={styles.metaValBold}>{currentOrder.orderNumber}</Text>
              <Text style={styles.metaLabel}>DATE & TIME:</Text>
              <Text style={styles.metaVal}>{currentOrder.createdAt}</Text>
              <Text style={styles.metaLabel}>FULFILLMENT:</Text>
              <Text style={styles.metaVal}>
                {currentOrder.fulfillmentType === 'DELIVERY'
                  ? '🛵 Doorstep Society Delivery'
                  : '🏪 Mart Counter Pickup'}
              </Text>
            </View>

            <View style={styles.metaColumnRight}>
              <View style={styles.custHeaderRow}>
                <Text style={styles.metaLabel}>BILLED TO CUSTOMER:</Text>
                <TouchableOpacity
                  style={styles.quickEditPill}
                  onPress={() => setEditModalVisible(true)}
                >
                  <Ionicons name="pencil" size={11} color="#4338CA" />
                  <Text style={styles.quickEditPillText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.custNameBold}>{currentOrder.customerName}</Text>
              <Text style={styles.custFlatBadge}>Flat: {currentOrder.customerFlat}</Text>
              <Text style={styles.metaVal}>Phone: {currentOrder.customerPhone || 'N/A'}</Text>
              {currentOrder.deliveryAddress ? (
                <Text style={styles.metaVal} numberOfLines={2}>
                  Address: {currentOrder.deliveryAddress}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.dashedDivider} />

          {/* Table of Items */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, { flex: 5 }]}>ITEM & SPEC</Text>
            <Text style={[styles.tableColHeader, { flex: 2, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.tableColHeader, { flex: 2, textAlign: 'right' }]}>RATE</Text>
            <Text style={[styles.tableColHeader, { flex: 3, textAlign: 'right' }]}>AMOUNT</Text>
          </View>

          {normalizeOrderItems(currentOrder).map((item, idx) => {
            const itemName = item.name;
            const itemQty = item.quantity;
            const itemRate = item.price;
            const itemTotal = item.total;
            const itemUnit = item.unit;
            const itemEmoji = item.emoji;

            return (
              <View key={idx} style={styles.tableRow}>
                <View style={{ flex: 5, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.itemEmoji}>{itemEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{itemName}</Text>
                    <Text style={styles.itemUnit}>{itemUnit}</Text>
                  </View>
                </View>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'center' }]}>
                  {itemQty}
                </Text>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                  ₹{itemRate.toFixed(2)}
                </Text>
                <Text style={[styles.tableCellBold, { flex: 3, textAlign: 'right' }]}>
                  ₹{itemTotal.toFixed(2)}
                </Text>
              </View>
            );
          })}

          <View style={styles.dashedDivider} />

          {/* Financial Calculation */}
          <View style={styles.calcContainer}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Item Subtotal</Text>
              <Text style={styles.calcVal}>₹{Number(currentOrder.subtotal || 0).toFixed(2)}</Text>
            </View>

            {currentOrder.discount > 0 && (
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: '#059669' }]}>
                  Society Promo Discount {currentOrder.discountCode ? `(${currentOrder.discountCode})` : ''}
                </Text>
                <Text style={[styles.calcVal, { color: '#059669' }]}>
                  -₹{Number(currentOrder.discount).toFixed(2)}
                </Text>
              </View>
            )}

            {currentOrder.deliveryFee > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Doorstep Delivery Fee</Text>
                <Text style={styles.calcVal}>₹{Number(currentOrder.deliveryFee).toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Taxes (CGST 2.5% + SGST 2.5%)</Text>
              <Text style={styles.calcVal}>₹{Number(currentOrder.tax || 0).toFixed(2)}</Text>
            </View>

            <View style={styles.solidDivider} />

            <View style={styles.grandTotalRow}>
              <View>
                <Text style={styles.grandTotalTitle}>GRAND TOTAL</Text>
                <Text style={styles.inWords}>
                  Tender: {currentOrder.paymentMethod} • Status: {currentOrder.paymentStatus}
                </Text>
              </View>
              <Text style={styles.grandTotalVal}>₹{Number(currentOrder.totalAmount || 0).toFixed(2)}</Text>
            </View>
          </View>

          {/* Barcode & Digital Verification Footer */}
          <View style={styles.barcodeSection}>
            <Text style={styles.barcodeLines}>|||| | ||||| || |||||| | |||| ||||| ||| |</Text>
            <Text style={styles.barcodeText}>REF: {currentOrder.orderNumber}</Text>
            <View style={styles.stampBox}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={styles.stampText}>VERIFIED SOCIETY MART RECEIPT • NO CASH REFUNDS</Text>
            </View>
            <Text style={styles.footerNotice}>
              For any replacements or discrepancy, please present this digital slip at the Society
              Mart counter within 24 hours.
            </Text>
          </View>
        </View>

        {/* Action Buttons Below Receipt Card */}
        <View style={styles.bottomActionsBox}>
          <TouchableOpacity style={styles.actionBtnWhatsApp} onPress={handleShareWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnWhatsAppText}>Send PDF to WhatsApp (Direct Chat & File)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnFile} onPress={handleDownloadDirectPdf}>
            <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnFileText}>Download Official PDF Receipt (.PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnPrimary} onPress={handlePrintPdfDialog}>
            <Ionicons name="print-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnPrimaryText}>Print / Save via Browser (Dialog)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnCopy} onPress={handleCopyReceiptText}>
            <Ionicons name="copy-outline" size={18} color="#1E293B" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnCopyText}>Copy Receipt Text to Clipboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="pencil-outline" size={18} color="#374151" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnSecondaryText}>Edit Customer Name / Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal: Edit Order Customer Name & Details */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.editCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="person-circle-outline" size={22} color="#4338CA" />
                <Text style={[styles.modalTitle, { marginLeft: 8 }]}>Edit Order Customer</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Update the customer name and flat for Order #{currentOrder.orderNumber}. Changes will
              reflect immediately across bills, WhatsApp receipts, and vendor orders.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter customer full name..."
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Flat Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFlat}
                  onChangeText={setEditFlat}
                  placeholder="e.g. B-204"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Contact Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 98765..."
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Delivery Address / Notes</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Doorstep address or special instructions..."
                multiline
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDetails}>
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: WhatsApp PDF Attachment Guidance & Quick Actions */}
      <WhatsAppPdfModal
        visible={whatsAppModalVisible}
        onClose={() => setWhatsAppModalVisible(false)}
        order={currentOrder}
        onRedownloadPdf={handleDownloadDirectPdf}
        onReopenWhatsApp={handleShareWhatsApp}
        onCopyText={handleCopyReceiptText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  toastWrap: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    zIndex: 9999,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  navHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  whatsappHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  whatsappHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  printHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  printHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    alignItems: 'center',
  },
  receiptPaper: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taxInvoiceTag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  taxInvoiceTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  paidTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidTagGreen: {
    backgroundColor: '#DCFCE7',
  },
  paidTagAmber: {
    backgroundColor: '#FEF3C7',
  },
  paidTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  paidTagTextGreen: {
    color: '#15803D',
  },
  paidTagTextAmber: {
    color: '#B45309',
  },
  storeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  martLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  storeAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  storeTaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  storeTaxText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  storeTaxDivider: {
    color: '#94A3B8',
  },
  storeHelpdesk: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  metaColumn: {
    flex: 1,
  },
  metaColumnRight: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  metaVal: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    marginTop: 1,
  },
  metaValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  custHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  quickEditPillText: {
    fontSize: 10,
    color: '#4338CA',
    fontWeight: '700',
  },
  custNameBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  custFlatBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemUnit: {
    fontSize: 10,
    color: '#94A3B8',
  },
  tableCell: {
    fontSize: 12,
    color: '#475569',
  },
  tableCellBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  calcContainer: {
    marginTop: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  calcLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  grandTotalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  inWords: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  grandTotalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },
  barcodeSection: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  barcodeLines: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 4,
    fontSize: 15,
    color: '#1E293B',
  },
  barcodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 2,
    marginTop: 4,
  },
  stampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stampText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  footerNotice: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
  bottomActionsBox: {
    width: '100%',
    maxWidth: 600,
    marginTop: 16,
    gap: 10,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#4338CA',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnFileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionBtnWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnCopyText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnSecondaryText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14,
  },
  fallbackSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  fallbackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4338CA',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
