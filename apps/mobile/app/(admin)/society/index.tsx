import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import {
  useBookingStore,
  FacilityBooking,
  normalizeDateToKey,
  formatDateToDisplay,
} from '../../../stores/bookingStore';
import {
  BookingCalendar,
  CalendarMarkedDay,
} from '../../../components/calendar/BookingCalendar';
import { useCallStore } from '../../../stores/callStore';
import { useChatStore } from '../../../stores/chatStore';
import { useAuthStore } from '../../../stores/authStore';
import {
  useSocietyStore,
  SocietyMember,
  SocietyFlat,
} from '../../../stores/societyStore';
import { VideoMessageRecorderModal } from '../../../components/media/VideoMessageRecorderModal';
import { ActiveSosBanner } from '../../../components/sos/ActiveSosBanner';
import { CreatePollModal } from '../../../components/polls/CreatePollModal';
import { usePollStore } from '../../../stores/pollStore';
import { useNocStore } from '../../../stores/nocStore';

const FACILITY_OPTIONS = [
  'All',
  'Clubhouse',
  'Swimming Pool',
  'Tennis Court',
  'Badminton Court',
  'Gymnasium',
];

export default function AdminSociety() {
  const [activeTab, setActiveTab] = useState<'Residents' | 'Staff' | 'Flats' | 'Facility Bookings' | 'Polls' | 'Move NOCs'>('Residents');
  const [residentFilter, setResidentFilter] = useState<'all' | 'owner' | 'tenant' | 'committee'>('all');
  const [staffFilter, setStaffFilter] = useState<'all' | 'guard' | 'facility_manager' | 'technician' | 'vendor' | 'supplier'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [flatTowerFilter, setFlatTowerFilter] = useState('All');
  const [flatStatusFilter, setFlatStatusFilter] = useState('All');

  // Stores
  const { polls, closePoll } = usePollStore();
  const { nocRequests, approveNoc, rejectNoc } = useNocStore();

  // Modals & action states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [createPollModalVisible, setCreatePollModalVisible] = useState(false);
  const [recordingContact, setRecordingContact] = useState<any | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add Member Form State
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRoleCategory, setAddRoleCategory] = useState<SocietyMember['roleCategory']>('owner');
  const [addFlat, setAddFlat] = useState('');
  const [addTower, setAddTower] = useState('Tower B');
  const [addShift, setAddShift] = useState('Morning (8:00 AM - 8:00 PM)');
  const [addBadge, setAddBadge] = useState('');
  const [addAgency, setAddAgency] = useState('');
  const [addTrade, setAddTrade] = useState('Electrical & DG Backup');
  const [addVehicle, setAddVehicle] = useState('');
  const [addShareCert, setAddShareCert] = useState('');
  const [addOwnerName, setAddOwnerName] = useState('');
  const [addShopName, setAddShopName] = useState('');

  // Stores
  const { user } = useAuthStore();
  const { openCallPicker } = useCallStore();
  const { sendVideoMessage } = useChatStore();
  const {
    societyName,
    societyAddress,
    totalFlatsCount,
    estYear,
    members,
    flats,
    registerMember,
    deleteMember,
  } = useSocietyStore();

  // Booking store and calendar state
  const { bookings, cancelBooking } = useBookingStore();
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState('All');
  const [bookingSearch, setBookingSearch] = useState('');

  // Auto-sync logged-in user if they are registered but not in list
  useEffect(() => {
    if (user && user.name) {
      registerMember(user);
    }
  }, [user]);

  // Filtered Residents
  const filteredResidents = useMemo(() => {
    return members.filter((m) => {
      const isRes = m.roleCategory === 'owner' || m.roleCategory === 'tenant' || m.roleCategory === 'committee';
      if (!isRes) return false;

      if (residentFilter !== 'all' && m.roleCategory !== residentFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesFlat = m.flat ? m.flat.toLowerCase().includes(q) : false;
        const matchesPhone = m.phone.includes(q);
        const matchesVehicle = m.vehicleNumber ? m.vehicleNumber.toLowerCase().includes(q) : false;
        const matchesCert = m.shareCertNumber ? m.shareCertNumber.toLowerCase().includes(q) : false;
        return matchesName || matchesFlat || matchesPhone || matchesVehicle || matchesCert;
      }

      return true;
    });
  }, [members, residentFilter, searchQuery]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return members.filter((m) => {
      const isStf =
        m.roleCategory === 'guard' ||
        m.roleCategory === 'facility_manager' ||
        m.roleCategory === 'technician' ||
        m.roleCategory === 'vendor' ||
        m.roleCategory === 'supplier';
      if (!isStf) return false;

      if (staffFilter !== 'all' && m.roleCategory !== staffFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesBadge = m.badgeId ? m.badgeId.toLowerCase().includes(q) : false;
        const matchesPhone = m.phone.includes(q);
        const matchesTrade = m.tradeSpecialization ? m.tradeSpecialization.toLowerCase().includes(q) : false;
        const matchesShop = m.shopName ? m.shopName.toLowerCase().includes(q) : false;
        const matchesAgency = m.agencyName ? m.agencyName.toLowerCase().includes(q) : false;
        const matchesSupplier = m.companyName ? m.companyName.toLowerCase().includes(q) : false;
        return matchesName || matchesBadge || matchesPhone || matchesTrade || matchesShop || matchesAgency || matchesSupplier;
      }

      return true;
    });
  }, [members, staffFilter, searchQuery]);

  // Filtered Flats
  const filteredFlats = useMemo(() => {
    return flats.filter((f) => {
      if (flatTowerFilter !== 'All' && f.tower !== flatTowerFilter) return false;
      if (flatStatusFilter !== 'All' && f.status !== flatStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesFlat = f.flat.toLowerCase().includes(q);
        const matchesOwner = f.ownerName ? f.ownerName.toLowerCase().includes(q) : false;
        const matchesTenant = f.tenantName ? f.tenantName.toLowerCase().includes(q) : false;
        return matchesFlat || matchesOwner || matchesTenant;
      }
      return true;
    });
  }, [flats, flatTowerFilter, flatStatusFilter, searchQuery]);

  // Counts for Badges
  const ownersCount = useMemo(() => members.filter((m) => m.roleCategory === 'owner').length, [members]);
  const tenantsCount = useMemo(() => members.filter((m) => m.roleCategory === 'tenant').length, [members]);
  const committeeCount = useMemo(() => members.filter((m) => m.roleCategory === 'committee').length, [members]);
  const guardsCount = useMemo(() => members.filter((m) => m.roleCategory === 'guard').length, [members]);
  const fmCount = useMemo(() => members.filter((m) => m.roleCategory === 'facility_manager').length, [members]);
  const techCount = useMemo(() => members.filter((m) => m.roleCategory === 'technician').length, [members]);
  const vendorCount = useMemo(() => members.filter((m) => m.roleCategory === 'vendor').length, [members]);
  const supplierCount = useMemo(() => members.filter((m) => m.roleCategory === 'supplier').length, [members]);

  // Calendar dates
  const calendarDateKey = useMemo(() => normalizeDateToKey(calendarDate), [calendarDate]);
  const calendarDateDisplay = useMemo(() => formatDateToDisplay(calendarDate), [calendarDate]);

  const facilityCalendarMarks = useMemo(() => {
    const marks: Record<string, CalendarMarkedDay> = {};
    bookings.forEach((b) => {
      const k = normalizeDateToKey(b.date);
      if (!k) return;
      if (!marks[k]) {
        marks[k] = { count: 0, dots: [] };
      }
      marks[k].count = (marks[k].count || 0) + 1;
      let dotColor = '#10B981';
      if (b.facilityId === '1') dotColor = '#1D4ED8';
      else if (b.facilityId === '4') dotColor = '#10B981';
      else if (b.facilityId === '5') dotColor = '#F59E0B';
      else if (b.facilityId === '2') dotColor = '#06B6D4';
      else if (b.facilityId === '3') dotColor = '#8B5CF6';

      if (!marks[k].dots?.some((d) => d.color === dotColor)) {
        marks[k].dots?.push({ color: dotColor, key: `${b.id}-${dotColor}`, label: b.facilityName });
      }
    });
    return marks;
  }, [bookings]);

  const bookingsOnDate = useMemo(() => {
    return bookings.filter((b) => {
      const dateMatches = normalizeDateToKey(b.date) === calendarDateKey;
      if (!dateMatches) return false;
      if (selectedFacilityFilter !== 'All' && !b.facilityName.toLowerCase().includes(selectedFacilityFilter.toLowerCase())) {
        return false;
      }
      if (bookingSearch.trim()) {
        const q = bookingSearch.trim().toLowerCase();
        return (
          b.residentName.toLowerCase().includes(q) ||
          b.flatNumber.toLowerCase().includes(q) ||
          b.facilityName.toLowerCase().includes(q) ||
          b.accessPin.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, calendarDateKey, selectedFacilityFilter, bookingSearch]);

  const activeBookings = useMemo(() => bookings.filter((b) => b.status !== 'CANCELLED'), [bookings]);
  const totalRevenue = useMemo(() => {
    return activeBookings.reduce((sum, b) => {
      const numeric = parseInt(b.price.replace(/[^\d]/g, ''), 10) || 0;
      return sum + numeric;
    }, 0);
  }, [activeBookings]);

  const peakFacility = useMemo(() => {
    const counts: Record<string, number> = {};
    activeBookings.forEach((b) => {
      counts[b.facilityName] = (counts[b.facilityName] || 0) + 1;
    });
    let max = 0;
    let top = 'Clubhouse';
    Object.entries(counts).forEach(([fac, cnt]) => {
      if (cnt > max) {
        max = cnt;
        top = fac;
      }
    });
    return top.replace(/[^\w\s]/g, '').trim();
  }, [activeBookings]);

  // Handlers
  const handleSaveNewMember = () => {
    if (!addName.trim()) {
      Alert.alert('Required Field', 'Please enter the member full name.');
      return;
    }
    if (!addPhone.trim()) {
      Alert.alert('Required Field', 'Please enter a valid phone number.');
      return;
    }

    const newMember = registerMember({
      name: addName.trim(),
      phone: addPhone.trim(),
      email: addEmail.trim() || undefined,
      roleCategory: addRoleCategory,
      role:
        addRoleCategory === 'owner' ? 'resident_owner' :
        addRoleCategory === 'tenant' ? 'resident_tenant' :
        addRoleCategory === 'guard' ? 'guard' :
        addRoleCategory === 'facility_manager' ? 'facility_manager' :
        addRoleCategory === 'technician' ? 'technician' : 'vendor',
      flat: addFlat.trim() || (addRoleCategory === 'owner' ? 'B-204' : addRoleCategory === 'guard' ? 'Gate 1' : 'Shop 1'),
      tower: addTower,
      shift: addShift,
      badgeId: addBadge.trim().toUpperCase() || undefined,
      agencyName: addAgency.trim() || undefined,
      tradeSpecialization: addTrade,
      vehicleNumber: addVehicle.trim() || undefined,
      shareCertNumber: addShareCert.trim() || undefined,
      ownerName: addOwnerName.trim() || undefined,
      shopName: addShopName.trim() || undefined,
    });

    setAddModalVisible(false);
    // Reset form
    setAddName('');
    setAddPhone('');
    setAddEmail('');
    setAddFlat('');
    setAddBadge('');
    setAddVehicle('');
    setAddShareCert('');

    const msg = `${newMember.name} has been successfully added to the society registry!`;
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
    if (Platform.OS !== 'web') {
      Alert.alert('Member Registered', msg);
    }
  };

  const handleDeleteMember = (member: SocietyMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} (${member.flat || member.roleCategory}) from the society directory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteMember(member.id);
            setSuccessToast(`${member.name} has been removed.`);
            setTimeout(() => setSuccessToast(null), 3500);
          },
        },
      ]
    );
  };

  const handleSendVideoNote = (payload: { videoUri: string; durationSec: number; caption?: string }) => {
    if (!recordingContact) return;
    sendVideoMessage({
      channelId: 'general',
      videoUri: payload.videoUri,
      videoDurationSec: payload.durationSec,
      caption: payload.caption
        ? `[President Note for ${recordingContact.name}] ${payload.caption}`
        : `Executive notice from President for ${recordingContact.name}`,
      senderName: user?.name || 'RWA President',
      senderRole: 'RWA President',
      recipientName: recordingContact.name,
    });
    setSuccessToast(`Video note delivered to ${recordingContact.name}!`);
    setTimeout(() => setSuccessToast(null), 4000);
    setRecordingContact(null);
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Owner Occupied':
        return '#10B981';
      case 'Tenant Occupied':
        return '#3B82F6';
      case 'Vacant':
        return '#94A3B8';
      default:
        return '#6B7280';
    }
  };

  // Render Resident Item
  const renderResident = ({ item }: { item: SocietyMember }) => {
    const isOwner = item.roleCategory === 'owner';
    const isTenant = item.roleCategory === 'tenant';
    const isCommittee = item.roleCategory === 'committee';

    return (
      <View style={styles.listItemCard}>
        <View style={styles.itemTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 22 }}>{item.avatar || (isOwner ? '🏡' : isTenant ? '🔑' : '👑')}</Text>
          </View>

          <View style={styles.itemMainInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.itemNameText}>{item.name}</Text>
              {item.flat && (
                <View style={styles.flatPill}>
                  <Text style={styles.flatPillText}>{item.flat}</Text>
                </View>
              )}
            </View>

            <Text style={styles.itemRoleSub}>
              {isCommittee
                ? `👑 ${item.committeePosition || 'Managing Committee'} • ${item.tower || 'Tower A'}`
                : isOwner
                ? `🏡 Flat Owner • ${item.tower || 'Tower B'}`
                : `🔑 Tenant • ${item.tower || 'Tower A'}`}
            </Text>

            <Text style={styles.itemPhoneText}>📞 {item.phone}</Text>
          </View>

          {/* Delete Action Button for President */}
          <TouchableOpacity
            style={styles.trashBtn}
            onPress={() => handleDeleteMember(item)}
            activeOpacity={0.7}
            accessibilityLabel={`Remove ${item.name}`}
          >
            <Ionicons name="trash-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Detailed Metadata Pill Bar */}
        <View style={styles.itemMetaBar}>
          {isOwner && item.shareCertNumber && (
            <View style={styles.metaChip}>
              <Ionicons name="ribbon-outline" size={12} color="#1D4ED8" />
              <Text style={styles.metaChipText}>Cert: {item.shareCertNumber}</Text>
            </View>
          )}

          {isOwner && item.vehicleNumber && (
            <View style={styles.metaChip}>
              <Ionicons name="car-outline" size={12} color="#059669" />
              <Text style={styles.metaChipText}>{item.vehicleNumber}</Text>
            </View>
          )}

          {isTenant && item.ownerName && (
            <View style={styles.metaChip}>
              <Ionicons name="person-outline" size={12} color="#4B5563" />
              <Text style={styles.metaChipText}>Owner: {item.ownerName}</Text>
            </View>
          )}

          {isTenant && item.leaseEndDate && (
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={12} color="#D97706" />
              <Text style={styles.metaChipText}>Lease till: {item.leaseEndDate}</Text>
            </View>
          )}

          <View style={[styles.activeStatusPill, { backgroundColor: '#DCFCE7' }]}>
            <View style={[styles.miniDot, { backgroundColor: '#16A34A' }]} />
            <Text style={[styles.activeStatusText, { color: '#15803D' }]}>Verified Active</Text>
          </View>
        </View>

        {/* Communication Actions: Audio Call, Video Call, Video Note */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.commActionBtn, styles.audioCommBtn]}
            onPress={() =>
              openCallPicker(
                {
                  id: item.id,
                  name: item.name,
                  flat: item.flat,
                  role: isOwner ? 'Flat Owner' : isTenant ? 'Tenant Resident' : 'Committee Member',
                  phone: item.phone.replace(/[^0-9]/g, ''),
                  category: 'resident',
                },
                'AUDIO'
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.commActionText}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commActionBtn, styles.videoCommBtn]}
            onPress={() =>
              openCallPicker(
                {
                  id: item.id,
                  name: item.name,
                  flat: item.flat,
                  role: isOwner ? 'Flat Owner' : isTenant ? 'Tenant Resident' : 'Committee Member',
                  phone: item.phone.replace(/[^0-9]/g, ''),
                  category: 'resident',
                },
                'VIDEO'
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons name="videocam" size={14} color="#FFFFFF" />
            <Text style={styles.commActionText}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commActionBtn, styles.noteCommBtn]}
            onPress={() => setRecordingContact(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="recording" size={14} color="#FFFFFF" />
            <Text style={styles.commActionText}>Video Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Staff Item
  const renderStaff = ({ item }: { item: SocietyMember }) => {
    const isGuard = item.roleCategory === 'guard';
    const isFm = item.roleCategory === 'facility_manager';
    const isTech = item.roleCategory === 'technician';
    const isVendor = item.roleCategory === 'vendor';
    const isSupplier = item.roleCategory === 'supplier';

    return (
      <View style={styles.listItemCard}>
        <View style={styles.itemTopRow}>
          <View style={[styles.avatarCircle, { backgroundColor: '#F1F5F9' }]}>
            <Text style={{ fontSize: 22 }}>
              {item.avatar || (isGuard ? '🛡️' : isFm ? '🏢' : isTech ? '🔧' : isVendor ? '🛒' : isSupplier ? '🚛' : '👤')}
            </Text>
          </View>

          <View style={styles.itemMainInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.itemNameText}>{item.name}</Text>
              {item.badgeId && (
                <View style={styles.badgeIdPill}>
                  <Text style={styles.badgeIdPillText}>{item.badgeId}</Text>
                </View>
              )}
              {isSupplier && (
                <View style={[styles.badgeIdPill, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}>
                  <Text style={[styles.badgeIdPillText, { color: '#0D9488' }]}>B2B Supplier</Text>
                </View>
              )}
            </View>

            <Text style={styles.itemRoleSub}>
              {isGuard
                ? `🛡️ Security Guard • ${item.gatePost || item.flat || 'Gate'}`
                : isFm
                ? `🏢 Facility Lead • ${item.agencyName || 'CBRE'}`
                : isTech
                ? `🔧 ${item.tradeSpecialization || 'Maintenance Specialist'}`
                : isVendor
                ? `🛒 ${item.shopName || 'Society Vendor'}`
                : `🚛 Bulk Supplier • ${item.companyName || item.category || 'B2B Supplies'}`}
            </Text>

            <Text style={styles.itemPhoneText}>📞 {item.phone}</Text>
          </View>

          <TouchableOpacity
            style={styles.trashBtn}
            onPress={() => handleDeleteMember(item)}
            activeOpacity={0.7}
            accessibilityLabel={`Remove ${item.name}`}
          >
            <Ionicons name="trash-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Staff Specific Chips */}
        <View style={styles.itemMetaBar}>
          {item.shift && (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={12} color="#D97706" />
              <Text style={styles.metaChipText}>{item.shift}</Text>
            </View>
          )}

          {item.agencyName && (
            <View style={styles.metaChip}>
              <Ionicons name="business-outline" size={12} color="#4B5563" />
              <Text style={styles.metaChipText}>{item.agencyName}</Text>
            </View>
          )}

          {item.stallNumber && (
            <View style={styles.metaChip}>
              <Ionicons name="storefront-outline" size={12} color="#059669" />
              <Text style={styles.metaChipText}>{item.stallNumber}</Text>
            </View>
          )}

          {item.gstin && (
            <View style={styles.metaChip}>
              <Ionicons name="receipt-outline" size={12} color="#0D9488" />
              <Text style={styles.metaChipText}>GST: {item.gstin}</Text>
            </View>
          )}

          {item.upiId && (
            <View style={styles.metaChip}>
              <Ionicons name="card-outline" size={12} color="#6366F1" />
              <Text style={styles.metaChipText}>UPI: {item.upiId}</Text>
            </View>
          )}

          <View style={[styles.activeStatusPill, { backgroundColor: '#DCFCE7' }]}>
            <View style={[styles.miniDot, { backgroundColor: '#16A34A' }]} />
            <Text style={[styles.activeStatusText, { color: '#15803D' }]}>
              {isSupplier ? 'Verified Vendor' : 'On Duty'}
            </Text>
          </View>
        </View>

        {/* Communication Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.commActionBtn, styles.audioCommBtn]}
            onPress={() =>
              openCallPicker(
                {
                  id: item.id,
                  name: item.name,
                  role: isGuard ? 'Security Guard' : isFm ? 'Facility Manager' : isTech ? 'Technician' : 'Vendor',
                  phone: item.phone.replace(/[^0-9]/g, ''),
                  category: isGuard ? 'gate' : isTech ? 'technician' : 'vendor',
                },
                'AUDIO'
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={14} color="#FFFFFF" />
            <Text style={styles.commActionText}>Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commActionBtn, styles.videoCommBtn]}
            onPress={() =>
              openCallPicker(
                {
                  id: item.id,
                  name: item.name,
                  role: isGuard ? 'Security Guard' : isFm ? 'Facility Manager' : isTech ? 'Technician' : 'Vendor',
                  phone: item.phone.replace(/[^0-9]/g, ''),
                  category: isGuard ? 'gate' : isTech ? 'technician' : 'vendor',
                },
                'VIDEO'
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons name="videocam" size={14} color="#FFFFFF" />
            <Text style={styles.commActionText}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commActionBtn, styles.noteCommBtn]}
            onPress={() => setRecordingContact(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="recording" size={14} color="#FFFFFF" />
            <Text style={styles.commActionText}>Video Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Society Management 🏢"
        subtitle={`Official Registry • RWA President & Board`}
      />

      {/* Emergency Alert Banner */}
      <ActiveSosBanner />

      {/* Society Overview Card with Real Dynamic Numbers */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.societyName}>{societyName}</Text>
            <Text style={styles.societyAddress}>{societyAddress}</Text>
          </View>
          <View style={styles.estBadge}>
            <Text style={styles.estBadgeText}>Est. {estYear}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalFlatsCount}</Text>
            <Text style={styles.statLabel}>Total Units</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#059669' }]}>
              {ownersCount + tenantsCount}
            </Text>
            <Text style={styles.statLabel}>Reg. Residents</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#D97706' }]}>
              {guardsCount + fmCount + techCount + vendorCount}
            </Text>
            <Text style={styles.statLabel}>Staff & Vendors</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#7C3AED' }]}>94%</Text>
            <Text style={styles.statLabel}>Occupancy</Text>
          </View>
        </View>
      </View>

      {/* Top Main Navigation Tabs */}
      <View style={styles.tabsScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {(['Residents', 'Staff', 'Flats', 'Facility Bookings', 'Polls', 'Move NOCs'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.mainTabBtn, activeTab === tab && styles.mainTabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.mainTabBtnText, activeTab === tab && styles.mainTabBtnTextActive]}>
                {tab === 'Residents' ? `Residents (${ownersCount + tenantsCount})` :
                 tab === 'Staff' ? `Staff (${guardsCount + fmCount + techCount + vendorCount})` :
                 tab === 'Flats' ? 'Flats 🏢' :
                 tab === 'Facility Bookings' ? 'Bookings 📅' :
                 tab === 'Polls' ? `Polls (${polls.filter((p) => p.status === 'ACTIVE').length})` :
                 `Move NOCs (${nocRequests.filter((n) => n.status === 'PENDING_APPROVAL').length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Global Search Bar for active lists */}
      {(activeTab === 'Residents' || activeTab === 'Staff' || activeTab === 'Flats') && (
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={17} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'Residents'
                ? 'Search by Owner name, flat, phone, vehicle, cert...'
                : activeTab === 'Staff'
                ? 'Search by staff name, role, badge, agency, shift...'
                : 'Search flats, owners, or tenants...'
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ================= RESIDENTS TAB ================= */}
      {activeTab === 'Residents' && (
        <View style={{ flex: 1 }}>
          {/* Sub Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subFilterScroll}
            contentContainerStyle={styles.subFilterContent}
          >
            <TouchableOpacity
              style={[styles.subFilterChip, residentFilter === 'all' && styles.subFilterChipActive]}
              onPress={() => setResidentFilter('all')}
            >
              <Text style={[styles.subFilterChipText, residentFilter === 'all' && styles.subFilterChipTextActive]}>
                All Residents ({ownersCount + tenantsCount + committeeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subFilterChip, residentFilter === 'owner' && styles.subFilterChipActive]}
              onPress={() => setResidentFilter('owner')}
            >
              <Text style={[styles.subFilterChipText, residentFilter === 'owner' && styles.subFilterChipTextActive]}>
                🏡 Flat Owners ({ownersCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subFilterChip, residentFilter === 'tenant' && styles.subFilterChipActive]}
              onPress={() => setResidentFilter('tenant')}
            >
              <Text style={[styles.subFilterChipText, residentFilter === 'tenant' && styles.subFilterChipTextActive]}>
                🔑 Tenants ({tenantsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subFilterChip, residentFilter === 'committee' && styles.subFilterChipActive]}
              onPress={() => setResidentFilter('committee')}
            >
              <Text style={[styles.subFilterChipText, residentFilter === 'committee' && styles.subFilterChipTextActive]}>
                👑 Committee ({committeeCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <FlatList
            data={filteredResidents}
            keyExtractor={(item) => item.id}
            renderItem={renderResident}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No residents found</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? 'Try adjusting your search criteria.' : 'Tap "+" below to register a resident.'}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {/* ================= STAFF TAB ================= */}
      {activeTab === 'Staff' && (
        <View style={{ flex: 1 }}>
          {/* Sub Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subFilterScroll}
            contentContainerStyle={styles.subFilterContent}
          >
            <TouchableOpacity
              style={[styles.subFilterChip, staffFilter === 'all' && styles.subFilterChipActive]}
              onPress={() => setStaffFilter('all')}
            >
              <Text style={[styles.subFilterChipText, staffFilter === 'all' && styles.subFilterChipTextActive]}>
                All Staff ({guardsCount + fmCount + techCount + vendorCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subFilterChip, staffFilter === 'guard' && styles.subFilterChipActive]}
              onPress={() => setStaffFilter('guard')}
            >
              <Text style={[styles.subFilterChipText, staffFilter === 'guard' && styles.subFilterChipTextActive]}>
                🛡️ Security Guards ({guardsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subFilterChip, staffFilter === 'facility_manager' && styles.subFilterChipActive]}
              onPress={() => setStaffFilter('facility_manager')}
            >
              <Text style={[styles.subFilterChipText, staffFilter === 'facility_manager' && styles.subFilterChipTextActive]}>
                🏢 Facility Managers ({fmCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subFilterChip, staffFilter === 'technician' && styles.subFilterChipActive]}
              onPress={() => setStaffFilter('technician')}
            >
              <Text style={[styles.subFilterChipText, staffFilter === 'technician' && styles.subFilterChipTextActive]}>
                🔧 Technicians ({techCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subFilterChip, staffFilter === 'vendor' && styles.subFilterChipActive]}
              onPress={() => setStaffFilter('vendor')}
            >
              <Text style={[styles.subFilterChipText, staffFilter === 'vendor' && styles.subFilterChipTextActive]}>
                🛒 Vendors & Mart ({vendorCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subFilterChip, staffFilter === 'supplier' && styles.subFilterChipActive]}
              onPress={() => setStaffFilter('supplier' as any)}
            >
              <Text style={[styles.subFilterChipText, staffFilter === 'supplier' && styles.subFilterChipTextActive]}>
                🚛 Bulk Suppliers ({supplierCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <FlatList
            data={filteredStaff}
            keyExtractor={(item) => item.id}
            renderItem={renderStaff}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No staff members found</Text>
                <Text style={styles.emptySub}>
                  {searchQuery ? 'Try adjusting your search criteria.' : 'Tap "+" below to register staff.'}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {/* ================= FLATS TAB ================= */}
      {activeTab === 'Flats' && (
        <View style={{ flex: 1 }}>
          <View style={styles.flatFilterRow}>
            {/* Tower selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {['All', 'Tower A', 'Tower B', 'Tower C'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.flatFilterPill, flatTowerFilter === t && styles.flatFilterPillActive]}
                  onPress={() => setFlatTowerFilter(t)}
                >
                  <Text style={[styles.flatFilterText, flatTowerFilter === t && styles.flatFilterTextActive]}>
                    {t === 'All' ? 'All Towers' : t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.flatsGridContainer}>
            {filteredFlats.map((flat) => (
              <View key={flat.id} style={styles.flatCard}>
                <View style={styles.flatCardHeader}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusDotColor(flat.status) }]} />
                  <Text style={styles.flatUnitText}>{flat.flat}</Text>
                  <Text style={styles.flatTowerTag}>{flat.tower}</Text>
                </View>

                <View style={styles.flatCardBody}>
                  <Text style={[styles.flatStatusBadge, { color: getStatusDotColor(flat.status) }]}>
                    {flat.status}
                  </Text>

                  {flat.ownerName && (
                    <Text style={styles.flatResidentLine} numberOfLines={1}>
                      Owner: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{flat.ownerName}</Text>
                    </Text>
                  )}

                  {flat.tenantName && (
                    <Text style={styles.flatResidentLine} numberOfLines={1}>
                      Tenant: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{flat.tenantName}</Text>
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ================= FACILITY BOOKINGS TAB ================= */}
      {activeTab === 'Facility Bookings' && (
        <ScrollView style={styles.bookingScroll} contentContainerStyle={styles.bookingScrollContent}>
          {/* Facility KPIs */}
          <View style={styles.kpiContainer}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiVal}>{activeBookings.length}</Text>
              <Text style={styles.kpiLabel}>Total Bookings</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiVal, { color: '#16A34A' }]}>₹{totalRevenue.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Revenue (₹)</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiVal, { color: '#D97706' }]}>
                {activeBookings.filter((b) => b.accessPin).length}
              </Text>
              <Text style={styles.kpiLabel}>Active PINs</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiVal, { color: '#8B5CF6' }]} numberOfLines={1}>
                {peakFacility}
              </Text>
              <Text style={styles.kpiLabel}>Top Facility</Text>
            </View>
          </View>

          {/* Master Booking Calendar */}
          <View style={styles.calendarWrapper}>
            <BookingCalendar
              selectedDate={calendarDate}
              onSelectDate={setCalendarDate}
              markedDates={facilityCalendarMarks}
              title="Society Facility Calendar"
            />
          </View>

          {/* Facility Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterPillsScroll}
            contentContainerStyle={styles.filterPillsContent}
          >
            {FACILITY_OPTIONS.map((fac) => (
              <TouchableOpacity
                key={fac}
                style={[styles.filterPill, selectedFacilityFilter === fac && styles.filterPillActive]}
                onPress={() => setSelectedFacilityFilter(fac)}
              >
                <Text
                  style={[styles.filterPillText, selectedFacilityFilter === fac && styles.filterPillTextActive]}
                >
                  {fac}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search bar */}
          <View style={styles.adminSearchBox}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.adminSearchInput}
              placeholder="Search by resident, flat, PIN or booking ID..."
              placeholderTextColor="#9CA3AF"
              value={bookingSearch}
              onChangeText={setBookingSearch}
            />
            {bookingSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBookingSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Day Agenda */}
          <View style={styles.adminAgendaBox}>
            <View style={styles.adminAgendaHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminAgendaTitle}>Reservations on {calendarDateDisplay}</Text>
                <Text style={styles.adminAgendaSub}>
                  Showing {bookingsOnDate.length} {bookingsOnDate.length === 1 ? 'reservation' : 'reservations'}
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{bookingsOnDate.length}</Text>
              </View>
            </View>

            {bookingsOnDate.length === 0 ? (
              <View style={styles.emptyReservations}>
                <Ionicons name="calendar-clear-outline" size={38} color="#94A3B8" />
                <Text style={styles.emptyReservationsText}>No facility bookings on this date</Text>
                <Text style={styles.emptyReservationsSub}>
                  All slots are currently free for resident bookings.
                </Text>
              </View>
            ) : (
              bookingsOnDate.map((b) => (
                <View key={b.id} style={styles.bookingRowCard}>
                  <View style={styles.bookingRowHeader}>
                    <View style={styles.bookingFacilityInfo}>
                      <Ionicons
                        name={
                          b.facilityIcon === 'water-outline' ? 'water-outline' :
                          b.facilityIcon === 'fitness-outline' ? 'fitness-outline' :
                          b.facilityIcon === 'tennisball-outline' ? 'tennisball-outline' :
                          b.facilityIcon === 'football-outline' ? 'football-outline' : 'business-outline'
                        }
                        size={20}
                        color="#1D4ED8"
                        style={{ marginRight: 8 }}
                      />
                      <View>
                        <Text style={styles.bookingFacilityName}>{b.facilityName}</Text>
                        <Text style={styles.bookingSlotText}>🕒 {b.slot}</Text>
                      </View>
                    </View>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceTagText}>{b.price}</Text>
                    </View>
                  </View>

                  <View style={styles.bookingResidentDetails}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingResidentName}>👤 {b.residentName}</Text>
                      <Text style={styles.bookingFlatText}>Flat {b.flatNumber}</Text>
                    </View>
                    {b.accessPin && (
                      <View style={styles.pinBadge}>
                        <Text style={styles.pinLabel}>PIN</Text>
                        <Text style={styles.pinValue}>{b.accessPin}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.bookingActionRow}>
                    <TouchableOpacity
                      style={styles.cancelBookingBtn}
                      onPress={() => {
                        Alert.alert('Cancel Reservation', `Cancel reservation #${b.id}?`, [
                          { text: 'Keep', style: 'cancel' },
                          {
                            text: 'Yes, Cancel',
                            style: 'destructive',
                            onPress: () => cancelBooking(b.id),
                          },
                        ]);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                      <Text style={styles.cancelBookingText}>Cancel & Reopen Slot</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* ================= POLLS MANAGEMENT TAB ================= */}
      {activeTab === 'Polls' && (
        <ScrollView style={styles.bookingScroll} contentContainerStyle={styles.bookingScrollContent}>
          <View style={styles.tabActionHeader}>
            <View>
              <Text style={styles.tabActionTitle}>Democratic Society Polls</Text>
              <Text style={styles.tabActionSub}>Create and manage official RWA voting referendums</Text>
            </View>
            <TouchableOpacity
              style={styles.createPollBtn}
              onPress={() => setCreatePollModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.createPollBtnText}>+ New Poll</Text>
            </TouchableOpacity>
          </View>

          {polls.map((p) => {
            const isActive = p.status === 'ACTIVE';
            return (
              <View key={p.id} style={styles.adminPollCard}>
                <View style={styles.adminPollTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={styles.pollCategoryBadge}>
                      <Text style={styles.pollCategoryText}>{p.category}</Text>
                    </View>
                    <Text style={styles.adminPollTitle}>{p.title}</Text>
                    <Text style={styles.adminPollDesc}>{p.description}</Text>
                  </View>

                  <View style={[styles.pollStatusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9' }]}>
                    <Text style={[styles.pollStatusText, { color: isActive ? '#15803D' : '#64748B' }]}>
                      {p.status}
                    </Text>
                  </View>
                </View>

                {/* Options Breakdown */}
                <View style={styles.adminPollOptions}>
                  {p.options.map((opt) => {
                    const pct = p.totalVotes > 0 ? Math.round((opt.votes / p.totalVotes) * 100) : 0;
                    return (
                      <View key={opt.id} style={styles.adminOptionRow}>
                        <Text style={styles.adminOptionText}>{opt.emoji} {opt.text}</Text>
                        <Text style={styles.adminOptionVotes}>{opt.votes} votes ({pct}%)</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.adminPollBottom}>
                  <Text style={styles.pollVoterCountText}>Total votes: {p.totalVotes} • Target Quorum: {p.quorumTarget}</Text>
                  {isActive && (
                    <TouchableOpacity
                      style={styles.closePollBtn}
                      onPress={() => {
                        Alert.alert('Close Poll', `Close voting on "${p.title}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Close Poll', style: 'destructive', onPress: () => closePoll(p.id) },
                        ]);
                      }}
                    >
                      <Text style={styles.closePollBtnText}>Close Voting</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ================= MOVE-IN / MOVE-OUT NOCs TAB ================= */}
      {activeTab === 'Move NOCs' && (
        <ScrollView style={styles.bookingScroll} contentContainerStyle={styles.bookingScrollContent}>
          <View style={styles.tabActionHeader}>
            <View>
              <Text style={styles.tabActionTitle}>Shifting &amp; Move NOC Approvals</Text>
              <Text style={styles.tabActionSub}>Review dues clearance and issue digital gate passes for packers &amp; movers</Text>
            </View>
          </View>

          {nocRequests.map((n) => {
            const isPending = n.status === 'PENDING_APPROVAL';
            const isApproved = n.status === 'APPROVED';

            return (
              <View key={n.id} style={styles.adminNocCard}>
                <View style={styles.adminNocTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nocTypeRow}>
                      <View style={[styles.nocTypeBadge, { backgroundColor: n.type === 'MOVE_IN' ? '#DCFCE7' : '#FEF3C7' }]}>
                        <Text style={[styles.nocTypeText, { color: n.type === 'MOVE_IN' ? '#15803D' : '#B45309' }]}>
                          {n.type === 'MOVE_IN' ? '📦 MOVE-IN' : '🚚 MOVE-OUT'}
                        </Text>
                      </View>
                      <Text style={styles.nocUnitText}>Unit {n.flatNumber} ({n.tower})</Text>
                    </View>
                    <Text style={styles.nocApplicantName}>{n.applicantName}</Text>
                    <Text style={styles.nocMetaText}>Phone: {n.applicantPhone} • Shifting Date: {n.moveDate}</Text>
                    <Text style={styles.nocMetaText}>Slot: {n.timeSlot} • Vehicle: {n.vehicleDetails}</Text>
                    {n.notes && <Text style={styles.nocNotesText}>Note: {n.notes}</Text>}
                  </View>

                  <View style={[styles.nocStatusBadge, { backgroundColor: isApproved ? '#DCFCE7' : isPending ? '#FEF3C7' : '#FEE2E2' }]}>
                    <Text style={[styles.nocStatusText, { color: isApproved ? '#15803D' : isPending ? '#B45309' : '#BE123C' }]}>
                      {n.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Checklist Badges */}
                <View style={styles.nocChecksRow}>
                  <View style={styles.nocCheckPill}>
                    <Text style={styles.nocCheckText}>✓ Dues Cleared</Text>
                  </View>
                  <View style={styles.nocCheckPill}>
                    <Text style={styles.nocCheckText}>✓ Lift Reserved</Text>
                  </View>
                  <View style={styles.nocCheckPill}>
                    <Text style={styles.nocCheckText}>✓ Deposit Paid</Text>
                  </View>
                </View>

                <View style={styles.adminNocBottom}>
                  {isApproved ? (
                    <View style={styles.gatePassBox}>
                      <Ionicons name="qr-code-outline" size={16} color="#15803D" />
                      <Text style={styles.gatePassText}>Gate Clearance: {n.gatePassCode} (Approved by {n.approvedBy})</Text>
                    </View>
                  ) : isPending ? (
                    <View style={styles.nocActionBtnRow}>
                      <TouchableOpacity
                        style={styles.rejectNocBtn}
                        onPress={() => rejectNoc(n.id)}
                      >
                        <Text style={styles.rejectNocBtnText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveNocBtn}
                        onPress={() => approveNoc(n.id, user?.name || 'President Vikram Malhotra')}
                      >
                        <Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.approveNocBtnText}>Approve &amp; Issue Gate Pass</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.rejectedNotesText}>{n.notes}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Action Button (+ Add Member) */}
      {(activeTab === 'Residents' || activeTab === 'Staff' || activeTab === 'Flats') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
          accessibilityLabel="Add New Society Member"
        >
          <Ionicons name="person-add" size={22} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.fabText}>Add Member</Text>
        </TouchableOpacity>
      )}

      {/* Toast Notification */}
      {successToast && (
        <View style={styles.toastCard}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{successToast}</Text>
        </View>
      )}

      {/* ================= ADD MEMBER MODAL ================= */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Register Society Member</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Role Category Selector Chips */}
              <Text style={styles.inputSectionLabel}>Select Member Role</Text>
              <View style={styles.roleChipRow}>
                {[
                  { key: 'owner', label: '🏡 Flat Owner' },
                  { key: 'tenant', label: '🔑 Tenant' },
                  { key: 'guard', label: '🛡️ Guard' },
                  { key: 'facility_manager', label: '🏢 Manager' },
                  { key: 'technician', label: '🔧 Technician' },
                  { key: 'vendor', label: '🛒 Vendor' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.roleChip,
                      addRoleCategory === r.key && styles.roleChipActive,
                    ]}
                    onPress={() => setAddRoleCategory(r.key as any)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        addRoleCategory === r.key && styles.roleChipTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Basic Fields */}
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#94A3B8"
                value={addName}
                onChangeText={setAddName}
              />

              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
                value={addPhone}
                onChangeText={setAddPhone}
              />

              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ramesh@example.com"
                keyboardType="email-address"
                placeholderTextColor="#94A3B8"
                value={addEmail}
                onChangeText={setAddEmail}
              />

              {/* Role-Specific Fields */}
              {(addRoleCategory === 'owner' || addRoleCategory === 'tenant') && (
                <>
                  <Text style={styles.fieldLabel}>Flat Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. B-204"
                    placeholderTextColor="#94A3B8"
                    value={addFlat}
                    onChangeText={setAddFlat}
                  />

                  <Text style={styles.fieldLabel}>Tower</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Tower B"
                    placeholderTextColor="#94A3B8"
                    value={addTower}
                    onChangeText={setAddTower}
                  />

                  {addRoleCategory === 'owner' && (
                    <>
                      <Text style={styles.fieldLabel}>Share Certificate #</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. SC-88210"
                        placeholderTextColor="#94A3B8"
                        value={addShareCert}
                        onChangeText={setAddShareCert}
                      />
                    </>
                  )}

                  {addRoleCategory === 'tenant' && (
                    <>
                      <Text style={styles.fieldLabel}>Landlord / Owner Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Aditya Sharma"
                        placeholderTextColor="#94A3B8"
                        value={addOwnerName}
                        onChangeText={setAddOwnerName}
                      />
                    </>
                  )}

                  <Text style={styles.fieldLabel}>Vehicle Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. HR-26-DK-9021"
                    placeholderTextColor="#94A3B8"
                    value={addVehicle}
                    onChangeText={setAddVehicle}
                  />
                </>
              )}

              {addRoleCategory === 'guard' && (
                <>
                  <Text style={styles.fieldLabel}>Gate Post / Station *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Main Gate 1"
                    placeholderTextColor="#94A3B8"
                    value={addFlat}
                    onChangeText={setAddFlat}
                  />

                  <Text style={styles.fieldLabel}>Badge ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. SEC-04"
                    placeholderTextColor="#94A3B8"
                    value={addBadge}
                    onChangeText={setAddBadge}
                  />

                  <Text style={styles.fieldLabel}>Shift Timing</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Morning Shift (8AM - 8PM)"
                    placeholderTextColor="#94A3B8"
                    value={addShift}
                    onChangeText={setAddShift}
                  />

                  <Text style={styles.fieldLabel}>Security Agency Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. SIS Security Solutions"
                    placeholderTextColor="#94A3B8"
                    value={addAgency}
                    onChangeText={setAddAgency}
                  />
                </>
              )}

              {addRoleCategory === 'technician' && (
                <>
                  <Text style={styles.fieldLabel}>Trade Specialization</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Electrician / Master Plumber"
                    placeholderTextColor="#94A3B8"
                    value={addTrade}
                    onChangeText={setAddTrade}
                  />

                  <Text style={styles.fieldLabel}>Badge ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. TECH-04"
                    placeholderTextColor="#94A3B8"
                    value={addBadge}
                    onChangeText={setAddBadge}
                  />
                </>
              )}

              {addRoleCategory === 'vendor' && (
                <>
                  <Text style={styles.fieldLabel}>Shop or Stall Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Society Mart / Milk Booth"
                    placeholderTextColor="#94A3B8"
                    value={addShopName}
                    onChangeText={setAddShopName}
                  />

                  <Text style={styles.fieldLabel}>Stall / Unit Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Commercial Stall #03"
                    placeholderTextColor="#94A3B8"
                    value={addFlat}
                    onChangeText={setAddFlat}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveNewMember}
              >
                <Text style={styles.saveBtnText}>Save Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Message Recorder Modal (when President leaves video note) */}
      <VideoMessageRecorderModal
        visible={!!recordingContact}
        onClose={() => setRecordingContact(null)}
        onSendVideo={handleSendVideoNote}
        recipientName={recordingContact?.name}
        recipientRole={recordingContact?.roleCategory}
        recipientFlat={recordingContact?.flat}
      />

      {/* Create Society Democratic Poll Modal */}
      <CreatePollModal
        visible={createPollModalVisible}
        onClose={() => setCreatePollModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  societyName: { fontSize: 19, fontWeight: '800', color: '#0F172A' },
  societyAddress: { fontSize: 12, color: '#64748B', marginTop: 2 },
  estBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  estBadgeText: { fontSize: 11, fontWeight: '700', color: '#4338CA' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 14,
    paddingTop: 12,
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '800', color: '#1B4FD8' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },

  // Main Tabs
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 10,
  },
  mainTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mainTabBtnActive: { borderBottomColor: '#1B4FD8' },
  mainTabBtnText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  mainTabBtnTextActive: { color: '#1B4FD8', fontWeight: '800' },

  // Search Bar
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },

  // Sub Filter Chips
  subFilterScroll: { maxHeight: 44, marginVertical: 6 },
  subFilterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  subFilterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subFilterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  subFilterChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  subFilterChipTextActive: { color: '#FFFFFF' },

  // List Container & Cards
  listContainer: { paddingHorizontal: 16, paddingBottom: 90, paddingTop: 4 },
  listItemCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemMainInfo: { flex: 1 },
  itemNameText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  flatPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  flatPillText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  badgeIdPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeIdPillText: { fontSize: 10, fontWeight: '800', color: '#92400E' },
  itemRoleSub: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },
  itemPhoneText: { fontSize: 11, color: '#475569', marginTop: 2 },
  trashBtn: { padding: 6 },

  // Meta Chip Bar
  itemMetaBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaChipText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  activeStatusText: { fontSize: 10, fontWeight: '800' },

  // Communication Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  commActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  audioCommBtn: { backgroundColor: '#16A34A' },
  videoCommBtn: { backgroundColor: '#4338CA' },
  noteCommBtn: { backgroundColor: '#DC2626' },
  commActionText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  // Flats Grid View
  flatFilterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  flatFilterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  flatFilterPillActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  flatFilterText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  flatFilterTextActive: { color: '#FFFFFF' },
  flatsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingBottom: 90,
  },
  flatCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  flatCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  flatUnitText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  flatTowerTag: { fontSize: 10, color: '#64748B' },
  flatCardBody: { marginTop: 6 },
  flatStatusBadge: { fontSize: 10, fontWeight: '800', marginBottom: 3 },
  flatResidentLine: { fontSize: 11, color: '#64748B' },

  // Facility Bookings Tab Styles
  bookingScroll: { flex: 1 },
  bookingScrollContent: { paddingBottom: 40 },
  kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 10 },
  kpiCard: { width: '47%', margin: '1.5%', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  kpiVal: { fontSize: 18, fontWeight: '800', color: '#1B4FD8' },
  kpiLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  calendarWrapper: { marginHorizontal: 16, marginTop: 10 },
  filterPillsScroll: { maxHeight: 44, marginVertical: 8 },
  filterPillsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  filterPillActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filterPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  filterPillTextActive: { color: '#FFFFFF' },
  adminSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  adminSearchInput: { flex: 1, fontSize: 12, color: '#0F172A' },
  adminAgendaBox: { marginHorizontal: 16, marginTop: 12 },
  adminAgendaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  adminAgendaTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  adminAgendaSub: { fontSize: 11, color: '#64748B' },
  countBadge: { backgroundColor: '#1E40AF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  emptyReservations: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyReservationsText: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  emptyReservationsSub: { fontSize: 11, color: '#64748B', marginTop: 2, textAlign: 'center' },
  bookingRowCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  bookingRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingFacilityInfo: { flexDirection: 'row', alignItems: 'center' },
  bookingFacilityName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  bookingSlotText: { fontSize: 11, color: '#64748B' },
  priceTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priceTagText: { fontSize: 11, fontWeight: '800', color: '#16A34A' },
  bookingResidentDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 6 },
  bookingResidentName: { fontSize: 12, fontWeight: '700', color: '#334155' },
  bookingFlatText: { fontSize: 11, color: '#64748B' },
  pinBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignItems: 'center' },
  pinLabel: { fontSize: 9, color: '#92400E', fontWeight: '800' },
  pinValue: { fontSize: 12, fontWeight: '800', color: '#B45309' },
  bookingActionRow: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 6 },
  cancelBookingBtn: { flexDirection: 'row', alignItems: 'center' },
  cancelBookingText: { fontSize: 11, color: '#EF4444', fontWeight: '700' },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B4FD8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#1B4FD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  // Toast Card
  toastCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 50,
  },
  toastText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#F8FAFC' },

  // Add Member Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  inputSectionLabel: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 6 },
  roleChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  roleChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  roleChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  roleChipTextActive: { color: '#FFFFFF' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  cancelBtnText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  saveBtn: {
    backgroundColor: '#1B4FD8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  // Empty State
  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },

  // Scrollable Main Tabs
  tabsScrollWrapper: {
    marginVertical: 6,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  // Tab Action Header
  tabActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabActionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabActionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  createPollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#881337',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createPollBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Admin Poll Card
  adminPollCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminPollTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pollCategoryBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  pollCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#881337',
  },
  adminPollTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  adminPollDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  pollStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pollStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  adminPollOptions: {
    gap: 6,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  adminOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adminOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  adminOptionVotes: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  adminPollBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pollVoterCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  closePollBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  closePollBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
  },

  // Admin Move NOC Card
  adminNocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminNocTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nocTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nocTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nocTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  nocUnitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  nocApplicantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  nocMetaText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  nocNotesText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  nocStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nocStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  nocChecksRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  nocCheckPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nocCheckText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  adminNocBottom: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  gatePassBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
  },
  gatePassText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  nocActionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  rejectNocBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  rejectNocBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE123C',
  },
  approveNocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  approveNocBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rejectedNotesText: {
    fontSize: 12,
    color: '#BE123C',
    fontStyle: 'italic',
  },
});
