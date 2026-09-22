/**
 * UPI Payment Utilities
 * Implements NPCI (National Payments Corporation of India) standard UPI URI formatting,
 * parsing, QR code image preview generation, and voice soundbox announcements.
 */

import { Linking, Platform } from 'react-native';

export interface UpiPaymentDetails {
  pa: string; // Payee VPA / UPI ID (e.g. ama.society@icici)
  pn: string; // Payee Name (e.g. AMA Resident Welfare Association)
  am?: number | string; // Transaction Amount (e.g. 4500.00)
  cu?: string; // Currency code (default: INR)
  tn?: string; // Transaction Note / Remarks (e.g. Maintenance Sep 2023)
  tr?: string; // Transaction Reference ID (e.g. INV-1-89234)
  mc?: string; // Merchant Code / MCC (optional)
}

/**
 * Generates an NPCI-compliant UPI payment URI:
 * e.g. upi://pay?pa=ama.society@icici&pn=AMA%20Society&am=4500.00&cu=INR&tn=Maintenance
 */
export function generateUpiUri(details: UpiPaymentDetails): string {
  const params: string[] = [
    `pa=${encodeURIComponent(details.pa.trim())}`,
    `pn=${encodeURIComponent(details.pn.trim())}`,
  ];

  if (details.am !== undefined && details.am !== null && details.am !== '') {
    const num = typeof details.am === 'number' ? details.am : parseFloat(details.am);
    if (!isNaN(num) && num > 0) {
      params.push(`am=${num.toFixed(2)}`);
    }
  }

  params.push(`cu=${details.cu || 'INR'}`);

  if (details.tn) {
    params.push(`tn=${encodeURIComponent(details.tn.trim())}`);
  }

  if (details.tr) {
    params.push(`tr=${encodeURIComponent(details.tr.trim())}`);
  }

  if (details.mc) {
    params.push(`mc=${encodeURIComponent(details.mc.trim())}`);
  }

  return `upi://pay?${params.join('&')}`;
}

/**
 * Parses an NPCI UPI payment URI into structured details.
 * Supports upi://pay?... and raw query strings.
 */
export function parseUpiUri(uri: string): UpiPaymentDetails | null {
  if (!uri || typeof uri !== 'string') return null;

  try {
    let queryString = uri;
    if (uri.startsWith('upi://pay?')) {
      queryString = uri.replace('upi://pay?', '');
    } else if (uri.includes('?')) {
      queryString = uri.split('?')[1];
    }

    const searchParams = new URLSearchParams(queryString);
    const pa = searchParams.get('pa');
    const pn = searchParams.get('pn');

    if (!pa) return null;

    const am = searchParams.get('am') || undefined;
    const cu = searchParams.get('cu') || 'INR';
    const tn = searchParams.get('tn') || undefined;
    const tr = searchParams.get('tr') || undefined;
    const mc = searchParams.get('mc') || undefined;

    return {
      pa: decodeURIComponent(pa),
      pn: pn ? decodeURIComponent(pn) : 'UPI Payee',
      am: am ? parseFloat(am) : undefined,
      cu,
      tn: tn ? decodeURIComponent(tn) : undefined,
      tr: tr ? decodeURIComponent(tr) : undefined,
      mc: mc ? decodeURIComponent(mc) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Generates a public HTTPS QR Code image URL for sharing or fallback rendering.
 */
export function getPublicUpiQrImageUrl(upiUri: string, size: number = 450): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=png&margin=10&data=${encodeURIComponent(
    upiUri
  )}`;
}

/**
 * Directly launches Google Pay or the default UPI application via Intent.
 */
export async function openGooglePay(upiUri: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(upiUri);
    if (supported) {
      await Linking.openURL(upiUri);
      return true;
    } else {
      await Linking.openURL(upiUri);
      return true;
    }
  } catch (error) {
    console.log('Unable to launch UPI app directly:', error);
    return false;
  }
}

/**
 * Triggers a Google Pay / Paytm Soundbox style voice announcement:
 * e.g. "Google Pay par ₹500 prapt hue!" / "₹500 received on Google Pay!"
 */
export function speakSoundboxNotification(amount: number, appName: string = 'Google Pay'): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const text = `${appName} par ₹${amount.toLocaleString('en-IN')} rupaye prapt hue. ₹${amount.toLocaleString('en-IN')} received on ${appName}!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log('Soundbox speech synthesis not available:', e);
    }
  }
}
