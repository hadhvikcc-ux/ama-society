import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import {
  useEventStore,
  SocietyEvent,
  EventCategory,
  EventStatus,
  EventExpense,
  EventContribution,
  EventPlaceVisit,
} from '../../../stores/eventStore';
import { useAuthStore } from '../../../stores/authStore';
import {
  generateGoogleCalendarUrl,
  downloadEventIcsFile,
  formatEventWhatsAppPlan,
  shareEventPlanOnWhatsApp,
  copyEventPlanToClipboard,
} from '../../../utils/eventPlanShare';
import { UpiPaymentScannerModal } from '../../../components/payment/UpiPaymentScannerModal';
import { LegalPolicyModal } from '../../../components/legal/LegalPolicyModal';
import { usePaymentStore, PaymentRecord } from '../../../stores/paymentStore';
import { AttachmentUploader } from '../../../components/ui/AttachmentUploader';
import { AppAttachment } from '../../../utils/filePicker';
import { BookingCalendar, CalendarMarkedDay } from '../../../components/calendar/BookingCalendar';
import { normalizeDateToKey, formatDateToDisplay } from '../../../stores/bookingStore';

const CATEGORIES: Array<{ key: EventCategory; label: string; icon: string }> = [
  { key: 'Festival', label: 'Festival', icon: 'sparkles-outline' },
  { key: 'Trip', label: 'Trip / Tour', icon: 'bus-outline' },
  { key: 'Sports', label: 'Sports', icon: 'football-outline' },
  { key: 'Wellness', label: 'Wellness', icon: 'fitness-outline' },
  { key: 'Cultural', label: 'Cultural', icon: 'color-palette-outline' },
  { key: 'Social', label: 'Social', icon: 'people-outline' },
  { key: 'General', label: 'General', icon: 'megaphone-outline' },
];

const EXPENSE_CATEGORIES = [
  { key: 'Travel', label: 'Travel / Transport', icon: 'bus' },
  { key: 'Food', label: 'Food & Meals', icon: 'restaurant' },
  { key: 'Venue', label: 'Venue & Audio', icon: 'business' },
  { key: 'Decor', label: 'Decorations', icon: 'color-palette' },
  { key: 'Equipment', label: 'Entry / Equipment', icon: 'ticket' },
  { key: 'Other', label: 'Miscellaneous', icon: 'receipt' },
] as const;

const VENUE_PRESETS = [
  'Central Lawn',
  'Clubhouse Lawn',
  'Clubhouse Hall',
  'Amphitheatre',
  'Indoor Badminton Court',
  'Poolside Deck',
  'Children Play Area',
];

const TIME_PRESETS = ['07:00 AM', '09:30 AM', '12:00 PM', '04:00 PM', '05:30 PM', '07:00 PM'];
const DURATION_PRESETS = ['45m', '1h 00m', '1h 30m', '2h 00m', '2h 30m', '3h 00m', '4h 00m'];

function isDateInPast(dateStr: string): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  const cleanedDateStr = dateStr.replace(/^[A-Za-z]+,\s*/, '').trim();
  const parsed = new Date(cleanedDateStr);
  if (isNaN(parsed.getTime())) {
    const isoParsed = new Date(dateStr);
    if (isNaN(isoParsed.getTime())) return false;
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return isoParsed < todayZero;
  }
  const now = new Date();
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetZero = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return targetZero < todayZero;
}

