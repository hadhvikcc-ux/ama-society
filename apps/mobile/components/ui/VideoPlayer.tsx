import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlayerProps {
  uri: string;
  name?: string;
  size?: string;
  maxHeight?: number;
  autoPlay?: boolean;
  style?: ViewStyle;
  onExpand?: () => void;
}

export function VideoPlayer({
  uri,
  name,
  size,
  maxHeight = 360,
  autoPlay = false,
  style,
  onExpand,
}: VideoPlayerProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      try {
        videoRef.current.playbackRate = playbackSpeed;
      } catch (e) {
        // ignore
      }
    }
  }, [playbackSpeed]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (Platform.OS === 'web' && videoRef.current) {
      try {
        videoRef.current.playbackRate = speed;
      } catch (e) {
        // ignore
      }
    }
  };

  const handleOpenNative = () => {
    if (typeof window !== 'undefined') {
      window.open(uri, '_blank');
    }
  };

  const handleDownload = () => {
    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = uri;
      a.download = name || 'inspection-video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setRetryKey((prev) => prev + 1);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Video Viewport */}
      <View style={[styles.viewport, { maxHeight }]}>
        {Platform.OS === 'web' ? (
          !hasError ? (
            React.createElement('video', {
              key: `${uri}-${retryKey}`,
              ref: videoRef,
              src: uri,
              controls: true,
              autoPlay: autoPlay,
              playsInline: true,
              preload: 'metadata',
              onError: (e: any) => {
                setHasError(true);
                setErrorMessage('Unable to stream video recording. Check network connection or video codec.');
              },
              style: {
                width: '100%',
                maxHeight: maxHeight,
                height: '100%',
                backgroundColor: '#0B0F19',
                borderRadius: 12,
                outline: 'none',
                objectFit: 'contain',
              },
            })
          ) : (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
              <Text style={styles.errorTitle}>Video Playback Unavailable</Text>
              <Text style={styles.errorSub}>{errorMessage}</Text>
              <View style={styles.errorActionRow}>
                <TouchableOpacity style={styles.errorRetryBtn} onPress={handleRetry}>
                  <Ionicons name="reload" size={14} color="#FFFFFF" />
                  <Text style={styles.errorRetryText}>Retry Playback</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.errorOpenBtn} onPress={handleOpenNative}>
                  <Ionicons name="open-outline" size={14} color="#1D4ED8" />
                  <Text style={styles.errorOpenText}>Direct Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          <View style={styles.nativeCard}>
            <Ionicons name="videocam" size={44} color="#3B82F6" />
            <Text style={styles.nativeTitle}>Video Clip Attached</Text>
            <Text style={styles.nativeSub}>{name || 'Inspection Recording'} ({size || 'HD'})</Text>
            <TouchableOpacity style={styles.nativePlayBtn} onPress={handleOpenNative}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.nativePlayText}>Play in System Player</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Media Controller Bar */}
      <View style={styles.controllerBar}>
        {/* Speed Controls */}
        <View style={styles.speedPillsRow}>
          <Text style={styles.speedLabel}>Speed:</Text>
          {[0.75, 1, 1.25, 1.5, 2].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.speedPill, playbackSpeed === s && styles.speedPillActive]}
              onPress={() => handleSpeedChange(s)}
            >
              <Text style={[styles.speedPillText, playbackSpeed === s && styles.speedPillTextActive]}>
                {s === 1 ? '1x' : `${s}x`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          {onExpand && (
            <TouchableOpacity style={styles.iconBtn} onPress={onExpand} accessibilityLabel="Expand Fullscreen">
              <Ionicons name="expand-outline" size={16} color="#1E293B" />
              <Text style={styles.iconBtnText}>Fullscreen</Text>
            </TouchableOpacity>
          )}
          {Platform.OS === 'web' && (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={handleOpenNative} accessibilityLabel="Open in New Tab">
                <Ionicons name="open-outline" size={16} color="#1E293B" />
                <Text style={styles.iconBtnText}>Inspect Tab</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleDownload} accessibilityLabel="Download Video">
                <Ionicons name="download-outline" size={16} color="#1E293B" />
                <Text style={styles.iconBtnText}>Download</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  viewport: {
    width: '100%',
    minHeight: 220,
    backgroundColor: '#0B0F19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controllerBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 2,
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  speedPillActive: {
    backgroundColor: '#2563EB',
  },
  speedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  speedPillTextActive: {
    color: '#FFFFFF',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  errorBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
  },
  errorTitle: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  errorSub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  errorRetryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorRetryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  errorOpenBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorOpenText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
  nativeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  nativeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  nativeSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  nativePlayBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  nativePlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
