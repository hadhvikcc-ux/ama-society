import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useTicketStore } from '../../../stores/ticketStore';
import { WorkOrderModal, WorkOrderData } from '../../../components/workorder/WorkOrderModal';

const initialMockTickets = [
  { id: 'AMA00001', title: 'Water leakage in bathroom', category: 'Plumbing', flat: 'A-101', priority: 'Urgent', status: 'In Progress' },
  { id: 'AMA00002', title: 'Main door lock broken', category: 'Carpentry', flat: 'B-205', priority: 'Urgent', status: 'Unassigned' },
  { id: 'AMA00003', title: 'AC not cooling properly', category: 'Electrical', flat: 'C-302', priority: 'Normal', status: 'In Progress' },
  { id: 'AMA00004', title: 'Pest control treatment request', category: 'Pest Control', flat: 'D-404', priority: 'Normal', status: 'Unassigned' },
  { id: 'AMA00005', title: 'Kitchen sink drain blocked', category: 'Plumbing', flat: 'E-501', priority: 'Normal', status: 'In Progress' },
  { id: 'AMA00006', title: 'Fan regulator faulty', category: 'Electrical', flat: 'F-603', priority: 'Normal', status: 'Unassigned' },
  { id: 'AMA00007', title: 'Balcony grill welding repair', category: 'Civil Work', flat: 'G-702', priority: 'Urgent', status: 'In Progress' },
  { id: 'AMA00008', title: 'Regular common area cleaning', category: 'Cleaning', flat: 'A-105', priority: 'Normal', status: 'Unassigned' },
];

const mockVendors = [
  { id: 'v1', name: 'Raju Plumbing', category: 'Plumbing' },
  { id: 'v2', name: 'Sri Electricals', category: 'Electrical' },
  { id: 'v3', name: 'Metro Carpentry', category: 'Carpentry' },
  { id: 'v4', name: 'Quick Fix Services', category: 'All' },
];

