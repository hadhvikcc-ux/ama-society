import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../../stores/chatStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface VideoPlayerModalProps {
  visible: boolean;
  message: ChatMessage | null;
  onClose: () => void;
}

export function VideoPlayerModal({ visible, message, onClose }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<any>(null);
  const scanlineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsPlaying(true);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanlineAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(scanlineAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible]);

  if (!visible || !message) return null;

  const togglePlay = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const isWebVideo =
    Platform.OS === 'web' &&
    message.videoUri &&
    (message.videoUri.startsWith('blob:') ||
      message.videoUri.startsWith('http:') ||
      message.videoUri.startsWith('https:'));

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* ================= HEADER BAR ================= */}
        <View style={styles.topHeader}>
          <View style={styles.senderInfo}>
            <View style={styles.avatarWrap}>
              <Text style={{ fontSize: 22 }}>{message.senderAvatar || '👤'}</Text>
            </View>
            <View>
              <Text style={styles.senderName}>{message.senderName}</Text>
              <Text style={styles.senderSub}>
                {message.senderFlat ? `Flat ${message.senderFlat} • ` : ''}
                {message.time}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ================= VIDEO STAGE ================= */}
        <TouchableOpacity style={styles.videoStage} activeOpacity={1} onPress={togglePlay}>
          {isWebVideo ? (
            React.createElement('video', {
              ref: (node: any) => {
                videoRef.current = node;
              },
              src: message.videoUri,
              autoPlay: true,
              loop: true,
              playsInline: true,
              controls: true,
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#000',
              },
            })
          ) : (
            // Simulated video note presentation
            <View style={styles.simulatedStage}>
              <View style={styles.simulatedShieldWrap}>
                <Ionicons name="videocam" size={60} color="#60A5FA" />
              </View>

              <Text style={styles.simulatedTitle}>AMA Intercom Video Note</Text>
              <Text style={styles.simulatedSub}>
                {message.senderName} • {message.videoDurationSec || 8}s Clip
              </Text>

              <View style={styles.statusPill}>
                <Ionicons name="play" size={14} color="#10B981" />
                <Text style={styles.statusPillText}>Playing 1080p Stream</Text>
              </View>

              {/* Watermark */}
              <View style={styles.cctvWatermark}>
                <Text style={styles.cctvText}>
                  SECURITY RECORDING • {new Date(message.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          {/* Center Play/Pause Overlay Indicator if Paused */}
          {!isPlaying && (
            <View style={styles.pausedOverlay}>
              <View style={styles.pausedCircle}>
                <Ionicons name="play" size={38} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </View>
            </View>
          )}

          {/* Duration Pill at top right */}
          <View style={styles.durationPill}>
            <Ionicons name="film-outline" size={13} color="#CBD5E1" />
            <Text style={styles.durationText}>
              00:{message.videoDurationSec ? (message.videoDurationSec < 10 ? `0${message.videoDurationSec}` : message.videoDurationSec) : '08'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ================= FOOTER WITH CAPTION ================= */}
        <View style={styles.footerContainer}>
          {message.caption ? (
            <View style={styles.captionBox}>
              <Text style={styles.captionText}>{message.caption}</Text>
            </View>
          ) : (
            <View style={styles.noCaptionBox}>
              <Ionicons name="chatbubble-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.noCaptionText}>Video message without caption</Text>
            </View>
          )}

          {/* Quick Playback Bar */}
          <View style={styles.playbackControlsRow}>
            <TouchableOpacity style={styles.playbackCircleBtn} onPress={togglePlay} activeOpacity={0.8}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.timeTrack}>
              <View style={styles.timeTrackActive} />
            </View>

            <Text style={styles.trackDurationText}>
              {message.videoDurationSec ? `${message.videoDurationSec}s` : '8s'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A10',
  },
  topHeader: {
    height: Platform.OS === 'ios' ? 64 : 68,
    paddingTop: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 20,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  senderSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoStage: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  simulatedStage: {
    alignItems: 'center',
    padding: 24,
  },
  simulatedShieldWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  simulatedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  simulatedSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  cctvWatermark: {
    marginTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cctvText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  durationPill: {
    position: 'absolute',
    top: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  footerContainer: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  captionBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  captionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 20,
  },
  noCaptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  noCaptionText: {
    fontSize: 12,
    color: '#64748B',
  },
  playbackControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playbackCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B4FD8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
    overflow: 'hidden',
  },
  timeTrackActive: {
    width: '60%',
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  trackDurationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
