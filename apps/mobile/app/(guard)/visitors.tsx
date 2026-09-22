import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import {
  useBookingStore,
  normalizeDateToKey,
  formatDateToDisplay,
  FacilityBooking,
} from '../../stores/bookingStore';
import { BookingCalendar, CalendarMarkedDay } from '../../components/calendar/BookingCalendar';
import { ActiveSosBanner } from '../../components/sos/ActiveSosBanner';
import { GateParcelModal } from '../../components/parcel/GateParcelModal';
import { VehicleLookupModal } from '../../components/vehicle/VehicleLookupModal';
import { useParcelStore, GateParcel, COURIER_ICONS } from '../../stores/parcelStore';
import { useDomesticStaffStore, DomesticHelper, HELPER_CATEGORY_ICONS } from '../../stores/domesticStaffStore';

interface PreApprovedPass {
  id: string;
  visitorName: string;
  purpose: string;
  flat: string;
  dateKey: string;
  time: string;
  pin: string;
  vehicle?: string;
}

const initialPreApprovedPasses: PreApprovedPass[] = [
  { id: 'sp1', visitorName: 'Dr. Alok Verma', purpose: 'Doctor / Medical', flat: 'B-204', dateKey: '2026-09-16', time: '04:30 PM', pin: '9182', vehicle: 'DL 01 AB 1234' },
  { id: 'sp2', visitorName: 'Urban Company AC Service', purpose: 'Maintenance', flat: 'A-102', dateKey: '2026-09-17', time: '11:00 AM', pin: '3819', vehicle: 'HR 26 DQ 5432' },
  { id: 'sp3', visitorName: 'Kavita Chawla', purpose: 'Guest (Family)', flat: 'C-305', dateKey: '2026-09-20', time: '06:00 PM', pin: '7412', vehicle: 'DL 08 CC 9988' },
  { id: 'sp4', visitorName: 'BlueDart Delivery', purpose: 'Courier', flat: 'B-205', dateKey: '2026-09-24', time: '02:00 PM', pin: '6521', vehicle: 'KA 03 EX 7711' },
  { id: 'sp5', visitorName: 'Party Decorators Team', purpose: 'Clubhouse Event', flat: 'B-204', dateKey: '2026-10-05', time: '08:00 AM', pin: '8832', vehicle: 'DL 04 KK 1122' },
  { id: 'sp6', visitorName: 'Suresh Electrician', purpose: 'Electrical Maintenance', flat: 'D-404', dateKey: '2026-09-18', time: '10:00 AM', pin: '4512', vehicle: 'DL 05 AB 4455' },
  { id: 'sp7', visitorName: 'Neha Verma', purpose: 'Guest (Birthday Party)', flat: 'A-101', dateKey: '2026-09-28', time: '05:00 PM', pin: '8392', vehicle: 'HR 26 MN 1100' },
];

