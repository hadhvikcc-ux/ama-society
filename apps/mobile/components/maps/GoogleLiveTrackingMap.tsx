import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTrackingStore, TrackingTrip, LiveTelemetry, MapStyle } from '../../stores/trackingStore';

interface GoogleLiveTrackingMapProps {
  height?: number | string;
  showControls?: boolean;
  showTelemetryHeader?: boolean;
  interactive?: boolean;
}

export function GoogleLiveTrackingMap({
  height = 360,
  showControls = true,
  showTelemetryHeader = true,
  interactive = true,
}: GoogleLiveTrackingMapProps) {
  const {
    activeTripId,
    progress,
    isPlaying,
    playbackSpeed,
    mapStyle,
    showTraffic,
    zoomLevel,
    centeredOnVehicle,
    setMapStyle,
    toggleTraffic,
    zoomIn,
    zoomOut,
    setCenteredOnVehicle,
    stepSimulation,
    getActiveTrip,
    getLiveTelemetry,
  } = useTrackingStore();

  const trip = getActiveTrip();
  const telemetry = getLiveTelemetry();

  // Pulse animation ticker for vehicle marker
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setPulse((p) => (p + 1) % 10);
    }, 400);
    return () => clearInterval(pulseTimer);
  }, []);

  // Live real-time simulation step ticker
  useEffect(() => {
    if (!isPlaying) return;
    const ticker = setInterval(() => {
      stepSimulation(1);
    }, 800);
    return () => clearInterval(ticker);
  }, [isPlaying, playbackSpeed, activeTripId]);

  // Coordinate projection helpers to map GPS coordinates to canvas percentages
  // Min & Max bounds for Bangalore routes
  const waypoints = trip?.waypoints && Array.isArray(trip.waypoints) && trip.waypoints.length > 0
    ? trip.waypoints
    : [{ lat: 13.0358, lng: 77.597, street: 'AMA Grand Estate' }];
  const lats = waypoints.map((w) => typeof w?.lat === 'number' ? w.lat : 13.0358);
  const lngs = waypoints.map((w) => typeof w?.lng === 'number' ? w.lng : 77.597);
  const srcLat = trip?.source?.lat ?? 13.0358;
  const srcLng = trip?.source?.lng ?? 77.597;
  const dstLat = trip?.destination?.lat ?? 13.1986;
  const dstLng = trip?.destination?.lng ?? 77.7066;

  const minLat = Math.min(...lats, srcLat, dstLat);
  const maxLat = Math.max(...lats, srcLat, dstLat);
  const minLng = Math.min(...lngs, srcLng, dstLng);
  const maxLng = Math.max(...lngs, srcLng, dstLng);

  const padLat = (maxLat - minLat) * 0.15 || 0.01;
  const padLng = (maxLng - minLng) * 0.15 || 0.01;

  const latRange = maxLat - minLat + padLat * 2;
  const lngRange = maxLng - minLng + padLng * 2;

  // Project lat/lng to percentage coordinates (0% to 100%)
  const project = (lat: number, lng: number) => {
    const validLat = typeof lat === 'number' && !isNaN(lat) ? lat : srcLat;
    const validLng = typeof lng === 'number' && !isNaN(lng) ? lng : srcLng;
    const x = ((validLng - (minLng - padLng)) / lngRange) * 100;
    // Invert Y because latitude increases upwards
    const y = (1 - (validLat - (minLat - padLat)) / latRange) * 100;

    // Apply zoom scaling & centering
    let finalX = x;
    let finalY = y;

    if (centeredOnVehicle) {
      const vX = ((telemetry.currentLng - (minLng - padLng)) / lngRange) * 100;
      const vY = (1 - (telemetry.currentLat - (minLat - padLat)) / latRange) * 100;
      const scale = 0.8 + zoomLevel * 0.25;
      finalX = 50 + (x - vX) * scale;
      finalY = 50 + (y - vY) * scale;
    }

    return {
      x: Math.max(-20, Math.min(120, finalX)),
      y: Math.max(-20, Math.min(120, finalY)),
    };
  };

  const originPos = project(srcLat, srcLng);
  const destPos = project(dstLat, dstLng);
  const vehiclePos = project(telemetry.currentLat, telemetry.currentLng);

  // Projected waypoint dots
  const projectedWaypoints = waypoints.map((w) => project(w.lat, w.lng));

  // Visual vehicle emoji
  const getVehicleIcon = () => {
    switch (trip.vehicleType) {
      case 'AUTO':
        return '🛺';
      case 'SEDAN':
        return '🚘';
      case 'EV':
        return '⚡';
      case 'SCOOTER':
        return '🛵';
      case 'BIKE':
        return '🏍️';
      default:
        return '🚗';
    }
  };

  const isDark = mapStyle === 'DARK';
  const isSatellite = mapStyle === 'SATELLITE';

  return (
    <View
      style={[
        styles.container,
        { height: height as any },
        isDark && styles.containerDark,
        isSatellite && styles.containerSatellite,
      ]}
    >
      {/* ================================================================= */}
      {/* 1. MAP BACKGROUND & VECTOR ROADS                                  */}
      {/* ================================================================= */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Background base tone */}
        <View
          style={[
            StyleSheet.absoluteFill,
            isDark
              ? { backgroundColor: '#1A1D24' }
              : isSatellite
              ? { backgroundColor: '#1C2E24' }
              : { backgroundColor: '#F3F4F6' },
          ]}
        />

        {/* Green Parks / Lake Waterbodies Background Patches */}
        <View
          style={[
            styles.lakePatch,
            isDark
              ? { backgroundColor: '#152538' }
              : isSatellite
              ? { backgroundColor: '#0F2537' }
              : { backgroundColor: '#D7E8F8' },
          ]}
        />
        <View
          style={[
            styles.parkPatch,
            isDark
              ? { backgroundColor: '#1B2C22' }
              : isSatellite
              ? { backgroundColor: '#17361E' }
              : { backgroundColor: '#DCF0E0' },
          ]}
        />
        <View
          style={[
            styles.societyBoundary,
            isDark
              ? { borderColor: '#4338CA', backgroundColor: 'rgba(67, 56, 202, 0.08)' }
              : { borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.06)' },
          ]}
        >
          <Text style={[styles.societyAreaLabel, isDark && { color: '#818CF8' }]}>
            AMA GRAND ESTATE CAMPUS
          </Text>
        </View>

        {/* Major Expressways / Arterials */}
        <View
          style={[
            styles.majorRoad1,
            isDark
              ? { backgroundColor: '#333A45' }
              : isSatellite
              ? { backgroundColor: 'rgba(255,255,255,0.25)' }
              : { backgroundColor: '#FFFFFF' },
          ]}
        />
        <View
          style={[
            styles.majorRoad2,
            isDark
              ? { backgroundColor: '#333A45' }
              : isSatellite
              ? { backgroundColor: 'rgba(255,255,255,0.25)' }
              : { backgroundColor: '#FFFFFF' },
          ]}
        />

        {/* Traffic Congestion Highlight Layer */}
        {showTraffic && (
          <>
            <View style={[styles.trafficSegment, styles.trafficGreen]} />
            <View style={[styles.trafficSegment, styles.trafficOrange]} />
            <View style={[styles.trafficSegment, styles.trafficRed]} />
          </>
        )}

        {/* Active Route Polyline Path (rendered as connecting segments) */}
        {projectedWaypoints.map((pt, idx) => {
          if (idx === 0) return null;
          const prev = projectedWaypoints[idx - 1];

          // Compute length and angle
          const dx = pt.x - prev.x;
          const dy = pt.y - prev.y;
          const distPct = Math.sqrt(dx * dx + dy * dy);
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

          // Highlight traversed portion vs remaining
          const isPassed = idx <= telemetry.segmentIndex;

          return (
            <View
              key={`route-seg-${idx}`}
              style={[
                styles.routeLine,
                {
                  left: `${prev.x}%`,
                  top: `${prev.y}%`,
                  width: `${distPct}%`,
                  transform: [{ rotate: `${angleDeg}deg` }],
                  backgroundColor: isPassed
                    ? isDark
                      ? '#4F46E5'
                      : '#3B82F6'
                    : isDark
                    ? '#6366F1'
                    : '#4285F4',
                  opacity: isPassed ? 0.95 : 0.75,
                },
              ]}
            />
          );
        })}
      </View>

      {/* ================================================================= */}
      {/* 2. MARKERS: ORIGIN, DESTINATION & MOVING VEHICLE                  */}
      {/* ================================================================= */}
      {/* Origin Marker (Point A) */}
      <View
        style={[
          styles.markerWrap,
          { left: `${originPos.x}%`, top: `${originPos.y}%` },
        ]}
      >
        <View style={styles.originMarkerPulse} />
        <View style={styles.originMarkerPin}>
          <Text style={styles.originMarkerLetter}>A</Text>
        </View>
        <View style={styles.markerLabelPill}>
          <Text style={styles.markerLabelText} numberOfLines={1}>
            {trip.source.name}
          </Text>
        </View>
      </View>

      {/* Destination Marker (Point B) */}
      <View
        style={[
          styles.markerWrap,
          { left: `${destPos.x}%`, top: `${destPos.y}%` },
        ]}
      >
        <View style={styles.destMarkerPin}>
          <Text style={{ fontSize: 13 }}>🏁</Text>
        </View>
        <View style={styles.markerLabelPill}>
          <Text style={styles.markerLabelText} numberOfLines={1}>
            {trip.destination.name}
          </Text>
        </View>
      </View>

      {/* Live Moving Vehicle Marker */}
      <View
        style={[
          styles.markerWrap,
          { left: `${vehiclePos.x}%`, top: `${vehiclePos.y}%` },
        ]}
      >
        {/* Radar wave pulse ring */}
        <View
          style={[
            styles.vehicleRadarPulse,
            {
              width: 44 + pulse * 2,
              height: 44 + pulse * 2,
              borderRadius: (44 + pulse * 2) / 2,
              opacity: 0.5 - pulse * 0.04,
            },
          ]}
        />

        {/* Rotated Vehicle Pin pointing along bearing heading */}
        <View
          style={[
            styles.vehicleCircle,
            { transform: [{ rotate: `${telemetry.bearing}deg` }] },
          ]}
        >
          {/* Forward direction arrow */}
          <View style={styles.bearingArrow} />
          <Text style={{ fontSize: 18 }}>{getVehicleIcon()}</Text>
        </View>

        {/* Floating live plate badge */}
        <View style={styles.vehiclePlateTag}>
          <View style={styles.liveVehicleDot} />
          <Text style={styles.vehiclePlateText}>
            {trip.driverOrRider.vehicleNumber}
          </Text>
        </View>
      </View>

      {/* ================================================================= */}
      {/* 3. TELEMETRY HEADER OVERLAY                                       */}
      {/* ================================================================= */}
      {showTelemetryHeader && (
        <View style={styles.telemetryOverlay}>
          <View style={styles.telemetryRow}>
            <View style={styles.streetBadge}>
              <View style={styles.liveDotPulsing} />
              <Text style={styles.streetText} numberOfLines={1}>
                {telemetry.currentStreet}
              </Text>
            </View>

            <View style={styles.speedGaugeBadge}>
              <Ionicons name="speedometer" size={13} color="#FFFFFF" />
              <Text style={styles.speedGaugeText}>
                {telemetry.currentSpeedKmh} km/h
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ================================================================= */}
      {/* 4. GOOGLE MAPS BRANDING & INTERACTIVE CONTROLS                    */}
      {/* ================================================================= */}
      {/* Authentic Google Logo Watermark */}
      <View style={styles.googleWatermark}>
        <Text style={styles.googleWatermarkG}>G</Text>
        <Text style={styles.googleWatermarkO1}>o</Text>
        <Text style={styles.googleWatermarkO2}>o</Text>
        <Text style={styles.googleWatermarkG}>g</Text>
        <Text style={styles.googleWatermarkL}>l</Text>
        <Text style={styles.googleWatermarkO1}>e</Text>
      </View>

      {/* Scale & Traffic status */}
      <View style={styles.mapMetaBar}>
        <Text style={[styles.mapScaleText, isDark && { color: '#94A3B8' }]}>
          {trip.totalDistanceKm} km route • {trip.totalDurationMins} min
        </Text>
      </View>

      {/* Interactive Floating Map Controls */}
      {showControls && (
        <View style={styles.controlsColumn}>
          {/* Map Style Toggle */}
          <TouchableOpacity
            style={styles.mapCtrlBtn}
            onPress={() => {
              const stylesList: MapStyle[] = ['STANDARD', 'SATELLITE', 'DARK'];
              const nextIdx = (stylesList.indexOf(mapStyle) + 1) % stylesList.length;
              setMapStyle(stylesList[nextIdx]);
            }}
            accessibilityLabel="Switch Map Style"
          >
            <Ionicons
              name={
                mapStyle === 'DARK'
                  ? 'moon'
                  : mapStyle === 'SATELLITE'
                  ? 'globe'
                  : 'map'
              }
              size={18}
              color="#334155"
            />
          </TouchableOpacity>

          {/* Traffic Toggle */}
          <TouchableOpacity
            style={[styles.mapCtrlBtn, showTraffic && styles.mapCtrlBtnActive]}
            onPress={toggleTraffic}
            accessibilityLabel="Toggle Traffic Layer"
          >
            <Ionicons
              name="analytics"
              size={18}
              color={showTraffic ? '#4338CA' : '#64748B'}
            />
          </TouchableOpacity>

          {/* Zoom In */}
          <TouchableOpacity
            style={styles.mapCtrlBtn}
            onPress={zoomIn}
            accessibilityLabel="Zoom In"
          >
            <Ionicons name="add" size={18} color="#334155" />
          </TouchableOpacity>

          {/* Zoom Out */}
          <TouchableOpacity
            style={styles.mapCtrlBtn}
            onPress={zoomOut}
            accessibilityLabel="Zoom Out"
          >
            <Ionicons name="remove" size={18} color="#334155" />
          </TouchableOpacity>

          {/* Re-center on Vehicle */}
          <TouchableOpacity
            style={[styles.mapCtrlBtn, centeredOnVehicle && styles.mapCtrlBtnActive]}
            onPress={() => setCenteredOnVehicle(!centeredOnVehicle)}
            accessibilityLabel="Center on Vehicle"
          >
            <Ionicons
              name="locate"
              size={18}
              color={centeredOnVehicle ? '#4338CA' : '#64748B'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* ================================================================= */}
      {/* 5. BOTTOM ETA & TELEMETRY PROGRESS BAR                            */}
      {/* ================================================================= */}
      <View
        style={[
          styles.bottomEtaBar,
          isDark && { backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: '#334155' },
        ]}
      >
        <View style={styles.etaLeft}>
          <View style={styles.etaCircle}>
            <Ionicons name="time" size={16} color="#059669" />
          </View>
          <View>
            <Text style={[styles.etaTitle, isDark && { color: '#FFFFFF' }]}>
              {telemetry.remainingEtaMins} mins
            </Text>
            <Text style={styles.etaSub}>
              {telemetry.remainingDistanceKm} km left • On time
            </Text>
          </View>
        </View>

        <View style={styles.progressBarBox}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${telemetry.progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentText}>
            {telemetry.progressPercent}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  containerDark: {
    backgroundColor: '#1A1D24',
    borderColor: '#334155',
  },
  containerSatellite: {
    backgroundColor: '#1C2E24',
    borderColor: '#2D4A38',
  },
  lakePatch: {
    position: 'absolute',
    top: '15%',
    right: '5%',
    width: 140,
    height: 90,
    borderRadius: 50,
    opacity: 0.8,
  },
  parkPatch: {
    position: 'absolute',
    bottom: '20%',
    left: '10%',
    width: 160,
    height: 100,
    borderRadius: 30,
    opacity: 0.75,
  },
  societyBoundary: {
    position: 'absolute',
    top: '40%',
    left: '18%',
    width: 120,
    height: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  societyAreaLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  majorRoad1: {
    position: 'absolute',
    top: '48%',
    left: '-10%',
    width: '120%',
    height: 14,
    transform: [{ rotate: '-18deg' }],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  majorRoad2: {
    position: 'absolute',
    top: '20%',
    left: '42%',
    width: 14,
    height: '110%',
    transform: [{ rotate: '25deg' }],
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  trafficSegment: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  trafficGreen: {
    top: '47%',
    left: '10%',
    width: '35%',
    backgroundColor: '#10B981',
    transform: [{ rotate: '-18deg' }],
  },
  trafficOrange: {
    top: '43%',
    left: '44%',
    width: '25%',
    backgroundColor: '#F59E0B',
    transform: [{ rotate: '-18deg' }],
  },
  trafficRed: {
    top: '39%',
    left: '68%',
    width: '20%',
    backgroundColor: '#EF4444',
    transform: [{ rotate: '-18deg' }],
  },
  routeLine: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    transformOrigin: 'left center',
  },
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  originMarkerPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  originMarkerPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  originMarkerLetter: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  destMarkerPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLabelPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
    maxWidth: 100,
  },
  markerLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vehicleRadarPulse: {
    position: 'absolute',
    backgroundColor: 'rgba(67, 56, 202, 0.25)',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  vehicleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  bearingArrow: {
    position: 'absolute',
    top: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4338CA',
  },
  vehiclePlateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 4,
  },
  liveVehicleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  vehiclePlateText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  telemetryOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streetBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  liveDotPulsing: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  streetText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  speedGaugeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  speedGaugeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  googleWatermark: {
    position: 'absolute',
    bottom: 58,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 5,
  },
  googleWatermarkG: {
    fontSize: 11,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleWatermarkO1: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EA4335',
  },
  googleWatermarkO2: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FBBC05',
  },
  googleWatermarkL: {
    fontSize: 11,
    fontWeight: '900',
    color: '#34A853',
  },
  mapMetaBar: {
    position: 'absolute',
    bottom: 58,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 5,
  },
  mapScaleText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  controlsColumn: {
    position: 'absolute',
    top: 50,
    right: 12,
    gap: 6,
    zIndex: 10,
  },
  mapCtrlBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapCtrlBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  bottomEtaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  etaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  etaTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  etaSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  progressBarBox: {
    width: 100,
    alignItems: 'flex-end',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
});
