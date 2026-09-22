import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { WorkOrderModal, WorkOrderData } from '../../components/workorder/WorkOrderModal';

interface BidItem {
  id: string;
  title: string;
  category: string;
  date?: string;
  budget?: string;
  amount?: string;
  status: 'Open' | 'Pending' | 'Accepted' | 'Completed';
}

const initialMockOpenBids: BidItem[] = [
  { id: 'b1', title: 'Main gate painting & rust-proofing', category: 'Civil', date: 'Posted 2h ago', budget: '₹15,000 - ₹20,000', status: 'Open' },
  { id: 'b2', title: 'Generator servicing & oil change', category: 'Electrical', date: 'Posted 5h ago', budget: '₹5,000 - ₹8,000', status: 'Open' },
  { id: 'b3', title: 'Clubhouse plumbing overhaul', category: 'Plumbing', date: 'Posted 1d ago', budget: '₹2,000 - ₹3,500', status: 'Open' },
];

const initialMockActiveBids: BidItem[] = [
  { id: 'a1', title: 'CCTV maintenance & IP camera alignment', category: 'Security & Electrical', amount: '₹12,000', status: 'Accepted' },
  { id: 'a2', title: 'Lobby tiles repair & grouting', category: 'Civil', amount: '₹8,500', status: 'Pending' },
];

const initialMockCompletedBids: BidItem[] = [
  { id: 'c1', title: 'Submersible pump motor rewinding', category: 'Electrical', amount: '₹18,500', status: 'Completed', date: 'Completed 3d ago' },
  { id: 'c2', title: 'Rainwater harvesting filter media wash', category: 'Plumbing', amount: '₹9,200', status: 'Completed', date: 'Completed 1w ago' },
];

