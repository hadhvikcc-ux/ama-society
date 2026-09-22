/**
 * Universal File & Media Picker Utility
 * Supports Pictures, Videos, Screenshots, Excel Spreadsheets (.xlsx, .xls, .csv),
 * and Documents (.pdf, .doc, .docx, .txt).
 */

import { Platform } from 'react-native';

export type AttachmentType = 'IMAGE' | 'VIDEO' | 'EXCEL' | 'DOCUMENT';

export interface AppAttachment {
  id: string;
  name: string;
  size: string; // formatted size e.g. "1.8 MB"
  sizeBytes: number;
  type: AttachmentType;
  uri: string;
  mimeType: string;
  uploadedAt: string;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function determineAttachmentType(fileName: string, mimeType?: string): AttachmentType {
  const lowerName = fileName.toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  if (
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.csv') ||
    lowerMime.includes('spreadsheet') ||
    lowerMime.includes('excel') ||
    lowerMime.includes('csv')
  ) {
    return 'EXCEL';
  }

  if (
    lowerName.endsWith('.mp4') ||
    lowerName.endsWith('.mov') ||
    lowerName.endsWith('.avi') ||
    lowerName.endsWith('.webm') ||
    lowerName.endsWith('.mkv') ||
    lowerMime.startsWith('video/')
  ) {
    return 'VIDEO';
  }

  if (
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.webp') ||
    lowerName.endsWith('.gif') ||
    lowerName.endsWith('.heic') ||
    lowerMime.startsWith('image/')
  ) {
    return 'IMAGE';
  }

  return 'DOCUMENT';
}

/**
 * Universal file picker leveraging standard HTML5 file inputs on web
 * and cross-platform fallback.
/**
 * Universal file picker leveraging standard HTML5 file inputs on web
 * and cross-platform fallback.
 */
export async function pickAttachments(
  filterType: 'ALL' | 'IMAGE' | 'VIDEO' | 'EXCEL' | 'DOCUMENT' = 'ALL',
  multiple: boolean = true
): Promise<AppAttachment[]> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;

      // Set MIME filters according to user selection
      if (filterType === 'IMAGE') {
        input.accept = 'image/*,.png,.jpg,.jpeg,.webp';
      } else if (filterType === 'VIDEO') {
        input.accept = 'video/*,.mp4,.mov,.webm';
      } else if (filterType === 'EXCEL') {
        input.accept = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';
      } else if (filterType === 'DOCUMENT') {
        input.accept = '.pdf,.doc,.docx,.txt,application/pdf,application/msword';
      } else {
        input.accept = 'image/*,video/*,.pdf,.doc,.docx,.xlsx,.xls,.csv,.txt';
      }

      input.onchange = async (event: any) => {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) {
          resolve([]);
          return;
        }

        const readAsDataUrl = (file: File): Promise<string> => {
          return new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.onerror = () => res(URL.createObjectURL(file));
            reader.readAsDataURL(file);
          });
        };

        const results: AppAttachment[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileType = determineAttachmentType(file.name, file.type);
          
          // For images and videos under 30MB, read as persistent base64 Data URL so they survive page reloads and storage
          let uri: string;
          if ((fileType === 'IMAGE' || fileType === 'VIDEO') && file.size < 30 * 1024 * 1024) {
            try {
              uri = await readAsDataUrl(file);
            } catch {
              uri = URL.createObjectURL(file);
            }
          } else {
            uri = URL.createObjectURL(file);
          }

          results.push({
            id: `att-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name: file.name,
            size: formatBytes(file.size),
            sizeBytes: file.size,
            type: fileType,
            uri,
            mimeType: file.type || 'application/octet-stream',
            uploadedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          });
        }
        resolve(results);
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  // Fallback for native devices
  return [];
}

/**
 * Pre-configured realistic sample attachments for quick testing
 */
export const SAMPLE_ATTACHMENTS: Record<string, AppAttachment> = {
  LEAKAGE_PHOTO: {
    id: 'sample-img-01',
    name: 'Tap_Water_Leakage_Proof.jpg',
    size: '1.4 MB',
    sizeBytes: 1468006,
    type: 'IMAGE',
    uri: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1600&auto=format&fit=crop&q=85',
    mimeType: 'image/jpeg',
    uploadedAt: 'Today, 10:15 AM',
  },
  SEEPAGE_PHOTO: {
    id: 'sample-img-02',
    name: 'Wall_Seepage_Dampness_HD.jpg',
    size: '2.1 MB',
    sizeBytes: 2202009,
    type: 'IMAGE',
    uri: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=85',
    mimeType: 'image/jpeg',
    uploadedAt: 'Today, 10:20 AM',
  },
  ELECTRICAL_BURNT_PHOTO: {
    id: 'sample-img-03',
    name: 'Switchboard_Spark_Damage_HD.jpg',
    size: '1.9 MB',
    sizeBytes: 1992294,
    type: 'IMAGE',
    uri: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600&auto=format&fit=crop&q=85',
    mimeType: 'image/jpeg',
    uploadedAt: 'Today, 10:25 AM',
  },
  INSPECTION_VIDEO: {
    id: 'sample-vid-01',
    name: 'Ceiling_Dampness_Inspection.mp4',
    size: '1.1 MB',
    sizeBytes: 1128375,
    type: 'VIDEO',
    uri: '/assets/inspection-video.mp4',
    mimeType: 'video/mp4',
    uploadedAt: 'Today, 10:18 AM',
  },
  PIPE_BURST_VIDEO: {
    id: 'sample-vid-02',
    name: 'Main_Pipeline_Burst_Recording.mp4',
    size: '1.1 MB',
    sizeBytes: 1128375,
    type: 'VIDEO',
    uri: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    mimeType: 'video/mp4',
    uploadedAt: 'Today, 10:30 AM',
  },
  WORK_ESTIMATE_EXCEL: {
    id: 'sample-xls-01',
    name: 'Plumbing_Work_Estimate_BOQ.xlsx',
    size: '420 KB',
    sizeBytes: 430080,
    type: 'EXCEL',
    uri: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQABgAIAAAAIQ==',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: 'Today, 11:00 AM',
  },
  TAX_INVOICE_PDF: {
    id: 'sample-pdf-01',
    name: 'Vendor_Tax_Invoice_INV9823.pdf',
    size: '1.1 MB',
    sizeBytes: 1153433,
    type: 'DOCUMENT',
    uri: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOf',
    mimeType: 'application/pdf',
    uploadedAt: 'Today, 11:25 AM',
  },
  GPAY_RECEIPT_SCREENSHOT: {
    id: 'sample-pay-01',
    name: 'GooglePay_Payment_Slip_₹4500.png',
    size: '850 KB',
    sizeBytes: 870400,
    type: 'IMAGE',
    uri: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1600&auto=format&fit=crop&q=85',
    mimeType: 'image/png',
    uploadedAt: 'Today, 11:30 AM',
  },
};
