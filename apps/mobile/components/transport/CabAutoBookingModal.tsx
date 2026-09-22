import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useCabStore,
  RideType,
  RideStatus,
  RIDE_TIERS,
  SOCIETY_PICKUP_POINTS,
  POPULAR_DESTINATIONS,
  calculateEstimatedFare,
  CabBooking,
} from '../../stores/cabStore';
import { useAuthStore } from '../../stores/authStore';
import { LiveTrackingModal } from './LiveTrackingModal';

interface CabAutoBookingModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'book' | 'active';
}

export function CabAutoBookingModal({
  visible,
  onClose,
}: CabAutoBookingModalProps) {
  const { user } = useAuthStore();
  const {
    selectedRideType,
    setSelectedRideType,
    selectedPickupId,
    setSelectedPickupId,
    selectedDestinationId,
    setSelectedDestinationId,
    customDestination,
    setCustomDestination,
    bookRide,
    cancelBooking,
    updateBookingStatus,
    verifyGateInward,
    getActiveBooking,
  } = useCabStore();

  const activeBooking = getActiveBooking();

  // If there's an active booking, default to 'active', otherwise 'book'
  const [activeTab, setActiveTab] = useState<'book' | 'active'>('book');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [liveMapVisible, setLiveMapVisible] = useState(false);

  // Sync tab when opening
  React.useEffect(() => {
    if (visible) {
      if (activeBooking) {
        setActiveTab('active');
      } else {
        setActiveTab('book');
      }
    }
  }, [visible, !!activeBooking]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  // Selected destination info
  const popularDest = POPULAR_DESTINATIONS.find((d) => d.id === selectedDestinationId);
  const currentDistKm = popularDest ? popularDest.distanceKm : 8.5;
  const currentDurationMins = popularDest ? popularDest.durationMins : 20;
  const estimatedFare = calculateEstimatedFare(selectedRideType, currentDistKm);

  const selectedPickup =
    SOCIETY_PICKUP_POINTS.find((p) => p.id === selectedPickupId) ||
    SOCIETY_PICKUP_POINTS[0];

  const handleConfirmBooking = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const destinationTitle = customDestination.trim() || (popularDest ? popularDest.title : "Kempegowda Int'l Airport (BLR)");

    const newBooking = bookRide({
      rideType: selectedRideType,
      pickupPointId: selectedPickupId,
      destinationName: destinationTitle,
      distanceKm: currentDistKm,
      residentName: user?.name || 'Aditya Sharma',
      residentFlat: user?.flatNumber || 'B-204',
      residentPhone: user?.phone || '+91 98765 43210',
    });

    setActiveTab('active');
  };

  const handleCopy = (text: string, isCode: boolean) => {
    triggerHaptic();
    if (isCode) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      Alert.alert('Copied to Clipboard', text);
    }
  };

  const handleShareWhatsApp = (booking: CabBooking) => {
    triggerHaptic();
    const text = `🚕 *AMA Society Gate Transit Pass*\n\n` +
      `Hello ${booking.driver.name},\n` +
      `Your gate clearance code for AMA Grand Estate is *${booking.passCode}* (PIN: *${booking.gatePin}*).\n\n` +
      `📍 *Pickup Porch:* ${booking.pickupPoint.name}\n` +
      `🚪 *Recommended Gate:* ${booking.pickupPoint.gateRecommendation}\n` +
      `👤 *Resident:* ${booking.residentName} (${booking.residentFlat})\n` +
      `⏱️ *Transit Window:* 15 minutes campus limit (Max 15 km/h).\n\n` +
      `Please show this pass code to the security guard at the boom barrier for instant automated entry!`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = booking.driver.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Gate Pass Text', text);
      });
    }
  };

  const handleCallDriver = (phone: string) => {
    triggerHaptic();
    const url = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Driver Phone', phone);
      });
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleBlock}>
              <View style={styles.brandIcon}>
                <Text style={{ fontSize: 20 }}>🛺</Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>Society Cab &amp; Auto</Text>
                <Text style={styles.modalSubtitle}>Ride Hailing &amp; Digital Gate Transit Pass</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'book' && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic();
                setActiveTab('book');
              }}
            >
              <Ionicons
                name="car-outline"
                size={16}
                color={activeTab === 'book' ? '#4338CA' : '#64748B'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'book' && styles.tabBtnTextActive]}>
                Book a Ride
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
              onPress={() => {
                triggerHaptic();
                setActiveTab('active');
              }}
            >
              <Ionicons
                name="ticket-outline"
                size={16}
                color={activeTab === 'active' ? '#4338CA' : '#64748B'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'active' && styles.tabBtnTextActive]}>
                Active Ride &amp; Pass {activeBooking && '• 1'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'book' ? (
              /* ================= BOOKING FLOW ================= */
              <View>
                {/* 1. Pick Pickup Point */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>1. SELECT SOCIETY PICKUP POINT</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {SOCIETY_PICKUP_POINTS.map((pt) => {
                      const isSelected = pt.id === selectedPickupId;
                      return (
                        <TouchableOpacity
                          key={pt.id}
                          style={[styles.pickupChip, isSelected && styles.pickupChipSelected]}
                          onPress={() => {
                            triggerHaptic();
                            setSelectedPickupId(pt.id);
                          }}
                        >
                          <Ionicons
                            name="location-sharp"
                            size={14}
                            color={isSelected ? '#4338CA' : '#64748B'}
                          />
                          <Text style={[styles.pickupChipText, isSelected && styles.pickupChipTextSelected]}>
                            {pt.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.pickupHelperText}>
                    📍 {selectedPickup.landmark} • {selectedPickup.gateRecommendation}
                  </Text>
                </View>

                {/* 2. Pick Destination */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>2. POPULAR DESTINATIONS</Text>
                  <View style={styles.destGrid}>
                    {POPULAR_DESTINATIONS.map((dest) => {
                      const isSelected = selectedDestinationId === dest.id && !customDestination;
                      return (
                        <TouchableOpacity
                          key={dest.id}
                          style={[styles.destCard, isSelected && styles.destCardSelected]}
                          onPress={() => {
                            triggerHaptic();
                            setSelectedDestinationId(dest.id);
                            setCustomDestination('');
                          }}
                        >
                          <View style={styles.destCardHeader}>
                            <View style={[styles.destIconBox, isSelected && styles.destIconBoxSelected]}>
                              <Ionicons
                                name={dest.icon as any}
                                size={16}
                                color={isSelected ? '#FFFFFF' : '#4338CA'}
                              />
                            </View>
                            <Text style={styles.destDistanceBadge}>{dest.distanceKm} km</Text>
                          </View>
                          <Text style={styles.destCardTitle} numberOfLines={1}>{dest.title}</Text>
                          <Text style={styles.destCardSub} numberOfLines={1}>{dest.subtitle}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Destination Input */}
                  <View style={styles.customInputBox}>
                    <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.customTextInput}
                      placeholder="Or enter custom destination address..."
                      placeholderTextColor="#94A3B8"
                      value={customDestination}
                      onChangeText={(val) => {
                        setCustomDestination(val);
                        if (val) setSelectedDestinationId(null);
                      }}
                    />
                    {customDestination.length > 0 && (
                      <TouchableOpacity onPress={() => setCustomDestination('')}>
                        <Ionicons name="close-circle" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* 3. Choose Ride Tier */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>3. SELECT RIDE VEHICLE TYPE</Text>
                  <View style={styles.tierContainer}>
                    {Object.values(RIDE_TIERS).map((tier) => {
                      const isSelected = selectedRideType === tier.type;
                      const fare = calculateEstimatedFare(tier.type, currentDistKm);

                      return (
                        <TouchableOpacity
                          key={tier.type}
                          style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                          onPress={() => {
                            triggerHaptic();
                            setSelectedRideType(tier.type);
                          }}
                        >
                          <View style={styles.tierLeft}>
                            <View style={styles.tierEmojiCircle}>
                              <Text style={{ fontSize: 24 }}>{tier.emoji}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.tierTitle}>{tier.title}</Text>
                                <View style={styles.capacityBadge}>
                                  <Text style={styles.capacityText}>{tier.capacity}</Text>
                                </View>
                              </View>
                              <Text style={styles.tierSub}>{tier.subtitle}</Text>
                              <Text style={styles.tierEta}>⚡ Driver ETA: {tier.baseEtaMins} mins at Gate 1</Text>
                            </View>
                          </View>

                          <View style={styles.tierRight}>
                            <Text style={styles.tierFare}>₹{fare}</Text>
                            <Text style={styles.tierRate}>₹{tier.perKmRate}/km</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Summary & Confirm Button */}
                <View style={styles.confirmBox}>
                  <View style={styles.summaryRow}>
                    <View>
                      <Text style={styles.summaryLabel}>Estimated Trip Total</Text>
                      <Text style={styles.summaryFare}>₹{estimatedFare}</Text>
                      <Text style={styles.summaryDetails}>
                        {currentDistKm} km • ~{currentDurationMins} mins drive
                      </Text>
                    </View>
                    <View style={styles.gatePassNotice}>
                      <Ionicons name="shield-checkmark" size={14} color="#059669" />
                      <Text style={styles.gatePassNoticeText}>Includes Gate Pass</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.bookNowBtn}
                    onPress={handleConfirmBooking}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.bookNowBtnText}>
                      Confirm &amp; Issue Gate Pass &rarr;
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* ================= ACTIVE RIDE & PASS VIEW ================= */
              <View>
                {activeBooking ? (
                  <View>
                    {/* Status Badge */}
                    <View style={styles.statusBanner}>
                      <View style={styles.statusLeft}>
                        <View
                          style={[
                            styles.statusDotLive,
                            activeBooking.status === RideStatus.INSIDE_CAMPUS && { backgroundColor: '#10B981' },
                            activeBooking.status === RideStatus.ARRIVED_AT_GATE && { backgroundColor: '#F59E0B' },
                          ]}
                        />
                        <View>
                          <Text style={styles.statusBannerTitle}>
                            {activeBooking.status === RideStatus.ASSIGNED && 'Driver Assigned • Heading to Gate'}
                            {activeBooking.status === RideStatus.ARRIVED_AT_GATE && 'Arrived at Security Gate • Awaiting Entry'}
                            {activeBooking.status === RideStatus.INSIDE_CAMPUS && 'Inside Campus • 15m Transit Active'}
                            {activeBooking.status === RideStatus.AT_PICKUP && 'Driver at Pickup Porch'}
                            {activeBooking.status === RideStatus.IN_TRIP && 'Trip In Progress'}
                          </Text>
                          <Text style={styles.statusBannerSub}>
                            Booking #{activeBooking.bookingCode} • {activeBooking.driver.currentEtaMins} mins away
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Driver Card */}
                    <View style={styles.driverCard}>
                      <View style={styles.driverHeader}>
                        <View style={styles.driverAvatar}>
                          <Text style={{ fontSize: 26 }}>{activeBooking.driver.photoEmoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.driverName}>{activeBooking.driver.name}</Text>
                            <View style={styles.ratingBadge}>
                              <Ionicons name="star" size={12} color="#D97706" />
                              <Text style={styles.ratingText}>{activeBooking.driver.rating}</Text>
                            </View>
                          </View>
                          <Text style={styles.carModelText}>
                            {activeBooking.driver.vehicleModel} • {activeBooking.driver.vehicleColor}
                          </Text>
                          <View style={styles.plateNumberBox}>
                            <Text style={styles.plateNumberText}>{activeBooking.driver.vehicleNumber}</Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.callDriverBtn}
                          onPress={() => handleCallDriver(activeBooking.driver.phone)}
                        >
                          <Ionicons name="call" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Digital Gate Transit Pass Card */}
                    <View style={styles.gatePassCard}>
                      <View style={styles.passHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="shield-checkmark" size={18} color="#4338CA" />
                          <Text style={styles.gatePassTitle}>DIGITAL GATE TRANSIT PASS</Text>
                        </View>
                        <View style={styles.transitWindowBadge}>
                          <Ionicons name="speedometer-outline" size={12} color="#1E3A8A" />
                          <Text style={styles.transitWindowText}>15m Campus Limit</Text>
                        </View>
                      </View>

                      {/* QR and Code Row */}
                      <View style={styles.qrRow}>
                        <Image
                          source={{
                            uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=AMA-CAB:${activeBooking.passCode}:${activeBooking.gatePin}:${activeBooking.driver.vehicleNumber}`,
                          }}
                          style={styles.qrImage}
                        />

                        <View style={styles.passDetailsColumn}>
                          <Text style={styles.passDetailLabel}>Gate Pass Code</Text>
                          <View style={styles.codePillRow}>
                            <Text style={styles.codeText}>{activeBooking.passCode}</Text>
                            <TouchableOpacity
                              style={styles.copyPillBtn}
                              onPress={() => handleCopy(activeBooking.passCode, true)}
                            >
                              <Ionicons
                                name={copiedCode ? 'checkmark' : 'copy-outline'}
                                size={14}
                                color="#4338CA"
                              />
                            </TouchableOpacity>
                          </View>

                          <Text style={[styles.passDetailLabel, { marginTop: 10 }]}>Driver Entry PIN</Text>
                          <View style={styles.codePillRow}>
                            <Text style={styles.pinText}>{activeBooking.gatePin}</Text>
                            <TouchableOpacity
                              style={styles.copyPillBtn}
                              onPress={() => handleCopy(activeBooking.gatePin, false)}
                            >
                              <Ionicons
                                name={copiedPin ? 'checkmark' : 'copy-outline'}
                                size={14}
                                color="#4338CA"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Pickup Info Banner */}
                      <View style={styles.pickupBanner}>
                        <Ionicons name="navigate-circle-outline" size={16} color="#047857" />
                        <Text style={styles.pickupBannerText} numberOfLines={2}>
                          Pickup: {activeBooking.pickupPoint.name} (Dest: {activeBooking.destination})
                        </Text>
                      </View>

                      {/* WhatsApp Share Button */}
                      <TouchableOpacity
                        style={styles.whatsappBtn}
                        onPress={() => handleShareWhatsApp(activeBooking)}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                        <Text style={styles.whatsappBtnText}>Send Pass to Driver via WhatsApp</Text>
                      </TouchableOpacity>

                      {/* Live Google Maps Tracking Button */}
                      <TouchableOpacity
                        style={styles.liveMapBtn}
                        onPress={() => {
                          triggerHaptic();
                          setLiveMapVisible(true);
                        }}
                      >
                        <Ionicons name="navigate" size={18} color="#FFFFFF" />
                        <Text style={styles.liveMapBtnText}>Track Live on Google Maps</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Simulation & Testing Control Panel */}
                    <View style={styles.simBox}>
                      <Text style={styles.simBoxTitle}>⚡ Interactive Lifecycle Simulator</Text>
                      <View style={styles.simBtnRow}>
                        <TouchableOpacity
                          style={styles.simBtn}
                          onPress={() => {
                            triggerHaptic();
                            updateBookingStatus(activeBooking.id, RideStatus.ARRIVED_AT_GATE);
                          }}
                        >
                          <Text style={styles.simBtnText}>At Gate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.simBtn, { backgroundColor: '#10B981' }]}
                          onPress={() => {
                            triggerHaptic();
                            verifyGateInward(activeBooking.passCode);
                          }}
                        >
                          <Text style={styles.simBtnText}>Guard Inward</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.simBtn}
                          onPress={() => {
                            triggerHaptic();
                            updateBookingStatus(activeBooking.id, RideStatus.AT_PICKUP);
                          }}
                        >
                          <Text style={styles.simBtnText}>At Porch</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.simBtn, { backgroundColor: '#4338CA' }]}
                          onPress={() => {
                            triggerHaptic();
                            updateBookingStatus(activeBooking.id, RideStatus.COMPLETED);
                            setActiveTab('book');
                          }}
                        >
                          <Text style={styles.simBtnText}>Complete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                        cancelBooking(activeBooking.id);
                        setActiveTab('book');
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={{ fontSize: 40, marginBottom: 8 }}>🚖</Text>
                    <Text style={styles.emptyTitle}>No Active Rides</Text>
                    <Text style={styles.emptySub}>
                      You don't have any ongoing cab or auto rides right now.
                    </Text>
                    <TouchableOpacity
                      style={styles.bookNewBtn}
                      onPress={() => setActiveTab('book')}
                    >
                      <Text style={styles.bookNewBtnText}>Book a Cab / Auto &rarr;</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>

    <LiveTrackingModal
      visible={liveMapVisible}
      onClose={() => setLiveMapVisible(false)}
      defaultTripType={activeBooking?.rideType === RideType.AUTO ? 'AUTO' : 'CAB'}
    />
  </>
);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#4338CA',
  },
  scrollBody: {
    maxHeight: 600,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pickupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickupChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  pickupChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pickupChipTextSelected: {
    color: '#4338CA',
  },
  pickupHelperText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  destGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  destCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  destCardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  destCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  destIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destIconBoxSelected: {
    backgroundColor: '#7C3AED',
  },
  destDistanceBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  destCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  destCardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  customInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  tierContainer: {
    gap: 10,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
  },
  tierCardSelected: {
    backgroundColor: '#F8FAFC',
    borderColor: '#4338CA',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  tierEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  capacityBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  capacityText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tierSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tierEta: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 3,
  },
  tierRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  tierFare: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  tierRate: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  confirmBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  summaryFare: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 2,
  },
  summaryDetails: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  gatePassNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gatePassNoticeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  bookNowBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDotLive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  statusBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  statusBannerSub: {
    fontSize: 11.5,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 2,
  },
  driverCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  carModelText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  plateNumberBox: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  plateNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 1,
  },
  callDriverBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gatePassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4338CA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  passHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  gatePassTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  transitWindowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transitWindowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  qrImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  passDetailsColumn: {
    flex: 1,
  },
  passDetailLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 3,
  },
  codePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  pinText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.5,
  },
  copyPillBtn: {
    padding: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  pickupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  pickupBannerText: {
    fontSize: 11.5,
    color: '#065F46',
    fontWeight: '700',
    flex: 1,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  whatsappBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  liveMapBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  simBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  simBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  simBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  simBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 240,
  },
  bookNewBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookNewBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
