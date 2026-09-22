import { Share, Platform, Alert } from 'react-native';

export interface SharePassDetails {
  passId: string;
  passType: 'RESIDENT' | 'VISITOR' | 'FACILITY';
  title?: string;
  visitorName?: string;
  category?: string;
  residentName: string;
  flatNumber: string;
  tower: string;
  residentPhone?: string;
  validDate: string;
  timeWindow?: string;
  accessPin: string;
  vehicleNumber?: string;
  facilityName?: string;
  qrPayload: string;
}

/**
 * Returns a high-resolution, publicly accessible direct PNG image URL for the QR code.
 * When shared in WhatsApp, iMessage, Telegram, or Slack, the app unfurls this link into
 * a visible preview of the actual QR code image inside the chat message.
 */
export function getQrImageUrl(qrPayload: string, size = 450): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(qrPayload)}`;
}

/**
 * Generates the formatted message text with pass details, gate access PIN,
 * and the direct scannable QR code image link.
 */
export function formatPassShareMessage(details: SharePassDetails): string {
  const qrImageUrl = getQrImageUrl(details.qrPayload);

  if (details.passType === 'VISITOR') {
    return (
      `🎫 *AMA VISITOR GATE PASS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Visitor:* ${details.visitorName} (${details.category || 'Guest'})\n` +
      `🏠 *Visiting Unit:* Flat ${details.flatNumber}, ${details.tower}\n` +
      `👨‍💼 *Host Resident:* ${details.residentName}` + (details.residentPhone ? ` • ${details.residentPhone}` : '') + `\n` +
      `📅 *Date:* ${details.validDate}\n` +
      `⏰ *Allowed Window:* ${details.timeWindow || 'All Day'}\n` +
      (details.vehicleNumber ? `🚗 *Vehicle:* ${details.vehicleNumber}\n` : '') +
      `🔑 *Gate Access PIN:* *${details.accessPin}*\n` +
      `🆔 *Pass ID:* #${details.passId}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📷 *TAP TO OPEN / SCAN QR CODE AT GATE:*\n` +
      `${qrImageUrl}\n\n` +
      `💡 *Instructions:* Show the QR code or state PIN *${details.accessPin}* to the security gatekeeper for rapid contactless entry.`
    );
  }

  if (details.passType === 'FACILITY') {
    return (
      `🎟️ *AMA FACILITY RESERVATION PASS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏛️ *Facility:* ${details.facilityName}\n` +
      `👤 *Resident:* ${details.residentName} (Flat ${details.flatNumber}, ${details.tower})\n` +
      `📅 *Date & Slot:* ${details.validDate} • ${details.timeWindow}\n` +
      `🔑 *Access PIN:* *${details.accessPin}*\n` +
      `🆔 *Booking ID:* #${details.passId}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📷 *TAP TO OPEN / SCAN QR CODE AT GATE:*\n` +
      `${qrImageUrl}\n\n` +
      `Show this pass at the clubhouse/facility reception to enter.`
    );
  }

  // RESIDENT GATE PASS
  return (
    `🛡️ *AMA RESIDENT GATE PASS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Resident:* ${details.residentName}\n` +
    `🏠 *Unit:* Flat ${details.flatNumber}, ${details.tower}\n` +
    `🔑 *Pass ID:* #${details.passId}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📷 *TAP TO OPEN / SCAN RESIDENT QR CODE:*\n` +
    `${qrImageUrl}\n\n` +
    `Present this QR code at any society checkpoint for instant resident access.`
  );
}

/**
 * Shares the pass including the full scannable QR code image.
 * Uses Web Share API with an attached Image File where supported,
 * and falls back to native Share with the direct QR image link and details.
 */
export async function sharePassWithQrCode(
  details: SharePassDetails,
  qrBase64?: string
): Promise<{ success: boolean; method: string }> {
  const message = formatPassShareMessage(details);
  const qrImageUrl = getQrImageUrl(details.qrPayload);
  const shareTitle = `Gate Pass - ${details.visitorName || details.residentName} (${details.flatNumber})`;

  // 1. Try Web Share API with actual image file if running in browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    try {
      let fileToShare: File | null = null;

      if (qrBase64) {
        // Convert base64 data to File object
        const cleanBase64 = qrBase64.replace(/^data:image\/\w+;base64,/, '');
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        fileToShare = new File([blob], `AMA-Pass-${details.passId}.png`, { type: 'image/png' });
      }

      // If navigator.canShare supports files
      if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          title: shareTitle,
          text: message,
          files: [fileToShare],
        });
        return { success: true, method: 'web-share-file' };
      }

      // If navigator.share supports text + URL
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: message,
          url: qrImageUrl,
        });
        return { success: true, method: 'web-share-url' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User closed the share dialog
        return { success: false, method: 'cancelled' };
      }
      console.warn('Web Share failed, falling back to React Native Share', err);
    }
  }

  // 2. React Native Share fallback (works across iOS, Android, and mobile web)
  try {
    const result = await Share.share({
      title: shareTitle,
      message,
      url: qrImageUrl,
    });

    if (result.action === Share.sharedAction) {
      return { success: true, method: 'rn-share' };
    }
    return { success: false, method: 'dismissed' };
  } catch (error) {
    console.error('Share error:', error);
    // Last resort fallback: copy to clipboard
    copyPassToClipboard(details);
    return { success: true, method: 'clipboard' };
  }
}

/**
 * Downloads the high-resolution QR code PNG image directly to the user's device
 * so they can manually send the picture or save it to their photo gallery.
 */
export async function downloadQrCodeImage(
  qrPayload: string,
  filename: string,
  qrBase64?: string
): Promise<void> {
  const qrImageUrl = getQrImageUrl(qrPayload, 600);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      let dataUri = '';
      if (qrBase64) {
        dataUri = qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`;
      } else {
        // Fetch image blob from QR generator service
        const response = await fetch(qrImageUrl);
        const blob = await response.blob();
        dataUri = URL.createObjectURL(blob);
      }

      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `AMA-Pass-${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (!qrBase64) URL.revokeObjectURL(dataUri);

      Alert.alert(
        'QR Code Downloaded',
        `The QR Code image "AMA-Pass-${filename}.png" has been downloaded to your device!`
      );
      return;
    } catch (error) {
      console.error('Download error:', error);
    }
  }

  // Fallback: open image in new window
  if (typeof window !== 'undefined') {
    window.open(qrImageUrl, '_blank');
  } else {
    Alert.alert('Download QR Code', `You can view and save the QR Code image at:\n${qrImageUrl}`);
  }
}

/**
 * Copies the complete pass information along with the scannable QR image link to clipboard.
 */
export async function copyPassToClipboard(details: SharePassDetails): Promise<void> {
  const text = formatPassShareMessage(details);
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      Alert.alert(
        'Copied to Clipboard',
        'Pass details & scannable QR code link have been copied to your clipboard!'
      );
      return;
    } catch (e) {
      console.warn('Clipboard writeText failed', e);
    }
  }
  Alert.alert('Pass Details', text);
}
