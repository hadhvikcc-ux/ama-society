import { Platform, Linking, Share } from 'react-native';
import { BazaarOrder } from '../stores/bazaarStore';

export interface SharePdfResult {
  success: boolean;
  method: 'web-share-file' | 'download-and-whatsapp' | 'whatsapp-link' | 'clipboard-fallback';
  whatsappUrl: string;
  message: string;
  fileName: string;
}

export interface NormalizedOrderItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  emoji: string;
}

/**
 * Normalizes any order object items into consistent, display-ready items.
 * Guarantees that item details reflect properly in receipts, PDFs, and WhatsApp.
 */
export function normalizeOrderItems(order: any): NormalizedOrderItem[] {
  if (!order) return [];
  let rawItems = order.items || order.orderItems || order.lineItems || order.cart || [];

  if (typeof rawItems === 'string') {
    try {
      rawItems = JSON.parse(rawItems);
    } catch (e) {
      rawItems = [];
    }
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    const totalAmount = Number(order.totalAmount) || Number(order.subtotal) || 0;
    return [
      {
        name: order.notes ? `Mart Grocery Order (${order.notes})` : 'AMA Society Mart Grocery & Daily Essentials Pack',
        quantity: 1,
        unit: 'order',
        price: totalAmount,
        total: totalAmount,
        emoji: '🛒',
      },
    ];
  }

  return rawItems.map((item: any, idx: number) => {
    const name = String(
      item.productName || item.name || item.title || item.item || item.description || item.product?.name || `Item #${idx + 1}`
    ).trim();
    const quantity = Math.max(1, Number(item.quantity || item.qty || 1));
    const unit = String(item.unit || item.unitType || 'pcs').trim();
    const price = Number(
      item.price || item.unitPrice || item.rate || (Number(item.total) && quantity ? Number(item.total) / quantity : 0)
    );
    const total = Number(item.total || item.amount || price * quantity);
    const emoji = item.emoji || '📦';

    return {
      name: name || `Item #${idx + 1}`,
      quantity,
      unit: unit || 'pcs',
      price: isNaN(price) ? 0 : price,
      total: isNaN(total) ? 0 : total,
      emoji,
    };
  });
}

/**
 * Generates an official, standard vector PDF document conforming to the PDF 1.4 spec.
 * Completely self-contained, 0 external runtime dependencies, 100% offline-compatible.
 */