export default function VendorBids() {
  const [activeTab, setActiveTab] = useState<'Open' | 'My Bids' | 'Completed'>('Open');
  const [openBids, setOpenBids] = useState<BidItem[]>(initialMockOpenBids);
  const [activeBids, setActiveBids] = useState<BidItem[]>(initialMockActiveBids);
  const [completedBids, setCompletedBids] = useState<BidItem[]>(initialMockCompletedBids);

  // Place Bid Modal State
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedOpenBid, setSelectedOpenBid] = useState<BidItem | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [estDays, setEstDays] = useState('');
  const [notes, setNotes] = useState('');

  // Work Order Inspection Modal State
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderData | null>(null);
  const [workOrderModalVisible, setWorkOrderModalVisible] = useState(false);

  const getWorkOrderForBid = (bid: BidItem): WorkOrderData => {
    return {
      id: `WO-2026-${bid.id.toUpperCase()}-0842`,
      title: bid.title,
      category: bid.category || 'Maintenance & Technical',
      status: bid.status === 'Completed' ? 'COMPLETED' : 'IN_PROGRESS',
      amount: bid.amount || bid.budget || '₹12,000',
      societyName: 'AMA Grand Estate RWA',
      societyAddress: '123 Prime Avenue, Orchid Towers, Bangalore 560103',
      contractorName: 'AMA Vendor Services (Suresh Patel)',
      contractorPhone: '+91 98201 00042',
      supervisorName: 'Vikram Patil (Facility Manager)',
      supervisorPhone: '+91 98201 00042',
      issuedDate: '19 Sep 2026',
      targetDate: '23 Sep 2026',
      gatePassCode: `INW-WO-${bid.id.toUpperCase()}42`,
      scopeItems: [
        `Complete thorough diagnostic assessment and scope inspection for ${bid.title.toLowerCase()}`,
        'Mobilize certified technicians, safety gear, and testing instruments to site',
        'Execute component servicing, realignments, and replacement per society standards',
        'Conduct 48-hour continuous run testing and obtain signed sign-off from Facility Manager',
      ],
      milestones: [
        { title: 'Milestone 1: Site inspection, mobilization & diagnostics', percent: 40, amount: '₹4,800', status: 'DONE' },
        { title: 'Milestone 2: Execution, component replacement & testing', percent: 40, amount: '₹4,800', status: bid.status === 'Completed' ? 'DONE' : 'IN_PROGRESS' },
        { title: 'Milestone 3: Final performance validation & RWA handover', percent: 20, amount: '₹2,400', status: bid.status === 'Completed' ? 'DONE' : (bid.status === 'Accepted' ? 'IN_PROGRESS' : 'PENDING') },
      ],
      terms: [
        'All contractor technicians must wear safety gear and display the official gate pass token.',
        'Noisy work permitted strictly between 10:00 AM and 05:00 PM on weekdays.',
        'Debris and tools must be cleared from common corridors at the end of each workday.',
        'Payment released via direct NEFT within 3 banking days of verified milestone completion.',
      ],
    };
  };

  const handleOpenWorkOrder = (bid: BidItem) => {
    const wo = getWorkOrderForBid(bid);
    setSelectedWorkOrder(wo);
    setWorkOrderModalVisible(true);
  };

  const handleOpenBidModal = (bid: BidItem) => {
    setSelectedOpenBid(bid);
    setBidAmount('');
    setEstDays('3');
    setNotes('');
    setBidModalVisible(true);
  };

  const handleSubmitBid = () => {
    if (!selectedOpenBid) return;
    const finalAmount = bidAmount.trim() ? `₹${bidAmount.trim().replace(/^₹/, '')}` : '₹10,500';

    const newBid: BidItem = {
      id: `b-${Date.now().toString().slice(-4)}`,
      title: selectedOpenBid.title,
      category: selectedOpenBid.category,
      amount: finalAmount,
      status: 'Pending',
    };

    setActiveBids([newBid, ...activeBids]);
    setOpenBids(openBids.filter(b => b.id !== selectedOpenBid.id));
    setBidModalVisible(false);
    setSelectedOpenBid(null);
    setActiveTab('My Bids');
    Alert.alert('Bid Submitted', `Your bid of ${finalAmount} for "${newBid.title}" was placed successfully.`);
  };

  const handleWorkOrderStatusChange = (newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    if (!selectedWorkOrder) return;
    if (newStatus === 'COMPLETED') {
      // Move from active to completed if found
      const activeMatch = activeBids.find(b => selectedWorkOrder.id.includes(b.id.toUpperCase()));
      if (activeMatch) {
        setActiveBids(activeBids.filter(b => b.id !== activeMatch.id));
        setCompletedBids([{ ...activeMatch, status: 'Completed' }, ...completedBids]);
      }
    }
  };

  const renderOpenBid = ({ item }: { item: BidItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <Text style={styles.bidTitle}>{item.title}</Text>
      <Text style={styles.budgetText}>Est. Budget: {item.budget}</Text>
      <TouchableOpacity style={styles.placeBidBtn} onPress={() => handleOpenBidModal(item)} activeOpacity={0.85}>
        <Ionicons name="pricetag-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.placeBidText}>Place Bid</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActiveBid = ({ item }: { item: BidItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.bidTitle}>{item.title}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'Accepted'
                  ? '#D1FAE5'
                  : item.status === 'Completed'
                  ? '#EEF2FF'
                  : '#FEF3C7',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === 'Accepted'
                    ? '#047857'
                    : item.status === 'Completed'
                    ? '#4338CA'
                    : '#D97706',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.myBidAmount}>Contract Value: {item.amount}</Text>

      {/* View Work Order Action: Enabled for Accepted and Completed Bids */}
      {(item.status === 'Accepted' || item.status === 'Completed') && (
        <TouchableOpacity
          style={styles.workOrderBtn}
          onPress={() => handleOpenWorkOrder(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`View Work Order for ${item.title}`}
        >
          <Ionicons name="document-text-outline" size={17} color="#7C3AED" style={{ marginRight: 6 }} />
          <Text style={styles.workOrderText}>View Work Order</Text>
        </TouchableOpacity>
      )}

      {item.status === 'Pending' && (
        <View style={styles.pendingHintRow}>
          <Ionicons name="time-outline" size={14} color="#D97706" style={{ marginRight: 4 }} />
          <Text style={styles.pendingHintText}>Awaiting Managing Committee &amp; President Review</Text>
        </View>
      )}
    </View>
  );

  const currentData =
    activeTab === 'Open'
      ? openBids
      : activeTab === 'My Bids'
      ? activeBids
      : completedBids;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Service Bids &amp; Work Orders" />

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['Open', 'My Bids', 'Completed'] as const).map(tab => {
          const count =
            tab === 'Open'
              ? openBids.length
              : tab === 'My Bids'
              ? activeBids.length
              : completedBids.length;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bids List */}
      <FlatList
        data={currentData}
        keyExtractor={item => item.id}
        renderItem={activeTab === 'Open' ? renderOpenBid : renderActiveBid}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={44} color="#9CA3AF" />
            <Text style={styles.emptyText}>No bids found in this section.</Text>
          </View>
        }
      />

      {/* Place Bid Modal */}
      <Modal visible={bidModalVisible} transparent animationType="slide" onRequestClose={() => setBidModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Submit Formal Bid</Text>
                <Text style={styles.modalSubtitle}>{selectedOpenBid?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setBidModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Bid Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 16500"
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>Estimated Days to Complete</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3"
              value={estDays}
              onChangeText={setEstDays}
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>Proposal &amp; Warranty Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
              placeholder="Includes 1-year service warranty and genuine ISI spares..."
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setBidModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitBid}>
                <Ionicons name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Submit Bid</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Work Order Inspection Modal */}
      <WorkOrderModal
        visible={workOrderModalVisible}
        onClose={() => setWorkOrderModalVisible(false)}
        workOrder={selectedWorkOrder}
        onStatusChange={handleWorkOrderStatusChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTab: { backgroundColor: '#7C3AED' },
  tabText: { color: '#6B7280', fontWeight: '700', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  listContent: { padding: 16, paddingBottom: 60 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { color: '#7C3AED', fontSize: 12, fontWeight: 'bold' },
  dateText: { fontSize: 12, color: '#6B7280' },
  bidTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8, flex: 1 },
  budgetText: { fontSize: 14, color: '#4B5563', marginBottom: 14, fontWeight: '500' },
  placeBidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
  },
  placeBidText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  myBidAmount: { fontSize: 15, fontWeight: '700', color: '#059669', marginBottom: 12 },
  workOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  workOrderText: { color: '#7C3AED', fontWeight: '800', fontSize: 14 },
  pendingHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingHintText: { fontSize: 12, color: '#B45309', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 12, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 15, backgroundColor: '#F9FAFB' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 10 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelBtnText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
