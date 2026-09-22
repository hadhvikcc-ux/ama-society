import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import {
  useBookingStore,
  FacilityBooking,
  isSlotInPast,
  formatDateToDisplay,
  normalizeDateToKey,
} from '../../../stores/bookingStore';
import { BookingCalendar, CalendarMarkedDay } from '../../../components/calendar/BookingCalendar';
import { useAuthStore } from '../../../stores/authStore';
import { sharePassWithQrCode, downloadQrCodeImage } from '../../../utils/qrShare';

const facilities = [
  { id: '1', name: 'Clubhouse 🏛️', price: '₹500/hr', icon: 'business-outline', desc: 'Air-conditioned hall with projector & seating' },
  { id: '2', name: 'Swimming Pool 🏊', price: 'Free', icon: 'water-outline', desc: 'Olympic-size pool with shower & locker access' },
  { id: '3', name: 'Gymnasium 💪', price: 'Free', icon: 'barbell-outline', desc: 'Modern cardio & strength training equipment' },
  { id: '4', name: 'Tennis Court 🎾', price: '₹100/hr', icon: 'tennisball-outline', desc: 'Synthetic turf floodlit tennis court' },
  { id: '5', name: 'Badminton Court 🏸', price: '₹150/hr', icon: 'fitness-outline', desc: 'Indoor wooden court, max 4 players' },
];

const BASE_TIME_SLOTS = [
  '06:00 AM - 07:00 AM',
  '07:00 AM - 08:00 AM',
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
  '07:00 PM - 08:00 PM',
];

interface DateOption {
  label: string;
  day: string;
  full: string;
  isToday: boolean;
  dateObj: Date;
}

function generateDateOptions(): DateOption[] {
  const options: DateOption[] = [];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const day = String(d.getDate()).padStart(2, '0');
    const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const full = i === 0 ? `Today, ${day} ${month} ${year}` : `${dayName}, ${day} ${month} ${year}`;

    options.push({
      label: dayName,
      day,
      full,
      isToday: i === 0,
      dateObj: d,
    });
  }
  return options;
}