export function generateReceiptPdfBytes(order: BazaarOrder): Uint8Array {
  const items = normalizeOrderItems(order);
  const orderNum = order.orderNumber || 'ORD-0000';
  const customer = (order.customerName || 'Society Resident').replace(/[()\\]/g, '');
  const flat = (order.customerFlat || 'Flat').replace(/[()\\]/g, '');
  const phone = (order.customerPhone || 'N/A').replace(/[()\\]/g, '');
  const date = (order.createdAt || new Date().toLocaleDateString('en-IN')).replace(/[()\\]/g, '');
  const paymentMethod = (order.paymentMethod || 'UPI').replace(/[()\\]/g, '');
  const paymentStatus = (order.paymentStatus || 'PAID').replace(/[()\\]/g, '');
  const subtotal = Number(order.subtotal || 0).toFixed(2);
  const discount = Number(order.discount || 0).toFixed(2);
  const deliveryFee = Number(order.deliveryFee || 0).toFixed(2);
  const tax = Number(order.tax || 0).toFixed(2);
  const grandTotal = Number(order.totalAmount || 0).toFixed(2);
  const isDelivery = order.fulfillmentType === 'DELIVERY';

  let stream = '';

  // Header background rectangle (light pastel indigo)
  stream += '0.93 0.95 1.0 rg\n14 785 567 42 re f\n';

  // Tax Invoice Tag
  stream += 'BT\n/F2 8 Tf\n0.26 0.22 0.79 rg\n22 812 Td\n(OFFICIAL TAX INVOICE & CASH MEMO) Tj\nET\n';

  // Status Badge
  const isPaid = paymentStatus === 'PAID';
  if (isPaid) {
    stream += '0.92 0.99 0.95 rg\n495 807 72 16 re f\n';
    stream += 'BT\n/F2 8 Tf\n0.02 0.58 0.41 rg\n505 812 Td\n([PAID - VERIFIED]) Tj\nET\n';
  } else {
    stream += '0.99 0.95 0.78 rg\n495 807 72 16 re f\n';
    stream += 'BT\n/F2 8 Tf\n0.85 0.47 0.02 rg\n505 812 Td\n([OUTSTANDING]) Tj\nET\n';
  }

  // Brand Name
  stream += 'BT\n/F2 16 Tf\n0.06 0.09 0.16 rg\n22 793 Td\n(AMA SOCIETY FRESH MART) Tj\nET\n';

  // Subtitle
  stream += 'BT\n/F1 8 Tf\n0.39 0.45 0.54 rg\n22 770 Td\n(Ground Floor Lobby, Tower B, Green Glen Palms | GSTIN: 29AABCA8821K1ZM | Reg: CHS/BLR/MART-04) Tj\nET\n';

  // Divider
  stream += '0.8 0.85 0.9 RG\n1 w\n14 760 m 581 760 l S\n';

  // Order Details 2-Column Grid
  stream += `BT\n/F2 8.5 Tf\n0.06 0.09 0.16 rg\n14 742 Td\n(RECEIPT NO: ${orderNum}) Tj\nET\n`;
  stream += `BT\n/F2 8.5 Tf\n0.06 0.09 0.16 rg\n360 742 Td\n(BILLED TO: ${customer}) Tj\nET\n`;

  stream += `BT\n/F1 8 Tf\n0.39 0.45 0.54 rg\n14 728 Td\n(DATE: ${date}) Tj\nET\n`;
  stream += `BT\n/F1 8 Tf\n0.39 0.45 0.54 rg\n360 728 Td\n(FLAT: ${flat}) Tj\nET\n`;

  stream += `BT\n/F1 8 Tf\n0.39 0.45 0.54 rg\n14 714 Td\n(FULFILLMENT: ${isDelivery ? 'Doorstep Delivery' : 'Mart Pickup'}) Tj\nET\n`;
  stream += `BT\n/F1 8 Tf\n0.39 0.45 0.54 rg\n360 714 Td\n(PHONE: ${phone}) Tj\nET\n`;

  // Table header background
  stream += '0.95 0.96 0.98 rg\n14 690 567 18 re f\n';
  stream += '0.8 0.85 0.9 RG\n14 690 m 581 690 l S\n14 708 m 581 708 l S\n';

  // Table header text
  stream += 'BT\n/F2 8 Tf\n0.28 0.33 0.41 rg\n22 696 Td\n(ITEM DESCRIPTION) Tj\n350 696 Td\n(QTY) Tj\n430 696 Td\n(UNIT RATE) Tj\n510 696 Td\n(TOTAL) Tj\nET\n';

  let y = 672;
  items.forEach((item, index) => {
    const rawName = (item.name || `Item ${index + 1}`).replace(/[()\\]/g, '');
    const safeName = rawName.length > 40 ? rawName.slice(0, 38) + '..' : rawName;
    const qtyText = `${item.quantity} ${item.unit || 'pcs'}`;
    const rateText = `Rs ${Number(item.price || 0).toFixed(2)}`;
    const totalText = `Rs ${Number(item.total || 0).toFixed(2)}`;

    stream += `BT\n/F1 8.5 Tf\n0.12 0.16 0.23 rg\n22 ${y} Td\n(${safeName}) Tj\n350 ${y} Td\n(${qtyText}) Tj\n430 ${y} Td\n(${rateText}) Tj\nET\n`;
    stream += `BT\n/F2 8.5 Tf\n0.12 0.16 0.23 rg\n510 ${y} Td\n(${totalText}) Tj\nET\n`;

    // Row underline
    stream += `0.93 0.95 0.98 RG\n0.5 w\n14 ${y - 4} m 581 ${y - 4} l S\n`;
    y -= 16;
  });

  // Summary section
  y -= 8;
  stream += `0.8 0.85 0.9 RG\n1 w\n360 ${y} m 581 ${y} l S\n`;
  y -= 14;

  stream += `BT\n/F1 8.5 Tf\n0.28 0.33 0.41 rg\n360 ${y} Td\n(Item Subtotal:) Tj\nET\n`;
  stream += `BT\n/F1 8.5 Tf\n0.06 0.09 0.16 rg\n510 ${y} Td\n(Rs ${subtotal}) Tj\nET\n`;

  if (Number(discount) > 0) {
    y -= 14;
    stream += `BT\n/F1 8.5 Tf\n0.02 0.58 0.41 rg\n360 ${y} Td\n(Discount Applied:) Tj\nET\n`;
    stream += `BT\n/F1 8.5 Tf\n0.02 0.58 0.41 rg\n510 ${y} Td\n(-Rs ${discount}) Tj\nET\n`;
  }

  if (Number(deliveryFee) > 0) {
    y -= 14;
    stream += `BT\n/F1 8.5 Tf\n0.28 0.33 0.41 rg\n360 ${y} Td\n(Delivery Fee:) Tj\nET\n`;
    stream += `BT\n/F1 8.5 Tf\n0.06 0.09 0.16 rg\n510 ${y} Td\n(Rs ${deliveryFee}) Tj\nET\n`;
  }

  if (Number(tax) > 0) {
    y -= 14;
    stream += `BT\n/F1 8.5 Tf\n0.28 0.33 0.41 rg\n360 ${y} Td\n(GST (5%):) Tj\nET\n`;
    stream += `BT\n/F1 8.5 Tf\n0.06 0.09 0.16 rg\n510 ${y} Td\n(Rs ${tax}) Tj\nET\n`;
  }

  y -= 6;
  stream += `0.06 0.09 0.16 RG\n1.5 w\n360 ${y} m 581 ${y} l S\n`;
  y -= 16;

  stream += `BT\n/F2 11 Tf\n0.06 0.09 0.16 rg\n360 ${y} Td\n(GRAND TOTAL:) Tj\nET\n`;
  stream += `BT\n/F2 12 Tf\n0.02 0.58 0.41 rg\n510 ${y} Td\n(Rs ${grandTotal}) Tj\nET\n`;

  // Footer notes
  stream += `0.8 0.85 0.9 RG\n1 w\n14 60 m 581 60 l S\n`;
  stream += `BT\n/F1 7.5 Tf\n0.39 0.45 0.54 rg\n14 46 Td\n(Payment Mode: ${paymentMethod}  |  Payment Status: ${paymentStatus}  |  Verified Society Mart Tax Invoice) Tj\nET\n`;
  stream += `BT\n/F1 7.5 Tf\n0.39 0.45 0.54 rg\n14 34 Td\n(Thank you for shopping with AMA Society Fresh Mart! Helpdesk & Delivery Inquiries: +91 98765 43210) Tj\nET\n`;

  const enc = new TextEncoder();
  const streamBuf = enc.encode(stream);
  const streamLen = streamBuf.length;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
  const obj6 = `6 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`;

  const header = '%PDF-1.4\n';
  const p1 = enc.encode(header).length;
  const p2 = p1 + enc.encode(obj1).length;
  const p3 = p2 + enc.encode(obj2).length;
  const p4 = p3 + enc.encode(obj3).length;
  const p5 = p4 + enc.encode(obj4).length;
  const p6 = p5 + enc.encode(obj5).length;
  const xrefOffset = p6 + enc.encode(obj6).length;

  const pad = (n: number) => String(n).padStart(10, '0');
  const xref = `xref\n0 7\n0000000000 65535 f \n${pad(p1)} 00000 n \n${pad(p2)} 00000 n \n${pad(p3)} 00000 n \n${pad(p4)} 00000 n \n${pad(p5)} 00000 n \n${pad(p6)} 00000 n \n`;
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdfString = header + obj1 + obj2 + obj3 + obj4 + obj5 + obj6 + xref + trailer;
  return enc.encode(fullPdfString);
}

