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
import { useTrackingStore, PRESET_TRIPS, TrackingTrip } from '../../stores/trackingStore';
import { GoogleLiveTrackingMap } from '../../components/maps/GoogleLiveTrackingMap';

export default function ResidentTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    trips,
    activeTripId,
    setActiveTripId,
    progress,
    setProgress,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    resetTrip,
    getActiveTrip,
    getLiveTelemetry,
  } = useTrackingStore();

  const trip = getActiveTrip() || PRESET_TRIPS[0];
  const telemetry = getLiveTelemetry();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'CAB' | 'DELIVERY'>('ALL');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (categoryFilter === 'CAB') return t.tripType === 'CAB' || t.tripType === 'AUTO';
    if (categoryFilter === 'DELIVERY') return t.tripType === 'DELIVERY_MART' || t.tripType === 'DELIVERY_PARCEL';
    return true;
  });

  const handleShareWhatsApp = () => {
    triggerHaptic();
    const isCab = trip.tripType === 'CAB' || trip.tripType === 'AUTO';
    const text = isCab
      ? `🚖 *AMA Live Ride Tracking (Google Maps)*\n\n` +
        `• *Driver:* ${trip.driverOrRider.name} (${trip.driverOrRider.vehicleNumber})\n` +
        `• *Location:* ${telemetry.currentStreet}\n` +
        `• *ETA:* ${telemetry.remainingEtaMins} mins (${telemetry.remainingDistanceKm} km left)\n` +
        `• *Destination:* ${trip.destination.name}\n` +
        `• *Gate Pass:* ${trip.orderOrPassCode} (PIN: ${trip.gatePin})\n\n` +
        `Live GPS tracking in AMA SuperApp.`
      : `📦 *AMA Live Delivery Tracking (Google Maps)*\n\n` +
        `• *Order:* ${trip.orderOrPassCode}\n` +
        `• *Rider:* ${trip.driverOrRider.name} (${trip.driverOrRider.vehicleNumber})\n` +
        `• *Location:* ${telemetry.currentStreet}\n` +
        `• *ETA:* ${telemetry.remainingEtaMins} mins\n` +
        `• *Gate PIN:* ${trip.gatePin}\n\n` +
        `Live GPS delivery tracking in AMA SuperApp.`;

    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Live Tracking', text);
      });
    }
  };

  const handleCall = () => {
    triggerHaptic();
    const phone = trip.driverOrRider.phone;
    const url = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    if (Platform.OS === 'web') {
      window.open(url);
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Phone', phone);
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle}>Live Route Tracking</Text>
            <View style={styles.googlePill}>
              <Text style={styles.googlePillText}>Google Maps</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Real-time GPS delivery &amp; cab tracking</Text>
        </View>

        <TouchableOpacity
          style={styles.headerShareBtn}
          onPress={handleShareWhatsApp}
          accessibilityLabel="Share on WhatsApp"
        >
          <Ionicons name="share-social" size={18} color="#4338CA" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Switcher Tabs */}
        <View style={styles.categoryRow}>
          <TouchableOpacity
            style={[styles.categoryBtn, categoryFilter === 'ALL' && styles.categoryBtnActive]}
            onPress={() => {
              triggerHaptic();
              setCategoryFilter('ALL');
            }}
          >
            <Text style={[styles.categoryBtnText, categoryFilter === 'ALL' && styles.categoryBtnTextActive]}>
              All Routes ({trips.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtn, categoryFilter === 'CAB' && styles.categoryBtnActive]}
            onPress={() => {
              triggerHaptic();
              setCategoryFilter('CAB');
              const firstCab = trips.find((t) => t.tripType === 'CAB' || t.tripType === 'AUTO');
              if (firstCab) setActiveTripId(firstCab.id);
            }}
          >
            <Text style={[styles.categoryBtnText, categoryFilter === 'CAB' && styles.categoryBtnTextActive]}>
              🛺 Cabs &amp; Autos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtn, categoryFilter === 'DELIVERY' && styles.categoryBtnActive]}
            onPress={() => {
              triggerHaptic();
              setCategoryFilter('DELIVERY');
              const firstDelivery = trips.find(
                (t) => t.tripType === 'DELIVERY_MART' || t.tripType === 'DELIVERY_PARCEL'
              );
              if (firstDelivery) setActiveTripId(firstDelivery.id);
            }}
          >
            <Text style={[styles.categoryBtnText, categoryFilter === 'DELIVERY' && styles.categoryBtnTextActive]}>
              📦 Deliveries
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Trip Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripListHorizontal}>
          {filteredTrips.map((t) => {
            const isSelected = t.id === activeTripId;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tripCard, isSelected && styles.tripCardActive]}
                onPress={() => {
                  triggerHaptic();
                  setActiveTripId(t.id);
                }}
              >
                <View style={styles.tripCardTop}>
                  <View style={styles.tripCardEmoji}>
                    <Text style={{ fontSize: 18 }}>{t.driverOrRider.photoEmoji}</Text>
                  </View>
                  <View style={styles.tripTypePill}>
                    <Text style={styles.tripTypePillText}>
                      {t.tripType === 'CAB' ? 'CAB' : t.tripType === 'AUTO' ? 'AUTO' : 'DELIVERY'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.tripCardTitle} numberOfLines={1}>
                  {t.title}
                </Text>
                <Text style={styles.tripCardSub} numberOfLines={1}>
                  To: {t.destination.name}
                </Text>
                <Text style={styles.tripCardMeta}>
                  {t.totalDistanceKm} km • ~{t.totalDurationMins} mins
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Embedded Google Maps Live Canvas */}
        <GoogleLiveTrackingMap height={350} />

        {/* Telemetry Control Panel */}
        <View style={styles.telemetryPanel}>
          <View style={styles.telemetryPanelTop}>
            <View>
              <Text style={styles.panelHeading}>{trip.title}</Text>
              <Text style={styles.panelSub}>{trip.subtitle}</Text>
            </View>
            <View style={styles.speedSelector}>
              {[1, 2, 5].map((spd) => (
                <TouchableOpacity
                  key={spd}
                  style={[styles.spdBtn, playbackSpeed === spd && styles.spdBtnActive]}
                  onPress={() => {
                    triggerHaptic();
                    setPlaybackSpeed(spd as any);
                  }}
                >
                  <Text style={[styles.spdBtnText, playbackSpeed === spd && styles.spdBtnTextActive]}>
                    {spd}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Progress Slider */}
          <TouchableOpacity
            style={styles.sliderTrack}
            activeOpacity={1}
            onPress={(e) => {
              const locX = e?.nativeEvent?.locationX;
              if (typeof locX === 'number' && !isNaN(locX)) {
                const pct = Math.max(0, Math.min(1, locX / 300));
                setProgress(pct);
              }
            }}
          >
            <View style={[styles.sliderFill, { width: `${telemetry.progressPercent}%` }]} />
            <View
              style={[
                styles.sliderThumb,
                { left: `${Math.max(0, Math.min(96, telemetry.progressPercent))}%` },
              ]}
            />
          </TouchableOpacity>

          {/* Simulation Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.playBtn, isPlaying && styles.pauseBtn]}
              onPress={() => {
                triggerHaptic();
                togglePlay();
              }}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color="#FFFFFF" />
              <Text style={styles.playBtnText}>{isPlaying ? 'Pause' : 'Play Live GPS'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                triggerHaptic();
                setProgress(Math.min(1, progress + 0.1));
              }}
            >
              <Ionicons name="play-forward" size={15} color="#475569" />
              <Text style={styles.stepBtnText}>+10%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                triggerHaptic();
                resetTrip();
              }}
            >
              <Ionicons name="refresh" size={15} color="#475569" />
              <Text style={styles.stepBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Driver / Delivery Rider HUD */}
        <View style={styles.driverCard}>
          <View style={styles.driverCardTop}>
            <View style={styles.driverAvatar}>
              <Text style={{ fontSize: 26 }}>{trip.driverOrRider.photoEmoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.driverName}>{trip.driverOrRider.name}</Text>
                <View style={styles.starBadge}>
                  <Ionicons name="star" size={11} color="#D97706" />
                  <Text style={styles.starText}>{trip.driverOrRider.rating}</Text>
                </View>
              </View>
              <Text style={styles.driverModel}>{trip.driverOrRider.vehicleModel}</Text>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{trip.driverOrRider.vehicleNumber}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Order / Pass details */}
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pass / Order Code:</Text>
              <Text style={styles.detailVal}>{trip.orderOrPassCode}</Text>
            </View>
            {trip.gatePin && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Security Gate PIN:</Text>
                <Text style={styles.detailPin}>{trip.gatePin}</Text>
              </View>
            )}
            {trip.itemsSummary && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.detailLabel}>Items in Package:</Text>
                <Text style={styles.detailItems}>{trip.itemsSummary}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Security Advisory */}
        <View style={styles.advisoryCard}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" />
          <Text style={styles.advisoryText}>
            All delivery riders and cabs must present gate pass tokens or OTPs at Gate 1 boom barrier. Campus speed limit 15 km/h strictly enforced.
          </Text>
        </View>
      </ScrollView>
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
  googlePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  googlePillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#4338CA',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  headerShareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  categoryBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryBtnTextActive: {
    color: '#4338CA',
  },
  tripListHorizontal: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tripCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  tripCardActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  tripCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripCardEmoji: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripTypePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tripTypePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  tripCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  tripCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  tripCardMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  telemetryPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
    marginBottom: 14,
  },
  telemetryPanelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  panelSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  speedSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  spdBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spdBtnActive: {
    backgroundColor: '#4338CA',
  },
  spdBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  spdBtnTextActive: {
    color: '#FFFFFF',
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    marginVertical: 10,
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#4338CA',
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#4338CA',
    top: -4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  playBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  pauseBtn: {
    backgroundColor: '#D97706',
  },
  playBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  driverCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  starText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  driverModel: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  plateBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  plateText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 0.8,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  detailPin: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  detailItems: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
  },
  advisoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  advisoryText: {
    fontSize: 11.5,
    color: '#065F46',
    lineHeight: 16,
    flex: 1,
  },
});
