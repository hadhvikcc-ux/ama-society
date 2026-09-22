import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTrackingStore, PRESET_TRIPS, TrackingTrip } from '../../stores/trackingStore';
import { GoogleLiveTrackingMap } from '../maps/GoogleLiveTrackingMap';

interface LiveTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  defaultTripType?: 'CAB' | 'AUTO' | 'DELIVERY_MART' | 'DELIVERY_PARCEL';
}

export function LiveTrackingModal({
  visible,
  onClose,
  defaultTripType,
}: LiveTrackingModalProps) {
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

  // Set default trip if provided when opening
  React.useEffect(() => {
    if (visible && defaultTripType) {
      const match = trips.find((t) => t.tripType === defaultTripType);
      if (match) {
        setActiveTripId(match.id);
      }
    }
  }, [visible, defaultTripType]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleShareWhatsApp = () => {
    triggerHaptic();
    const isCab = trip.tripType === 'CAB' || trip.tripType === 'AUTO';
    const text = isCab
      ? `🚖 *AMA Live Ride Tracking (Google Maps)*\n\n` +
        `• *Driver:* ${trip.driverOrRider.name} (${trip.driverOrRider.vehicleNumber})\n` +
        `• *Current Location:* ${telemetry.currentStreet}\n` +
        `• *ETA:* ${telemetry.remainingEtaMins} mins (${telemetry.remainingDistanceKm} km left)\n` +
        `• *Destination:* ${trip.destination.name}\n` +
        `• *Gate Pass:* ${trip.orderOrPassCode} (PIN: ${trip.gatePin})\n\n` +
        `Live GPS tracking active in AMA SuperApp.`
      : `📦 *AMA Live Delivery Tracking (Google Maps)*\n\n` +
        `• *Order:* ${trip.orderOrPassCode}\n` +
        `• *Rider:* ${trip.driverOrRider.name} (${trip.driverOrRider.vehicleNumber})\n` +
        `• *Current Location:* ${telemetry.currentStreet}\n` +
        `• *ETA:* ${telemetry.remainingEtaMins} mins to ${trip.destination.name}\n` +
        `• *Gate PIN:* ${trip.gatePin}\n\n` +
        `Live GPS delivery tracking active in AMA SuperApp.`;

    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Live Tracking Link', text);
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.googleIconCircle}>
                <Ionicons name="navigate" size={18} color="#4285F4" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.headerTitle}>Live Route Tracking</Text>
                  <View style={styles.liveTag}>
                    <View style={styles.livePulse} />
                    <Text style={styles.liveTagText}>GPS LIVE</Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitle}>Real-time Google Maps telemetry</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Preset Trips Horizontal Switcher */}
          <View style={styles.tripSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripChipRow}>
              {trips.map((t) => {
                const isSelected = t.id === activeTripId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tripChip, isSelected && styles.tripChipActive]}
                    onPress={() => {
                      triggerHaptic();
                      setActiveTripId(t.id);
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>
                      {t.tripType === 'AUTO'
                        ? '🛺'
                        : t.tripType === 'CAB'
                        ? '🚘'
                        : t.tripType === 'DELIVERY_MART'
                        ? '🛒'
                        : '📦'}
                    </Text>
                    <Text
                      style={[styles.tripChipText, isSelected && styles.tripChipTextActive]}
                    >
                      {t.tripType === 'CAB'
                        ? 'Airport Cab'
                        : t.tripType === 'AUTO'
                        ? 'Metro Auto'
                        : t.tripType === 'DELIVERY_MART'
                        ? 'Mart Express'
                        : 'Food Delivery'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Embedded Interactive Google Maps Canvas */}
            <GoogleLiveTrackingMap height={320} />

            {/* Simulation Telemetry Playback Controls */}
            <View style={styles.simControlCard}>
              <View style={styles.simControlTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.simControlTitle}>Simulation Engine</Text>
                  <Text style={styles.simProgressVal}>({telemetry.progressPercent}%)</Text>
                </View>

                {/* Speed Multiplier */}
                <View style={styles.speedRow}>
                  {[1, 2, 5].map((spd) => (
                    <TouchableOpacity
                      key={spd}
                      style={[
                        styles.speedPill,
                        playbackSpeed === spd && styles.speedPillActive,
                      ]}
                      onPress={() => {
                        triggerHaptic();
                        setPlaybackSpeed(spd as any);
                      }}
                    >
                      <Text
                        style={[
                          styles.speedPillText,
                          playbackSpeed === spd && styles.speedPillTextActive,
                        ]}
                      >
                        {spd}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Progress Slider Track (Tappable / Interactive) */}
              <View style={styles.scrubberContainer}>
                <TouchableOpacity
                  style={styles.scrubberTrack}
                  activeOpacity={1}
                  onPress={(e) => {
                    const locX = e?.nativeEvent?.locationX;
                    if (typeof locX === 'number' && !isNaN(locX)) {
                      const pct = Math.max(0, Math.min(1, locX / 300));
                      setProgress(pct);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.scrubberFill,
                      { width: `${telemetry.progressPercent}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.scrubberThumb,
                      { left: `${Math.max(0, Math.min(96, telemetry.progressPercent))}%` },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Action Buttons: Play/Pause, Step, Reset */}
              <View style={styles.simBtnRow}>
                <TouchableOpacity
                  style={[styles.playBtn, isPlaying && styles.pauseBtn]}
                  onPress={() => {
                    triggerHaptic();
                    togglePlay();
                  }}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.playBtnText}>
                    {isPlaying ? 'Pause' : 'Resume GPS'}
                  </Text>
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

            {/* Driver / Rider Profile & Order HUD */}
            <View style={styles.driverHudCard}>
              <View style={styles.driverHudTop}>
                <View style={styles.driverAvatarCircle}>
                  <Text style={{ fontSize: 24 }}>{trip.driverOrRider.photoEmoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.driverNameText}>{trip.driverOrRider.name}</Text>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={11} color="#D97706" />
                      <Text style={styles.ratingVal}>{trip.driverOrRider.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.driverModelText}>
                    {trip.driverOrRider.vehicleModel}
                  </Text>
                  <View style={styles.licensePlateBox}>
                    <Text style={styles.licensePlateText}>
                      {trip.driverOrRider.vehicleNumber}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.callCircleBtn} onPress={handleCall}>
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Items summary or Gate PIN */}
              <View style={styles.orderMetaBox}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Order / Pass Code:</Text>
                  <Text style={styles.metaValue}>{trip.orderOrPassCode}</Text>
                </View>
                {trip.gatePin && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Gate Clearance PIN:</Text>
                    <Text style={styles.metaPin}>{trip.gatePin}</Text>
                  </View>
                )}
                {trip.itemsSummary && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.metaLabel}>Order Items:</Text>
                    <Text style={styles.metaItemsText}>{trip.itemsSummary}</Text>
                  </View>
                )}
              </View>

              {/* WhatsApp Share Button */}
              <TouchableOpacity
                style={styles.shareWhatsappBtn}
                onPress={handleShareWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.shareWhatsappText}>Share Live Route via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  liveTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 11.5,
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
  tripSelector: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tripChipRow: {
    flexDirection: 'row',
  },
  tripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
  },
  tripChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  tripChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tripChipTextActive: {
    color: '#4338CA',
  },
  scrollBody: {
    maxHeight: 580,
  },
  scrollContent: {
    padding: 16,
  },
  simControlCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
    marginBottom: 14,
  },
  simControlTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  simControlTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  simProgressVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  speedRow: {
    flexDirection: 'row',
    gap: 4,
  },
  speedPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  speedPillActive: {
    backgroundColor: '#4338CA',
  },
  speedPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  speedPillTextActive: {
    color: '#FFFFFF',
  },
  scrubberContainer: {
    marginVertical: 8,
  },
  scrubberTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#4338CA',
    borderRadius: 5,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#4338CA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    top: -4,
  },
  simBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  stepBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  driverHudCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  driverHudTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingVal: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  driverModelText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  licensePlateBox: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  licensePlateText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 0.8,
  },
  callCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderMetaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  metaPin: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.5,
  },
  metaItemsText: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
    marginTop: 2,
  },
  shareWhatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
  },
  shareWhatsappText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