/**
 * Returns a document wrapper object matching standard PDF writer APIs.
 */
export function generateReceiptPdf(order: BazaarOrder) {
  const bytes = generateReceiptPdfBytes(order);
  return {
    output: (type?: string) => {
      if (type === 'arraybuffer') {
        return bytes.buffer;
      }
      if (type === 'blob') {
        return new Blob([bytes], { type: 'application/pdf' });
      }
      return bytes;
    },
    save: (filename?: string) => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `Receipt-${order.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    },
  };
}

/**
 * Returns the PDF document as a Blob with MIME application/pdf.
 */
export function getReceiptPdfBlob(order: BazaarOrder): Blob {
  const bytes = generateReceiptPdfBytes(order);
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Triggers a direct browser download of Receipt-${orderNumber}.pdf.
 */
export function downloadReceiptPdf(order: BazaarOrder): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const doc = generateReceiptPdf(order);
    const fileName = `Receipt-${order.orderNumber}.pdf`;
    doc.save(fileName);
    return fileName;
  }
  return '';
}

/**
 * Generates the clean WhatsApp itemized summary with online PDF viewer link.
 */
export function formatWhatsAppReceiptMessage(order: BazaarOrder, baseUrl?: string): string {
  const origin =
    baseUrl ||
    (Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:8081');

  const pdfDownloadUrl = `${origin}/receipts?orderId=${encodeURIComponent(order.orderNumber)}&download=pdf`;

  const itemsSummary = normalizeOrderItems(order)
    .map((it) => {
      const emoji = it.emoji ? `${it.emoji} ` : '• ';
      return `${emoji}*${it.name}* (${it.quantity} ${it.unit}) — ₹${it.total.toFixed(2)}`;
    })
    .join('\n');

  return [
    '🧾 *OFFICIAL TAX INVOICE & RECEIPT*',
    '🏛️ *AMA Society Fresh Mart*',
    'Ground Floor Lobby, Tower B, Green Glen Palms',
    'GSTIN: 29AABCA8821K1ZM | Reg: CHS/BLR/MART-04',
    '----------------------------------------',
    `📄 *Receipt No:* ${order.orderNumber}`,
    `📅 *Date:* ${order.createdAt}`,
    `👤 *Customer:* ${order.customerName}`,
    `🏠 *Flat:* ${order.customerFlat}`,
    `📞 *Phone:* ${order.customerPhone || 'N/A'}`,
    `📦 *Fulfillment:* ${
      order.fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Mart Pickup'
    }`,
    '----------------------------------------',
    '*ITEMS ORDERED:*',
    itemsSummary,
    '----------------------------------------',
    `Subtotal: ₹${Number(order.subtotal || 0).toFixed(2)}`,
    order.discount > 0 ? `Discount: -₹${Number(order.discount).toFixed(2)}` : null,
    order.deliveryFee > 0 ? `Delivery Fee: ₹${Number(order.deliveryFee).toFixed(2)}` : null,
    order.tax && order.tax > 0 ? `Taxes (GST 5%): ₹${Number(order.tax).toFixed(2)}` : null,
    `*TOTAL PAID: ₹${Number(order.totalAmount || 0).toFixed(2)}*`,
    `*Payment Mode:* ${order.paymentMethod} (${order.paymentStatus})`,
    '----------------------------------------',
    '📥 *View / Download Official PDF Online:*',
    pdfDownloadUrl,
    '----------------------------------------',
    'Thank you for shopping with AMA Society Mart!',
    'Queries & Support: +91 98765 43210',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Coordinates end-to-end PDF delivery to WhatsApp:
 * 1. Mobile browser: uses Web Share API with PDF File to directly attach the PDF in WhatsApp.
 * 2. Desktop Web: automatically downloads Receipt-${orderNumber}.pdf to computer and opens WhatsApp Web with contact & text.
 * 3. Mobile native: dispatches via Linking / Share.
 */
export async function shareReceiptPdf(
  order: BazaarOrder,
  baseUrl?: string
): Promise<SharePdfResult> {
  const fileName = `Receipt-${order.orderNumber}.pdf`;
  const message = formatWhatsAppReceiptMessage(order, baseUrl);

  const cleanPhone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
  const targetPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
  const whatsappUrl = targetPhone.length >= 10
    ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  // 1. Mobile Web Share API with files (direct WhatsApp PDF attachment)
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    try {
      const blob = getReceiptPdfBlob(order);
      if (typeof File !== 'undefined' && (navigator as any).canShare) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if ((navigator as any).canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Receipt #${order.orderNumber}`,
            text: message,
          });
          return { success: true, method: 'web-share-file', whatsappUrl, message, fileName };
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'web-share-file', whatsappUrl, message, fileName };
      }
      console.warn('Web Share file failed, falling back to download + WhatsApp link:', err);
    }

    // 2. Desktop Web: Download actual PDF to Downloads and open WhatsApp
    downloadReceiptPdf(order);

    const win = window.open(whatsappUrl, '_blank');
    if (!win && navigator.clipboard) {
      navigator.clipboard.writeText(message);
      return { success: true, method: 'clipboard-fallback', whatsappUrl, message, fileName };
    }

    return { success: true, method: 'download-and-whatsapp', whatsappUrl, message, fileName };
  }

  // 3. React Native Mobile
  try {
    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
      return { success: true, method: 'whatsapp-link', whatsappUrl, message, fileName };
    }
  } catch (e) {
    // fallback
  }

  await Share.share({ message, title: `Receipt #${order.orderNumber}` });
  return { success: true, method: 'whatsapp-link', whatsappUrl, message, fileName };
}

