import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCabStore, RIDE_TIERS, RideType, RideStatus } from '../../stores/cabStore';
import { CabAutoBookingModal } from '../../components/transport/CabAutoBookingModal';

export default function ResidentCabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookings, getActiveBooking, setSelectedRideType } = useCabStore();
  const activeBooking = getActiveBooking();

  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleOpenBooking = (type?: RideType) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (type) {
      setSelectedRideType(type);
    }
    setBookingModalVisible(true);
  };

  const handleCallHotline = (number: string, label: string) => {
    triggerHaptic();
    const url = `tel:${number}`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert(label, `Contact number: ${number}`);
      });
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            triggerHaptic();
            router.back();
          }}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Society Cabs &amp; Autos</Text>
          <Text style={styles.headerSubtitle}>Fast Gate Clearance &amp; Local Auto Stand</Text>
        </View>

        <TouchableOpacity
          style={styles.bookIconBtn}
          onPress={() => handleOpenBooking()}
          accessibilityLabel="Book a Ride"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Booking Banner */}
        {activeBooking && (
          <View style={styles.activeCard}>
            <View style={styles.activeCardTop}>
              <View style={styles.livePulseDot} />
              <Text style={styles.activeCardStatus}>
                {activeBooking.status === RideStatus.ASSIGNED && 'DRIVER ASSIGNED • EN ROUTE'}
                {activeBooking.status === RideStatus.ARRIVED_AT_GATE && 'CAB AT SECURITY GATE 1'}
                {activeBooking.status === RideStatus.INSIDE_CAMPUS && 'INSIDE CAMPUS • 15M TRANSIT'}
                {activeBooking.status === RideStatus.AT_PICKUP && 'ARRIVED AT PORCH'}
                {activeBooking.status === RideStatus.IN_TRIP && 'TRIP IN PROGRESS'}
              </Text>
              <View style={styles.passCodeBadge}>
                <Text style={styles.passCodeBadgeText}>{activeBooking.passCode}</Text>
              </View>
            </View>

            <View style={styles.activeDriverRow}>
              <View style={styles.activeAvatar}>
                <Text style={{ fontSize: 24 }}>{activeBooking.driver.photoEmoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeDriverName}>{activeBooking.driver.name}</Text>
                <Text style={styles.activeVehicleText}>
                  {activeBooking.driver.vehicleModel} • {activeBooking.driver.vehicleNumber}
                </Text>
                <Text style={styles.activeDestText}>
                  To: {activeBooking.destination} (₹{activeBooking.estimatedFare})
                </Text>
              </View>
            </View>

            <View style={styles.activeCardActions}>
              <TouchableOpacity
                style={styles.viewPassBtn}
                onPress={() => {
                  triggerHaptic();
                  setBookingModalVisible(true);
                }}
              >
                <Ionicons name="qr-code-outline" size={16} color="#4338CA" />
                <Text style={styles.viewPassBtnText}>View Gate Pass &amp; QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hero Booking CTA */}
        <View style={styles.heroBox}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroHeading}>Need a Ride from Society?</Text>
            <Text style={styles.heroSub}>
              Hassle-free auto rickshaws &amp; pre-cleared cabs. Pre-issued gate pass avoids delay at the boom barrier.
            </Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => handleOpenBooking()}
              activeOpacity={0.85}
            >
              <Text style={styles.heroBtnText}>Book a Cab / Auto &rarr;</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroEmojiBox}>
            <Text style={{ fontSize: 44 }}>🛺</Text>
          </View>
        </View>

        {/* Quick Vehicle Types */}
        <Text style={styles.sectionHeader}>SELECT VEHICLE TYPE</Text>
        <View style={styles.typeGrid}>
          {Object.values(RIDE_TIERS).map((tier) => (
            <TouchableOpacity
              key={tier.type}
              style={styles.typeCard}
              onPress={() => handleOpenBooking(tier.type)}
              activeOpacity={0.8}
            >
              <View style={styles.typeIconBox}>
                <Text style={{ fontSize: 28 }}>{tier.emoji}</Text>
              </View>
              <Text style={styles.typeCardTitle}>{tier.title}</Text>
              <Text style={styles.typeCardSub}>From ₹{tier.baseFare}</Text>
              <View style={styles.typeEtaPill}>
                <Text style={styles.typeEtaText}>⚡ {tier.baseEtaMins}m ETA</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Society Auto Stand Hotlines */}
        <Text style={styles.sectionHeader}>SOCIETY TRANSPORT HELPDESK</Text>
        <View style={styles.hotlineCard}>
          <View style={styles.hotlineRow}>
            <View style={styles.hotlineIcon}>
              <Ionicons name="call" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotlineTitle}>Gate 1 Auto Stand Roster</Text>
              <Text style={styles.hotlineSub}>Verified local society auto drivers on call</Text>
            </View>
            <TouchableOpacity
              style={styles.dialBtn}
              onPress={() => handleCallHotline('+91 98450 99881', 'Gate 1 Auto Stand')}
            >
              <Text style={styles.dialBtnText}>Call</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.hotlineRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10, paddingTop: 10 }]}>
            <View style={styles.hotlineIcon}>
              <Ionicons name="headset" size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotlineTitle}>Quick Cab Helpdesk (Security)</Text>
              <Text style={styles.hotlineSub}>For cab gate delays or vehicle clearance assistance</Text>
            </View>
            <TouchableOpacity
              style={styles.dialBtn}
              onPress={() => handleCallHotline('+91 98450 99882', 'Security Gate Desk')}
            >
              <Text style={styles.dialBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Campus Rules Notice */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesHeader}>
            <Ionicons name="information-circle" size={18} color="#0284C7" />
            <Text style={styles.rulesTitle}>Society Transit Policy &amp; Security Compliance</Text>
          </View>
          <Text style={styles.rulesText}>
            • Maximum speed limit inside society campus is <Text style={{ fontWeight: '800' }}>15 km/h</Text>.{'\n'}
            • Transit vehicles are granted a <Text style={{ fontWeight: '800' }}>15-minute entry window</Text> for passenger pickup and exit.{'\n'}
            • Gate PIN or digital QR pass must be shown at the boom barrier for entry.
          </Text>
        </View>

        {/* Recent Ride History */}
        <Text style={styles.sectionHeader}>RECENT TRIPS &amp; PASSES</Text>
        <View style={styles.historyList}>
          {bookings.map((booking) => (
            <View key={booking.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <View style={styles.historyEmojiBox}>
                  <Text style={{ fontSize: 20 }}>
                    {booking.rideType === RideType.AUTO ? '🛺' : '🚗'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDest} numberOfLines={1}>
                    {booking.destination}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {booking.pickupPoint.name} • Pass {booking.passCode}
                  </Text>
                </View>
              </View>

              <View style={styles.historyRight}>
                <Text style={styles.historyFare}>₹{booking.estimatedFare}</Text>
                <Text
                  style={[
                    styles.historyStatus,
                    booking.status === RideStatus.COMPLETED && { color: '#059669' },
                    booking.status === RideStatus.CANCELLED && { color: '#DC2626' },
                  ]}
                >
                  {booking.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <CabAutoBookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  bookIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#4338CA',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  activeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  activeCardStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
    flex: 1,
  },
  passCodeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  passCodeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#4338CA',
  },
  activeDriverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  activeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDriverName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeVehicleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  activeDestText: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  activeCardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  viewPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewPassBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  heroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  heroLeft: {
    flex: 1,
    marginRight: 10,
  },
  heroHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: '#C7D2FE',
    lineHeight: 17,
    marginBottom: 14,
  },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  heroBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  heroEmojiBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  typeCardSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
  },
  typeEtaPill: {
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeEtaText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  hotlineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hotlineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotlineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  hotlineSub: {
    fontSize: 11,
    color: '#64748B',
  },
  dialBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dialBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rulesCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 24,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rulesTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0369A1',
  },
  rulesText: {
    fontSize: 11.5,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  historyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDest: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  historyFare: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  historyStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
});