export default function GuardVisitors() {
  const [viewMode, setViewMode] = useState<'LIVE' | 'SCHEDULED' | 'PARCELS' | 'STAFF'>('LIVE');
  const [showLog, setShowLog] = useState(false);

  // Parcel & Staff Stores
  const { parcels } = useParcelStore();
  const { helpers, checkInHelper, checkOutHelper } = useDomesticStaffStore();

  // Modals
  const [parcelModalVisible, setParcelModalVisible] = useState(false);
  const [selectedParcelForHandover, setSelectedParcelForHandover] = useState<GateParcel | null>(null);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [parcelFilter, setParcelFilter] = useState<'ALL' | 'HELD' | 'COLLECTED'>('HELD');

  // Live visitors list
  const [activeVisitors, setActiveVisitors] = useState([
    { id: '1', name: 'Rahul Kumar', purpose: 'Zomato', flat: 'A-101', timeIn: '10:15 AM' },
    { id: '2', name: 'Sita Devi', purpose: 'Maid', flat: 'B-205', timeIn: '08:30 AM' },
    { id: '3', name: 'Amit Singh', purpose: 'Guest', flat: 'C-302', timeIn: '11:00 AM' },
    { id: '4', name: 'Raju', purpose: 'Plumber', flat: 'D-404', timeIn: '11:45 AM' },
  ]);

  const [visitorLog, setVisitorLog] = useState([
    { id: 'l1', name: 'Vijay', purpose: 'Amazon', flat: 'A-102', timeIn: '09:00 AM', timeOut: '09:10 AM' },
    { id: 'l2', name: 'Priya', purpose: 'Guest', flat: 'B-201', timeIn: '09:15 AM', timeOut: '10:30 AM' },
    { id: 'l3', name: 'Sita Devi', purpose: 'Maid', flat: 'B-205', timeIn: '08:30 AM', timeOut: null },
    { id: 'l4', name: 'Uber Driver', purpose: 'Cab', flat: 'C-305', timeIn: '10:00 AM', timeOut: '10:05 AM' },
    { id: 'l5', name: 'Swiggy', purpose: 'Delivery', flat: 'D-401', timeIn: '10:45 AM', timeOut: '10:50 AM' },
  ]);

  // Scheduled Calendar State
  const { bookings } = useBookingStore();
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [scheduledSearch, setScheduledSearch] = useState('');
  const [scheduledPasses, setScheduledPasses] = useState<PreApprovedPass[]>(initialPreApprovedPasses);

  const calendarDateKey = useMemo(() => normalizeDateToKey(calendarDate), [calendarDate]);
  const calendarDateDisplay = useMemo(() => formatDateToDisplay(calendarDate), [calendarDate]);

  // Calendar Marked Dates for Guard View
  const guardCalendarMarks = useMemo(() => {
    const marks: Record<string, CalendarMarkedDay> = {};

    // 1. Mark facility reservations (Green dots)
    bookings.forEach((b) => {
      if (b.status === 'CANCELLED') return;
      const k = normalizeDateToKey(b.date);
      if (!k) return;

      if (!marks[k]) {
        marks[k] = { count: 0, dots: [] };
      }
      marks[k].count = (marks[k].count || 0) + 1;

      if (!marks[k].dots?.some((d) => d.color === '#10B981')) {
        marks[k].dots?.push({ color: '#10B981', key: `fac-${k}`, label: 'Facility' });
      }
    });

    // 2. Mark pre-approved passes (Amber dots)
    scheduledPasses.forEach((p) => {
      const k = p.dateKey;
      if (!marks[k]) {
        marks[k] = { count: 0, dots: [] };
      }
      marks[k].count = (marks[k].count || 0) + 1;

      if (!marks[k].dots?.some((d) => d.color === '#F59E0B')) {
        marks[k].dots?.push({ color: '#F59E0B', key: `pass-${k}`, label: 'Pass' });
      }
    });

    return marks;
  }, [bookings, scheduledPasses]);

  // Facility bookings on selected date
  const bookingsOnDate = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status === 'CANCELLED') return false;
      const dateMatches = normalizeDateToKey(b.date) === calendarDateKey;
      if (!dateMatches) return false;

      if (scheduledSearch.trim()) {
        const q = scheduledSearch.trim().toLowerCase();
        return (
          b.residentName.toLowerCase().includes(q) ||
          b.flatNumber.toLowerCase().includes(q) ||
          b.facilityName.toLowerCase().includes(q) ||
          b.accessPin.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, calendarDateKey, scheduledSearch]);

  // Pre-approved passes on selected date
  const passesOnDate = useMemo(() => {
    return scheduledPasses.filter((p) => {
      const dateMatches = p.dateKey === calendarDateKey;
      if (!dateMatches) return false;

      if (scheduledSearch.trim()) {
        const q = scheduledSearch.trim().toLowerCase();
        return (
          p.visitorName.toLowerCase().includes(q) ||
          p.flat.toLowerCase().includes(q) ||
          p.purpose.toLowerCase().includes(q) ||
          p.pin.toLowerCase().includes(q) ||
          (p.vehicle && p.vehicle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [scheduledPasses, calendarDateKey, scheduledSearch]);

  const totalScheduledToday = bookingsOnDate.length + passesOnDate.length;

  const handleMarkExit = (id: string, name: string) => {
    const visitor = activeVisitors.find((v) => v.id === id);
    if (!visitor) return;

    Alert.alert('Confirm Checkout', `Mark ${name} as exited through the main gate?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm Exit',
        onPress: () => {
          const nowTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setActiveVisitors((prev) => prev.filter((v) => v.id !== id));
          setVisitorLog((prev) => [
            {
              id: `exit-${Date.now()}`,
              name: visitor.name,
              purpose: visitor.purpose,
              flat: visitor.flat,
              timeIn: visitor.timeIn,
              timeOut: nowTime,
            },
            ...prev,
          ]);
          Alert.alert('Visitor Checked Out', `${name} has been logged as exited.`);
        },
      },
    ]);
  };

  const handleAdmitScheduledPass = (pass: PreApprovedPass) => {
    Alert.alert(
      'Verify Gate Entry',
      `Allow entry for ${pass.visitorName} (${pass.purpose}) visiting Flat ${pass.flat}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Allow Entry',
          onPress: () => {
            const nowTime = new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });
            setActiveVisitors((prev) => [
              {
                id: `v-${Date.now()}`,
                name: pass.visitorName,
                purpose: pass.purpose,
                flat: pass.flat,
                timeIn: nowTime,
              },
              ...prev,
            ]);
            Alert.alert(
              'Entry Granted ✓',
              `${pass.visitorName} admitted for Flat ${pass.flat}. Gate pass PIN ${pass.pin} verified.`
            );
          },
        },
      ]
    );
  };

  const handleVerifyFacilityEntry = (booking: FacilityBooking) => {
    Alert.alert(
      'Verify Facility Entry',
      `Grant gate access to ${booking.residentName} (${booking.flatNumber}) for ${booking.facilityName} reserved for ${booking.slot}?\nAccess PIN: ${booking.accessPin}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Grant Access',
          onPress: () => {
            Alert.alert(
              'Access Granted ✓',
              `Access permitted for ${booking.facilityName}. Resident ${booking.residentName} (${booking.flatNumber}) logged.`
            );
          },
        },
      ]
    );
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'Maid':
        return '#8B5CF6';
      case 'Guest':
      case 'Guest (Family)':
        return '#3B82F6';
      case 'Cab':
        return '#F59E0B';
      case 'Doctor / Medical':
        return '#EF4444';
      default:
        return '#10B981'; // Deliveries & Maintenance
    }
  };

  const renderActiveCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.nameText}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.flatText}>{item.flat}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.purposeText}>{item.purpose}</Text>
          </View>
          <Text style={styles.timeText}>In: {item.timeIn}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.exitBtn} onPress={() => handleMarkExit(item.id, item.name)}>
        <Text style={styles.exitBtnText}>Mark Exit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Gate Verification & Visitors" showLogout={true} />

      {/* Top Emergency Siren Banner */}
      <ActiveSosBanner />

      {/* Quick Desk Action Shortcuts */}
      <View style={styles.deskActionBar}>
        <TouchableOpacity
          style={styles.deskActionBtn}
          onPress={() => {
            setSelectedParcelForHandover(null);
            setParcelModalVisible(true);
          }}
        >
          <Ionicons name="cube-outline" size={16} color="#4338CA" />
          <Text style={styles.deskActionBtnText}>+ Log Delivery Parcel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deskActionBtn}
          onPress={() => setVehicleModalVisible(true)}
        >
          <Ionicons name="car-outline" size={16} color="#0D9488" />
          <Text style={styles.deskActionBtnText}>🚗 Plate Search</Text>
        </TouchableOpacity>
      </View>

      {/* Top Segmented Mode Selector */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'LIVE' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('LIVE')}
        >
          <Text style={[styles.viewModeBtnText, viewMode === 'LIVE' && styles.viewModeBtnTextActive]}>
            Live ({activeVisitors.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'SCHEDULED' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('SCHEDULED')}
        >
          <Text style={[styles.viewModeBtnText, viewMode === 'SCHEDULED' && styles.viewModeBtnTextActive]}>
            Passes 📅
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'PARCELS' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('PARCELS')}
        >
          <Text style={[styles.viewModeBtnText, viewMode === 'PARCELS' && styles.viewModeBtnTextActive]}>
            Parcels ({parcels.filter((p) => p.status === 'HELD_AT_GATE').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'STAFF' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('STAFF')}
        >
          <Text style={[styles.viewModeBtnText, viewMode === 'STAFF' && styles.viewModeBtnTextActive]}>
            Staff ({helpers.filter((h) => h.presence === 'INSIDE_SOCIETY').length})
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'LIVE' ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {visitorLog.length + activeVisitors.length}
              </Text>
              <Text style={styles.statLabel}>Total Today</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#16A34A' }]}>{activeVisitors.length}</Text>
              <Text style={styles.statLabel}>Still Inside</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#D97706' }]}>{totalScheduledToday}</Text>
              <Text style={styles.statLabel}>Expected Today</Text>
            </View>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Visitors</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeVisitors.length}</Text>
              </View>
            </View>

            {activeVisitors.map((item) => (
              <View key={item.id}>{renderActiveCard({ item })}</View>
            ))}

            <TouchableOpacity style={styles.toggleLogBtn} onPress={() => setShowLog(!showLog)}>
              <Text style={styles.toggleLogText}>{showLog ? 'Hide' : 'Show'} Today's Full Log</Text>
              <Ionicons name={showLog ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
            </TouchableOpacity>

            {showLog && (
              <View style={styles.logSection}>
                {visitorLog.map((item) => (
                  <View key={item.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logName}>{item.name}</Text>
                      <View
                        style={[
                          styles.purposeBadge,
                          { backgroundColor: getPurposeColor(item.purpose) + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.purposeBadgeText,
                            { color: getPurposeColor(item.purpose) },
                          ]}
                        >
                          {item.purpose}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.logFlat}>Flat: {item.flat}</Text>
                    <View style={styles.logTimes}>
                      <Text style={styles.logTimeText}>In: {item.timeIn}</Text>
                      {item.timeOut ? (
                        <Text style={styles.logTimeText}>Out: {item.timeOut}</Text>
                      ) : (
                        <Text style={[styles.logTimeText, { color: '#16A34A', fontWeight: 'bold' }]}>
                          Still Inside
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <ScrollView style={styles.scheduledScroll} contentContainerStyle={styles.scheduledScrollContent}>
          {/* Scheduled Calendar */}
          <BookingCalendar
            selectedDate={calendarDate}
            onSelectDate={setCalendarDate}
            markedDates={guardCalendarMarks}
            title="Gate Scheduled Arrivals"
          />

          {/* Color Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Facility Reservation</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Pre-Approved Pass</Text>
            </View>
          </View>

          {/* Quick Filter Search */}
          <View style={styles.guardSearchBox}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.guardSearchInput}
              placeholder="Search by visitor, resident, flat, vehicle or PIN..."
              placeholderTextColor="#9CA3AF"
              value={scheduledSearch}
              onChangeText={setScheduledSearch}
            />
            {scheduledSearch.length > 0 && (
              <TouchableOpacity onPress={() => setScheduledSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Agenda */}
          <View style={styles.agendaSection}>
            <View style={styles.agendaHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.agendaTitle}>Expected on {calendarDateDisplay}</Text>
                <Text style={styles.agendaSub}>
                  {bookingsOnDate.length} Facility Reservations • {passesOnDate.length} Visitor Passes
                </Text>
              </View>
              <View style={styles.agendaCountBadge}>
                <Text style={styles.agendaCountBadgeText}>{totalScheduledToday}</Text>
              </View>
            </View>

            {totalScheduledToday === 0 ? (
              <View style={styles.emptyAgendaBox}>
                <Ionicons name="calendar-clear-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyAgendaTitle}>No arrivals scheduled for this date</Text>
                <Text style={styles.emptyAgendaSub}>
                  Any unannounced visitors will be registered manually at the guard desk.
                </Text>
              </View>
            ) : (
              <>
                {/* 1. Facility Reservations */}
                {bookingsOnDate.length > 0 && (
                  <View style={styles.groupSection}>
                    <Text style={styles.groupHeading}>
                      🏛️ FACILITY RESERVATIONS ({bookingsOnDate.length})
                    </Text>
                    {bookingsOnDate.map((b) => (
                      <View key={b.id} style={styles.scheduledCard}>
                        <View style={styles.cardTopRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.schedCardTitle}>{b.facilityName}</Text>
                            <Text style={styles.schedCardSub}>
                              👤 {b.residentName} • Flat {b.flatNumber}
                            </Text>
                          </View>
                          <View style={styles.slotBadge}>
                            <Text style={styles.slotBadgeText}>{b.slot}</Text>
                          </View>
                        </View>

                        <View style={styles.cardBottomRow}>
                          <View style={styles.pinTag}>
                            <Ionicons name="key" size={12} color="#1D4ED8" />
                            <Text style={styles.pinTagText}>PIN: {b.accessPin}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.verifyBtn}
                            onPress={() => handleVerifyFacilityEntry(b)}
                          >
                            <Ionicons name="checkmark-circle-outline" size={15} color="#1D4ED8" />
                            <Text style={styles.verifyBtnText}>Verify Gate Entry</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 2. Pre-Approved Visitor Passes */}
                {passesOnDate.length > 0 && (
                  <View style={styles.groupSection}>
                    <Text style={[styles.groupHeading, { color: '#D97706' }]}>
                      🎫 PRE-APPROVED VISITOR PASSES ({passesOnDate.length})
                    </Text>
                    {passesOnDate.map((p) => (
                      <View key={p.id} style={styles.scheduledCard}>
                        <View style={styles.cardTopRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.schedCardTitle}>{p.visitorName}</Text>
                            <Text style={styles.schedCardSub}>
                              Visiting Flat {p.flat} • {p.purpose}
                            </Text>
                            {p.vehicle && (
                              <Text style={styles.vehicleText}>🚗 Vehicle: {p.vehicle}</Text>
                            )}
                          </View>
                          <View style={[styles.slotBadge, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[styles.slotBadgeText, { color: '#B45309' }]}>{p.time}</Text>
                          </View>
                        </View>

                        <View style={styles.cardBottomRow}>
                          <View style={[styles.pinTag, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                            <Ionicons name="key" size={12} color="#B45309" />
                            <Text style={[styles.pinTagText, { color: '#B45309' }]}>PIN: {p.pin}</Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.verifyBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                            onPress={() => handleAdmitScheduledPass(p)}
                          >
                            <Ionicons name="checkmark-done" size={15} color="#16A34A" />
                            <Text style={[styles.verifyBtnText, { color: '#16A34A' }]}>Admit Visitor</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}

      {/* 3. PARCEL DESK VIEW */}
      {viewMode === 'PARCELS' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.filterChipsRow}>
              {(['HELD', 'COLLECTED', 'ALL'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, parcelFilter === f && styles.filterChipActive]}
                  onPress={() => setParcelFilter(f)}
                >
                  <Text style={[styles.filterChipText, parcelFilter === f && styles.filterChipTextActive]}>
                    {f === 'HELD'
                      ? `Held at Gate (${parcels.filter((p) => p.status === 'HELD_AT_GATE').length})`
                      : f === 'COLLECTED'
                      ? 'Handed Over'
                      : 'All Deliveries'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {parcels
            .filter((p) => {
              if (parcelFilter === 'HELD') return p.status === 'HELD_AT_GATE';
              if (parcelFilter === 'COLLECTED') return p.status === 'COLLECTED';
              return true;
            })
            .map((p) => {
              const info = COURIER_ICONS[p.courier] || { emoji: '📦', color: '#475569', bg: '#F1F5F9' };
              const isHeld = p.status === 'HELD_AT_GATE';

              return (
                <View key={p.id} style={styles.parcelCard}>
                  <View style={styles.parcelCardTop}>
                    <View style={styles.parcelCardLeft}>
                      <View style={[styles.courierEmojiBox, { backgroundColor: info.bg }]}>
                        <Text style={{ fontSize: 22 }}>{info.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.parcelCourier}>{p.courier} • {p.itemCount} pkgs</Text>
                        <Text style={styles.parcelRecipient}>
                          Unit {p.flatNumber} ({p.tower}) • {p.recipientName}
                        </Text>
                        {p.notes && <Text style={styles.parcelNotes}>{p.notes}</Text>}
                      </View>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: isHeld ? '#FEF3C7' : '#DCFCE7' }]}>
                      <Text style={[styles.statusPillText, { color: isHeld ? '#B45309' : '#15803D' }]}>
                        {isHeld ? 'HELD' : 'COLLECTED'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.parcelCardBottom}>
                    <Text style={styles.parcelIntakeTime}>Logged by {p.intakeGuard}</Text>
                    {isHeld ? (
                      <TouchableOpacity
                        style={styles.handoverBtn}
                        onPress={() => {
                          setSelectedParcelForHandover(p);
                          setParcelModalVisible(true);
                        }}
                      >
                        <Ionicons name="key" size={14} color="#FFFFFF" />
                        <Text style={styles.handoverBtnText}>Verify PIN &amp; Hand Over</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.collectedByText}>Handed to: {p.collectedBy || 'Resident'}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* 4. DAILY DOMESTIC STAFF ATTENDANCE VIEW */}
      {viewMode === 'STAFF' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.guardSearchBox}>
            <Ionicons name="search" size={16} color="#64748B" />
            <TextInput
              style={styles.guardSearchInput}
              value={staffSearch}
              onChangeText={setStaffSearch}
              placeholder="Search maid, cook, driver, or flat..."
              placeholderTextColor="#94A3B8"
            />
          </View>

          {helpers
            .filter((h) =>
              staffSearch.trim()
                ? h.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
                  h.category.toLowerCase().includes(staffSearch.toLowerCase()) ||
                  h.assignedFlats.some((f) => f.toLowerCase().includes(staffSearch.toLowerCase()))
                : true
            )
            .map((h) => {
              const icon = HELPER_CATEGORY_ICONS[h.category] || { emoji: '👤', color: '#475569', bg: '#F1F5F9' };
              const isInside = h.presence === 'INSIDE_SOCIETY';

              return (
                <View key={h.id} style={styles.staffCard}>
                  <View style={styles.staffCardTop}>
                    <View style={styles.staffCardLeft}>
                      <View style={[styles.staffEmojiBox, { backgroundColor: icon.bg }]}>
                        <Text style={{ fontSize: 22 }}>{icon.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.staffName}>{h.name}</Text>
                        <Text style={styles.staffMeta}>{h.category} • Badge: {h.badgeNumber}</Text>
                        <Text style={styles.staffFlats}>Assigned Flats: {h.assignedFlats.join(', ')}</Text>
                      </View>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: isInside ? '#DCFCE7' : '#F1F5F9' }]}>
                      <Text style={[styles.statusPillText, { color: isInside ? '#15803D' : '#64748B' }]}>
                        {isInside ? 'IN SOCIETY' : 'OUTSIDE'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.staffCardBottom}>
                    <Text style={styles.staffTimeText}>
                      {isInside ? `Checked in: ${h.currentGate || 'Gate 1'}` : 'Not inside society'}
                    </Text>

                    {isInside ? (
                      <TouchableOpacity
                        style={styles.checkOutBtn}
                        onPress={() => checkOutHelper(h.id)}
                      >
                        <Ionicons name="log-out-outline" size={14} color="#BE123C" />
                        <Text style={styles.checkOutBtnText}>Check Out</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.checkInBtn}
                        onPress={() => checkInHelper(h.id, 'Gate 1 (Main Entrance)')}
                      >
                        <Ionicons name="log-in-outline" size={14} color="#15803D" />
                        <Text style={styles.checkInBtnText}>Check In Gate 1</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Action Modals */}
      <GateParcelModal
        visible={parcelModalVisible}
        onClose={() => {
          setParcelModalVisible(false);
          setSelectedParcelForHandover(null);
        }}
        targetParcel={selectedParcelForHandover}
      />

      <VehicleLookupModal
        visible={vehicleModalVisible}
        onClose={() => setVehicleModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  viewModeBtnActive: {
    backgroundColor: '#1B4FD8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  viewModeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  content: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  badge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: { color: '#047857', fontWeight: 'bold', fontSize: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  nameText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 4 },
  flatText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  dot: { marginHorizontal: 6, color: '#9CA3AF' },
  purposeText: { fontSize: 14, color: '#6B7280' },
  timeText: { fontSize: 12, color: '#16A34A', fontWeight: '500' },
  exitBtn: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  toggleLogBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginVertical: 8,
  },
  toggleLogText: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginRight: 8 },
  logSection: { marginTop: 8, paddingBottom: 40 },
  logCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  purposeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  purposeBadgeText: { fontSize: 12, fontWeight: 'bold' },
  logFlat: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  logTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  logTimeText: { fontSize: 13, color: '#6B7280' },

  // Scheduled mode styles
  scheduledScroll: { flex: 1 },
  scheduledScrollContent: { padding: 16, paddingBottom: 100 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  guardSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guardSearchInput: { flex: 1, fontSize: 13, color: '#111827', padding: 0 },
  agendaSection: { marginTop: 4 },
  agendaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  agendaTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  agendaSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  agendaCountBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  agendaCountBadgeText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  emptyAgendaBox: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  emptyAgendaTitle: { fontSize: 15, fontWeight: '700', color: '#4B5563', marginTop: 8 },
  emptyAgendaSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4, maxWidth: 260 },
  groupSection: { marginBottom: 14 },
  groupHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  scheduledCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  schedCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  schedCardSub: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  vehicleText: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  slotBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slotBadgeText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pinTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pinTagText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifyBtnText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  deskActionBar: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  deskActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  deskActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#1E1B4B',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  parcelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  parcelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  parcelCardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  courierEmojiBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parcelCourier: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  parcelRecipient: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  parcelNotes: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  parcelCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  parcelIntakeTime: {
    fontSize: 11,
    color: '#64748B',
  },
  handoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  handoverBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  collectedByText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  staffCardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  staffEmojiBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  staffMeta: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  staffFlats: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  staffCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  staffTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  checkInBtnText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  checkOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  checkOutBtnText: {
    color: '#BE123C',
    fontSize: 11,
    fontWeight: '800',
  },
});
