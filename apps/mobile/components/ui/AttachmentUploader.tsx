import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppAttachment,
  AttachmentType,
  pickAttachments,
  SAMPLE_ATTACHMENTS,
} from '../../utils/filePicker';
import { VideoPlayer } from './VideoPlayer';

export interface AttachmentUploaderProps {
  attachments: AppAttachment[];
  onChange: (attachments: AppAttachment[]) => void;
  title?: string;
  subtitle?: string;
  maxFiles?: number;
  allowedTypes?: AttachmentType[];
  compact?: boolean;
}

export function AttachmentUploader({
  attachments = [],
  onChange,
  title = 'Attachments & Supporting Proofs',
  subtitle = 'Upload photos, videos, Excel BOQ sheets, or PDF invoices',
  maxFiles = 10,
  allowedTypes = ['IMAGE', 'VIDEO', 'EXCEL', 'DOCUMENT'],
  compact = false,
}: AttachmentUploaderProps) {
  const [selectedForPreview, setSelectedForPreview] = useState<AppAttachment | null>(null);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [isPicking, setIsPicking] = useState(false);

  const handlePick = async (category: 'ALL' | AttachmentType) => {
    if (attachments.length >= maxFiles) {
      alert(`Maximum of ${maxFiles} attachments reached.`);
      return;
    }
    setIsPicking(true);
    try {
      const picked = await pickAttachments(category, true);
      if (picked.length > 0) {
        const remainingSlots = maxFiles - attachments.length;
        const toAdd = picked.slice(0, remainingSlots);
        onChange([...attachments, ...toAdd]);
      }
    } catch (err) {
      console.error('File pick error:', err);
    } finally {
      setIsPicking(false);
    }
  };

  const handleAddSample = (sample: AppAttachment) => {
    if (attachments.length >= maxFiles) {
      alert(`Maximum of ${maxFiles} attachments reached.`);
      return;
    }
    const fresh: AppAttachment = {
      ...sample,
      id: `sample-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: 'Just now',
    };
    onChange([...attachments, fresh]);
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  const getTypeColor = (type: AttachmentType) => {
    switch (type) {
      case 'IMAGE':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', badge: 'Photo / Screenshot' };
      case 'VIDEO':
        return { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', badge: 'Video Clip' };
      case 'EXCEL':
        return { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', badge: 'Excel / CSV Sheet' };
      case 'DOCUMENT':
      default:
        return { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', badge: 'Document / PDF' };
    }
  };

  const getTypeIcon = (type: AttachmentType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'IMAGE':
        return 'image-outline';
      case 'VIDEO':
        return 'videocam-outline';
      case 'EXCEL':
        return 'grid-outline';
      case 'DOCUMENT':
      default:
        return 'document-text-outline';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {!compact && (
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {attachments.length}/{maxFiles}
            </Text>
          </View>
        </View>
      )}

      {/* Upload Action Tiles */}
      <View style={styles.actionGrid}>
        {allowedTypes.includes('IMAGE') && (
          <TouchableOpacity
            style={[styles.uploadTile, { borderColor: '#BFDBFE', backgroundColor: '#F0F7FF' }]}
            onPress={() => handlePick('IMAGE')}
            disabled={isPicking}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="camera-outline" size={20} color="#1D4ED8" />
            </View>
            <Text style={styles.tileTitle}>Photo / Screenshot</Text>
            <Text style={styles.tileDesc}>JPG, PNG, WEBP</Text>
          </TouchableOpacity>
        )}

        {allowedTypes.includes('VIDEO') && (
          <TouchableOpacity
            style={[styles.uploadTile, { borderColor: '#C7D2FE', backgroundColor: '#F5F3FF' }]}
            onPress={() => handlePick('VIDEO')}
            disabled={isPicking}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="videocam-outline" size={20} color="#4338CA" />
            </View>
            <Text style={styles.tileTitle}>Video Clip</Text>
            <Text style={styles.tileDesc}>MP4, MOV, WEBM</Text>
          </TouchableOpacity>
        )}

        {allowedTypes.includes('EXCEL') && (
          <TouchableOpacity
            style={[styles.uploadTile, { borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' }]}
            onPress={() => handlePick('EXCEL')}
            disabled={isPicking}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="grid-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.tileTitle}>Excel / Sheet</Text>
            <Text style={styles.tileDesc}>.xlsx, .xls, .csv</Text>
          </TouchableOpacity>
        )}

        {allowedTypes.includes('DOCUMENT') && (
          <TouchableOpacity
            style={[styles.uploadTile, { borderColor: '#FECACA', backgroundColor: '#FFF5F5' }]}
            onPress={() => handlePick('DOCUMENT')}
            disabled={isPicking}
            activeOpacity={0.7}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="document-text-outline" size={20} color="#DC2626" />
            </View>
            <Text style={styles.tileTitle}>Document / PDF</Text>
            <Text style={styles.tileDesc}>PDF, DOC, DOCX</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick-add Sample Files Bar */}
      <View style={styles.sampleSection}>
        <Text style={styles.sampleSectionTitle}>⚡ Quick-add sample test attachments:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleRow}>
          <TouchableOpacity
            style={[styles.sampleChip, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            onPress={() => handleAddSample(SAMPLE_ATTACHMENTS.LEAKAGE_PHOTO)}
          >
            <Text style={[styles.sampleChipText, { color: '#1D4ED8' }]}>📸 Leakage Photo (HD)</Text>
          </TouchableOpacity>

          {SAMPLE_ATTACHMENTS.SEEPAGE_PHOTO && (
            <TouchableOpacity
              style={[styles.sampleChip, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
              onPress={() => handleAddSample(SAMPLE_ATTACHMENTS.SEEPAGE_PHOTO)}
            >
              <Text style={[styles.sampleChipText, { color: '#166534' }]}>🧱 Wall Seepage (HD)</Text>
            </TouchableOpacity>
          )}

          {SAMPLE_ATTACHMENTS.ELECTRICAL_BURNT_PHOTO && (
            <TouchableOpacity
              style={[styles.sampleChip, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
              onPress={() => handleAddSample(SAMPLE_ATTACHMENTS.ELECTRICAL_BURNT_PHOTO)}
            >
              <Text style={[styles.sampleChipText, { color: '#B45309' }]}>⚡ Spark Damage (HD)</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.sampleChip, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
            onPress={() => handleAddSample(SAMPLE_ATTACHMENTS.INSPECTION_VIDEO)}
          >
            <Text style={[styles.sampleChipText, { color: '#4338CA' }]}>🎥 Inspection Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sampleChip, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
            onPress={() => handleAddSample(SAMPLE_ATTACHMENTS.WORK_ESTIMATE_EXCEL)}
          >
            <Text style={[styles.sampleChipText, { color: '#065F46' }]}>📊 Excel BOQ Estimate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sampleChip, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
            onPress={() => handleAddSample(SAMPLE_ATTACHMENTS.TAX_INVOICE_PDF)}
          >
            <Text style={[styles.sampleChipText, { color: '#991B1B' }]}>📄 Tax Invoice PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sampleChip, { backgroundColor: '#FDF4FF', borderColor: '#F5D0FE' }]}
            onPress={() => handleAddSample(SAMPLE_ATTACHMENTS.GPAY_RECEIPT_SCREENSHOT)}
          >
            <Text style={[styles.sampleChipText, { color: '#86198F' }]}>🧾 GPay Receipt</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List of Attached Files */}
      {attachments && attachments.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.listHeading}>
            Attached Files ({attachments.length})
          </Text>

          {attachments.map((file) => {
            const colorMeta = getTypeColor(file.type);
            const iconName = getTypeIcon(file.type);

            return (
              <View key={file.id} style={styles.fileCard}>
                {/* Thumbnail / Icon preview */}
                <TouchableOpacity
                  style={styles.thumbnailWrapper}
                  onPress={() => {
                    setImageZoom(1);
                    setSelectedForPreview(file);
                  }}
                  activeOpacity={0.8}
                >
                  {file.type === 'IMAGE' && !!file.uri ? (
                    <>
                      <Image source={{ uri: file.uri }} style={styles.thumbnailImg} resizeMode="cover" />
                      <View style={styles.hdBadgeMini}>
                        <Text style={styles.hdBadgeMiniText}>HD</Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.thumbnailPlaceholder, { backgroundColor: colorMeta.bg }]}>
                      <Ionicons name={iconName} size={24} color={colorMeta.text} />
                    </View>
                  )}
                  {file.type === 'VIDEO' && (
                    <View style={styles.playOverlay}>
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Details */}
                <TouchableOpacity
                  style={styles.fileDetails}
                  onPress={() => setSelectedForPreview(file)}
                  activeOpacity={0.8}
                >
                  <View style={styles.fileNameRow}>
                    <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                      {file.name}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: colorMeta.bg, borderColor: colorMeta.border },
                      ]}
                    >
                      <Text style={[styles.typeBadgeText, { color: colorMeta.text }]}>
                        {colorMeta.badge}
                      </Text>
                    </View>
                    <Text style={styles.fileSizeText}>• {file.size}</Text>
                    <Text style={styles.timeText}>• {file.uploadedAt}</Text>
                  </View>
                </TouchableOpacity>

                {/* Actions: View & Remove */}
                <View style={styles.actionsGroup}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => setSelectedForPreview(file)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye-outline" size={18} color="#4B5563" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(file.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Attachment Preview Modal */}
      <Modal
        visible={!!selectedForPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedForPreview(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedForPreview?.name}
                </Text>
                <Text style={styles.modalSub}>
                  {selectedForPreview?.type} • {selectedForPreview?.size} • {selectedForPreview?.uploadedAt}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedForPreview(null)}
              >
                <Ionicons name="close" size={22} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Modal Body based on Type */}
            <ScrollView style={styles.modalBody} contentContainerStyle={{ alignItems: 'center', paddingVertical: 16 }}>
              {selectedForPreview?.type === 'IMAGE' && (
                <View style={styles.imageViewerWrapper}>
                  {/* High-Res Inspector Toolbar */}
                  <View style={styles.imageToolbar}>
                    <View style={styles.hdPillBadge}>
                      <Ionicons name="sparkles" size={13} color="#1D4ED8" />
                      <Text style={styles.hdPillText}>High-Definition 4K</Text>
                    </View>

                    {/* Zoom Toggle Buttons */}
                    <View style={styles.zoomControlGroup}>
                      {[1, 1.5, 2].map((z) => (
                        <TouchableOpacity
                          key={z}
                          style={[styles.zoomBtn, imageZoom === z && styles.zoomBtnActive]}
                          onPress={() => setImageZoom(z)}
                        >
                          <Text style={[styles.zoomBtnText, imageZoom === z && styles.zoomBtnTextActive]}>
                            {z === 1 ? '1x' : `${z}x`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Main Image Display Box */}
                  <View style={styles.previewImageContainer}>
                    {selectedForPreview.uri ? (
                      <ScrollView
                        horizontal={imageZoom > 1}
                        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Image
                          source={{ uri: selectedForPreview.uri }}
                          style={[
                            styles.previewFullImage,
                            {
                              transform: [{ scale: imageZoom }],
                            },
                          ]}
                          resizeMode="contain"
                        />
                      </ScrollView>
                    ) : (
                      <View style={styles.genericFilePreviewCard}>
                        <Ionicons name="image" size={54} color="#2563EB" />
                        <Text style={styles.genericPreviewTitle}>Photo Attached</Text>
                        <Text style={styles.genericPreviewDesc}>
                          MIME: {selectedForPreview?.mimeType}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Web / Native High-Res Inspection Action */}
                  {selectedForPreview.uri && (
                    <View style={styles.imageActionFooter}>
                      <TouchableOpacity
                        style={styles.openFullResBtn}
                        onPress={() => {
                          if (Platform.OS === 'web' && typeof window !== 'undefined') {
                            const newWin = window.open();
                            if (newWin) {
                              newWin.document.write(`
                                <html>
                                  <head><title>${selectedForPreview.name} - Full Resolution</title></head>
                                  <body style="margin:0; background:#0b0f19; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                                    <img src="${selectedForPreview.uri}" style="max-width:100%; height:auto; box-shadow:0 10px 40px rgba(0,0,0,0.8);" />
                                  </body>
                                </html>
                              `);
                            }
                          }
                        }}
                      >
                        <Ionicons name="scan-outline" size={15} color="#1D4ED8" />
                        <Text style={styles.openFullResText}>Inspect Full 100% Native Resolution</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {selectedForPreview?.type === 'VIDEO' && (
                <View style={{ marginVertical: 8 }}>
                  {selectedForPreview.uri ? (
                    <VideoPlayer
                      uri={selectedForPreview.uri}
                      name={selectedForPreview.name}
                      size={selectedForPreview.size}
                      autoPlay={true}
                    />
                  ) : (
                    <View style={styles.videoPreviewCard}>
                      <View style={styles.videoPlayCircle}>
                        <Ionicons name="videocam" size={40} color="#FFFFFF" />
                      </View>
                      <Text style={styles.videoPreviewTitle}>Video Recording Attached</Text>
                      <Text style={styles.videoPreviewSub}>
                        {selectedForPreview.name} ({selectedForPreview.size})
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {selectedForPreview?.type === 'EXCEL' && (
                <View style={styles.excelPreviewCard}>
                  <View style={styles.excelHeaderStrip}>
                    <Ionicons name="grid" size={24} color="#059669" />
                    <Text style={styles.excelStripTitle}>Microsoft Excel Spreadsheet</Text>
                  </View>
                  <View style={styles.excelTableMock}>
                    <View style={[styles.excelTableRow, styles.excelTableHead]}>
                      <Text style={[styles.excelCell, styles.excelCellHead]}>Item / Work</Text>
                      <Text style={[styles.excelCell, styles.excelCellHead]}>Qty</Text>
                      <Text style={[styles.excelCell, styles.excelCellHead]}>Rate (₹)</Text>
                      <Text style={[styles.excelCell, styles.excelCellHead]}>Total (₹)</Text>
                    </View>
                    <View style={styles.excelTableRow}>
                      <Text style={styles.excelCell}>CPVC Pipes & Fittings</Text>
                      <Text style={styles.excelCell}>4 Units</Text>
                      <Text style={styles.excelCell}>450</Text>
                      <Text style={styles.excelCell}>1,800</Text>
                    </View>
                    <View style={styles.excelTableRow}>
                      <Text style={styles.excelCell}>Waterproof Sealant Epoxy</Text>
                      <Text style={styles.excelCell}>2 Kits</Text>
                      <Text style={styles.excelCell}>650</Text>
                      <Text style={styles.excelCell}>1,300</Text>
                    </View>
                    <View style={styles.excelTableRow}>
                      <Text style={styles.excelCell}>Technician Labor Charges</Text>
                      <Text style={styles.excelCell}>1 Day</Text>
                      <Text style={styles.excelCell}>1,200</Text>
                      <Text style={styles.excelCell}>1,200</Text>
                    </View>
                    <View style={[styles.excelTableRow, { backgroundColor: '#F0FDF4' }]}>
                      <Text style={[styles.excelCell, { fontWeight: '700', color: '#065F46' }]}>
                        Grand Total
                      </Text>
                      <Text style={styles.excelCell} />
                      <Text style={styles.excelCell} />
                      <Text style={[styles.excelCell, { fontWeight: '700', color: '#065F46' }]}>
                        ₹4,300
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {selectedForPreview?.type === 'DOCUMENT' && (
                <View style={styles.docPreviewCard}>
                  <View style={styles.docIconHeader}>
                    <Ionicons name="document-text" size={44} color="#DC2626" />
                  </View>
                  <Text style={styles.docTitle}>{selectedForPreview?.name}</Text>
                  <Text style={styles.docMeta}>
                    Format: Adobe PDF Document • Size: {selectedForPreview?.size}
                  </Text>
                  <View style={styles.docBox}>
                    <Text style={styles.docBoxText}>
                      ✓ Official Digital Document Verified{'\n'}
                      ✓ Contains GSTIN & Society Stamp Validation{'\n'}
                      ✓ Ready for Audit & Committee Review
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setSelectedForPreview(null)}
              >
                <Text style={styles.doneBtnText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  counterBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  uploadTile: {
    flex: 1,
    minWidth: '47%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  tileDesc: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  sampleSection: {
    marginBottom: 14,
  },
  sampleSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  sampleRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  sampleChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 6,
  },
  listHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 10,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  hdBadgeMini: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#1D4ED8',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  hdBadgeMiniText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
  },
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  fileSizeText: {
    fontSize: 11,
    color: '#6B7280',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  viewBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: 380,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  imageViewerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  imageToolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hdPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  hdPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  zoomControlGroup: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  zoomBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zoomBtnActive: {
    backgroundColor: '#1B4FD8',
  },
  zoomBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  zoomBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewImageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFullImage: {
    width: 320,
    height: 320,
  },
  imageActionFooter: {
    marginTop: 10,
    alignItems: 'center',
  },
  openFullResBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  openFullResText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  genericFilePreviewCard: {
    alignItems: 'center',
    padding: 24,
  },
  genericPreviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 10,
  },
  genericPreviewDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  videoPreviewCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  videoPlayCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  videoPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  videoPreviewSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  videoControlsMock: {
    width: '100%',
    marginTop: 8,
  },
  videoBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    width: '100%',
  },
  videoTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  videoTimeText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  excelPreviewCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  excelHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  excelStripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  excelTableMock: {
    backgroundColor: '#FFFFFF',
  },
  excelTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  excelTableHead: {
    backgroundColor: '#F9FAFB',
    borderBottomColor: '#E5E7EB',
  },
  excelCell: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
  },
  excelCellHead: {
    fontWeight: '700',
    color: '#111827',
  },
  docPreviewCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
  },
  docIconHeader: {
    marginBottom: 10,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  docMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 14,
  },
  docBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
  },
  docBoxText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doneBtn: {
    backgroundColor: '#1B4FD8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
