import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { useTicketStore } from '../../../stores/ticketStore';
import { AttachmentUploader } from '../../../components/ui/AttachmentUploader';
import { VideoPlayer } from '../../../components/ui/VideoPlayer';
import {
  AppAttachment,
  pickAttachments,
  SAMPLE_ATTACHMENTS,
} from '../../../utils/filePicker';
import { WorkOrderModal, WorkOrderData } from '../../../components/workorder/WorkOrderModal';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getTicketById, updateTicketStatus, updateTicketAttachments } = useTicketStore();

  const [activePhotoModal, setActivePhotoModal] = useState<AppAttachment | null>(null);
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState<AppAttachment | null>(null);
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [workOrderModalVisible, setWorkOrderModalVisible] = useState(false);

  const ticketId = (Array.isArray(id) ? id[0] : id) || 'AMA00001';
  const ticket = getTicketById(ticketId) || {
    id: ticketId,
    status: 'OPEN',
    category: 'Plumbing',
    description: 'Ticket details loaded from society system.',
    location: 'Main Unit',
    createdAt: new Date().toISOString(),
    vendorName: 'Assigned Vendor',
    flat: 'B-204',
    attachments: [],
  };

  const allAttachments: AppAttachment[] = (ticket as any).attachments || [];
  const photoAttachments = allAttachments.filter((a) => a.type === 'IMAGE');
  const videoAttachments = allAttachments.filter((a) => a.type === 'VIDEO');

  const residentWorkOrder: WorkOrderData = {
    id: `WO-${ticket.id}`,
    title: `${ticket.category} Maintenance: ${ticket.description || 'Assigned Service Task'}`,
    category: ticket.category,
    status: ticket.status === 'CLOSED' ? 'COMPLETED' : 'IN_PROGRESS',
    amount: '₹3,500',
    societyName: 'AMA Grand Estate RWA',
    societyAddress: '123 Prime Avenue, Orchid Towers, Bangalore',
    contractorName: ticket.vendorName || 'Quick Fix Services (Technician Ramesh Kumar)',
    contractorPhone: '+91 98201 00042',
    supervisorName: 'Vikram Patil (Facility Manager)',
    supervisorPhone: '+91 98201 00042',
    issuedDate: ticket.createdAt
      ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '19 Sep 2026',
    targetDate: '21 Sep 2026',
    gatePassCode: `INW-TK-${ticket.id.slice(-4)}`,
    flat: ticket.flat || 'B-204',
    scopeItems: [
      `Attend resident service complaint in flat ${ticket.flat || 'B-204'}: ${ticket.description || 'Reported maintenance issue'}`,
      'Perform on-site safety check and isolate relevant fixture or circuit',
      'Execute repair and component replacement using certified ISI spares',
      'Obtain resident sign-off confirmation upon completing test run',
    ],
    milestones: [
      { title: 'Diagnostic assessment & parts procurement', percent: 50, amount: '₹1,750', status: 'DONE' },
      { title: 'Repair execution & resident confirmation', percent: 50, amount: '₹1,750', status: ticket.status === 'CLOSED' ? 'DONE' : 'IN_PROGRESS' },
    ],
    terms: [
      'Technician must present gate pass token at security desk upon entry.',
      'Technician must wear safety gear and clean up workspace post-work.',
      'Work verified by resident and marked closed via AMA mobile application.',
    ],
  };

  const handleApprove = () => {
    updateTicketStatus(ticket.id, 'CLOSED');
    Alert.alert('Ticket Closed', `Ticket #${ticket.id} has been verified and marked as closed.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  // Direct fast photo addition from camera/device
  const handleQuickAddPhoto = async () => {
    setIsAddingPhoto(true);
    try {
      const picked = await pickAttachments('IMAGE', true);
      if (picked.length > 0) {
        const updated = [...allAttachments, ...picked];
        updateTicketAttachments(ticket.id, updated);
      }
    } catch (err) {
      console.error('Failed to pick photo:', err);
    } finally {
      setIsAddingPhoto(false);
    }
  };

  // Add sample HD photo for quick testing
  const handleAddSamplePhoto = (sample: AppAttachment) => {
    const fresh: AppAttachment = {
      ...sample,
      id: `sample-photo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: 'Just now',
    };
    updateTicketAttachments(ticket.id, [...allAttachments, fresh]);
  };

  // Direct fast video addition from camera/device
  const handleQuickAddVideo = async () => {
    setIsAddingVideo(true);
    try {
      const picked = await pickAttachments('VIDEO', true);
      if (picked.length > 0) {
        const updated = [...allAttachments, ...picked];
        updateTicketAttachments(ticket.id, updated);
      }
    } catch (err) {
      console.error('Failed to pick video:', err);
    } finally {
      setIsAddingVideo(false);
    }
  };

  // Add sample video clip for quick testing
  const handleAddSampleVideo = (sample: AppAttachment) => {
    const fresh: AppAttachment = {
      ...sample,
      id: `sample-video-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: 'Just now',
    };
    updateTicketAttachments(ticket.id, [...allAttachments, fresh]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Ticket #${ticket.id}`} showBack />
      <ScrollView style={styles.content}>
        
        {/* Status & Category */}
        <View style={styles.headerRow}>
          <StatusBadge status={ticket.status} size="md" />
          <View style={styles.catTag}>
            <Text style={styles.catTagText}>{ticket.category}</Text>
          </View>
        </View>

        {/* Ticket Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.descText}>{ticket.description || (ticket as any).desc}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{ticket.location || 'Unit'}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Raised On</Text>
              <Text style={styles.metaValue}>
                {ticket.createdAt
                  ? new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Today'}
              </Text>
            </View>
          </View>
        </View>

        {/* ACTIVE WORK ORDER CARD */}
        <View style={styles.residentWorkOrderCard}>
          <View style={styles.residentWorkOrderRow}>
            <View style={styles.residentWorkOrderIconCircle}>
              <Ionicons name="construct" size={20} color="#4338CA" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.residentWorkOrderTitle}>Official Work Order Active</Text>
              <Text style={styles.residentWorkOrderSub} numberOfLines={1}>
                Assigned: {ticket.vendorName || 'Technician Ramesh (Plumbing & Electrical)'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.residentWorkOrderBtn}
              onPress={() => setWorkOrderModalVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View Work Order"
            >
              <Ionicons name="document-text-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.residentWorkOrderBtnText}>View Work Order</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROMINENT HIGH-RESOLUTION INSPECTION & EVIDENCE PHOTOS GALLERY */}
        <View style={styles.photoGalleryCard}>
          <View style={styles.photoGalleryHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.galleryIconBadge}>
                <Ionicons name="camera" size={18} color="#1D4ED8" />
              </View>
              <View>
                <Text style={styles.photoGalleryTitle}>Inspection & Evidence Photos</Text>
                <Text style={styles.photoGallerySub}>
                  {photoAttachments.length} high-resolution {photoAttachments.length === 1 ? 'photo' : 'photos'} attached
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={handleQuickAddPhoto}
              disabled={isAddingPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addPhotoBtnText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          {photoAttachments.length > 0 ? (
            <View style={styles.photosGrid}>
              {photoAttachments.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  {/* Photo Thumbnail Container */}
                  <TouchableOpacity
                    style={styles.photoWrapper}
                    onPress={() => {
                      setModalZoom(1);
                      setActivePhotoModal(photo);
                    }}
                    activeOpacity={0.85}
                  >
                    {photo.uri ? (
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="image-outline" size={36} color="#9CA3AF" />
                      </View>
                    )}

                    {/* HD 4K Badge */}
                    <View style={styles.hdBadge}>
                      <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                      <Text style={styles.hdBadgeText}>HD 4K</Text>
                    </View>

                    {/* Tap to Zoom Overlay Button */}
                    <View style={styles.zoomOverlayBadge}>
                      <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.zoomOverlayText}>Inspect</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Photo Caption & Meta */}
                  <View style={styles.photoMeta}>
                    <Text style={styles.photoName} numberOfLines={1} ellipsizeMode="middle">
                      {photo.name}
                    </Text>
                    <View style={styles.photoDetailsRow}>
                      <Text style={styles.photoSize}>{photo.size}</Text>
                      <Text style={styles.photoDot}>•</Text>
                      <Text style={styles.photoTime}>{photo.uploadedAt}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPhotoState}>
              <Ionicons name="images-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyPhotoTitle}>No High-Resolution Photos Attached</Text>
              <Text style={styles.emptyPhotoSub}>
                Upload clear photos of the issue to help technicians diagnose and prepare parts before visiting.
              </Text>

              <View style={styles.quickSampleRow}>
                <Text style={styles.quickSampleLabel}>Add test sample:</Text>
                <TouchableOpacity
                  style={styles.quickSampleChip}
                  onPress={() => handleAddSamplePhoto(SAMPLE_ATTACHMENTS.LEAKAGE_PHOTO)}
                >
                  <Text style={styles.quickSampleChipText}>📸 Leakage Photo (HD)</Text>
                </TouchableOpacity>
                {SAMPLE_ATTACHMENTS.SEEPAGE_PHOTO && (
                  <TouchableOpacity
                    style={styles.quickSampleChip}
                    onPress={() => handleAddSamplePhoto(SAMPLE_ATTACHMENTS.SEEPAGE_PHOTO)}
                  >
                    <Text style={styles.quickSampleChipText}>🧱 Wall Dampness (HD)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* PROMINENT INSPECTION VIDEO RECORDINGS & EVIDENCE CLIPS */}
        <View style={styles.videoGalleryCard}>
          <View style={styles.videoGalleryHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.videoGalleryIconBadge}>
                <Ionicons name="videocam" size={18} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.videoGalleryTitle}>Inspection Video Recordings & Evidence</Text>
                <Text style={styles.videoGallerySub}>
                  {videoAttachments.length} video {videoAttachments.length === 1 ? 'clip' : 'clips'} recorded
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addVideoBtn}
              onPress={handleQuickAddVideo}
              disabled={isAddingVideo}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addVideoBtnText}>Add Video</Text>
            </TouchableOpacity>
          </View>

          {videoAttachments.length > 0 ? (
            <View style={styles.videosList}>
              {videoAttachments.map((video) => (
                <View key={video.id} style={styles.videoCardBox}>
                  <View style={styles.videoMetaRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.videoNameText} numberOfLines={1}>
                        {video.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={styles.videoSubText}>{video.size}</Text>
                        <Text style={styles.videoSubText}>•</Text>
                        <Text style={styles.videoSubText}>{video.uploadedAt}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.expandModalBtn}
                      onPress={() => setActiveVideoModal(video)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="expand-outline" size={14} color="#7C3AED" />
                      <Text style={styles.expandModalBtnText}>Expand</Text>
                    </TouchableOpacity>
                  </View>

                  <VideoPlayer
                    uri={video.uri}
                    name={video.name}
                    size={video.size}
                    maxHeight={280}
                    onExpand={() => setActiveVideoModal(video)}
                    style={{ marginTop: 8 }}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyVideoState}>
              <Ionicons name="videocam-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyVideoTitle}>No Video Evidence Clips Attached</Text>
              <Text style={styles.emptyVideoSub}>
                Upload video clips of leaking pipes, fluctuating electricity, or dampness to help technicians inspect dynamic issues before visiting.
              </Text>

              <View style={styles.quickSampleRow}>
                <Text style={styles.quickSampleLabel}>Add test clip:</Text>
                {SAMPLE_ATTACHMENTS.PIPE_BURST_VIDEO && (
                  <TouchableOpacity
                    style={styles.quickSampleChipVideo}
                    onPress={() => handleAddSampleVideo(SAMPLE_ATTACHMENTS.PIPE_BURST_VIDEO)}
                  >
                    <Text style={styles.quickSampleChipVideoText}>🎥 Pipe Burst Demo</Text>
                  </TouchableOpacity>
                )}
                {SAMPLE_ATTACHMENTS.INSPECTION_VIDEO && (
                  <TouchableOpacity
                    style={styles.quickSampleChipVideo}
                    onPress={() => handleAddSampleVideo(SAMPLE_ATTACHMENTS.INSPECTION_VIDEO)}
                  >
                    <Text style={styles.quickSampleChipVideoText}>📹 Ceiling Dampness</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ALL ATTACHMENTS (DOCUMENTS, EXCEL BOQ, VIDEOS, ETC.) */}
        <View style={styles.card}>
          <AttachmentUploader
            attachments={allAttachments}
            onChange={(updatedAttachments) => {
              updateTicketAttachments(ticket.id, updatedAttachments);
            }}
            title="All Files & Supporting Documents"
            subtitle="Manage all photos, videos, Excel BOQ sheets & invoices"
          />
        </View>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timeline}>
          <TimelineItem status="done" title="Ticket Raised" date="10 Sep, 10:30 AM" />
          <TimelineItem status="done" title="Assigned to Vendor" subtitle={ticket.vendorName} date="10 Sep, 11:15 AM" />
          <TimelineItem status="done" title="Work In Progress" date="10 Sep, 02:00 PM" />
          <TimelineItem status="current" title="Pending Verification" subtitle="Please confirm work completion" date="Today, 03:30 PM" />
          <TimelineItem status="pending" title="Closed" isLast />
        </View>

        {ticket.status === 'PENDING_VERIFICATION' && (
          <View style={styles.signoffBox}>
            <Text style={styles.signoffTitle}>Confirm work is complete?</Text>
            <View style={styles.signoffActions}>
              <TouchableOpacity style={styles.btnReject}>
                <Ionicons name="close" size={20} color="#DC2626" />
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnApprove} onPress={handleApprove}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.btnApproveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Comments</Text>
        <View style={styles.comment}>
          <Text style={styles.commentAuthor}>Ramesh Kumar (Vendor)</Text>
          <Text style={styles.commentText}>I have replaced the washer. Please check and confirm.</Text>
          <Text style={styles.commentTime}>Today, 03:30 PM</Text>
        </View>
        <View style={styles.comment}>
          <Text style={styles.commentAuthor}>Admin</Text>
          <Text style={styles.commentText}>Assigned to Ramesh.</Text>
          <Text style={styles.commentTime}>10 Sep, 11:15 AM</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FULL-SCREEN HIGH-RESOLUTION PHOTO LIGHTBOX / INSPECTOR MODAL */}
      <Modal
        visible={!!activePhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePhotoModal(null)}
      >
        <View style={styles.lightboxOverlay}>
          {/* Top Bar */}
          <View style={styles.lightboxTopBar}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <View style={styles.lightboxHDBadge}>
                  <Ionicons name="sparkles" size={12} color="#93C5FD" />
                  <Text style={styles.lightboxHDBadgeText}>4K Ultra-HD Photo</Text>
                </View>
                <Text style={styles.lightboxFileSize}>{activePhotoModal?.size}</Text>
              </View>
              <Text style={styles.lightboxTitle} numberOfLines={1}>
                {activePhotoModal?.name}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.lightboxCloseBtn}
              onPress={() => setActivePhotoModal(null)}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Photo Body with Zoom & Pan */}
          <View style={styles.lightboxBody}>
            {activePhotoModal?.uri ? (
              <ScrollView
                horizontal={modalZoom > 1}
                contentContainerStyle={styles.lightboxScrollContainer}
              >
                <Image
                  source={{ uri: activePhotoModal.uri }}
                  style={[
                    styles.lightboxImage,
                    { transform: [{ scale: modalZoom }] },
                  ]}
                  resizeMode="contain"
                />
              </ScrollView>
            ) : null}
          </View>

          {/* Bottom Controls Bar */}
          <View style={styles.lightboxBottomBar}>
            {/* Zoom Controls */}
            <View style={styles.lightboxZoomControls}>
              {[1, 1.5, 2].map((z) => (
                <TouchableOpacity
                  key={z}
                  style={[
                    styles.lightboxZoomBtn,
                    modalZoom === z && styles.lightboxZoomBtnActive,
                  ]}
                  onPress={() => setModalZoom(z)}
                >
                  <Text
                    style={[
                      styles.lightboxZoomText,
                      modalZoom === z && styles.lightboxZoomTextActive,
                    ]}
                  >
                    {z === 1 ? 'Fit (1x)' : `${z}x Zoom`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inspect Native 100% Button for Web */}
            {Platform.OS === 'web' && activePhotoModal?.uri && (
              <TouchableOpacity
                style={styles.lightboxNativeBtn}
                onPress={() => {
                  if (typeof window !== 'undefined' && activePhotoModal?.uri) {
                    const win = window.open();
                    if (win) {
                      win.document.write(`
                        <html>
                          <head><title>${activePhotoModal.name}</title></head>
                          <body style="margin:0; background:#0b0f19; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                            <img src="${activePhotoModal.uri}" style="max-width:100%; height:auto;" />
                          </body>
                        </html>
                      `);
                    }
                  }
                }}
              >
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                <Text style={styles.lightboxNativeBtnText}>Open Native Resolution</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* FULL-SCREEN HIGH-DEFINITION VIDEO INSPECTOR MODAL */}
      <Modal
        visible={!!activeVideoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveVideoModal(null)}
      >
        <View style={styles.lightboxOverlay}>
          {/* Top Bar */}
          <View style={styles.lightboxTopBar}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <View style={[styles.lightboxHDBadge, { backgroundColor: 'rgba(124, 58, 237, 0.4)', borderColor: '#8B5CF6' }]}>
                  <Ionicons name="videocam" size={12} color="#C4B5FD" />
                  <Text style={[styles.lightboxHDBadgeText, { color: '#C4B5FD' }]}>HD Video Evidence</Text>
                </View>
                <Text style={styles.lightboxFileSize}>{activeVideoModal?.size}</Text>
              </View>
              <Text style={styles.lightboxTitle} numberOfLines={1}>
                {activeVideoModal?.name}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.lightboxCloseBtn}
              onPress={() => setActiveVideoModal(null)}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Video Body */}
          <View style={[styles.lightboxBody, { padding: 16 }]}>
            {activeVideoModal?.uri ? (
              <VideoPlayer
                uri={activeVideoModal.uri}
                name={activeVideoModal.name}
                size={activeVideoModal.size}
                maxHeight={Platform.OS === 'web' ? 560 : 420}
                autoPlay
                style={{ width: '100%', maxWidth: 720 }}
              />
            ) : null}
          </View>

          {/* Bottom Bar */}
          <View style={styles.lightboxBottomBar}>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>
              Playing back in high-definition video inspector
            </Text>
            <TouchableOpacity
              style={styles.lightboxZoomBtn}
              onPress={() => setActiveVideoModal(null)}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Official Work Order Modal */}
      <WorkOrderModal
        visible={workOrderModalVisible}
        onClose={() => setWorkOrderModalVisible(false)}
        workOrder={residentWorkOrder}
      />
    </View>
  );
}

function TimelineItem({ status, title, subtitle, date, isLast }: any) {
  return (
    <View style={styles.tlItem}>
      <View style={styles.tlLeft}>
        <View
          style={[
            styles.tlDot,
            status === 'done' && styles.tlDotDone,
            status === 'current' && styles.tlDotCurrent,
          ]}
        />
        {!isLast && <View style={[styles.tlLine, status === 'done' && styles.tlLineDone]} />}
      </View>
      <View style={styles.tlRight}>
        <Text style={[styles.tlTitle, status === 'current' && styles.tlTitleCurrent]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.tlSubtitle}>{subtitle}</Text>}
        {date && <Text style={styles.tlDate}>{date}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  residentWorkOrderCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  residentWorkOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  residentWorkOrderIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  residentWorkOrderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  residentWorkOrderSub: {
    fontSize: 11,
    color: '#4338CA',
    marginTop: 2,
  },
  residentWorkOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  residentWorkOrderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: { padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  catTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  catTagText: { fontSize: 12, fontWeight: '500', color: '#4B5563' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  descText: { fontSize: 16, color: '#111827', lineHeight: 24 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  metaRow: { flexDirection: 'row' },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '500', color: '#111827' },

  // PHOTO GALLERY STYLES
  photoGalleryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  photoGalleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  galleryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGalleryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  photoGallerySub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addPhotoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hdBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 78, 216, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  hdBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  zoomOverlayBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  zoomOverlayText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoMeta: {
    padding: 8,
  },
  photoName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  photoDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoSize: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  photoDot: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  photoTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  emptyPhotoState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyPhotoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  emptyPhotoSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  quickSampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickSampleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  quickSampleChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  quickSampleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },

  // VIDEO GALLERY STYLES
  videoGalleryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  videoGalleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoGalleryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoGalleryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4C1D95',
  },
  videoGallerySub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  addVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addVideoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  videosList: {
    gap: 14,
  },
  videoCardBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  videoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  videoNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  videoSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  expandModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  expandModalBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  emptyVideoState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderStyle: 'dashed',
  },
  emptyVideoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#581C87',
    marginTop: 8,
  },
  emptyVideoSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  quickSampleChipVideo: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  quickSampleChipVideoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },

  // LIGHTBOX MODAL STYLES
  lightboxOverlay: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  lightboxTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  lightboxHDBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 78, 216, 0.4)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  lightboxHDBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
  },
  lightboxFileSize: {
    fontSize: 11,
    color: '#94A3B8',
  },
  lightboxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  lightboxCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lightboxScrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: 360,
    height: 480,
  },
  lightboxBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  lightboxZoomControls: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  lightboxZoomBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  lightboxZoomBtnActive: {
    backgroundColor: '#1D4ED8',
  },
  lightboxZoomText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  lightboxZoomTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  lightboxNativeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  lightboxNativeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // COMMON TIMELINE & COMMENTS STYLES
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  timeline: { paddingLeft: 8, marginBottom: 24 },
  tlItem: { flexDirection: 'row', marginBottom: 24 },
  tlLeft: { width: 24, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D1D5DB', zIndex: 1 },
  tlDotDone: { backgroundColor: '#16A34A' },
  tlDotCurrent: { backgroundColor: '#1B4FD8', width: 14, height: 14, borderRadius: 7 },
  tlLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    top: 12,
    bottom: -24,
  },
  tlLineDone: { backgroundColor: '#16A34A' },
  tlRight: { flex: 1, paddingLeft: 16, marginTop: -4 },
  tlTitle: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
  tlTitleCurrent: { color: '#111827', fontWeight: 'bold' },
  tlSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  tlDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  signoffBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 24,
  },
  signoffTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },
  signoffActions: { flexDirection: 'row', gap: 12 },
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnRejectText: { color: '#DC2626', fontWeight: 'bold', marginLeft: 8 },
  btnApprove: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnApproveText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 8 },
  comment: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentAuthor: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  commentTime: { fontSize: 12, color: '#9CA3AF' },
});
