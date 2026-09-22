import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Platform, 
  Alert, 
  RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../../stores/authStore';
import { useTicketStore } from '../../stores/ticketStore';
import { useBazaarStore } from '../../stores/bazaarStore';
import { useResponsive } from '../../hooks/useResponsive';
import { COLORS } from '../../constants/colors';
import { TOUCH_TARGET } from '../../constants/theme';

import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { UpiPaymentScannerModal } from '../../components/payment/UpiPaymentScannerModal';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { BentoTile } from '../../components/ui/BentoTile';
import { BentoGrid } from '../../components/ui/BentoGrid';
import { DigitalGatePassTile } from '../../components/gate/DigitalGatePassTile';
import { SosPanicModal } from '../../components/sos/SosPanicModal';
import { ParcelPickupCard } from '../../components/parcel/ParcelPickupCard';
import { PollVoteCard } from '../../components/polls/PollVoteCard';
import { ReportWrongParkingModal } from '../../components/vehicle/ReportWrongParkingModal';
import { useDomesticStaffStore } from '../../stores/domesticStaffStore';
import { CabAutoBookingModal } from '../../components/transport/CabAutoBookingModal';
import { useCabStore, RideStatus } from '../../stores/cabStore';

export default function ResidentHome() {
  const insets = useSafeAreaInsets();
  const { isSmallPhone, isPhone, isTablet, isDesktop, containerPadding, tileGap, width } = useResponsive();
  const { user } = useAuthStore();
  const router = useRouter();
  const { tickets } = useTicketStore();
  const { cart } = useBazaarStore();
  
  const helpers = useDomesticStaffStore((s) => s.getHelpersForFlat(user?.flatNumber || 'B-204'));
  const insideHelper = helpers.find((h) => h.presence === 'INSIDE_SOCIETY');
  const activeCab = useCabStore((s) => s.getActiveBooking());

  const latestTicket = tickets[0] || {
    id: 'TK-1082',
    description: 'Master Bath Plumbing & Pressure Valve',
    category: 'PLUMBING',
    status: 'IN_PROGRESS',
    location: 'B-204 Bathroom',
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Interactive local states
  const [autoDebit, setAutoDebit] = useState(true);
  const [duesPaid, setDuesPaid] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [parkingModalVisible, setParkingModalVisible] = useState(false);
  const [cabModalVisible, setCabModalVisible] = useState(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const onRefresh = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    }, 1200);
  }, []);

  const handleToggleAutoDebit = (value: boolean) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setAutoDebit(value);
  };

  // Adaptive font size for hero currency to prevent clipping
  const heroAmountFontSize = isSmallPhone ? 28 : (isTablet || isDesktop) ? 42 : 34;

  return (
    <View style={styles.screen}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: containerPadding,
            paddingTop: Math.max(insets.top + 8, 16),
            paddingBottom: Math.max(insets.bottom + 24, 40),
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ================================================================= */}
        {/* TOP BRAND & COMMUNITY HEADER BAR                                 */}
        {/* ================================================================= */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.brandIconBox}>
              <Text style={styles.brandIconEmoji}>🏛️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.societyRow}>
                <Text style={styles.societyName} numberOfLines={1}>AMA Society</Text>
                <View style={styles.societyTag}>
                  <Text style={styles.societyTagText}>Orchid</Text>
                </View>
              </View>
              <Text style={styles.residentSubtitle} numberOfLines={1}>
                {user?.name || 'John Doe'} • {user?.flatNumber || 'Flat B-204'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity 
              style={styles.sosHeaderBtn} 
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                setSosModalVisible(true);
              }}
              accessibilityLabel="Emergency SOS"
              accessibilityRole="button"
            >
              <Ionicons name="warning" size={14} color="#FFFFFF" />
              <Text style={styles.sosHeaderBtnText}>SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.headerIconBtn} 
              onPress={() => {
                triggerHaptic();
                setEditModalVisible(true);
              }}
              accessibilityLabel="Edit Profile"
              accessibilityRole="button"
            >
              <Ionicons name="pencil-outline" size={18} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.headerIconBtn} 
              onPress={() => {
                triggerHaptic();
                router.push('/(resident)/profile');
              }}
              accessibilityLabel="View Profile"
              accessibilityRole="button"
            >
              <Ionicons name="person-outline" size={18} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.logoutIconBtn} 
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                setLogoutModalVisible(true);
              }}
              accessibilityLabel="Log Out"
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={18} color="#BE123C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================================= */}
        {/* RESPONSIVE BENTO BOX CONTAINER                                    */}
        {/* ================================================================= */}
        <BentoGrid>

          {/* 1. HERO TILE: Maintenance Dues & Financial Ledger */}
          <BentoTile color="white" style={styles.heroTile}>
            <View style={styles.tileHeader}>
              <View style={styles.liveBadgeRow}>
                <View style={[styles.statusDot, { backgroundColor: '#16A34A' }]} />
                <Text style={styles.tileCategoryText}>Maintenance &amp; Utilities</Text>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: '#E2EFE7' }]}>
                <Text style={[styles.pillBadgeText, { color: '#14532D' }]}>
                  {duesPaid ? 'All Clear' : 'Due in 12 Days'}
                </Text>
              </View>
            </View>

            <View style={styles.heroAmountBlock}>
              <Text style={styles.amountLabel}>Total Current Outstanding</Text>
              <View style={styles.amountRow}>
                <Text style={[styles.amountValue, { fontSize: heroAmountFontSize }]}>
                  {duesPaid ? '₹0' : '₹4,850'}
                </Text>
                {!duesPaid && (
                  <>
                    <Text style={styles.amountStrikethrough}>₹5,200</Text>
                    <View style={styles.discountTag}>
                      <Text style={styles.discountText}>-₹350 Early</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Itemized Pastel Breakdown Pills */}
            <View style={[styles.breakdownGrid, isSmallPhone && { flexDirection: 'column' }]}>
              <View style={[styles.breakdownPill, { backgroundColor: COLORS.PASTEL.cream.fill, borderColor: COLORS.PASTEL.cream.border }]}>
                <Text style={styles.breakdownTitle}>Society Maintenance</Text>
                <Text style={styles.breakdownAmount}>₹3,200</Text>
              </View>
              <View style={[styles.breakdownPill, { backgroundColor: COLORS.PASTEL.powder.fill, borderColor: COLORS.PASTEL.powder.border }]}>
                <Text style={styles.breakdownTitle}>Sinking Fund</Text>
                <Text style={styles.breakdownAmount}>₹1,150</Text>
              </View>
              <View style={[styles.breakdownPill, { backgroundColor: COLORS.PASTEL.peach.fill, borderColor: COLORS.PASTEL.peach.border }]}>
                <Text style={styles.breakdownTitle}>Mart Khata</Text>
                <Text style={styles.breakdownAmount}>₹500</Text>
              </View>
            </View>

            {/* Action Row: Auto-Debit Switch & Instant Pay Button */}
            <View style={[styles.heroFooterRow, isSmallPhone && { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={styles.switchRow}>
                <Switch 
                  value={autoDebit} 
                  onValueChange={handleToggleAutoDebit}
                  trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                  thumbColor={autoDebit ? '#4338CA' : '#94A3B8'}
                />
                <Text style={styles.switchLabel}>
                  {autoDebit ? 'Auto-Debit (UPI)' : 'Manual Mode'}
                </Text>
              </View>

              <View style={[styles.heroBtnGroup, isSmallPhone && { width: '100%', marginTop: 8 }]}>
                <TouchableOpacity 
                  style={styles.slipBtn}
                  onPress={() => {
                    triggerHaptic();
                    router.push('/(resident)/billing');
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.slipBtnText}>View Slips</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.payNowBtn, duesPaid && styles.paidBtn]}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    if (duesPaid) {
                      Alert.alert('Cleared', 'September maintenance dues are already paid!');
                    } else {
                      setUpiModalVisible(true);
                    }
                  }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.payNowBtnText}>
                    {duesPaid ? 'Cleared ✓' : 'Pay ₹4,850'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BentoTile>

          {/* 2. DIGITAL GATE PASS TILE */}
          <DigitalGatePassTile 
            residentName={user?.name || 'John Doe'}
            flatNumber={user?.flatNumber || 'Flat B-204'}
            pin="5821"
          />

          {/* 2B. PENDING GATE PARCELS */}
          <ParcelPickupCard flatNumber={user?.flatNumber || 'B-204'} />

          {/* 2C. DOMESTIC HELPER PRESENCE */}
          {insideHelper && (
            <BentoTile color="sage" style={styles.helperTile}>
              <View style={styles.helperRow}>
                <View style={styles.helperEmojiBox}>
                  <Text style={{ fontSize: 20 }}>🧹</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.helperTagRow}>
                    <Text style={styles.helperBadge}>STAFF IN SOCIETY</Text>
                    <View style={styles.pulseDot} />
                  </View>
                  <Text style={styles.helperName}>{insideHelper.name} ({insideHelper.category})</Text>
                  <Text style={styles.helperSub}>Inside society • Checked in at {insideHelper.currentGate || 'Gate 1'}</Text>
                </View>
              </View>
            </BentoTile>
          )}

          {/* 2D. ACTIVE SOCIETY CAB / AUTO RIDE */}
          {activeCab && (
            <BentoTile 
              color="lavender" 
              style={styles.activeCabTile}
              onPress={() => {
                triggerHaptic();
                setCabModalVisible(true);
              }}
              accessibilityRole="button"
            >
              <View style={styles.cabTileHeader}>
                <View style={styles.cabTileHeaderLeft}>
                  <View style={styles.cabEmojiBox}>
                    <Text style={{ fontSize: 22 }}>
                      {activeCab.rideType === 'AUTO' ? '🛺' : '🚗'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cabBadgeRow}>
                      <View style={styles.pulseDotGreen} />
                      <Text style={styles.cabStatusBadgeText}>
                        {activeCab.status === RideStatus.ASSIGNED && 'CAB ASSIGNED • EN ROUTE'}
                        {activeCab.status === RideStatus.ARRIVED_AT_GATE && 'CAB AT SECURITY GATE 1'}
                        {activeCab.status === RideStatus.INSIDE_CAMPUS && 'INSIDE CAMPUS • 15M TRANSIT'}
                        {activeCab.status === RideStatus.AT_PICKUP && 'DRIVER AT PORCH'}
                        {activeCab.status === RideStatus.IN_TRIP && 'TRIP IN PROGRESS'}
                      </Text>
                    </View>
                    <Text style={styles.cabDriverTitle}>
                      {activeCab.driver.name} ({activeCab.driver.vehicleNumber})
                    </Text>
                    <Text style={styles.cabDestSub} numberOfLines={1}>
                      To: {activeCab.destination} • Fare: ₹{activeCab.estimatedFare}
                    </Text>
                  </View>
                </View>
                <View style={styles.cabPassBadge}>
                  <Text style={styles.cabPassBadgeText}>{activeCab.passCode}</Text>
                  <Text style={styles.cabPinText}>PIN: {activeCab.gatePin}</Text>
                </View>
              </View>

              <View style={styles.cabTileFooter}>
                <Text style={styles.cabFooterHint}>Show pass at Gate 1 boom barrier</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    style={styles.cabTrackBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      router.push('/(resident)/tracking' as any);
                    }}
                  >
                    <Ionicons name="navigate" size={11} color="#FFFFFF" />
                    <Text style={styles.cabTrackBtnText}>Live Map</Text>
                  </TouchableOpacity>
                  <Text style={styles.cabFooterAction}>Pass &rarr;</Text>
                </View>
              </View>
            </BentoTile>
          )}

          {/* 3. ROW OF 2 TILES: Active Service Ticket & Bazaar Mart */}
          <View style={[styles.twoColumnRow, isSmallPhone && { flexDirection: 'column' }]}>
            
            {/* Tile 3A: Active Work Order Ticket */}
            <BentoTile 
              color="peach" 
              style={styles.halfTile}
              onPress={() => router.push('/(resident)/tickets')}
              accessibilityRole="button"
            >
              <View style={styles.tileHeader}>
                <View style={[styles.tileIconCircle, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="construct-outline" size={16} color="#7C2D12" />
                </View>
                <View style={[styles.pillBadge, { backgroundColor: '#FED7AA' }]}>
                  <Text style={[styles.pillBadgeText, { color: '#7C2D12' }]}>In Progress</Text>
                </View>
              </View>

              <View style={{ marginVertical: 6 }}>
                <Text style={styles.ticketTitle} numberOfLines={1}>
                  {latestTicket.description}
                </Text>
                <Text style={styles.ticketSub} numberOfLines={1}>
                  Technician Ramesh assigned • ETA 12 mins
                </Text>
              </View>

              <View style={styles.tileBottomAction}>
                <Text style={styles.ticketIdText}>#{latestTicket.id}</Text>
                <Text style={styles.actionArrowText}>Track &rarr;</Text>
              </View>
            </BentoTile>

            {/* Tile 3B: Bazaar Mart Cart Tile */}
            <BentoTile 
              color="powder" 
              style={styles.halfTile}
              onPress={() => router.push('/(resident)/bazaar' as any)}
              accessibilityRole="button"
            >
              <View style={styles.tileHeader}>
                <View style={[styles.tileIconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="cart-outline" size={16} color="#1E3A8A" />
                </View>
                <View style={[styles.pillBadge, { backgroundColor: '#BFDBFE' }]}>
                  <Text style={[styles.pillBadgeText, { color: '#1E3A8A' }]}>
                    {cartItemCount > 0 ? `${cartItemCount} in Cart` : 'Mart Open'}
                  </Text>
                </View>
              </View>

              <View style={{ marginVertical: 6 }}>
                <Text style={styles.ticketTitle} numberOfLines={1}>
                  Orchid Mart Basket
                </Text>
                <Text style={styles.ticketSub} numberOfLines={1}>
                  {cartItemCount > 0 ? `Total: ₹${cartSubtotal} • 15m Delivery` : 'Farm Milk, Sourdough, Groceries'}
                </Text>
              </View>

              <View style={styles.tileBottomAction}>
                <Text style={styles.ticketIdText}>Free Delivery</Text>
                <Text style={[styles.actionArrowText, { color: '#1E3A8A' }]}>Order &rarr;</Text>
              </View>
            </BentoTile>

          </View>

          {/* 4. FACILITY RESERVATION TILE */}
          <BentoTile 
            color="sage" 
            style={styles.wideTile}
            onPress={() => router.push('/(resident)/community/facilities')}
            accessibilityRole="button"
          >
            <View style={styles.tileHeader}>
              <View style={styles.amenityRow}>
                <View style={[styles.tileIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="tennisball-outline" size={18} color="#14532D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.amenityTitle} numberOfLines={1}>Badminton Court 1</Text>
                  <Text style={styles.amenitySubtitle} numberOfLines={1}>Today • 07:00 PM – 08:00 PM</Text>
                </View>
              </View>
              <View style={styles.pinTag}>
                <Text style={styles.pinTagText}>PIN: 9142</Text>
              </View>
            </View>

            {/* Visual Timeline Bar */}
            <View style={styles.timelineBox}>
              <View style={styles.timelineLabels}>
                <Text style={styles.timelineLabelText}>Morning: Cleaned</Text>
                <Text style={[styles.timelineLabelText, { color: '#14532D', fontWeight: '700' }]}>Your Slot (60m)</Text>
                <Text style={styles.timelineLabelText}>Evening: Open</Text>
              </View>
              <View style={styles.timelineTrack}>
                <View style={[styles.timelineFill, { width: '30%', backgroundColor: '#CBD5E1' }]} />
                <View style={[styles.timelineFill, { width: '35%', backgroundColor: '#16A34A' }]} />
                <View style={[styles.timelineFill, { width: '35%', backgroundColor: '#FFFFFF' }]} />
              </View>
            </View>

            <View style={styles.tileBottomAction}>
              <Text style={styles.locationText}>Clubhouse Ground Floor</Text>
              <Text style={[styles.actionArrowText, { color: '#14532D' }]}>Book Another Slot &rarr;</Text>
            </View>
          </BentoTile>

          {/* 5. COMMUNITY SOCIAL & POLL TILE */}
          <PollVoteCard userId={user?.id || 'u-1'} />

          {/* 6. QUICK ACTION LAUNCHPAD PILLS */}
          <View style={styles.quickLaunchpad}>
            <Text style={styles.launchpadTitle}>Quick Services</Text>
            <View style={styles.launchpadRow}>
              <QuickActionPill 
                icon="call-outline" 
                label="Intercom" 
                color="#0D9488" 
                onPress={() => {
                  triggerHaptic();
                  router.push('/(resident)/community/directory' as any);
                }} 
              />
              <QuickActionPill 
                icon="storefront-outline" 
                label="Bazaar" 
                color="#2563EB" 
                onPress={() => {
                  triggerHaptic();
                  router.push('/(resident)/bazaar' as any);
                }} 
              />
              <QuickActionPill 
                icon="build-outline" 
                label="Ticket" 
                color="#4338CA" 
                onPress={() => {
                  triggerHaptic();
                  router.push('/(resident)/tickets/new');
                }} 
              />
              <QuickActionPill 
                icon="calendar-outline" 
                label="Booking" 
                color="#16A34A" 
                onPress={() => {
                  triggerHaptic();
                  router.push('/(resident)/community/facilities');
                }} 
              />
              <QuickActionPill 
                icon="card-outline" 
                label="Bills" 
                color="#D97706" 
                onPress={() => {
                  triggerHaptic();
                  router.push('/(resident)/billing');
                }} 
              />
              <QuickActionPill 
                icon="scan-outline" 
                label="UPI Pay" 
                color="#059669" 
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  setUpiModalVisible(true);
                }} 
              />
              <QuickActionPill 
                icon="people-outline" 
                label="Events" 
                color="#E11D48" 
                onPress={() => {
                  triggerHaptic();
                  router.push('/(resident)/community/events');
                }} 
              />
              <QuickActionPill 
                icon="warning-outline" 
                label="SOS" 
                color="#BE123C" 
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                  setSosModalVisible(true);
                }} 
              />
              <QuickActionPill 
                icon="car-sport-outline" 
                label="Parking" 
                color="#C2410C" 
                onPress={() => {
                  triggerHaptic();
                  setParkingModalVisible(true);
                }} 
              />
              <QuickActionPill 
                icon="car-outline" 
                label="Cab / Auto" 
                color="#4338CA" 
                onPress={() => {
                  triggerHaptic();
                  setCabModalVisible(true);
                }} 
              />
              <QuickActionPill 
                icon="navigate-outline" 
                label="Live Track" 
                color="#4285F4" 
                onPress={() => {
                  triggerHaptic();
                  router.push('/(resident)/tracking' as any);
                }} 
              />
            </View>
          </View>

        </BentoGrid>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ================================================================= */}
      {/* POPUP & ACTION MODALS                                             */}
      {/* ================================================================= */}
      <EditProfileModal 
        visible={editModalVisible} 
        onClose={() => setEditModalVisible(false)} 
      />

      <UpiPaymentScannerModal
        visible={upiModalVisible}
        onClose={() => {
          setUpiModalVisible(false);
          setDuesPaid(true);
        }}
        initialMode="RECEIVE"
        defaultAmount={4850}
      />

      <LogoutConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />

      <SosPanicModal
        visible={sosModalVisible}
        onClose={() => setSosModalVisible(false)}
      />

      <ReportWrongParkingModal
        visible={parkingModalVisible}
        onClose={() => setParkingModalVisible(false)}
      />

      <CabAutoBookingModal
        visible={cabModalVisible}
        onClose={() => setCabModalVisible(false)}
      />
    </View>
  );
}