export default function FacilitiesScreen() {
  const { user } = useAuthStore();
  const { bookings, addBooking, cancelBooking } = useBookingStore();

  const [dateOptions] = useState<DateOption[]>(() => generateDateOptions());
  const [selectedFac, setSelectedFac] = useState(facilities[0].id);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'SLOTS' | 'MY_BOOKINGS'>('CALENDAR');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const facilityQrRef = useRef<any>(null);

  // Active Date String & Key depending on viewMode
  const activeDateDisplay = useMemo(() => {
    if (viewMode === 'CALENDAR') {
      return formatDateToDisplay(selectedCalendarDate);
    }
    return (dateOptions[selectedDateIdx] || dateOptions[0]).full;
  }, [viewMode, selectedCalendarDate, selectedDateIdx, dateOptions]);

  const activeDateKey = useMemo(() => {
    if (viewMode === 'CALENDAR') {
      return normalizeDateToKey(selectedCalendarDate);
    }
    return normalizeDateToKey((dateOptions[selectedDateIdx] || dateOptions[0]).full);
  }, [viewMode, selectedCalendarDate, selectedDateIdx, dateOptions]);

  // Marked Dates for Calendar View
  const calendarMarkedDates = useMemo(() => {
    const marks: Record<string, CalendarMarkedDay> = {};
    bookings.forEach((b) => {
      if (b.status === 'CANCELLED') return;
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
        marks[k].dots?.push({ color: dotColor, key: b.id });
      }
    });
    return marks;
  }, [bookings]);

  // Bookings on the currently selected calendar date
  const bookingsOnSelectedDate = useMemo(() => {
    return bookings.filter((b) => normalizeDateToKey(b.date) === activeDateKey);
  }, [bookings, activeDateKey]);

  // Dynamically compute whether a slot is past, booked, or reopened post-cancellation
  const getSlotDetails = (slotTime: string) => {
    const isPast = isSlotInPast(slotTime, activeDateDisplay);
    
    // Check for active booking
    const activeBooking = bookings.find(
      (b) =>
        b.facilityId === selectedFac &&
        normalizeDateToKey(b.date) === activeDateKey &&
        b.slot === slotTime &&
        b.status !== 'CANCELLED'
    );

    // Check if there is a cancelled booking for this slot
    const cancelledBooking = bookings.find(
      (b) =>
        b.facilityId === selectedFac &&
        normalizeDateToKey(b.date) === activeDateKey &&
        b.slot === slotTime &&
        b.status === 'CANCELLED'
    );

    return {
      isPast,
      isBooked: !!activeBooking,
      activeBooking,
      wasCancelled: !activeBooking && !!cancelledBooking,
    };
  };

  // Modal & Toast states
  const [confirmedBooking, setConfirmedBooking] = useState<FacilityBooking | null>(null);
  const [detailBooking, setDetailBooking] = useState<FacilityBooking | null>(null);
  const [qrPassBooking, setQrPassBooking] = useState<FacilityBooking | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentFacility = facilities.find(f => f.id === selectedFac) || facilities[0];

  const handleBook = () => {
    if (!selectedSlot) {
      Alert.alert('Select a Slot', 'Please choose a time slot to proceed.');
      return;
    }

    if (isSlotInPast(selectedSlot, activeDateDisplay)) {
      Alert.alert(
        'Time Slot Elapsed',
        'Cannot book a facility slot in the past. Please select an upcoming available slot.'
      );
      return;
    }

    try {
      const newBookingId = addBooking({
        facilityId: currentFacility.id,
        facilityName: currentFacility.name,
        facilityIcon: currentFacility.icon,
        date: activeDateDisplay,
        slot: selectedSlot,
        price: currentFacility.price,
        status: 'CONFIRMED',
        residentName: user?.name || 'Resident',
        flatNumber: user?.flatNumber || 'B-204',
      });

      const createdBooking: FacilityBooking = {
        id: newBookingId,
        facilityId: currentFacility.id,
        facilityName: currentFacility.name,
        facilityIcon: currentFacility.icon,
        date: activeDateDisplay,
        slot: selectedSlot,
        price: currentFacility.price,
        status: 'CONFIRMED',
        residentName: user?.name || 'Resident',
        flatNumber: user?.flatNumber || 'B-204',
        accessPin: String(Math.floor(1000 + Math.random() * 9000)),
        createdAt: new Date().toISOString(),
      };

      setConfirmedBooking(createdBooking);
      setSelectedSlot(null);
    } catch (err: any) {
      Alert.alert('Booking Error', err?.message || 'Unable to complete booking.');
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelTargetId) return;
    const targetId = cancelTargetId;
    cancelBooking(targetId);

    // If currently viewing details of this booking, update in modal immediately
    if (detailBooking && detailBooking.id.toUpperCase() === targetId.toUpperCase()) {
      setDetailBooking({ ...detailBooking, status: 'CANCELLED' });
    }

    setCancelTargetId(null);
    setCancelSuccessMsg(`Booking #${targetId} has been successfully cancelled.`);
    setTimeout(() => setCancelSuccessMsg(null), 4000);
  };

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'ACTIVE') return b.status !== 'CANCELLED';
    if (bookingFilter === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title="Book Facility" />

      {/* View Mode Navigation Bar */}
      <View style={styles.viewModeBar}>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'CALENDAR' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('CALENDAR')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar"
            size={15}
            color={viewMode === 'CALENDAR' ? '#FFFFFF' : '#475569'}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.viewModeText, viewMode === 'CALENDAR' && styles.viewModeTextActive]}>
            Calendar View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'SLOTS' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('SLOTS')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="flash-outline"
            size={15}
            color={viewMode === 'SLOTS' ? '#FFFFFF' : '#475569'}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.viewModeText, viewMode === 'SLOTS' && styles.viewModeTextActive]}>
            Quick Slots
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'MY_BOOKINGS' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('MY_BOOKINGS')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="receipt-outline"
            size={15}
            color={viewMode === 'MY_BOOKINGS' ? '#FFFFFF' : '#475569'}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.viewModeText, viewMode === 'MY_BOOKINGS' && styles.viewModeTextActive]}>
            My Bookings ({bookings.filter(b => b.status === 'CONFIRMED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Success Toast Banner */}
      {cancelSuccessMsg && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#15803D" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{cancelSuccessMsg}</Text>
          <TouchableOpacity onPress={() => setCancelSuccessMsg(null)}>
            <Ionicons name="close" size={18} color="#15803D" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Facility Picker Cards */}
        <Text style={styles.sectionHeading}>Select Facility</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.facScroll} 
          contentContainerStyle={styles.facScrollContent}
        >
          {facilities.map(f => (
            <TouchableOpacity 
              key={f.id} 
              style={[styles.facCard, selectedFac === f.id && styles.facCardActive]}
              onPress={() => {
                setSelectedFac(f.id);
                setSelectedSlot(null);
              }}
            >
              <View style={[styles.facIconBox, selectedFac === f.id ? styles.facIconBoxActive : {}]}>
                <Ionicons 
                  name={f.icon as any} 
                  size={30} 
                  color={selectedFac === f.id ? '#1B4FD8' : '#4B5563'} 
                />
              </View>
              <Text style={[styles.facName, selectedFac === f.id && styles.facNameActive]}>{f.name}</Text>
              <Text style={styles.facPrice}>{f.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ========================================================= */}
        {/* VIEW 1: INTERACTIVE BOOKING CALENDAR                      */}
        {/* ========================================================= */}
        {viewMode === 'CALENDAR' && (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <BookingCalendar
              selectedDate={selectedCalendarDate}
              onSelectDate={(d) => {
                setSelectedCalendarDate(d);
                setSelectedSlot(null);
              }}
              markedDates={calendarMarkedDates}
              title="Society Facility Availability"
            />

            {/* Selected Day Booking Section */}
            <View style={[styles.bookingSection, { marginTop: 16, paddingHorizontal: 0 }]}>
              <View style={styles.facDetailHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.facDetailTitle}>
                    {currentFacility.name} • {activeDateDisplay}
                  </Text>
                  <Text style={styles.facDetailDesc}>{currentFacility.desc}</Text>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.priceTagText}>{currentFacility.price}</Text>
                </View>
              </View>

              {/* Time Slots */}
              <View style={styles.slotSectionHeader}>
                <Text style={styles.subHeading}>Available Slots for {activeDateDisplay}</Text>
                <View style={styles.slotLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                    <Text style={styles.legendText}>Open</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                    <Text style={styles.legendText}>Booked</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
                    <Text style={styles.legendText}>Past</Text>
                  </View>
                </View>
              </View>

              <View style={styles.slotsGrid}>
                {BASE_TIME_SLOTS.map((slotTime) => {
                  const { isPast, isBooked, wasCancelled } = getSlotDetails(slotTime);
                  const isSelected = selectedSlot === slotTime;
                  const isDisabled = isBooked || isPast;

                  return (
                    <TouchableOpacity
                      key={slotTime}
                      style={[
                        styles.slotCard,
                        isPast && styles.slotPast,
                        isBooked && !isPast && styles.slotBooked,
                        isSelected && styles.slotSelected,
                        wasCancelled && !isSelected && !isPast && styles.slotRecentlyReleased,
                      ]}
                      disabled={isDisabled}
                      onPress={() => setSelectedSlot(slotTime)}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          isPast && styles.slotTextPast,
                          isBooked && !isPast && styles.slotTextBooked,
                          isSelected && styles.slotTextSelected,
                          wasCancelled && !isSelected && !isPast && styles.slotTextReleased,
                        ]}
                      >
                        {slotTime}
                      </Text>
                      <Text
                        style={[
                          styles.slotStatusText,
                          isPast && styles.slotStatusPast,
                          isBooked && !isPast && styles.slotStatusBooked,
                          isSelected && styles.slotStatusSelected,
                          wasCancelled && !isSelected && !isPast && styles.slotStatusReleased,
                        ]}
                      >
                        {isPast ? 'Closed' : isBooked ? 'Reserved' : isSelected ? 'Selected' : wasCancelled ? 'Reopened' : 'Available'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Book Slot Button */}
              <TouchableOpacity
                style={[
                  styles.bookBtn,
                  (!selectedSlot || isSlotInPast(selectedSlot, activeDateDisplay)) && styles.bookBtnDisabled,
                ]}
                disabled={!selectedSlot || isSlotInPast(selectedSlot, activeDateDisplay)}
                onPress={handleBook}
              >
                <Text style={styles.bookBtnText}>
                  {selectedSlot
                    ? isSlotInPast(selectedSlot, activeDateDisplay)
                      ? 'Selected Slot Has Passed'
                      : `Confirm Booking • ${currentFacility.price}`
                    : 'Select a Slot to Continue'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selected Date Reservations Agenda */}
            <View style={[styles.myBookings, { marginTop: 16, paddingHorizontal: 0 }]}>
              <View style={styles.myBookingsHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Reservations on {activeDateDisplay}</Text>
                  <Text style={styles.sectionSub}>
                    {bookingsOnSelectedDate.length === 0
                      ? 'No active reservations currently on this date'
                      : `${bookingsOnSelectedDate.length} active reservation(s)`}
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{bookingsOnSelectedDate.length} Booked</Text>
                </View>
              </View>

              {bookingsOnSelectedDate.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.bookingItem, item.status === 'CANCELLED' && styles.bookingItemCancelled]}
                  onPress={() => setDetailBooking(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.bookingTopRow}>
                    <View style={styles.bookingIdBadge}>
                      <Ionicons name="ticket-outline" size={14} color="#1D4ED8" style={{ marginRight: 4 }} />
                      <Text style={styles.bookingIdText}>#{item.id}</Text>
                    </View>
                    <StatusBadge status={item.status} size="sm" />
                  </View>

                  <View style={styles.bookingMidRow}>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingItemTitle}>{item.facilityName}</Text>
                      <View style={styles.bookingDetailLine}>
                        <Ionicons name="person-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                        <Text style={styles.bookingDetailText}>{item.residentName} ({item.flatNumber})</Text>
                      </View>
                      <View style={styles.bookingDetailLine}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                        <Text style={styles.bookingDetailText}>{item.slot}</Text>
                      </View>
                    </View>

                    {item.status !== 'CANCELLED' ? (
                      <View style={styles.pinBox}>
                        <Text style={styles.pinLabel}>ACCESS PIN</Text>
                        <Text style={styles.pinValue}>{item.accessPin}</Text>
                      </View>
                    ) : (
                      <View style={styles.cancelledTag}>
                        <Text style={styles.cancelledTagText}>Cancelled</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: QUICK 7-DAY SLOTS STRIP                           */}
        {/* ========================================================= */}
        {viewMode === 'SLOTS' && (
          <View style={styles.bookingSection}>
            <View style={styles.facDetailHeader}>
              <View>
                <Text style={styles.facDetailTitle}>{currentFacility.name}</Text>
                <Text style={styles.facDetailDesc}>{currentFacility.desc}</Text>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceTagText}>{currentFacility.price}</Text>
              </View>
            </View>

            {/* Date Picker */}
            <Text style={styles.subHeading}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {dateOptions.map((d, i) => (
                <TouchableOpacity 
                  key={d.day + d.label} 
                  style={[styles.dateCard, selectedDateIdx === i && styles.dateCardActive]}
                  onPress={() => {
                    setSelectedDateIdx(i);
                    setSelectedSlot(null);
                  }}
                >
                  <Text style={[styles.dateDay, selectedDateIdx === i && styles.dateTextActive]}>{d.label}</Text>
                  <Text style={[styles.dateNum, selectedDateIdx === i && styles.dateTextActive]}>{d.day}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time Slots */}
            <View style={styles.slotSectionHeader}>
              <Text style={styles.subHeading}>Select Time Slot</Text>
              <View style={styles.slotLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={styles.legendText}>Reserved</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
                  <Text style={styles.legendText}>Past</Text>
                </View>
              </View>
            </View>

            <View style={styles.slotsGrid}>
              {BASE_TIME_SLOTS.map(slotTime => {
                const { isPast, isBooked, wasCancelled } = getSlotDetails(slotTime);
                const isSelected = selectedSlot === slotTime;
                const isDisabled = isBooked || isPast;

                return (
                  <TouchableOpacity 
                    key={slotTime} 
                    style={[
                      styles.slotCard, 
                      isPast && styles.slotPast,
                      isBooked && !isPast && styles.slotBooked,
                      isSelected && styles.slotSelected,
                      wasCancelled && !isSelected && !isPast && styles.slotRecentlyReleased
                    ]}
                    disabled={isDisabled}
                    onPress={() => setSelectedSlot(slotTime)}
                  >
                    <Text style={[
                      styles.slotText,
                      isPast && styles.slotTextPast,
                      isBooked && !isPast && styles.slotTextBooked,
                      isSelected && styles.slotTextSelected,
                      wasCancelled && !isSelected && !isPast && styles.slotTextReleased
                    ]}>{slotTime}</Text>
                    <Text style={[
                      styles.slotStatusText,
                      isPast && styles.slotStatusPast,
                      isBooked && !isPast && styles.slotStatusBooked,
                      isSelected && styles.slotStatusSelected,
                      wasCancelled && !isSelected && !isPast && styles.slotStatusReleased
                    ]}>
                      {isPast ? 'Closed' : isBooked ? 'Reserved' : isSelected ? 'Selected' : wasCancelled ? 'Reopened' : 'Available'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Book Slot Button */}
            <TouchableOpacity 
              style={[
                styles.bookBtn, 
                (!selectedSlot || isSlotInPast(selectedSlot, (dateOptions[selectedDateIdx] || dateOptions[0]).full)) && styles.bookBtnDisabled
              ]} 
              disabled={!selectedSlot || isSlotInPast(selectedSlot, (dateOptions[selectedDateIdx] || dateOptions[0]).full)}
              onPress={handleBook}
            >
              <Text style={styles.bookBtnText}>
                {selectedSlot 
                  ? isSlotInPast(selectedSlot, (dateOptions[selectedDateIdx] || dateOptions[0]).full)
                    ? 'Selected Slot Has Passed'
                    : `Confirm Booking • ${currentFacility.price}` 
                  : 'Select a Slot to Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* My Upcoming Bookings List with Visible Booking IDs */}
        <View style={styles.myBookings}>
          <View style={styles.myBookingsHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Facility Bookings</Text>
              <Text style={styles.sectionSub}>View reservation IDs, access PINs, or cancel</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{bookings.length} Total</Text>
            </View>
          </View>

          {/* Filter Pills: All | Active | Cancelled */}
          <View style={styles.filterPillRow}>
            {(['ALL', 'ACTIVE', 'CANCELLED'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, bookingFilter === filter && styles.filterPillActive]}
                onPress={() => setBookingFilter(filter)}
              >
                <Text style={[styles.filterPillText, bookingFilter === filter && styles.filterPillTextActive]}>
                  {filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Active' : 'Cancelled'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredBookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyBookingsText}>No {bookingFilter.toLowerCase()} bookings found.</Text>
            </View>
          ) : (
            filteredBookings.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.bookingItem, item.status === 'CANCELLED' && styles.bookingItemCancelled]}
                onPress={() => setDetailBooking(item)}
                activeOpacity={0.85}
              >
                <View style={styles.bookingTopRow}>
                  {/* Community Booking ID Badge */}
                  <View style={styles.bookingIdBadge}>
                    <Ionicons name="ticket-outline" size={14} color="#1D4ED8" style={{ marginRight: 4 }} />
                    <Text style={styles.bookingIdText}>#{item.id}</Text>
                  </View>
                  <StatusBadge status={item.status} size="sm" />
                </View>

                <View style={styles.bookingMidRow}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingItemTitle}>{item.facilityName}</Text>
                    <View style={styles.bookingDetailLine}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                      <Text style={styles.bookingDetailText}>{item.date}</Text>
                    </View>
                    <View style={styles.bookingDetailLine}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                      <Text style={styles.bookingDetailText}>{item.slot}</Text>
                    </View>
                  </View>
                  
                  {item.status !== 'CANCELLED' ? (
                    <View style={styles.pinBox}>
                      <Text style={styles.pinLabel}>ACCESS PIN</Text>
                      <Text style={styles.pinValue}>{item.accessPin}</Text>
                    </View>
                  ) : (
                    <View style={styles.cancelledTag}>
                      <Text style={styles.cancelledTagText}>Cancelled</Text>
                    </View>
                  )}
                </View>

                {/* Card Footer: Quick Actions */}
                <View style={styles.bookingBottomRow}>
                  <Text style={styles.bookingRate}>Rate: {item.price}</Text>
                  
                  <View style={styles.cardActionsGroup}>
                    {item.status !== 'CANCELLED' && (
                      <TouchableOpacity 
                        style={styles.cardQrBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setQrPassBooking(item);
                        }}
                      >
                        <Ionicons name="qr-code-outline" size={13} color="#1D4ED8" style={{ marginRight: 3 }} />
                        <Text style={styles.cardQrBtnText}>QR Pass</Text>
                      </TouchableOpacity>
                    )}
                    {item.status !== 'CANCELLED' && (
                      <TouchableOpacity 
                        style={styles.cardCancelBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setCancelTargetId(item.id);
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={13} color="#DC2626" style={{ marginRight: 3 }} />
                        <Text style={styles.cardCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    <View style={styles.viewDetailLink}>
                      <Text style={styles.viewDetailText}>Details</Text>
                      <Ionicons name="chevron-forward" size={14} color="#1B4FD8" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 1. CONFIRMATION MODAL AFTER NEW BOOKING */}
      <Modal visible={!!confirmedBooking} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={60} color="#16A34A" />
            </View>
            <Text style={styles.confirmTitle}>Booking Confirmed!</Text>
            <Text style={styles.confirmSubtitle}>Your community facility slot has been registered.</Text>

            {/* Prominent Booking ID Box */}
            <View style={styles.confirmIdCard}>
              <Text style={styles.confirmIdLabel}>COMMUNITY BOOKING ID</Text>
              <Text style={styles.confirmIdNumber}>#{confirmedBooking?.id}</Text>
              <TouchableOpacity 
                style={styles.copyPill} 
                onPress={() => setCopied(true)}
              >
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color="#1B4FD8" />
                <Text style={styles.copyPillText}>{copied ? "Copied" : "Copy ID"}</Text>
              </TouchableOpacity>
            </View>

            {/* Scannable Gatekeeper QR Pass */}
            <View style={styles.qrPassCard}>
              <View style={styles.qrPassHeaderRow}>
                <Ionicons name="qr-code-outline" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
                <Text style={styles.qrPassHeader}>GATEKEEPER SCAN PASS</Text>
              </View>
              <View style={styles.qrWhiteBox}>
                <QRCode
                  value={`AMA-FACILITY:${confirmedBooking?.id}:${confirmedBooking?.accessPin}:${confirmedBooking?.flatNumber}`}
                  size={130}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={styles.qrPassSub}>Scan with guard scanner or quote ID #{confirmedBooking?.id}</Text>
            </View>

            {/* Details Receipt Table */}
            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Facility</Text>
                <Text style={styles.receiptValue}>{confirmedBooking?.facilityName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date</Text>
                <Text style={styles.receiptValue}>{confirmedBooking?.date}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Time Slot</Text>
                <Text style={styles.receiptValue}>{confirmedBooking?.slot}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Booked By</Text>
                <Text style={styles.receiptValue}>{confirmedBooking?.residentName} ({confirmedBooking?.flatNumber})</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Entry Passcode</Text>
                <Text style={[styles.receiptValue, { color: '#1B4FD8', fontWeight: 'bold' }]}>
                  {confirmedBooking?.accessPin}
                </Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.receiptLabel}>Charges</Text>
                <Text style={[styles.receiptValue, { color: '#16A34A' }]}>{confirmedBooking?.price}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.confirmDoneBtn}
              onPress={() => {
                setConfirmedBooking(null);
                setCopied(false);
              }}
            >
              <Text style={styles.confirmDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. BOOKING DETAILS MODAL */}
      <Modal visible={!!detailBooking} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.detailModalHeader}>
              <View>
                <Text style={styles.detailModalTitle}>Booking Details</Text>
                <Text style={styles.detailModalId}>#{detailBooking?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailBooking(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Facility</Text>
                <Text style={styles.receiptValue}>{detailBooking?.facilityName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date</Text>
                <Text style={styles.receiptValue}>{detailBooking?.date}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Slot</Text>
                <Text style={styles.receiptValue}>{detailBooking?.slot}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status</Text>
                <StatusBadge status={detailBooking?.status || 'CONFIRMED'} size="sm" />
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Access Code</Text>
                <Text style={[styles.receiptValue, { color: '#1B4FD8', fontWeight: 'bold' }]}>
                  {detailBooking?.accessPin}
                </Text>
              </View>
              <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.receiptLabel}>Rate</Text>
                <Text style={styles.receiptValue}>{detailBooking?.price}</Text>
              </View>
            </View>

            {/* QR Pass Box for Detail View */}
            {detailBooking?.status !== 'CANCELLED' ? (
              <View style={styles.qrPassCard}>
                <View style={styles.qrPassHeaderRow}>
                  <Ionicons name="qr-code-outline" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
                  <Text style={styles.qrPassHeader}>GATEKEEPER SCAN PASS</Text>
                </View>
                <View style={styles.qrWhiteBox}>
                  <QRCode
                    value={`AMA-FACILITY:${detailBooking?.id}:${detailBooking?.accessPin}:${detailBooking?.flatNumber}`}
                    size={130}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrPassSub}>Guard can scan this QR code or enter PIN {detailBooking?.accessPin}</Text>
              </View>
            ) : (
              <View style={styles.qrCancelledBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.qrCancelledBannerText}>QR Pass Inactive (Booking Cancelled)</Text>
              </View>
            )}

            <View style={styles.guardNotice}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#1E40AF" style={{ marginRight: 8 }} />
              <Text style={styles.guardNoticeText}>
                {detailBooking?.status === 'CANCELLED' 
                  ? 'This booking was cancelled and is no longer valid for entry.'
                  : `Present Booking ID #${detailBooking?.id} and PIN ${detailBooking?.accessPin} to clubhouse staff.`
                }
              </Text>
            </View>

            <View style={styles.detailModalActions}>
              {detailBooking?.status !== 'CANCELLED' ? (
                <TouchableOpacity 
                  style={styles.cancelBookingBtn} 
                  onPress={() => detailBooking && setCancelTargetId(detailBooking.id)}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.cancelBookingBtnText}>Cancel Booking</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.cancelledBadgeBox}>
                  <Text style={styles.cancelledBadgeText}>Booking Cancelled</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.closeDetailBtn} 
                onPress={() => setDetailBooking(null)}
              >
                <Text style={styles.closeDetailBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. DEDICATED IN-APP CANCEL CONFIRMATION MODAL */}
      <Modal visible={!!cancelTargetId} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalCard}>
            <View style={styles.cancelIconCircle}>
              <Ionicons name="alert-circle" size={54} color="#DC2626" />
            </View>
            <Text style={styles.cancelModalTitle}>Cancel Booking?</Text>
            <Text style={styles.cancelModalSubtitle}>
              Are you sure you want to cancel booking <Text style={{ fontWeight: 'bold', color: '#111827' }}>#{cancelTargetId}</Text>? Your reserved slot will be released for other residents.
            </Text>

            <View style={styles.cancelModalActions}>
              <TouchableOpacity 
                style={styles.cancelKeepBtn} 
                onPress={() => setCancelTargetId(null)}
              >
                <Text style={styles.cancelKeepBtnText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelConfirmBtn} 
                onPress={handleConfirmCancel}
              >
                <Text style={styles.cancelConfirmBtnText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. DEDICATED QR GATE PASS MODAL */}
      <Modal visible={!!qrPassBooking} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.qrPassModalCard}>
            <View style={styles.detailModalHeader}>
              <View>
                <Text style={styles.detailModalTitle}>Facility Gate Pass</Text>
                <Text style={styles.detailModalId}>#{qrPassBooking?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setQrPassBooking(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrHeroBox}>
              <Text style={styles.qrHeroFacility}>{qrPassBooking?.facilityName}</Text>
              <Text style={styles.qrHeroSlot}>{qrPassBooking?.date} • {qrPassBooking?.slot}</Text>

              <View style={styles.qrBigWrapper}>
                {qrPassBooking && (
                  <QRCode
                    value={`AMA-FACILITY:${qrPassBooking.id}:${qrPassBooking.accessPin}:${qrPassBooking.flatNumber}`}
                    size={175}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                    getRef={(c) => { facilityQrRef.current = c; }}
                  />
                )}
              </View>

              <View style={styles.pinPill}>
                <Text style={styles.pinPillLabel}>VERIFICATION PIN:</Text>
                <Text style={styles.pinPillValue}>{qrPassBooking?.accessPin}</Text>
              </View>

              <Text style={styles.qrHeroResident}>
                Resident: {qrPassBooking?.residentName} • Flat {qrPassBooking?.flatNumber}
              </Text>
            </View>

            <View style={styles.guardNotice}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#1E40AF" style={{ marginRight: 8 }} />
              <Text style={styles.guardNoticeText}>
                Present this QR code or 4-digit PIN to the gatekeeper or facility security desk for instant validation.
              </Text>
            </View>

            {/* QR Pass Sharing & Download Actions */}
            <View style={styles.facilityQrActionsRow}>
              <TouchableOpacity 
                style={styles.facilityShareBtn}
                onPress={async () => {
                  if (!qrPassBooking) return;
                  const qrPayload = `AMA-FACILITY:${qrPassBooking.id}:${qrPassBooking.accessPin}:${qrPassBooking.flatNumber}`;
                  let base64: string | undefined;
                  if (facilityQrRef.current?.toDataURL) {
                    base64 = await new Promise((res) => facilityQrRef.current.toDataURL((d: string) => res(d)));
                  }
                  await sharePassWithQrCode({
                    passId: qrPassBooking.id,
                    passType: 'FACILITY',
                    facilityName: qrPassBooking.facilityName,
                    residentName: qrPassBooking.residentName,
                    flatNumber: qrPassBooking.flatNumber,
                    tower: 'Tower B',
                    validDate: qrPassBooking.date,
                    timeWindow: qrPassBooking.slot,
                    accessPin: qrPassBooking.accessPin,
                    qrPayload,
                  }, base64);
                }}
              >
                <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.facilityShareBtnText}>Share Pass & QR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.facilityDownloadBtn}
                onPress={async () => {
                  if (!qrPassBooking) return;
                  const qrPayload = `AMA-FACILITY:${qrPassBooking.id}:${qrPassBooking.accessPin}:${qrPassBooking.flatNumber}`;
                  let base64: string | undefined;
                  if (facilityQrRef.current?.toDataURL) {
                    base64 = await new Promise((res) => facilityQrRef.current.toDataURL((d: string) => res(d)));
                  }
                  await downloadQrCodeImage(qrPayload, `Facility-${qrPassBooking.id}`, base64);
                }}
              >
                <Ionicons name="download-outline" size={18} color="#1D4ED8" style={{ marginRight: 6 }} />
                <Text style={styles.facilityDownloadBtnText}>Save QR</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.confirmDoneBtn}
              onPress={() => setQrPassBooking(null)}
            >
              <Text style={styles.confirmDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toastText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#15803D' },

  sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  facScroll: { paddingBottom: 12 },
  facScrollContent: { paddingHorizontal: 16, gap: 12 },
  facCard: { width: 140, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  facCardActive: { borderColor: '#1B4FD8', backgroundColor: '#EFF6FF' },
  facIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  facIconBoxActive: { backgroundColor: '#DBEAFE' },
  facName: { fontSize: 13, fontWeight: 'bold', color: '#374151', textAlign: 'center', marginBottom: 4 },
  facNameActive: { color: '#1B4FD8' },
  facPrice: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  
  bookingSection: { padding: 16, backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  facDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 16 },
  facDetailTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  facDetailDesc: { fontSize: 13, color: '#6B7280', marginTop: 2, maxWidth: 220 },
  priceTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  priceTagText: { color: '#15803D', fontWeight: 'bold', fontSize: 13 },
  
  subHeading: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  slotSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  slotLegend: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  dateScroll: { marginBottom: 20, flexDirection: 'row' },
  dateCard: { width: 64, height: 72, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#F9FAFB' },
  dateCardActive: { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  dateDay: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  dateNum: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  dateTextActive: { color: '#FFFFFF' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  slotCard: { width: '31%', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', backgroundColor: '#FFFFFF' },
  slotPast: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', opacity: 0.55 },
  slotBooked: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  slotSelected: { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  slotRecentlyReleased: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  slotText: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  slotTextPast: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  slotTextBooked: { color: '#DC2626' },
  slotTextSelected: { color: '#FFFFFF' },
  slotTextReleased: { color: '#15803D' },
  slotStatusText: { fontSize: 9, color: '#16A34A', marginTop: 2, fontWeight: '600' },
  slotStatusPast: { color: '#9CA3AF', fontWeight: '500' },
  slotStatusBooked: { color: '#B91C1C' },
  slotStatusSelected: { color: '#BFDBFE' },
  slotStatusReleased: { color: '#15803D', fontWeight: '700' },

  bookBtn: { backgroundColor: '#1B4FD8', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center' },
  bookBtnDisabled: { backgroundColor: '#9CA3AF' },
  bookBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  myBookings: { paddingHorizontal: 16 },
  myBookingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  sectionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  countBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  
  filterPillRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  filterPillActive: { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterPillTextActive: { color: '#FFFFFF' },

  emptyBookings: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  emptyBookingsText: { color: '#6B7280', fontSize: 14, marginTop: 8 },

  bookingItem: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  bookingItemCancelled: { opacity: 0.65, backgroundColor: '#FAFAFA' },
  bookingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bookingIdBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  bookingIdText: { fontSize: 12, fontWeight: '800', color: '#1D4ED8', letterSpacing: 0.5 },
  bookingMidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingInfo: { flex: 1 },
  bookingItemTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  bookingDetailLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  bookingDetailText: { fontSize: 13, color: '#4B5563' },
  pinBox: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  pinLabel: { fontSize: 9, fontWeight: 'bold', color: '#6B7280', letterSpacing: 0.5 },
  pinValue: { fontSize: 18, fontWeight: 'bold', color: '#1B4FD8', letterSpacing: 1 },
  cancelledTag: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  cancelledTagText: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },

  bookingBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  bookingRate: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
  cardActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardQrBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  cardQrBtnText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  cardCancelBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  cardCancelBtnText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
  viewDetailLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  viewDetailText: { fontSize: 12, fontWeight: '600', color: '#1B4FD8', marginRight: 2 },

  // Confirmation & Details Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 420, borderRadius: 24, padding: 24, alignItems: 'center' },
  successIconCircle: { marginBottom: 12 },
  confirmTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  confirmSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  
  confirmIdCard: { backgroundColor: '#EFF6FF', borderWidth: 2, borderColor: '#93C5FD', borderRadius: 16, padding: 18, alignItems: 'center', width: '100%', marginBottom: 16 },
  confirmIdLabel: { fontSize: 11, fontWeight: '700', color: '#1E40AF', letterSpacing: 1, marginBottom: 4 },
  confirmIdNumber: { fontSize: 28, fontWeight: '900', color: '#1B4FD8', letterSpacing: 1.5, marginBottom: 8 },
  copyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', gap: 4 },
  copyPillText: { fontSize: 11, fontWeight: '600', color: '#1B4FD8' },

  receiptBox: { width: '100%', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  receiptLabel: { fontSize: 13, color: '#6B7280' },
  receiptValue: { fontSize: 13, fontWeight: '600', color: '#111827' },

  confirmDoneBtn: { backgroundColor: '#1B4FD8', width: '100%', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  confirmDoneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  detailModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  detailModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  detailModalId: { fontSize: 14, fontWeight: '700', color: '#1B4FD8', marginTop: 2 },
  closeBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 16 },

  guardNotice: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  guardNoticeText: { flex: 1, fontSize: 12, color: '#1E3A8A', lineHeight: 16 },

  detailModalActions: { flexDirection: 'row', width: '100%', gap: 10 },
  cancelBookingBtn: { flex: 1, flexDirection: 'row', height: 46, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  cancelBookingBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 14 },
  cancelledBadgeBox: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  cancelledBadgeText: { color: '#9CA3AF', fontWeight: '600', fontSize: 13 },
  closeDetailBtn: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  closeDetailBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },

  // Dedicated In-App Cancel Confirmation Modal
  cancelModalCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 380, borderRadius: 20, padding: 24, alignItems: 'center' },
  cancelIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cancelModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  cancelModalSubtitle: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  cancelModalActions: { flexDirection: 'row', width: '100%', gap: 12 },
  cancelKeepBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelKeepBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  cancelConfirmBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center' },
  cancelConfirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  // QR Pass Card in Confirmed / Detail Modals
  qrPassCard: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 16, padding: 14, alignItems: 'center', width: '100%', marginBottom: 16 },
  qrPassHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  qrPassHeader: { fontSize: 12, fontWeight: '800', color: '#1D4ED8', letterSpacing: 0.8 },
  qrWhiteBox: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  qrPassSub: { fontSize: 11, color: '#64748B', marginTop: 8, textAlign: 'center', fontWeight: '500' },
  qrCancelledBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 12, width: '100%', marginBottom: 16, justifyContent: 'center' },
  qrCancelledBannerText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },

  // Dedicated QR Gate Pass Modal
  qrPassModalCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, alignItems: 'center' },
  qrHeroBox: { backgroundColor: '#F8FAFC', width: '100%', borderRadius: 18, padding: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 16 },
  qrHeroFacility: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 2 },
  qrHeroSlot: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 14 },
  qrBigWrapper: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, marginBottom: 14 },
  pinPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 10, gap: 6 },
  pinPillLabel: { fontSize: 11, fontWeight: '700', color: '#1E40AF', letterSpacing: 0.5 },
  pinPillValue: { fontSize: 16, fontWeight: '900', color: '#1D4ED8', letterSpacing: 1.5 },
  qrHeroResident: { fontSize: 12, color: '#475569', fontWeight: '600' },
  facilityQrActionsRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 12 },
  facilityShareBtn: { flex: 2, flexDirection: 'row', height: 46, backgroundColor: '#16A34A', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  facilityShareBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  facilityDownloadBtn: { flex: 1, flexDirection: 'row', height: 46, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', justifyContent: 'center', alignItems: 'center' },
  facilityDownloadBtnText: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },

  viewModeBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 8 },
  viewModeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 4, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  viewModeBtnActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  viewModeText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  viewModeTextActive: { color: '#FFFFFF', fontWeight: '700' },
});