export default function AdminTickets() {
  const { tickets: storeTickets } = useTicketStore();
  const [activeTab, setActiveTab] = useState('All');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [inspectingPhoto, setInspectingPhoto] = useState<{ uri: string; name: string; size?: string } | null>(null);
  const [adminZoom, setAdminZoom] = useState(1);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderData | null>(null);
  const [workOrderModalVisible, setWorkOrderModalVisible] = useState(false);

  const handleOpenTicketWorkOrder = (ticket: any) => {
    const wo: WorkOrderData = {
      id: `WO-${ticket.id}`,
      title: `${ticket.category} Service: ${ticket.title}`,
      category: ticket.category,
      status: ticket.status === 'Closed' ? 'COMPLETED' : 'IN_PROGRESS',
      amount: '₹3,500',
      societyName: 'AMA Grand Estate RWA',
      societyAddress: '123 Prime Avenue, Orchid Towers, Bangalore',
      contractorName: ticket.vendorName || 'Quick Fix Services (Raju Plumbing & Sri Electricals)',
      contractorPhone: '+91 98201 00042',
      supervisorName: 'Vikram Patil (Facility Manager)',
      supervisorPhone: '+91 98201 00042',
      issuedDate: '19 Sep 2026',
      targetDate: '21 Sep 2026',
      gatePassCode: `INW-TK-${ticket.id.slice(-4)}`,
      flat: ticket.flat,
      priority: ticket.priority,
      scopeItems: [
        `Attend resident service complaint in unit ${ticket.flat}: ${ticket.title}`,
        'Perform on-site safety check and isolate relevant pipeline or electrical circuit',
        'Carry out necessary parts replacement, alignment, and leakproof sealing',
        'Verify zero leak/fault under active operating conditions and obtain resident sign-off',
      ],
      milestones: [
        { title: 'Milestone 1: Unit access & problem diagnostic', percent: 50, amount: '₹1,750', status: 'DONE' },
        { title: 'Milestone 2: Completion & resident sign-off confirmation', percent: 50, amount: '₹1,750', status: 'IN_PROGRESS' },
      ],
      terms: [
        'Contractor technicians must check in at security gate using the pass code.',
        'Entry into resident unit permitted only when resident is physically present.',
        'Debris and packaging material must be cleaned up post-work.',
      ],
    };
    setSelectedWorkOrder(wo);
    setWorkOrderModalVisible(true);
  };

  // Merge store tickets with mock tickets, with store tickets taking priority
  const storeTicketIds = new Set(storeTickets.map(t => t.id.toUpperCase()));
  const mappedStoreTickets = storeTickets.map(t => ({
    id: t.id,
    title: t.description,
    category: t.category,
    flat: t.flat || 'B-204',
    priority: t.priority === 'URGENT' || t.priority === 'HIGH' ? 'Urgent' : 'Normal',
    status: t.status === 'OPEN' ? 'Unassigned' : t.status === 'CLOSED' ? 'Closed' : 'In Progress',
    attachments: t.attachments || [],
  }));

  const remainingMocks = initialMockTickets.filter(m => !storeTicketIds.has(m.id.toUpperCase()));
  const allTickets = [...mappedStoreTickets, ...remainingMocks];

  const urgentCount = allTickets.filter(t => t.priority === 'Urgent').length;

  const sortedTickets = [...allTickets].sort((a, b) => {
    if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
    if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
    return 0;
  });

  const filteredTickets = sortedTickets.filter(t => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Urgent') return t.priority === 'Urgent';
    return t.status === activeTab;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Plumbing': return 'water';
      case 'Electrical': return 'flash';
      case 'Carpentry': return 'hammer';
      case 'Pest Control': return 'bug';
      default: return 'build';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Plumbing': return '#3B82F6';
      case 'Electrical': return '#F59E0B';
      case 'Carpentry': return '#8B5CF6';
      case 'Pest Control': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderTicket = ({ item }: { item: any }) => {
    const photos = (item.attachments || []).filter((a: any) => a.type === 'IMAGE' && a.uri);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <Ionicons name={getCategoryIcon(item.category) as any} size={20} color={getCategoryColor(item.category)} />
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>{item.category}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>#{item.id}</Text>
            </View>
          </View>
          <Text style={styles.flatText}>{item.flat}</Text>
        </View>
        <Text style={styles.ticketTitle}>{item.title}</Text>

        {/* Attached High-Res Photo Preview for Admin */}
        {photos.length > 0 && (
          <TouchableOpacity
            style={styles.adminPhotoStrip}
            onPress={() => {
              setAdminZoom(1);
              setInspectingPhoto(photos[0]);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.adminPhotoThumbWrapper}>
              <Image source={{ uri: photos[0].uri }} style={styles.adminPhotoThumb} resizeMode="cover" />
              <View style={styles.adminHDBadge}>
                <Text style={styles.adminHDBadgeText}>HD</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminPhotoTitle}>
                📸 {photos.length} High-Res {photos.length === 1 ? 'Evidence Photo' : 'Evidence Photos'}
              </Text>
              <Text style={styles.adminPhotoSub} numberOfLines={1}>
                {photos[0].name} • Tap to inspect full-screen
              </Text>
            </View>
            <Ionicons name="scan-outline" size={18} color="#1D4ED8" />
          </TouchableOpacity>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.badges}>
            {item.priority === 'Urgent' && (
              <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.badgeText, { color: '#DC2626' }]}>Urgent</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: item.status === 'In Progress' ? '#FEF3C7' : '#F3F4F6' }]}>
              <Text style={[styles.badgeText, { color: item.status === 'In Progress' ? '#D97706' : '#6B7280' }]}>{item.status}</Text>
            </View>
          </View>
          {item.status === 'Unassigned' && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => { setSelectedTicket(item.id); setAssignModalVisible(true); }}>
              <Text style={styles.assignBtnText}>Assign</Text>
            </TouchableOpacity>
          )}
          {item.status === 'In Progress' && (
            <TouchableOpacity
              style={styles.workOrderBtn}
              onPress={() => handleOpenTicketWorkOrder(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={13} color="#4338CA" style={{ marginRight: 4 }} />
              <Text style={styles.workOrderBtnText}>View Work Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Service Tickets (${allTickets.length})`} />
      
      <View style={styles.tabs}>
        {['All', 'Unassigned', 'In Progress', 'Urgent'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab, tab === 'Urgent' && urgentCount > 0 && styles.urgentTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText, tab === 'Urgent' && urgentCount > 0 && styles.urgentTabText]}>
              {tab} {tab === 'Urgent' && urgentCount > 0 ? `(${urgentCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={item => item.id}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
      />

      {/* Assign Vendor Modal */}
      <Modal visible={assignModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Vendor</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={mockVendors}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.vendorItem} onPress={() => setAssignModalVisible(false)}>
                  <View>
                    <Text style={styles.vendorName}>{item.name}</Text>
                    <Text style={styles.vendorCategory}>{item.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* High-Resolution Photo Lightbox Modal for Admin */}
      <Modal visible={!!inspectingPhoto} transparent animationType="fade" onRequestClose={() => setInspectingPhoto(null)}>
        <View style={styles.adminLightboxBackdrop}>
          <View style={styles.adminLightboxHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.adminLightboxBadge}>
                <Ionicons name="sparkles" size={12} color="#93C5FD" />
                <Text style={styles.adminLightboxBadgeText}>4K Ultra-HD Photo Evidence</Text>
              </View>
              <Text style={styles.adminLightboxTitle} numberOfLines={1}>
                {inspectingPhoto?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setInspectingPhoto(null)} style={styles.adminLightboxClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.adminLightboxBody}>
            {inspectingPhoto?.uri && (
              <ScrollView horizontal={adminZoom > 1} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={{ uri: inspectingPhoto.uri }}
                  style={[styles.adminLightboxImg, { transform: [{ scale: adminZoom }] }]}
                  resizeMode="contain"
                />
              </ScrollView>
            )}
          </View>

          <View style={styles.adminLightboxFooter}>
            <View style={styles.zoomPillRow}>
              {[1, 1.5, 2].map((z) => (
                <TouchableOpacity
                  key={z}
                  style={[styles.zoomPill, adminZoom === z && styles.zoomPillActive]}
                  onPress={() => setAdminZoom(z)}
                >
                  <Text style={[styles.zoomPillText, adminZoom === z && styles.zoomPillTextActive]}>
                    {z === 1 ? 'Fit (1x)' : `${z}x`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {Platform.OS === 'web' && inspectingPhoto?.uri && (
              <TouchableOpacity
                style={styles.adminOpenTabBtn}
                onPress={() => {
                  if (typeof window !== 'undefined' && inspectingPhoto?.uri) {
                    const w = window.open();
                    if (w) {
                      w.document.write(`
                        <html>
                          <head><title>${inspectingPhoto.name}</title></head>
                          <body style="margin:0; background:#0b0f19; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                            <img src="${inspectingPhoto.uri}" style="max-width:100%; height:auto;" />
                          </body>
                        </html>
                      `);
                    }
                  }
                }}
              >
                <Ionicons name="open-outline" size={14} color="#FFFFFF" />
                <Text style={styles.adminOpenTabText}>Open Original</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Official Work Order Modal */}
      <WorkOrderModal
        visible={workOrderModalVisible}
        onClose={() => setWorkOrderModalVisible(false)}
        workOrder={selectedWorkOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  workOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  workOrderBtnText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  tabs: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginRight: 8, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#1B4FD8' },
  urgentTab: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  tabText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  urgentTabText: { color: '#DC2626' },
  listContent: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryContainer: { flexDirection: 'row', alignItems: 'center' },
  categoryText: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  idBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  idBadgeText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  flatText: { fontSize: 14, fontWeight: 'bold', color: '#374151', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ticketTitle: { fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 12 },

  // Admin Photo Strip
  adminPhotoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    gap: 8,
  },
  adminPhotoThumbWrapper: {
    width: 42,
    height: 42,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  adminPhotoThumb: {
    width: '100%',
    height: '100%',
  },
  adminHDBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#1D4ED8',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  adminHDBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adminPhotoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  adminPhotoSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  assignBtn: { backgroundColor: '#1B4FD8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  assignBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  vendorItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  vendorName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  vendorCategory: { fontSize: 14, color: '#6B7280' },

  // Admin Lightbox Styles
  adminLightboxBackdrop: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  adminLightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 14,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  adminLightboxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  adminLightboxBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },
  adminLightboxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  adminLightboxClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminLightboxBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  adminLightboxImg: {
    width: 360,
    height: 480,
  },
  adminLightboxFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  zoomPillRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  zoomPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  zoomPillActive: {
    backgroundColor: '#1D4ED8',
  },
  zoomPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  zoomPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  adminOpenTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  adminOpenTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