export default function EventsScreen() {
  const { user } = useAuthStore();
  const {
    events,
    addEvent,
    toggleRsvp,
    castVote,
    contributeBudget,
    addExpense,
    addContribution,
    addPlaceVisit,
  } = useEventStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UPCOMING' | 'VOTING' | 'MY_RSVP'>('ALL');

  // Modal States
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventTab, setEventTab] = useState<'OVERVIEW' | 'PLACES' | 'EXPENSES' | 'WHATSAPP'>('OVERVIEW');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);

  // UPI Payment Scanner Modal State
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiModalMode, setUpiModalMode] = useState<'RECEIVE' | 'SCAN'>('RECEIVE');
  const [upiModalAmount, setUpiModalAmount] = useState<number>(500);
  const [upiModalPayeeName, setUpiModalPayeeName] = useState<string>('AMA Community Event Fund');
  const [upiModalPayeeVpa, setUpiModalPayeeVpa] = useState<string>('ama.events@okhdfcbank');
  const [upiModalCategory, setUpiModalCategory] = useState<'EVENT_CONTRIBUTION' | 'REIMBURSEMENT'>('EVENT_CONTRIBUTION');
  const [upiModalNote, setUpiModalNote] = useState<string>('Event Contribution');
  const [legalModalVisible, setLegalModalVisible] = useState(false);

  // Toasts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [contributionToast, setContributionToast] = useState<string | null>(null);

  // Active Selected Event (auto-updates with Zustand state changes)
  const detailEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('Festival');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('06:00 PM');
  const [newVenue, setNewVenue] = useState('Central Lawn');
  const [newBudget, setNewBudget] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // New Place Visit Form State
  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [placeStartTime, setPlaceStartTime] = useState('09:30 AM');
  const [placeEndTime, setPlaceEndTime] = useState('12:00 PM');
  const [placeTimeToSpend, setPlaceTimeToSpend] = useState('2h 30m');
  const [placeActions, setPlaceActions] = useState('');
  const [placeTicketCost, setPlaceTicketCost] = useState('0');

  // New Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<'Travel' | 'Food' | 'Venue' | 'Decor' | 'Equipment' | 'Other'>('Travel');
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expPaidByFlat, setExpPaidByFlat] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [expAttachments, setExpAttachments] = useState<AppAttachment[]>([]);

  // Contribution Form State
  const [contribAmount, setContribAmount] = useState('500');
  const [contribMethod, setContribMethod] = useState('UPI / GPay');

  // Preset Dates Helper
  const presetDates = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = `${tomorrow.toLocaleDateString('en-US', { weekday: 'short' })}, ${String(tomorrow.getDate()).padStart(2, '0')} ${tomorrow.toLocaleDateString('en-US', { month: 'short' })} ${tomorrow.getFullYear()}`;

    const sat = new Date(now);
    const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
    sat.setDate(now.getDate() + daysUntilSat);
    const satStr = `Sat, ${String(sat.getDate()).padStart(2, '0')} ${sat.toLocaleDateString('en-US', { month: 'short' })} ${sat.getFullYear()}`;

    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);
    const sunStr = `Sun, ${String(sun.getDate()).padStart(2, '0')} ${sun.toLocaleDateString('en-US', { month: 'short' })} ${sun.getFullYear()}`;

    return [
      { label: 'Tomorrow', value: tomorrowStr },
      { label: 'This Sat', value: satStr },
      { label: 'This Sun', value: sunStr },
    ];
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const query = searchQuery.trim().toLowerCase();
      if (
        query &&
        !ev.title.toLowerCase().includes(query) &&
        !ev.location.toLowerCase().includes(query) &&
        !ev.category.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (selectedFilter === 'UPCOMING') return ev.status === 'CONFIRMED' || ev.status === 'OPEN';
      if (selectedFilter === 'VOTING') return ev.status === 'VOTING';
      if (selectedFilter === 'MY_RSVP') return ev.isUserRsvp;
      return true;
    });
  }, [events, searchQuery, selectedFilter]);

  // View Mode: FEED or CALENDAR
  const [eventsViewMode, setEventsViewMode] = useState<'FEED' | 'CALENDAR'>('FEED');
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());

  const calendarDateKey = useMemo(() => normalizeDateToKey(calendarDate), [calendarDate]);
  const calendarDateDisplay = useMemo(() => formatDateToDisplay(calendarDate), [calendarDate]);

  // Marked dates map for all community events
  const eventCalendarMarks = useMemo(() => {
    const marks: Record<string, CalendarMarkedDay> = {};

    events.forEach((ev) => {
      const key = normalizeDateToKey(ev.date);
      if (!key) return;

      if (!marks[key]) {
        marks[key] = { count: 0, dots: [] };
      }
      marks[key].count = (marks[key].count || 0) + 1;

      let dotColor = '#3B82F6';
      if (ev.category === 'Festival') dotColor = '#EC4899';
      else if (ev.category === 'Trip') dotColor = '#3B82F6';
      else if (ev.category === 'Sports') dotColor = '#10B981';
      else if (ev.category === 'Wellness') dotColor = '#06B6D4';
      else if (ev.category === 'Cultural') dotColor = '#8B5CF6';
      else if (ev.category === 'Social') dotColor = '#F59E0B';

      if (!marks[key].dots?.some((d) => d.color === dotColor)) {
        marks[key].dots?.push({ color: dotColor, key: `${ev.id}-${dotColor}`, label: ev.category });
      }
    });

    return marks;
  }, [events]);

  // Events scheduled on the selected calendar date
  const eventsOnSelectedDate = useMemo(() => {
    return events.filter((ev) => normalizeDateToKey(ev.date) === calendarDateKey);
  }, [events, calendarDateKey]);

  // Calculations for Active Event
  const expenseCalculations = useMemo(() => {
    if (!detailEvent) {
      return {
        totalSpent: 0,
        totalCollected: 0,
        attendeeCount: 1,
        perPersonShare: 0,
        purchaserSummary: {},
      };
    }

    const expenses = detailEvent.expenses || [];
    const contributions = detailEvent.contributions || [];

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalCollected = detailEvent.budget.collected || contributions.reduce((sum, c) => sum + c.amount, 0);
    const attendeeCount = Math.max(1, detailEvent.attendeesCount || 1);
    const perPersonShare = Math.round((totalSpent > 0 ? totalSpent : detailEvent.budget.total) / attendeeCount);

    const purchaserSummary: Record<string, { totalPaid: number; flat: string; items: string[] }> = {};
    expenses.forEach((exp) => {
      const key = exp.paidBy;
      if (!purchaserSummary[key]) {
        purchaserSummary[key] = { totalPaid: 0, flat: exp.paidByFlat, items: [] };
      }
      purchaserSummary[key].totalPaid += exp.amount;
      purchaserSummary[key].items.push(`${exp.title} (₹${exp.amount.toLocaleString()})`);
    });

    return {
      totalSpent,
      totalCollected,
      attendeeCount,
      perPersonShare,
      purchaserSummary,
    };
  }, [detailEvent]);

  // Handlers
  const handleOpenCreateModal = () => {
    setNewTitle('');
    setNewCategory('Festival');
    setNewDate(presetDates[0].value);
    setNewTime('06:00 PM');
    setNewVenue('Central Lawn');
    setNewBudget('');
    setNewDescription('');
    setIsCreateModalOpen(true);
  };

  const handleCreateEvent = () => {
    if (!newTitle.trim()) {
      Alert.alert('Required Field', 'Please enter an event title.');
      return;
    }
    if (!newDate.trim()) {
      Alert.alert('Required Field', 'Please specify an event date.');
      return;
    }
    if (isDateInPast(newDate)) {
      Alert.alert('Past Date Error', 'Cannot create an event for a past date. Please choose an upcoming date.');
      return;
    }
    if (!newVenue.trim()) {
      Alert.alert('Required Field', 'Please specify the location or venue.');
      return;
    }

    const budgetVal = Number(newBudget.replace(/[^0-9]/g, '')) || 0;

    const newId = addEvent({
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Join us for this exciting community gathering. All residents are welcome!',
      date: newDate.trim(),
      time: newTime.trim() || '06:00 PM',
      location: newVenue.trim(),
      status: budgetVal > 20000 ? 'VOTING' : 'OPEN',
      organizerName: user?.name || 'Resident',
      organizerFlat: user?.flatNumber || 'B-204',
      budget: {
        total: budgetVal,
        collected: 0,
      },
      votes: budgetVal > 20000 ? { approved: 1, rejected: 0, userVoted: 'APPROVE' } : undefined,
      highlights: ['Open for all residents', 'Community gathering', 'Family friendly'],
      placesToVisit: [],
      expenses: [],
      contributions: [],
    });

    setIsCreateModalOpen(false);
    setSuccessToast(`Event #${newId} "${newTitle.trim()}" created successfully!`);
    setTimeout(() => setSuccessToast(null), 4000);

    setSelectedEventId(newId);
    setEventTab('OVERVIEW');
  };

  const handleToggleRsvp = (event: SocietyEvent) => {
    toggleRsvp(event.id);
  };

  const handleVote = (event: SocietyEvent, approve: boolean) => {
    castVote(event.id, approve);
  };

  const handleQuickContribute = (event: SocietyEvent, amount: number) => {
    contributeBudget(event.id, amount);
    addContribution(event.id, {
      contributorName: user?.name || 'Resident',
      contributorFlat: user?.flatNumber || 'B-204',
      amount,
      date: 'Today',
      paymentMethod: 'UPI / Quick',
    });
    setContributionToast(`Thank you! Added ₹${amount.toLocaleString()} to ${event.title}`);
    setTimeout(() => setContributionToast(null), 3000);
  };

  // Add Place Visit Handler
  const handleOpenAddPlace = () => {
    setPlaceName('');
    setPlaceAddress('');
    setPlaceStartTime('09:30 AM');
    setPlaceEndTime('12:00 PM');
    setPlaceTimeToSpend('2h 30m');
    setPlaceActions('');
    setPlaceTicketCost('0');
    setIsAddPlaceModalOpen(true);
  };

  const handleSavePlaceVisit = () => {
    if (!detailEvent) return;
    if (!placeName.trim()) {
      Alert.alert('Required Field', 'Please provide a place / destination name.');
      return;
    }
    if (!placeActions.trim()) {
      Alert.alert('Required Field', 'Please describe the planned activities or actions at this location.');
      return;
    }

    addPlaceVisit(detailEvent.id, {
      placeName: placeName.trim(),
      address: placeAddress.trim() || undefined,
      startTime: placeStartTime.trim(),
      endTime: placeEndTime.trim(),
      timeToSpend: placeTimeToSpend.trim() || '1h 30m',
      actions: placeActions.trim(),
      ticketCostPerPerson: Number(placeTicketCost.replace(/[^0-9]/g, '')) || 0,
    });

    setIsAddPlaceModalOpen(false);
    setSuccessToast(`Added "${placeName.trim()}" to itinerary!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Add Expense Handler
  const handleOpenAddExpense = () => {
    setExpTitle('');
    setExpAmount('');
    setExpCategory('Travel');
    setExpPaidBy(user?.name || 'Aditya Sharma');
    setExpPaidByFlat(user?.flatNumber || 'B-402');
    setExpNotes('');
    setExpAttachments([]);
    setIsAddExpenseModalOpen(true);
  };

  const handleSaveExpense = () => {
    if (!detailEvent) return;
    if (!expTitle.trim()) {
      Alert.alert('Required Field', 'Please provide an expense title or purchase item.');
      return;
    }
    const amountVal = Number(expAmount.replace(/[^0-9]/g, '')) || 0;
    if (amountVal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount in ₹.');
      return;
    }
    if (!expPaidBy.trim()) {
      Alert.alert('Required Field', 'Please specify who paid for this expense.');
      return;
    }

    addExpense(detailEvent.id, {
      title: expTitle.trim(),
      amount: amountVal,
      category: expCategory,
      paidBy: expPaidBy.trim(),
      paidByFlat: expPaidByFlat.trim() || 'Resident',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      notes: expNotes.trim() || undefined,
      attachments: expAttachments,
    });

    setIsAddExpenseModalOpen(false);
    setSuccessToast(`Logged ₹${amountVal.toLocaleString()} paid by ${expPaidBy.trim()}!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Contribute Pool Handler
  const handleOpenContribute = () => {
    setContribAmount('500');
    setContribMethod('UPI / GPay');
    setIsContributeModalOpen(true);
  };

  const handleSaveContribution = () => {
    if (!detailEvent) return;
    const amountVal = Number(contribAmount.replace(/[^0-9]/g, '')) || 0;
    if (amountVal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid contribution amount.');
      return;
    }

    contributeBudget(detailEvent.id, amountVal);
    addContribution(detailEvent.id, {
      contributorName: user?.name || 'Resident',
      contributorFlat: user?.flatNumber || 'B-204',
      amount: amountVal,
      date: 'Today',
      paymentMethod: contribMethod,
    });

    setIsContributeModalOpen(false);
    setContributionToast(`🎉 Successfully contributed ₹${amountVal.toLocaleString()} via ${contribMethod}!`);
    setTimeout(() => setContributionToast(null), 3500);
  };

  // Open UPI Standee for Event Pool Contribution
  const handleOpenEventPoolQr = (amount: number) => {
    setUpiModalMode('RECEIVE');
    setUpiModalAmount(amount);
    setUpiModalPayeeName('AMA Community Event Fund');
    setUpiModalPayeeVpa('ama.events@okhdfcbank');
    setUpiModalCategory('EVENT_CONTRIBUTION');
    setUpiModalNote(`${detailEvent?.title || 'Event'} Pool Contribution`);
    setUpiModalVisible(true);
  };

  // Open UPI for Purchaser Settle-Up / Reimbursement
  const handleOpenUpiSettleUp = (purchaserName: string, purchaserFlat: string, amount: number) => {
    const cleanVpa = `${purchaserName.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`;
    setUpiModalMode('RECEIVE');
    setUpiModalAmount(Math.round(amount));
    setUpiModalPayeeName(purchaserName);
    setUpiModalPayeeVpa(cleanVpa);
    setUpiModalCategory('REIMBURSEMENT');
    setUpiModalNote(`Reimbursement for ${detailEvent?.title || 'Event'}`);
    setUpiModalVisible(true);
  };

  // Callback when UPI Payment succeeds via Scanner or Soundbox Simulation
  const handleUpiPaymentSuccess = (record: PaymentRecord) => {
    if (!detailEvent) return;
    if (record.category === 'EVENT_CONTRIBUTION') {
      contributeBudget(detailEvent.id, record.amount);
      addContribution(detailEvent.id, {
        contributorName: record.payerName,
        contributorFlat: record.payerFlat,
        amount: record.amount,
        date: 'Today',
        paymentMethod: 'UPI / GPay',
      });
      setContributionToast(`🎉 Successfully contributed ₹${record.amount.toLocaleString()} via UPI / GPay!`);
      setTimeout(() => setContributionToast(null), 3500);
    } else if (record.category === 'REIMBURSEMENT') {
      setContributionToast(`💸 Settle-up payment of ₹${record.amount.toLocaleString()} to ${record.payeeName} recorded!`);
      setTimeout(() => setContributionToast(null), 3500);
    }
  };

  // Share Actions
  const handleShareWhatsApp = async (ev: SocietyEvent) => {
    await shareEventPlanOnWhatsApp(ev);
  };

  const handleCopyPlan = async (ev: SocietyEvent) => {
    await copyEventPlanToClipboard(ev);
  };

  const handleBlockCalendar = (ev: SocietyEvent) => {
    const url = generateGoogleCalendarUrl(ev);
    Linking.openURL(url).catch(() => {
      Alert.alert('Calendar', 'Unable to open calendar application.');
    });
  };

  const handleDownloadIcs = (ev: SocietyEvent) => {
    downloadEventIcsFile(ev);
  };

  const renderItem = ({ item }: { item: SocietyEvent }) => {
    const budgetPct = item.budget.total > 0 ? Math.min(100, Math.round((item.budget.collected / item.budget.total) * 100)) : 0;
    const totalSpent = item.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const placesCount = item.placesToVisit?.length || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          setSelectedEventId(item.id);
          setEventTab('OVERVIEW');
        }}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
              <Text style={styles.eventIdSub}>#{item.id}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.detailsRow}>
          <Ionicons name="calendar-outline" size={15} color="#1D4ED8" />
          <Text style={styles.detailText}>{item.date} • {item.time}</Text>
        </View>
        <View style={styles.detailsRow}>
          <Ionicons name="location-outline" size={15} color="#DC2626" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>

        <Text style={styles.descriptionExcerpt} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Feature Badges Row (Places, Spent, RSVP) */}
        <View style={styles.cardFeatureBadgesRow}>
          {placesCount > 0 && (
            <View style={styles.cardFeatureBadge}>
              <Ionicons name="map" size={12} color="#0D9488" />
              <Text style={styles.cardFeatureBadgeText}>{placesCount} Stops Planned</Text>
            </View>
          )}
          {totalSpent > 0 && (
            <View style={[styles.cardFeatureBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Ionicons name="receipt" size={12} color="#D97706" />
              <Text style={[styles.cardFeatureBadgeText, { color: '#B45309' }]}>
                ₹{totalSpent.toLocaleString()} Spent
              </Text>
            </View>
          )}
          <View style={[styles.cardFeatureBadge, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
            <Ionicons name="people" size={12} color="#4B5563" />
            <Text style={[styles.cardFeatureBadgeText, { color: '#374151' }]}>
              {item.attendeesCount} RSVP
            </Text>
          </View>
        </View>

        {/* Budget Progress Bar */}
        {item.budget.total > 0 && (
          <View style={styles.budgetSection}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Community Budget Pool</Text>
              <Text style={styles.budgetValue}>
                ₹{item.budget.collected.toLocaleString()} / ₹{item.budget.total.toLocaleString()} ({budgetPct}%)
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${budgetPct}%` }]} />
            </View>
          </View>
        )}

        {/* Card Footer */}
        <View style={styles.footer}>
          <View style={styles.attendeesBox}>
            {item.isUserRsvp ? (
              <View style={styles.attendingBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#15803D" />
                <Text style={styles.attendingBadgeText}>You're Going</Text>
              </View>
            ) : (
              <Text style={styles.attendeesText}>{item.attendeesCount} attending</Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.quickShareBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleShareWhatsApp(item);
              }}
              accessibilityLabel="Share on WhatsApp"
            >
              <Ionicons name="logo-whatsapp" size={16} color="#15803D" />
              <Text style={styles.quickShareBtnText}>Share Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.joinBtn}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedEventId(item.id);
                setEventTab('OVERVIEW');
              }}
            >
              <Text style={styles.joinBtnText}>View Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#1B4FD8" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Society Events & Itineraries" />

      {/* View Mode Switcher */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeBtn, eventsViewMode === 'FEED' && styles.viewModeBtnActive]}
          onPress={() => setEventsViewMode('FEED')}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={eventsViewMode === 'FEED' ? '#FFFFFF' : '#475569'}
          />
          <Text
            style={[
              styles.viewModeBtnText,
              eventsViewMode === 'FEED' && styles.viewModeBtnTextActive,
            ]}
          >
            Events Feed ({filteredEvents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, eventsViewMode === 'CALENDAR' && styles.viewModeBtnActive]}
          onPress={() => setEventsViewMode('CALENDAR')}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={eventsViewMode === 'CALENDAR' ? '#FFFFFF' : '#475569'}
          />
          <Text
            style={[
              styles.viewModeBtnText,
              eventsViewMode === 'CALENDAR' && styles.viewModeBtnTextActive,
            ]}
          >
            Society Calendar 📅
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Success Notification Banner */}
      {successToast && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#15803D" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{successToast}</Text>
        </View>
      )}

      {eventsViewMode === 'FEED' ? (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, destinations, or organizers..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterRow}>
            {(['ALL', 'UPCOMING', 'VOTING', 'MY_RSVP'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
                  {filter === 'ALL'
                    ? 'All Events'
                    : filter === 'UPCOMING'
                    ? 'Upcoming'
                    : filter === 'VOTING'
                    ? 'Voting Pools'
                    : 'My RSVPs'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Events List */}
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedFilter === 'MY_RSVP'
                    ? "You haven't RSVP'd to any events yet. Explore events above and tap RSVP!"
                    : 'Try adjusting your search or propose a new community event using the + button.'}
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <ScrollView style={styles.calendarScrollView} contentContainerStyle={styles.calendarScrollContent}>
          <BookingCalendar
            selectedDate={calendarDate}
            onSelectDate={setCalendarDate}
            markedDates={eventCalendarMarks}
            title="Society Events Calendar"
          />

          {/* Event Category Dot Legend */}
          <View style={styles.eventLegendCard}>
            <Text style={styles.legendTitle}>Event Types</Text>
            <View style={styles.legendGrid}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EC4899' }]} />
                <Text style={styles.legendLabel}>Festival</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendLabel}>Trip / Tour</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendLabel}>Sports</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#06B6D4' }]} />
                <Text style={styles.legendLabel}>Wellness</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.legendLabel}>Cultural</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendLabel}>Social</Text>
              </View>
            </View>
          </View>

          {/* Selected Date Agenda */}
          <View style={styles.agendaSection}>
            <View style={styles.agendaHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.agendaTitle}>Schedule for {calendarDateDisplay}</Text>
                <Text style={styles.agendaSubtitle}>
                  {eventsOnSelectedDate.length} {eventsOnSelectedDate.length === 1 ? 'event' : 'events'} scheduled
                </Text>
              </View>
              <TouchableOpacity
                style={styles.proposeBtn}
                onPress={() => {
                  setNewDate(calendarDateDisplay);
                  handleOpenCreateModal();
                }}
              >
                <Ionicons name="add-circle" size={16} color="#1D4ED8" />
                <Text style={styles.proposeBtnText}>Add Event</Text>
              </TouchableOpacity>
            </View>

            {eventsOnSelectedDate.length === 0 ? (
              <View style={styles.calendarEmptyBox}>
                <Ionicons name="calendar-clear-outline" size={40} color="#94A3B8" />
                <Text style={styles.calendarEmptyTitle}>No events on this date</Text>
                <Text style={styles.calendarEmptySub}>
                  Tap "Add Event" or the floating + button to propose a festival, tournament, or community trip for {calendarDateDisplay}!
                </Text>
              </View>
            ) : (
              eventsOnSelectedDate.map((ev) => (
                <View key={ev.id} style={{ marginBottom: 14 }}>
                  {renderItem({ item: ev })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Add Event Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenCreateModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ========================================================================= */}
      {/* 1. MASTER EVENT DETAILS MODAL (WITH 4 SUB-TABS)                           */}
      {/* ========================================================================= */}
      <Modal visible={!!detailEvent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            {/* Modal Top Header */}
            <View style={styles.detailHeaderRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{detailEvent?.category.toUpperCase()}</Text>
                  <Text style={styles.eventIdSub}>#{detailEvent?.id}</Text>
                </View>
                <Text style={styles.detailModalTitle} numberOfLines={1}>
                  {detailEvent?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedEventId(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Sub-Tabs Bar: Overview, Places & Schedule, Expenses, WhatsApp */}
            <View style={styles.modalTabBar}>
              <TouchableOpacity
                style={[styles.modalTabItem, eventTab === 'OVERVIEW' && styles.modalTabItemActive]}
                onPress={() => setEventTab('OVERVIEW')}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color={eventTab === 'OVERVIEW' ? '#1D4ED8' : '#6B7280'}
                />
                <Text style={[styles.modalTabText, eventTab === 'OVERVIEW' && styles.modalTabTextActive]}>
                  Overview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalTabItem, eventTab === 'PLACES' && styles.modalTabItemActive]}
                onPress={() => setEventTab('PLACES')}
              >
                <Ionicons
                  name="map-outline"
                  size={15}
                  color={eventTab === 'PLACES' ? '#1D4ED8' : '#6B7280'}
                />
                <Text style={[styles.modalTabText, eventTab === 'PLACES' && styles.modalTabTextActive]}>
                  Places ({detailEvent?.placesToVisit?.length || 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalTabItem, eventTab === 'EXPENSES' && styles.modalTabItemActive]}
                onPress={() => setEventTab('EXPENSES')}
              >
                <Ionicons
                  name="wallet-outline"
                  size={15}
                  color={eventTab === 'EXPENSES' ? '#1D4ED8' : '#6B7280'}
                />
                <Text style={[styles.modalTabText, eventTab === 'EXPENSES' && styles.modalTabTextActive]}>
                  Expenses ({detailEvent?.expenses?.length || 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalTabItem, eventTab === 'WHATSAPP' && styles.modalTabItemActive]}
                onPress={() => setEventTab('WHATSAPP')}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={15}
                  color={eventTab === 'WHATSAPP' ? '#15803D' : '#6B7280'}
                />
                <Text style={[styles.modalTabText, eventTab === 'WHATSAPP' && { color: '#15803D', fontWeight: 'bold' }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScrollContent}>
              {/* In-Modal Contribution Toast if any */}
              {contributionToast && (
                <View style={[styles.toastBanner, { marginHorizontal: 0, marginBottom: 12 }]}>
                  <Ionicons name="heart" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.toastText}>{contributionToast}</Text>
                </View>
              )}

              {/* --------------------------------------------------------------- */}
              {/* SUB-TAB 1: OVERVIEW & RSVP                                      */}
              {/* --------------------------------------------------------------- */}
              {eventTab === 'OVERVIEW' && detailEvent && (
                <View>
                  {/* Status & Organizer Row */}
                  <View style={styles.statusOrganizerRow}>
                    <StatusBadge status={detailEvent.status} size="sm" />
                    <Text style={styles.organizerText}>
                      Organized by <Text style={{ fontWeight: 'bold' }}>{detailEvent.organizerName}</Text> ({detailEvent.organizerFlat})
                    </Text>
                  </View>

                  {/* Key Specs Card */}
                  <View style={styles.specsCard}>
                    <View style={styles.specItem}>
                      <Ionicons name="calendar" size={18} color="#1D4ED8" />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.specLabel}>Date & Time</Text>
                        <Text style={styles.specValue}>{detailEvent.date}</Text>
                        <Text style={styles.specSubValue}>{detailEvent.time}</Text>
                      </View>
                    </View>

                    <View style={[styles.specItem, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 10 }]}>
                      <Ionicons name="location" size={18} color="#DC2626" />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.specLabel}>Location / Meeting Assembly</Text>
                        <Text style={styles.specValue}>{detailEvent.location}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.sectionHeader}>About Event</Text>
                  <Text style={styles.detailDescription}>{detailEvent.description}</Text>

                  {/* Event Highlights */}
                  {detailEvent.highlights && detailEvent.highlights.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.sectionHeader}>Event Highlights</Text>
                      <View style={styles.highlightsBox}>
                        {detailEvent.highlights.map((h, idx) => (
                          <View key={idx} style={styles.highlightLine}>
                            <Ionicons name="checkmark-circle" size={15} color="#10B981" style={{ marginRight: 6 }} />
                            <Text style={styles.highlightText}>{h}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* RSVP Attendance Action Box */}
                  <View style={styles.rsvpBox}>
                    <View style={styles.rsvpHeaderRow}>
                      <View>
                        <Text style={styles.rsvpTitle}>Attendance & RSVP</Text>
                        <Text style={styles.rsvpSubtitle}>
                          {detailEvent.attendeesCount} residents confirmed attendance
                        </Text>
                      </View>
                      <Ionicons name="people-circle" size={32} color="#1B4FD8" />
                    </View>

                    <TouchableOpacity
                      style={[styles.rsvpBtn, detailEvent.isUserRsvp && styles.rsvpBtnActive]}
                      onPress={() => handleToggleRsvp(detailEvent)}
                    >
                      <Ionicons
                        name={detailEvent.isUserRsvp ? 'checkmark-circle' : 'add-circle-outline'}
                        size={20}
                        color={detailEvent.isUserRsvp ? '#15803D' : '#FFFFFF'}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.rsvpBtnText, detailEvent.isUserRsvp && styles.rsvpBtnTextActive]}>
                        {detailEvent.isUserRsvp ? "You're Attending (Tap to Cancel)" : '+ RSVP / I am Attending'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Voting Pool Card (if status is VOTING) */}
                  {detailEvent.status === 'VOTING' && (
                    <View style={styles.votingCard}>
                      <View style={styles.votingHeaderRow}>
                        <Ionicons name="pie-chart" size={20} color="#7C3AED" style={{ marginRight: 6 }} />
                        <Text style={styles.votingTitle}>Community Budget Approval Vote</Text>
                      </View>
                      <Text style={styles.votingDesc}>
                        This event proposal requires community consensus before funds are locked.
                      </Text>

                      <View style={styles.voteStatsRow}>
                        <View style={styles.voteStatItem}>
                          <Text style={[styles.voteStatNum, { color: '#16A34A' }]}>
                            {detailEvent.votes?.approved || 0}
                          </Text>
                          <Text style={styles.voteStatLabel}>Approved</Text>
                        </View>
                        <View style={styles.voteStatDivider} />
                        <View style={styles.voteStatItem}>
                          <Text style={[styles.voteStatNum, { color: '#DC2626' }]}>
                            {detailEvent.votes?.rejected || 0}
                          </Text>
                          <Text style={styles.voteStatLabel}>Rejected</Text>
                        </View>
                      </View>

                      {detailEvent.votes?.userVoted ? (
                        <View style={styles.votedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.votedBadgeText}>
                            You voted: {detailEvent.votes.userVoted}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.voteActionsRow}>
                          <TouchableOpacity
                            style={styles.voteApproveBtn}
                            onPress={() => handleVote(detailEvent, true)}
                          >
                            <Ionicons name="thumbs-up" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.voteApproveText}>Approve Budget</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.voteRejectBtn}
                            onPress={() => handleVote(detailEvent, false)}
                          >
                            <Ionicons name="thumbs-down" size={16} color="#DC2626" style={{ marginRight: 4 }} />
                            <Text style={styles.voteRejectText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Budget & Sponsorship Pool Preview */}
                  {detailEvent.budget.total > 0 && (
                    <View style={styles.sponsorCard}>
                      <Text style={styles.sectionHeader}>Budget & Sponsorship Pool</Text>
                      <View style={styles.budgetRow}>
                        <Text style={styles.budgetMainNum}>
                          ₹{detailEvent.budget.collected.toLocaleString()}
                        </Text>
                        <Text style={styles.budgetTarget}>
                          of ₹{detailEvent.budget.total.toLocaleString()} target
                        </Text>
                      </View>

                      <View style={styles.progressBarBgLarge}>
                        <View
                          style={[
                            styles.progressBarFillLarge,
                            {
                              width: `${Math.min(
                                100,
                                Math.round((detailEvent.budget.collected / detailEvent.budget.total) * 100)
                              )}%`,
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.sponsorHint}>Quick contribution to pool:</Text>
                      <View style={styles.sponsorChipsRow}>
                        {[250, 500, 1000].map((amt) => (
                          <TouchableOpacity
                            key={amt}
                            style={styles.sponsorChip}
                            onPress={() => handleQuickContribute(detailEvent, amt)}
                          >
                            <Ionicons name="add" size={13} color="#1D4ED8" />
                            <Text style={styles.sponsorChipText}>₹{amt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* --------------------------------------------------------------- */}
              {/* SUB-TAB 2: PLACES & SCHEDULE (ITINERARY & CALENDAR BLOCKING)    */}
              {/* --------------------------------------------------------------- */}
              {eventTab === 'PLACES' && detailEvent && (
                <View>
                  {/* Calendar Blocking Action Card */}
                  <View style={styles.calBlockCard}>
                    <View style={styles.calBlockHeader}>
                      <View style={styles.calBlockIconWrap}>
                        <Ionicons name="calendar" size={22} color="#1D4ED8" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.calBlockTitle}>Block Your Personal Calendar</Text>
                        <Text style={styles.calBlockSubtitle}>
                          Lock this date & visit schedule into your personal Google or Apple calendar so you don't miss checkpoints.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.calBlockButtonsRow}>
                      <TouchableOpacity
                        style={styles.gcalBtn}
                        onPress={() => handleBlockCalendar(detailEvent)}
                      >
                        <Ionicons name="logo-google" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.gcalBtnText}>Google Calendar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.icsBtn}
                        onPress={() => handleDownloadIcs(detailEvent)}
                      >
                        <Ionicons name="download-outline" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
                        <Text style={styles.icsBtnText}>Download .ICS</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Schedule Header with + Add Place */}
                  <View style={styles.sectionHeaderBetween}>
                    <View>
                      <Text style={styles.sectionHeader}>Trip Destinations & Timetable</Text>
                      <Text style={styles.sectionSub}>
                        {detailEvent.placesToVisit?.length || 0} scheduled checkpoint(s)
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.addSmallBtn} onPress={handleOpenAddPlace}>
                      <Ionicons name="add-circle" size={16} color="#1D4ED8" style={{ marginRight: 4 }} />
                      <Text style={styles.addSmallBtnText}>+ Add Place</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Places Timeline List */}
                  {(!detailEvent.placesToVisit || detailEvent.placesToVisit.length === 0) ? (
                    <View style={styles.emptySubBox}>
                      <Ionicons name="map-outline" size={36} color="#9CA3AF" />
                      <Text style={styles.emptySubTitle}>No destinations added yet</Text>
                      <Text style={styles.emptySubDesc}>
                        Plan stops, arrival timings, time to spend, and activities for participants.
                      </Text>
                      <TouchableOpacity style={styles.primarySmallBtn} onPress={handleOpenAddPlace}>
                        <Text style={styles.primarySmallBtnText}>+ Add First Destination</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.timelineContainer}>
                      {detailEvent.placesToVisit.map((place, idx) => {
                        const isLast = idx === (detailEvent.placesToVisit?.length || 0) - 1;
                        return (
                          <View key={place.id || idx} style={styles.timelineItem}>
                            {/* Left Pillar: Step Circle + Connecting Line */}
                            <View style={styles.timelinePillar}>
                              <View style={styles.timelineCircle}>
                                <Text style={styles.timelineCircleText}>{idx + 1}</Text>
                              </View>
                              {!isLast && <View style={styles.timelineLine} />}
                            </View>

                            {/* Right Content: Destination Card */}
                            <View style={styles.placeCard}>
                              <View style={styles.placeCardHeader}>
                                <Text style={styles.placeCardTitle}>{place.placeName}</Text>
                                {place.ticketCostPerPerson && place.ticketCostPerPerson > 0 ? (
                                  <View style={styles.ticketBadge}>
                                    <Ionicons name="ticket" size={11} color="#B45309" />
                                    <Text style={styles.ticketBadgeText}>
                                      ₹{place.ticketCostPerPerson}/person
                                    </Text>
                                  </View>
                                ) : (
                                  <View style={[styles.ticketBadge, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                                    <Text style={[styles.ticketBadgeText, { color: '#16A34A' }]}>Free / Included</Text>
                                  </View>
                                )}
                              </View>

                              {place.address ? (
                                <View style={styles.placeAddressRow}>
                                  <Ionicons name="location" size={13} color="#6B7280" />
                                  <Text style={styles.placeAddressText}>{place.address}</Text>
                                </View>
                              ) : null}

                              {/* Timing & Time to Spend Chips */}
                              <View style={styles.placeTimingRow}>
                                <View style={styles.timingChip}>
                                  <Ionicons name="time-outline" size={12} color="#1E40AF" />
                                  <Text style={styles.timingChipText}>
                                    {place.startTime} - {place.endTime}
                                  </Text>
                                </View>

                                <View style={styles.spendChip}>
                                  <Ionicons name="hourglass-outline" size={12} color="#0D9488" />
                                  <Text style={styles.spendChipText}>
                                    Time to spend: <Text style={{ fontWeight: 'bold' }}>{place.timeToSpend}</Text>
                                  </Text>
                                </View>
                              </View>

                              {/* Planned Actions */}
                              <View style={styles.actionsBox}>
                                <View style={styles.actionsHeader}>
                                  <Ionicons name="golf-outline" size={13} color="#4338CA" />
                                  <Text style={styles.actionsHeaderText}>Planned Actions & Activities:</Text>
                                </View>
                                <Text style={styles.actionsText}>{place.actions}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* --------------------------------------------------------------- */}
              {/* SUB-TAB 3: EXPENSE TRACKER & CONTRIBUTIONS                      */}
              {/* --------------------------------------------------------------- */}
              {eventTab === 'EXPENSES' && detailEvent && (
                <View>
                  {/* Summary Metric Cards (4 Grid) */}
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Budget Target</Text>
                      <Text style={styles.metricVal}>₹{detailEvent.budget.total.toLocaleString()}</Text>
                      <Text style={styles.metricSub}>Estimated total</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                      <Text style={[styles.metricLabel, { color: '#991B1B' }]}>Total Spent</Text>
                      <Text style={[styles.metricVal, { color: '#DC2626' }]}>
                        ₹{expenseCalculations.totalSpent.toLocaleString()}
                      </Text>
                      <Text style={[styles.metricSub, { color: '#B91C1C' }]}>
                        {detailEvent.expenses?.length || 0} purchases
                      </Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                      <Text style={[styles.metricLabel, { color: '#166534' }]}>Total Collected</Text>
                      <Text style={[styles.metricVal, { color: '#16A34A' }]}>
                        ₹{expenseCalculations.totalCollected.toLocaleString()}
                      </Text>
                      <Text style={[styles.metricSub, { color: '#15803D' }]}>From residents</Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                      <Text style={[styles.metricLabel, { color: '#1E40AF' }]}>Per-Person Share</Text>
                      <Text style={[styles.metricVal, { color: '#1D4ED8' }]}>
                        ₹{expenseCalculations.perPersonShare.toLocaleString()}
                      </Text>
                      <Text style={[styles.metricSub, { color: '#2563EB' }]}>
                        For {expenseCalculations.attendeeCount} participants
                      </Text>
                    </View>
                  </View>

                  {/* Quick Action Buttons: + Log Expense & + Contribute Share */}
                  <View style={styles.expenseActionRow}>
                    <TouchableOpacity style={styles.logExpenseBtn} onPress={handleOpenAddExpense}>
                      <Ionicons name="receipt" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.logExpenseBtnText}>+ Log Expense</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contributeShareBtn} onPress={handleOpenContribute}>
                      <Ionicons name="heart" size={16} color="#15803D" style={{ marginRight: 6 }} />
                      <Text style={styles.contributeShareBtnText}>+ Contribute Pool</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Purchaser Breakdown Section */}
                  <View style={styles.purchaserSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Ionicons name="pie-chart" size={18} color="#4338CA" />
                      <Text style={[styles.sectionHeader, { marginBottom: 0, marginLeft: 6 }]}>
                        Payment Contribution & Purchaser Balances
                      </Text>
                    </View>
                    <Text style={styles.purchaserDesc}>
                      Shows who purchased items and what reimbursement is due back after dividing fair shares.
                    </Text>

                    {Object.keys(expenseCalculations.purchaserSummary).length === 0 ? (
                      <View style={styles.emptySmallCard}>
                        <Text style={styles.emptySmallCardText}>
                          No expenses logged yet. Tap "+ Log Expense" above to record purchases.
                        </Text>
                      </View>
                    ) : (
                      Object.entries(expenseCalculations.purchaserSummary).map(([name, data], idx) => {
                        const netReimbursement = data.totalPaid - expenseCalculations.perPersonShare;
                        const isOwed = netReimbursement > 0;

                        return (
                          <View key={idx} style={styles.purchaserCard}>
                            <View style={styles.purchaserCardTop}>
                              <View>
                                <Text style={styles.purchaserName}>{name}</Text>
                                <Text style={styles.purchaserFlat}>Flat / Unit: {data.flat}</Text>
                              </View>
                              {isOwed ? (
                                <View style={styles.reimburseBadgeGreen}>
                                  <Ionicons name="arrow-down-circle" size={13} color="#15803D" />
                                  <Text style={styles.reimburseBadgeGreenText}>
                                    To Receive: ₹{netReimbursement.toLocaleString()}
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.reimburseBadgeGray}>
                                  <Text style={styles.reimburseBadgeGrayText}>Settled</Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.purchaserNumbersRow}>
                              <Text style={styles.purchaserNumText}>
                                Total Paid: <Text style={{ fontWeight: 'bold', color: '#111827' }}>₹{data.totalPaid.toLocaleString()}</Text>
                              </Text>
                              <Text style={styles.purchaserNumText}>
                                Fair Share: <Text style={{ fontWeight: 'bold', color: '#6B7280' }}>₹{expenseCalculations.perPersonShare.toLocaleString()}</Text>
                              </Text>
                            </View>

                            <View style={styles.purchaserItemsList}>
                              <Text style={styles.purchaserItemsHeader}>Items purchased:</Text>
                              {data.items.map((it, i) => (
                                <Text key={i} style={styles.purchaserItemLine}>• {it}</Text>
                              ))}
                            </View>

                            <TouchableOpacity
                              style={styles.settleUpiBtn}
                              onPress={() =>
                                handleOpenUpiSettleUp(
                                  name,
                                  data.flat,
                                  isOwed ? netReimbursement : expenseCalculations.perPersonShare
                                )
                              }
                            >
                              <Ionicons name="qr-code" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                              <Text style={styles.settleUpiBtnText}>
                                {isOwed
                                  ? `Pay / Settle ₹${netReimbursement.toLocaleString()} via UPI QR`
                                  : `Show UPI Payment Standee`}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* All Logged Expenses List */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionHeader}>Itemized Purchases & Expenses</Text>
                    {(!detailEvent.expenses || detailEvent.expenses.length === 0) ? (
                      <View style={styles.emptySmallCard}>
                        <Text style={styles.emptySmallCardText}>No expenses logged.</Text>
                      </View>
                    ) : (
                      detailEvent.expenses.map((exp, idx) => (
                        <View key={exp.id || idx} style={styles.expenseItemRow}>
                          <View style={styles.expenseItemLeft}>
                            <View style={styles.expenseCatChip}>
                              <Text style={styles.expenseCatChipText}>{exp.category}</Text>
                            </View>
                            <Text style={styles.expenseItemTitle}>{exp.title}</Text>
                            <Text style={styles.expenseItemSub}>
                              Paid by <Text style={{ fontWeight: '600' }}>{exp.paidBy}</Text> ({exp.paidByFlat}) • {exp.date}
                            </Text>
                            {exp.notes ? <Text style={styles.expenseItemNotes}>"{exp.notes}"</Text> : null}
                            {exp.attachments && exp.attachments.length > 0 && (
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                {exp.attachments.map((att) => (
                                  <View
                                    key={att.id}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      backgroundColor: '#F8FAFC',
                                      borderWidth: 1,
                                      borderColor: '#CBD5E1',
                                      borderRadius: 6,
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      gap: 4,
                                    }}
                                  >
                                    <Ionicons
                                      name={
                                        att.type === 'IMAGE'
                                          ? 'image'
                                          : att.type === 'VIDEO'
                                          ? 'videocam'
                                          : att.type === 'EXCEL'
                                          ? 'grid'
                                          : 'document-text'
                                      }
                                      size={12}
                                      color="#1D4ED8"
                                    />
                                    <Text style={{ fontSize: 10, color: '#334155', fontWeight: '600' }} numberOfLines={1}>
                                      {att.name}
                                    </Text>
                                    <Text style={{ fontSize: 9, color: '#64748B' }}>
                                      ({att.size})
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                          <Text style={styles.expenseItemAmount}>₹{exp.amount.toLocaleString()}</Text>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Pool Contributions from Residents */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionHeader}>Resident Pool Contributions</Text>
                    {(!detailEvent.contributions || detailEvent.contributions.length === 0) ? (
                      <View style={styles.emptySmallCard}>
                        <Text style={styles.emptySmallCardText}>No resident pool contributions recorded yet.</Text>
                      </View>
                    ) : (
                      detailEvent.contributions.map((contrib, idx) => (
                        <View key={contrib.id || idx} style={styles.contribItemRow}>
                          <View>
                            <Text style={styles.contribName}>{contrib.contributorName}</Text>
                            <Text style={styles.contribSub}>
                              {contrib.contributorFlat} • {contrib.paymentMethod || 'UPI'} • {contrib.date}
                            </Text>
                          </View>
                          <Text style={styles.contribAmount}>+₹{contrib.amount.toLocaleString()}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}

              {/* --------------------------------------------------------------- */}
              {/* SUB-TAB 4: WHATSAPP COMPLETE PLAN BROADCAST                     */}
              {/* --------------------------------------------------------------- */}
              {eventTab === 'WHATSAPP' && detailEvent && (
                <View>
                  <View style={styles.waBroadcastCard}>
                    <View style={styles.waBroadcastHeader}>
                      <Ionicons name="logo-whatsapp" size={24} color="#15803D" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.waBroadcastTitle}>Broadcast Complete Plan</Text>
                        <Text style={styles.waBroadcastSub}>
                          Send complete schedule, visit timings, activities, purchaser contributions, and one-tap calendar block link directly to your society WhatsApp group.
                        </Text>
                      </View>
                    </View>

                    {/* WhatsApp Action Buttons */}
                    <View style={styles.waActionButtonsRow}>
                      <TouchableOpacity
                        style={styles.waSendBtn}
                        onPress={() => handleShareWhatsApp(detailEvent)}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.waSendBtnText}>Send on WhatsApp</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.waCopyBtn}
                        onPress={() => handleCopyPlan(detailEvent)}
                      >
                        <Ionicons name="copy-outline" size={17} color="#15803D" style={{ marginRight: 6 }} />
                        <Text style={styles.waCopyBtnText}>Copy Plan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Message Preview */}
                  <Text style={styles.sectionHeader}>WhatsApp Message Preview</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ borderRadius: 12 }}>
                    <View style={styles.waPreviewBubble}>
                      <Text style={styles.waPreviewText}>
                        {formatEventWhatsAppPlan(detailEvent)}
                      </Text>
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={{ height: 28 }} />
            </ScrollView>

            {/* Modal Bottom Close Button */}
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setSelectedEventId(null)}>
              <Text style={styles.modalDoneBtnText}>Close Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. PROPOSE EVENT MODAL                                                    */}
      {/* ========================================================================= */}
      <Modal visible={isCreateModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.detailHeaderRow}>
              <View>
                <Text style={styles.createModalTitle}>Propose Society Event</Text>
                <Text style={styles.createModalSubtitle}>Create a community gathering, trip, or funding pool</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.createScrollContent}>
              <Text style={styles.formLabel}>Event Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Society Heritage Day Trip 🚌, Navratri Mela..."
                placeholderTextColor="#9CA3AF"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catChip, newCategory === cat.key && styles.catChipActive]}
                    onPress={() => setNewCategory(cat.key)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={newCategory === cat.key ? '#FFFFFF' : '#4B5563'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.catChipText, newCategory === cat.key && styles.catChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Event Date *</Text>
              <View style={styles.datePresetsRow}>
                {presetDates.map((pd) => (
                  <TouchableOpacity
                    key={pd.label}
                    style={[styles.datePresetChip, newDate === pd.value && styles.datePresetChipActive]}
                    onPress={() => setNewDate(pd.value)}
                  >
                    <Text style={[styles.datePresetText, newDate === pd.value && styles.datePresetTextActive]}>
                      {pd.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Sat, 26 Sep 2026 or YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={newDate}
                onChangeText={setNewDate}
              />
              {isDateInPast(newDate) && (
                <Text style={styles.dateErrorText}>
                  ⚠️ This date is in the past. Events must be scheduled for future dates.
                </Text>
              )}

              <Text style={styles.formLabel}>Time *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
                {TIME_PRESETS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.datePresetChip, newTime === t && styles.datePresetChipActive]}
                    onPress={() => setNewTime(t)}
                  >
                    <Text style={[styles.datePresetText, newTime === t && styles.datePresetTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 06:00 PM"
                placeholderTextColor="#9CA3AF"
                value={newTime}
                onChangeText={setNewTime}
              />

              <Text style={styles.formLabel}>Venue / Starting Assembly *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
                {VENUE_PRESETS.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.datePresetChip, newVenue === v && styles.datePresetChipActive]}
                    onPress={() => setNewVenue(v)}
                  >
                    <Text style={[styles.datePresetText, newVenue === v && styles.datePresetTextActive]}>
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Central Lawn, Clubhouse Gate..."
                placeholderTextColor="#9CA3AF"
                value={newVenue}
                onChangeText={setNewVenue}
              />

              <Text style={styles.formLabel}>Estimated Budget Target (₹, Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 25000 (leave 0 if free)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={newBudget}
                onChangeText={setNewBudget}
              />

              <Text style={styles.formLabel}>Event Description & Agenda</Text>
              <TextInput
                style={[styles.formInput, styles.formInputMultiline]}
                placeholder="Describe what will happen, itinerary plan, what to bring..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.formCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formSubmitBtn,
                  (!newTitle.trim() || !newDate.trim() || isDateInPast(newDate)) && styles.formSubmitBtnDisabled,
                ]}
                disabled={!newTitle.trim() || !newDate.trim() || isDateInPast(newDate)}
                onPress={handleCreateEvent}
              >
                <Text style={styles.formSubmitBtnText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. ADD PLACE VISIT MODAL                                                  */}
      {/* ========================================================================= */}
      <Modal visible={isAddPlaceModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.detailHeaderRow}>
              <View>
                <Text style={styles.createModalTitle}>Add Destination to Itinerary</Text>
                <Text style={styles.createModalSubtitle}>Schedule a stop, time window, duration & actions</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddPlaceModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.createScrollContent}>
              <Text style={styles.formLabel}>Place / Destination Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Amber Fort & Palace, City Botanical Garden"
                placeholderTextColor="#9CA3AF"
                value={placeName}
                onChangeText={setPlaceName}
              />

              <Text style={styles.formLabel}>Address / Landmark (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Devisinghpura, Amer, Jaipur"
                placeholderTextColor="#9CA3AF"
                value={placeAddress}
                onChangeText={setPlaceAddress}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Arrival Time *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="09:30 AM"
                    placeholderTextColor="#9CA3AF"
                    value={placeStartTime}
                    onChangeText={setPlaceStartTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Departure Time *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="12:00 PM"
                    placeholderTextColor="#9CA3AF"
                    value={placeEndTime}
                    onChangeText={setPlaceEndTime}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Time to be Spent *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
                {DURATION_PRESETS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.datePresetChip, placeTimeToSpend === d && styles.datePresetChipActive]}
                    onPress={() => setPlaceTimeToSpend(d)}
                  >
                    <Text style={[styles.datePresetText, placeTimeToSpend === d && styles.datePresetTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 2h 30m"
                placeholderTextColor="#9CA3AF"
                value={placeTimeToSpend}
                onChangeText={setPlaceTimeToSpend}
              />

              <Text style={styles.formLabel}>Planned Actions & Activities *</Text>
              <TextInput
                style={[styles.formInput, styles.formInputMultiline]}
                placeholder="e.g. Guided heritage walk, photo session at courtyard, explore royal armory..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={placeActions}
                onChangeText={setPlaceActions}
              />

              <Text style={styles.formLabel}>Entry / Ticket Cost Per Person (₹, 0 if Free)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 150"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={placeTicketCost}
                onChangeText={setPlaceTicketCost}
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setIsAddPlaceModalOpen(false)}
              >
                <Text style={styles.formCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formSubmitBtn, (!placeName.trim() || !placeActions.trim()) && styles.formSubmitBtnDisabled]}
                disabled={!placeName.trim() || !placeActions.trim()}
                onPress={handleSavePlaceVisit}
              >
                <Text style={styles.formSubmitBtnText}>Save Destination</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. LOG EXPENSE MODAL                                                      */}
      {/* ========================================================================= */}
      <Modal visible={isAddExpenseModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.detailHeaderRow}>
              <View>
                <Text style={styles.createModalTitle}>Log Event Expense</Text>
                <Text style={styles.createModalSubtitle}>Record purchases made by residents or organizers</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddExpenseModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.createScrollContent}>
              <Text style={styles.formLabel}>Purchase Item / Description *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 45-Seater Luxury AC Coach, Lunch Buffet..."
                placeholderTextColor="#9CA3AF"
                value={expTitle}
                onChangeText={setExpTitle}
              />

              <Text style={styles.formLabel}>Amount Paid (₹) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 18500"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={expAmount}
                onChangeText={setExpAmount}
              />

              <Text style={styles.formLabel}>Expense Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catChip, expCategory === cat.key && styles.catChipActive]}
                    onPress={() => setExpCategory(cat.key)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={expCategory === cat.key ? '#FFFFFF' : '#4B5563'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.catChipText, expCategory === cat.key && styles.catChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.formLabel}>Purchased By (Resident Name) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Aditya Sharma"
                    placeholderTextColor="#9CA3AF"
                    value={expPaidBy}
                    onChangeText={setExpPaidBy}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Flat / Unit *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. B-402"
                    placeholderTextColor="#9CA3AF"
                    value={expPaidByFlat}
                    onChangeText={setExpPaidByFlat}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Notes / Vendor Details (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Advance 50% paid via GPay to Rajesh Travels"
                placeholderTextColor="#9CA3AF"
                value={expNotes}
                onChangeText={setExpNotes}
              />

              <View style={{ marginTop: 10 }}>
                <AttachmentUploader
                  attachments={expAttachments}
                  onChange={setExpAttachments}
                  title="Attach Vendor Bills / Receipts (Optional)"
                  subtitle="Upload bill photo, catering tax invoice, or BOQ excel sheet"
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setIsAddExpenseModalOpen(false)}
              >
                <Text style={styles.formCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formSubmitBtn, (!expTitle.trim() || !expAmount.trim() || !expPaidBy.trim()) && styles.formSubmitBtnDisabled]}
                disabled={!expTitle.trim() || !expAmount.trim() || !expPaidBy.trim()}
                onPress={handleSaveExpense}
              >
                <Text style={styles.formSubmitBtnText}>Save Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. CONTRIBUTE TO POOL MODAL                                               */}
      {/* ========================================================================= */}
      <Modal visible={isContributeModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.createModalCard}>
            <View style={styles.detailHeaderRow}>
              <View>
                <Text style={styles.createModalTitle}>Contribute to Event Pool</Text>
                <Text style={styles.createModalSubtitle}>Support the community event fund</Text>
              </View>
              <TouchableOpacity onPress={() => setIsContributeModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.createScrollContent}>
              <Text style={styles.formLabel}>Select Contribution Amount (₹) *</Text>
              <View style={styles.sponsorChipsRow}>
                {['250', '500', '1000', '2000'].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.sponsorChip, contribAmount === amt && { backgroundColor: '#EFF6FF', borderColor: '#1D4ED8' }]}
                    onPress={() => setContribAmount(amt)}
                  >
                    <Text style={[styles.sponsorChipText, contribAmount === amt && { color: '#1D4ED8', fontWeight: '800' }]}>
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Or Enter Custom Amount (₹)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 1500"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={contribAmount}
                onChangeText={setContribAmount}
              />

              <Text style={styles.formLabel}>Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
                {['UPI / GPay', 'Razorpay', 'Cash', 'Maintenance Offset'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.datePresetChip, contribMethod === m && styles.datePresetChipActive]}
                    onPress={() => setContribMethod(m)}
                  >
                    <Text style={[styles.datePresetText, contribMethod === m && styles.datePresetTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.contribNoteBox}>
                <Ionicons name="shield-checkmark" size={18} color="#15803D" style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contribNoteText}>
                    Your contribution is recorded securely in the society event ledger and visible on the WhatsApp plan report.
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 4 }}
                    onPress={() => setLegalModalVisible(true)}
                  >
                    <Text style={{ fontSize: 11, color: '#1D4ED8', textDecorationLine: 'underline', fontWeight: '700' }}>
                      View Event Pool Funding & Surplus Policy &rarr;
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.upiQuickPayBtn}
                onPress={() => {
                  setIsContributeModalOpen(false);
                  handleOpenEventPoolQr(Number(contribAmount.replace(/[^0-9]/g, '')) || 500);
                }}
              >
                <Ionicons name="qr-code" size={18} color="#1D4ED8" style={{ marginRight: 6 }} />
                <Text style={styles.upiQuickPayBtnText}>
                  Pay via UPI / GPay QR Standee (₹{contribAmount})
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setIsContributeModalOpen(false)}
              >
                <Text style={styles.formCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.formSubmitBtn}
                onPress={handleSaveContribution}
              >
                <Text style={styles.formSubmitBtnText}>Contribute ₹{contribAmount}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global UPI Payment Scanner Modal */}
      <UpiPaymentScannerModal
        visible={upiModalVisible}
        onClose={() => setUpiModalVisible(false)}
        initialMode={upiModalMode}
        defaultAmount={upiModalAmount}
        defaultPayeeName={upiModalPayeeName}
        defaultPayeeVpa={upiModalPayeeVpa}
        category={upiModalCategory}
        referenceId={detailEvent?.id}
        defaultNote={upiModalNote}
        onPaymentSuccess={handleUpiPaymentSuccess}
      />

      {/* Global Legal & Payment Policy Modal */}
      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialSection="PAYMENT"
      />
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
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toastText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#15803D' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111827' },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },

  list: { padding: 16, paddingTop: 4, paddingBottom: 80 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  categoryText: { fontSize: 11, fontWeight: '800', color: '#1D4ED8', letterSpacing: 0.5 },
  eventIdSub: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: 'bold', color: '#111827' },

  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailText: { fontSize: 13, color: '#4B5563', marginLeft: 6, fontWeight: '500' },
  descriptionExcerpt: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 8, lineHeight: 18 },

  cardFeatureBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  cardFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  cardFeatureBadgeText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },

  budgetSection: {
    marginTop: 2,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  budgetValue: { fontSize: 11, fontWeight: 'bold', color: '#1E293B' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#1B4FD8', borderRadius: 3 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  attendeesBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attendeesText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  attendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  attendingBadgeText: { fontSize: 10, fontWeight: '700', color: '#15803D' },

  quickShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  quickShareBtnText: { color: '#15803D', fontWeight: '700', fontSize: 12 },

  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  joinBtnText: { color: '#1B4FD8', fontWeight: '700', fontSize: 13 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1B4FD8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1B4FD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 10 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18 },

  // Details Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '94%',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailModalTitle: { fontSize: 19, fontWeight: 'bold', color: '#111827' },
  modalCloseBtn: { padding: 4, backgroundColor: '#F3F4F6', borderRadius: 16 },

  modalTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  modalTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  modalTabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modalTabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  modalTabTextActive: { color: '#1D4ED8', fontWeight: 'bold' },

  detailScrollContent: { maxHeight: 540 },

  statusOrganizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  organizerText: { fontSize: 12, color: '#6B7280' },

  specsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  specItem: { flexDirection: 'row', alignItems: 'center' },
  specLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  specValue: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginTop: 1 },
  specSubValue: { fontSize: 12, color: '#475569' },

  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 },
  sectionSub: { fontSize: 12, color: '#64748B', marginTop: -2, marginBottom: 8 },
  sectionHeaderBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },

  detailDescription: { fontSize: 14, color: '#334155', lineHeight: 21, marginBottom: 14 },

  highlightsBox: { gap: 6 },
  highlightLine: { flexDirection: 'row', alignItems: 'center' },
  highlightText: { fontSize: 13, color: '#475569' },

  rsvpBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  rsvpHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rsvpTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E3A8A' },
  rsvpSubtitle: { fontSize: 12, color: '#2563EB', marginTop: 2 },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    height: 46,
    borderRadius: 10,
  },
  rsvpBtnActive: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  rsvpBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  rsvpBtnTextActive: { color: '#15803D' },

  votingCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  votingHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  votingTitle: { fontSize: 14, fontWeight: 'bold', color: '#6B21A8' },
  votingDesc: { fontSize: 12, color: '#7E22CE', marginBottom: 12 },
  voteStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  voteStatItem: { alignItems: 'center' },
  voteStatNum: { fontSize: 20, fontWeight: 'bold' },
  voteStatLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  voteStatDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB' },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 8,
    borderRadius: 8,
  },
  votedBadgeText: { color: '#065F46', fontWeight: 'bold', fontSize: 13 },
  voteActionsRow: { flexDirection: 'row', gap: 10 },
  voteApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 40,
    borderRadius: 8,
  },
  voteApproveText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  voteRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  voteRejectText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },

  sponsorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  budgetRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  budgetMainNum: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  budgetTarget: { fontSize: 13, color: '#64748B' },
  progressBarBgLarge: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBarFillLarge: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  sponsorHint: { fontSize: 12, color: '#475569', marginBottom: 8, fontWeight: '600' },
  sponsorChipsRow: { flexDirection: 'row', gap: 10 },
  sponsorChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingVertical: 8,
    borderRadius: 8,
  },
  sponsorChipText: { fontSize: 13, fontWeight: 'bold', color: '#1D4ED8' },

  // Calendar Block Card
  calBlockCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  calBlockHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  calBlockIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calBlockTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E40AF' },
  calBlockSubtitle: { fontSize: 12, color: '#3B82F6', marginTop: 2, lineHeight: 16 },
  calBlockButtonsRow: { flexDirection: 'row', gap: 10 },
  gcalBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    height: 38,
    borderRadius: 8,
  },
  gcalBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  icsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  icsBtnText: { color: '#1D4ED8', fontSize: 12, fontWeight: 'bold' },

  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSmallBtnText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },

  emptySubBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  emptySubTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginTop: 8 },
  emptySubDesc: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 12 },
  primarySmallBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primarySmallBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },

  // Timeline for Itinerary
  timelineContainer: { marginTop: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 14 },
  timelinePillar: { width: 28, alignItems: 'center', marginRight: 10 },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineCircleText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#CBD5E1', marginTop: 4 },
  placeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  placeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  placeCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', flex: 1, marginRight: 6 },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ticketBadgeText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  placeAddressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  placeAddressText: { fontSize: 11, color: '#64748B' },
  placeTimingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  timingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  timingChipText: { fontSize: 11, color: '#1E40AF', fontWeight: '600' },
  spendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  spendChipText: { fontSize: 11, color: '#0F766E' },

  actionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  actionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  actionsHeaderText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  actionsText: { fontSize: 12, color: '#475569', lineHeight: 17 },

  // Expense Tracker Styles
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  metricVal: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },
  metricSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  expenseActionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  logExpenseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    height: 42,
    borderRadius: 10,
  },
  logExpenseBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  contributeShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    height: 42,
    borderRadius: 10,
  },
  contributeShareBtnText: { color: '#15803D', fontSize: 13, fontWeight: 'bold' },

  purchaserSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  purchaserDesc: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12, lineHeight: 16 },
  emptySmallCard: { padding: 14, backgroundColor: '#F8FAFC', borderRadius: 8, alignItems: 'center' },
  emptySmallCardText: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },

  purchaserCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  purchaserCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  purchaserName: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  purchaserFlat: { fontSize: 11, color: '#64748B' },
  reimburseBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  reimburseBadgeGreenText: { fontSize: 11, fontWeight: 'bold', color: '#15803D' },
  reimburseBadgeGray: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reimburseBadgeGrayText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  purchaserNumbersRow: { flexDirection: 'row', gap: 14, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  purchaserNumText: { fontSize: 11, color: '#475569' },
  purchaserItemsList: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  purchaserItemsHeader: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 2 },
  purchaserItemLine: { fontSize: 11, color: '#334155' },

  expenseItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  expenseItemLeft: { flex: 1, marginRight: 10 },
  expenseCatChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  expenseCatChipText: { fontSize: 10, fontWeight: '700', color: '#1D4ED8' },
  expenseItemTitle: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  expenseItemSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  expenseItemNotes: { fontSize: 11, color: '#475569', fontStyle: 'italic', marginTop: 2 },
  expenseItemAmount: { fontSize: 14, fontWeight: 'bold', color: '#DC2626' },

  contribItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  contribName: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  contribSub: { fontSize: 11, color: '#6B7280' },
  contribAmount: { fontSize: 13, fontWeight: 'bold', color: '#16A34A' },

  // WhatsApp Broadcast Styles
  waBroadcastCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  waBroadcastHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  waBroadcastTitle: { fontSize: 15, fontWeight: 'bold', color: '#166534' },
  waBroadcastSub: { fontSize: 12, color: '#15803D', marginTop: 2, lineHeight: 17 },
  waActionButtonsRow: { flexDirection: 'row', gap: 10 },
  waSendBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    height: 42,
    borderRadius: 10,
  },
  waSendBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  waCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  waCopyBtnText: { color: '#15803D', fontSize: 13, fontWeight: 'bold' },

  waPreviewBubble: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  waPreviewText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1F2937',
    lineHeight: 18,
  },

  modalDoneBtn: {
    backgroundColor: '#F3F4F6',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalDoneBtnText: { color: '#374151', fontSize: 15, fontWeight: 'bold' },

  // Create Modal & Forms
  createModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
  },
  createModalTitle: { fontSize: 19, fontWeight: 'bold', color: '#0F172A' },
  createModalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  createScrollContent: { maxHeight: 500, marginTop: 10 },

  formLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 12, marginBottom: 6 },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  formInputMultiline: { height: 76, textAlignVertical: 'top', paddingTop: 10 },
  dateErrorText: { fontSize: 12, color: '#DC2626', marginTop: 4, fontWeight: '600' },

  catChipsScroll: { flexDirection: 'row', marginBottom: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  catChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  catChipTextActive: { color: '#FFFFFF' },

  datePresetsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  datePresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  datePresetChipActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  datePresetText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  datePresetTextActive: { color: '#1D4ED8', fontWeight: 'bold' },

  contribNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  contribNoteText: { fontSize: 12, color: '#15803D', flex: 1, lineHeight: 16 },

  formActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  formCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  formSubmitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSubmitBtnDisabled: { backgroundColor: '#94A3B8' },
  formSubmitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },

  settleUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  settleUpiBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  upiQuickPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  upiQuickPayBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800',
  },

  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 6,
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
    backgroundColor: '#1D4ED8',
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
  calendarScrollView: {
    flex: 1,
  },
  calendarScrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  eventLegendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  agendaSection: {
    marginTop: 18,
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  agendaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  agendaSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  proposeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  proposeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  calendarEmptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  calendarEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  calendarEmptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 290,
  },
});