interface QuickActionPillProps {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}

function QuickActionPill({ icon, label, color, onPress }: QuickActionPillProps) {
  return (
    <TouchableOpacity 
      style={styles.pillActionBtn} 
      onPress={onPress} 
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.pillIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.pillActionLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Dynamic padding set inline via useSafeAreaInsets & useResponsive
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EBE7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconEmoji: {
    fontSize: 22,
  },
  societyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  societyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  societyTag: {
    backgroundColor: '#E2EFE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  societyTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  residentSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    minWidth: TOUCH_TARGET.minWidth,
    minHeight: TOUCH_TARGET.minHeight,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconBtn: {
    minWidth: TOUCH_TARGET.minWidth,
    minHeight: TOUCH_TARGET.minHeight,
    borderRadius: 14,
    backgroundColor: '#FFF0F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTile: {
    padding: 18,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#64748B',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroAmountBlock: {
    marginVertical: 4,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  amountValue: {
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  amountStrikethrough: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  breakdownPill: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: TOUCH_TARGET.minHeight,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  heroBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slipBtn: {
    minHeight: TOUCH_TARGET.minHeight,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  payNowBtn: {
    minHeight: TOUCH_TARGET.minHeight,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  paidBtn: {
    backgroundColor: '#16A34A',
  },
  payNowBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfTile: {
    flex: 1,
    padding: 16,
  },
  wideTile: {
    padding: 18,
  },
  tileIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  ticketSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tileBottomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  ticketIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  actionArrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C2D12',
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  amenityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  amenitySubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  pinTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C6E2D1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pinTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#14532D',
  },
  timelineBox: {
    marginVertical: 10,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  timelineTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  timelineFill: {
    height: '100%',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#14532D',
  },
  pollTagline: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#881337',
    letterSpacing: 0.5,
  },
  pollPercentText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#881337',
  },
  pollButtonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  pollVoteBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  pollVoteBtnActive: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FB7185',
  },
  pollVoteEmoji: {
    fontSize: 14,
  },
  pollVoteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#881337',
  },
  votersCountText: {
    fontSize: 10,
    color: '#64748B',
  },
  quickLaunchpad: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  launchpadTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#64748B',
    marginBottom: 12,
  },
  launchpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillActionBtn: {
    width: '30%',
    minHeight: 64,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pillActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  sosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#BE123C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sosHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  helperTile: {
    marginVertical: 4,
    padding: 14,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helperEmojiBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helperBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  helperName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  helperSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1,
  },
  activeCabTile: {
    marginVertical: 4,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#4338CA',
  },
  cabTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cabTileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cabEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pulseDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  cabStatusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  cabDriverTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cabDestSub: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
    marginTop: 1,
  },
  cabPassBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  cabPassBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4338CA',
  },
  cabPinText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 1,
  },
  cabTileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.15)',
    marginTop: 12,
    paddingTop: 8,
  },
  cabFooterHint: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cabFooterAction: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  cabTrackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4285F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cabTrackBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
