import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CallContact } from '../../stores/callStore';

interface IntercomVideoFeedProps {
  contact: CallContact;
  isConnected: boolean;
  durationSeconds: number;
}

export function IntercomVideoFeed({
  contact,
  isConnected,
  durationSeconds,
}: IntercomVideoFeedProps) {
  const [liveTimestamp, setLiveTimestamp] = useState('');
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarAnim = useRef(new Animated.Value(0.9)).current;
  const waveAnim1 = useRef(new Animated.Value(14)).current;
  const waveAnim2 = useRef(new Animated.Value(24)).current;
  const waveAnim3 = useRef(new Animated.Value(18)).current;

  // Live real-world CCTV timecode
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLiveTimestamp(`${dateStr} ${timeStr} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // CCTV Surveillance Scanline Loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  // Pulse & Radar Loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    const radar = Animated.loop(
      Animated.sequence([
        Animated.timing(radarAnim, { toValue: 1.25, duration: 1600, useNativeDriver: true }),
        Animated.timing(radarAnim, { toValue: 0.9, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    radar.start();
    return () => {
      loop.stop();
      radar.stop();
    };
  }, [pulseAnim, radarAnim]);

  // Audio waveform frequency animation when connected
  useEffect(() => {
    if (isConnected) {
      const animateWave = (val: Animated.Value, max: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: max, duration: 300 + Math.random() * 200, useNativeDriver: false }),
            Animated.timing(val, { toValue: 6, duration: 300 + Math.random() * 200, useNativeDriver: false }),
          ])
        );
      };
      const w1 = animateWave(waveAnim1, 32);
      const w2 = animateWave(waveAnim2, 42);
      const w3 = animateWave(waveAnim3, 28);
      w1.start();
      w2.start();
      w3.start();
      return () => {
        w1.stop();
        w2.stop();
        w3.stop();
      };
    }
  }, [isConnected]);

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 380],
  });

  const getCameraChannelTitle = () => {
    switch (contact.category) {
      case 'gate':
        return 'CAM-01 • MAIN GATE SECURITY INTERCOM';
      case 'management':
        return 'CAM-02 • FACILITY MGMT OFFICE DESK';
      case 'technician':
        return 'CAM-03 • FIELD DISPATCH UNIT';
      case 'vendor':
        return 'CAM-04 • SOCIETY MART POS INTERCOM';
      case 'resident':
      default:
        return `CAM-DOORBELL • FLAT ${contact.flat || 'RESIDENT'}`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background CCTV Intercom Video Atmosphere */}
      <View style={styles.intercomBackground}>
        {/* Dynamic Scan Line */}
        <Animated.View
          style={[
            styles.cctvScanLine,
            { transform: [{ translateY: scanLineY }] },
          ]}
        />

        {/* Central Caller Video Feed Avatar Card */}
        <View style={styles.centralCallerCard}>
          <Animated.View
            style={[
              styles.radarCircle,
              { transform: [{ scale: radarAnim }] },
            ]}
          />

          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.avatarInner}>
              <Text style={{ fontSize: 58 }}>{contact.avatar || '🛡️'}</Text>
            </View>
            <View style={styles.liveCameraDot}>
              <View style={styles.liveDotInner} />
            </View>
          </Animated.View>

          {/* Caller Identity */}
          <Text style={styles.callerName}>{contact.name}</Text>
          <View style={styles.rolePillRow}>
            {contact.flat && (
              <View style={styles.flatPill}>
                <Text style={styles.flatPillText}>{contact.flat}</Text>
              </View>
            )}
            <Text style={styles.roleText}>{contact.role}</Text>
          </View>

          {/* Audio Waveform Equalizer */}
          {isConnected && (
            <View style={styles.audioWaveContainer}>
              <Animated.View style={[styles.audioWaveBar, { height: waveAnim1 }]} />
              <Animated.View style={[styles.audioWaveBar, { height: waveAnim2 }]} />
              <Animated.View style={[styles.audioWaveBar, { height: waveAnim3 }]} />
              <Animated.View style={[styles.audioWaveBar, { height: waveAnim2 }]} />
              <Animated.View style={[styles.audioWaveBar, { height: waveAnim1 }]} />
            </View>
          )}

          <Text style={styles.streamStatusText}>
            {isConnected
              ? '● HD Intercom Video Stream Connected'
              : 'Connecting encrypted intercom feed...'}
          </Text>
        </View>

        {/* Corner CCTV HUD Brackets */}
        <View style={[styles.cornerBracket, styles.bracketTL]} />
        <View style={[styles.cornerBracket, styles.bracketTR]} />
        <View style={[styles.cornerBracket, styles.bracketBL]} />
        <View style={[styles.cornerBracket, styles.bracketBR]} />

        {/* Bottom CCTV Status Strip */}
        <View style={styles.cctvBottomStrip}>
          <View style={styles.cctvInfoLeft}>
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>LIVE REC</Text>
            </View>
            <Text style={styles.channelText}>{getCameraChannelTitle()}</Text>
          </View>

          <View style={styles.cctvInfoRight}>
            <Text style={styles.timecodeText}>{liveTimestamp}</Text>
            <Text style={styles.specsText}>1080P • 60 FPS • 4.8 Mbps</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#070A11',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intercomBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B1120',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cctvScanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.45)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    zIndex: 2,
  },
  centralCallerCard: {
    alignItems: 'center',
    zIndex: 5,
    paddingHorizontal: 20,
  },
  radarCircle: {
    position: 'absolute',
    top: -15,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  liveCameraDot: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  liveDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  callerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  rolePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  flatPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  flatPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
  },
  roleText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  audioWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 44,
    marginTop: 14,
  },
  audioWaveBar: {
    width: 4,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  streamStatusText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  cornerBracket: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    borderWidth: 2.5,
  },
  bracketTL: { top: 90, left: 20, borderRightWidth: 0, borderBottomWidth: 0 },
  bracketTR: { top: 90, right: 20, borderLeftWidth: 0, borderBottomWidth: 0 },
  bracketBL: { bottom: 130, left: 20, borderRightWidth: 0, borderTopWidth: 0 },
  bracketBR: { bottom: 130, right: 20, borderLeftWidth: 0, borderTopWidth: 0 },
  cctvBottomStrip: {
    position: 'absolute',
    bottom: 125,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cctvInfoLeft: {
    flex: 1,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  recText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  channelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cctvInfoRight: {
    alignItems: 'flex-end',
  },
  timecodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  specsText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});
