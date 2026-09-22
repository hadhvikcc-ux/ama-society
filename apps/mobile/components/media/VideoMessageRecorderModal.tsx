import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UniversalCameraView } from '../camera/UniversalCameraView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface VideoMessageRecorderModalProps {
  visible: boolean;
  onClose: () => void;
  onSendVideo: (videoPayload: {
    videoUri: string;
    durationSec: number;
    caption?: string;
  }) => void;
  recipientName?: string;
  recipientRole?: string;
  recipientFlat?: string;
}

export function VideoMessageRecorderModal({
  visible,
  onClose,
  onSendVideo,
  recipientName = 'Community Chat',
  recipientRole,
  recipientFlat,
}: VideoMessageRecorderModalProps) {
  const [recordState, setRecordState] = useState<'READY' | 'RECORDING' | 'PREVIEW'>('READY');
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [caption, setCaption] = useState('');
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const chunksRef = useRef<any[]>([]);
  const timerRef = useRef<any>(null);
  const previewVideoRef = useRef<any>(null);

  // Animations
  const pulseRecAnim = useRef(new Animated.Value(1)).current;
  const soundwaveAnim1 = useRef(new Animated.Value(12)).current;
  const soundwaveAnim2 = useRef(new Animated.Value(24)).current;
  const soundwaveAnim3 = useRef(new Animated.Value(18)).current;
  const soundwaveAnim4 = useRef(new Animated.Value(30)).current;

  // Reset state on open/close
  useEffect(() => {
    if (visible) {
      setRecordState('READY');
      setRecordingSeconds(0);
      setCaption('');
      setRecordedBlobUrl(null);
      setIsPlayingPreview(false);
    } else {
      stopRecordingCleanup();
    }
  }, [visible]);

  // Pulse animation for recording red dot
  useEffect(() => {
    if (recordState === 'RECORDING') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseRecAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseRecAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      // Soundwave animation
      const makeWave = (anim: Animated.Value, max: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: max, duration: 250 + Math.random() * 200, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 8, duration: 250 + Math.random() * 200, useNativeDriver: false }),
          ])
        );
      };
      const w1 = makeWave(soundwaveAnim1, 28);
      const w2 = makeWave(soundwaveAnim2, 38);
      const w3 = makeWave(soundwaveAnim3, 24);
      const w4 = makeWave(soundwaveAnim4, 42);
      w1.start();
      w2.start();
      w3.start();
      w4.start();

      return () => {
        pulseLoop.stop();
        w1.stop();
        w2.stop();
        w3.stop();
        w4.stop();
      };
    }
  }, [recordState]);

  // Clean up streams
  const stopRecordingCleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track: any) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
  };

  // Start recording
  const handleStartRecording = async () => {
    setRecordState('RECORDING');
    setRecordingSeconds(0);
    chunksRef.current = [];

    // Timer (up to 60s)
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setRecordingSeconds(elapsed);
      if (elapsed >= 60) {
        handleStopRecording();
      }
    }, 1000);

    // Attempt web MediaRecorder
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        let stream: any;
        try {
          // Attempt video + audio recording
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing === 'front' ? 'user' : 'environment' },
            audio: true,
          });
        } catch (audioErr) {
          // Fallback to video-only if microphone hardware or permission is unavailable
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing === 'front' ? 'user' : 'environment' },
            audio: false,
          });
        }
        streamRef.current = stream;

        // Determine best supported MIME type
        let mimeType = '';
        if (typeof (window as any).MediaRecorder !== 'undefined') {
          const supportedTypes = [
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4',
          ];
          for (const type of supportedTypes) {
            if (
              (window as any).MediaRecorder.isTypeSupported &&
              (window as any).MediaRecorder.isTypeSupported(type)
            ) {
              mimeType = type;
              break;
            }
          }
        }

        let recorder: any;
        try {
          recorder = mimeType
            ? new (window as any).MediaRecorder(stream, { mimeType })
            : new (window as any).MediaRecorder(stream);
        } catch (e) {
          recorder = new (window as any).MediaRecorder(stream);
        }

        recorder.ondataavailable = (event: any) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, {
              type: mimeType || 'video/webm',
            });
            const url = URL.createObjectURL(blob);
            setRecordedBlobUrl(url);
          } else {
            // Simulated clip URL fallback
            setRecordedBlobUrl(`simulated://clip-${Date.now()}.mp4`);
          }

          // Clean up stream tracks after recording finalizes
          if (streamRef.current) {
            try {
              streamRef.current.getTracks().forEach((track: any) => track.stop());
            } catch (e) {}
            streamRef.current = null;
          }

          setRecordState('PREVIEW');
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250);
      } catch (err) {
        console.warn('MediaRecorder error, will use simulated clip recording:', err);
      }
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        // State transition and blob creation will happen inside recorder.onstop
        return;
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    }

    // Fallback if media recorder was not running (e.g. simulated mode or native)
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track: any) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    setRecordedBlobUrl(`simulated://clip-${Date.now()}.mp4`);
    setRecordState('PREVIEW');
  };

  // Retake video
  const handleRetake = () => {
    if (recordedBlobUrl && recordedBlobUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(recordedBlobUrl);
      } catch (e) {}
    }
    setRecordedBlobUrl(null);
    setRecordingSeconds(0);
    setRecordState('READY');
  };

  // Send video
  const handleSend = () => {
    const finalUri = recordedBlobUrl || `simulated://clip-${Date.now()}.mp4`;
    const finalDuration = recordingSeconds > 0 ? recordingSeconds : 6;
    onSendVideo({
      videoUri: finalUri,
      durationSec: finalDuration,
      caption: caption.trim() || undefined,
    });
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* ================= HEADER HUD ================= */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleCloseBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.recipientBadge}>
            <Ionicons name="videocam" size={14} color="#60A5FA" />
            <Text style={styles.recipientBadgeText} numberOfLines={1}>
              To: {recipientName}
              {recipientFlat ? ` (${recipientFlat})` : ''}
            </Text>
          </View>

          {recordState === 'READY' ? (
            <TouchableOpacity
              style={styles.circleIconBtn}
              onPress={() => setFacing((prev) => (prev === 'front' ? 'back' : 'front'))}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* ================= MAIN STAGE ================= */}
        <View style={styles.stageContainer}>
          {recordState !== 'PREVIEW' ? (
            // LIVE CAMERA VIEWFINDER (Ready or Recording)
            <View style={StyleSheet.absoluteFillObject}>
              <UniversalCameraView
                mode="video-call"
                facing={facing}
                isActive={visible}
                mirror={facing === 'front'}
                showStatusIndicator={false}
                style={StyleSheet.absoluteFillObject}
              />

              {/* RECORDING OVERLAY HUD */}
              {recordState === 'RECORDING' && (
                <View style={styles.recordingHud}>
                  <View style={styles.recordingTimerBadge}>
                    <Animated.View style={[styles.redRecDot, { transform: [{ scale: pulseRecAnim }] }]} />
                    <Text style={styles.recTimerText}>REC {formatSeconds(recordingSeconds)} / 01:00</Text>
                  </View>

                  {/* Audio Waveform visualization */}
                  <View style={styles.audioWaveContainer}>
                    <Animated.View style={[styles.soundWaveBar, { height: soundwaveAnim1 }]} />
                    <Animated.View style={[styles.soundWaveBar, { height: soundwaveAnim2 }]} />
                    <Animated.View style={[styles.soundWaveBar, { height: soundwaveAnim3 }]} />
                    <Animated.View style={[styles.soundWaveBar, { height: soundwaveAnim4 }]} />
                    <Animated.View style={[styles.soundWaveBar, { height: soundwaveAnim2 }]} />
                    <Animated.View style={[styles.soundWaveBar, { height: soundwaveAnim1 }]} />
                  </View>
                </View>
              )}

              {/* Ready State Helper Hint */}
              {recordState === 'READY' && (
                <View style={styles.readyHintBanner}>
                  <Text style={styles.readyHintText}>Tap the red button to record a video note (up to 60s)</Text>
                </View>
              )}
            </View>
          ) : (
            // PREVIEW & REVIEW RECORDED VIDEO
            <View style={styles.previewContainer}>
              {Platform.OS === 'web' && recordedBlobUrl && !recordedBlobUrl.startsWith('simulated://') ? (
                <View style={StyleSheet.absoluteFillObject}>
                  {React.createElement('video', {
                    ref: (node: any) => {
                      previewVideoRef.current = node;
                    },
                    src: recordedBlobUrl,
                    controls: false,
                    autoPlay: true,
                    loop: true,
                    playsInline: true,
                    style: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      backgroundColor: '#000',
                    },
                  })}
                </View>
              ) : (
                // Simulated recorded video preview
                <View style={styles.simulatedPreviewBox}>
                  <View style={styles.simulatedPreviewIconWrap}>
                    <Ionicons name="film-outline" size={56} color="#60A5FA" />
                  </View>
                  <Text style={styles.simulatedPreviewTitle}>Video Note Recorded</Text>
                  <Text style={styles.simulatedPreviewSub}>
                    Length: {formatSeconds(recordingSeconds || 6)} • HD 1080p
                  </Text>
                  <View style={styles.simulatedPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.simulatedPillText}>Ready to dispatch</Text>
                  </View>
                </View>
              )}

              {/* Duration Badge Pill on Preview */}
              <View style={styles.previewDurationBadge}>
                <Ionicons name="time-outline" size={13} color="#FFFFFF" />
                <Text style={styles.previewDurationText}>{formatSeconds(recordingSeconds || 6)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ================= BOTTOM CONTROLS ================= */}
        <View style={styles.bottomBar}>
          {recordState === 'READY' && (
            <View style={styles.readyControlsRow}>
              <TouchableOpacity
                style={styles.recordTriggerCircle}
                onPress={handleStartRecording}
                activeOpacity={0.8}
                accessibilityLabel="Start Video Recording"
              >
                <View style={styles.recordInnerDot} />
              </TouchableOpacity>
              <Text style={styles.recordButtonLabel}>Record Video Message</Text>
            </View>
          )}

          {recordState === 'RECORDING' && (
            <View style={styles.recordingControlsRow}>
              <TouchableOpacity
                style={styles.stopRecordBtn}
                onPress={handleStopRecording}
                activeOpacity={0.8}
                accessibilityLabel="Stop Recording"
              >
                <View style={styles.stopInnerSquare} />
              </TouchableOpacity>
              <Text style={styles.recordingActiveLabel}>Tap to Finish Recording</Text>
            </View>
          )}

          {recordState === 'PREVIEW' && (
            <View style={styles.previewControlsWrapper}>
              {/* Optional Caption Input */}
              <View style={styles.captionInputRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add a note with this video message..."
                  placeholderTextColor="#64748B"
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={160}
                />
              </View>

              {/* Action Buttons: Retake vs Send */}
              <View style={styles.previewActionsRow}>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={18} color="#CBD5E1" style={{ marginRight: 6 }} />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sendVideoBtn} onPress={handleSend} activeOpacity={0.8}>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.sendVideoBtnText}>Send Video Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  topBar: {
    height: Platform.OS === 'ios' ? 60 : 64,
    paddingTop: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.95)',
    zIndex: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    maxWidth: SCREEN_WIDTH * 0.55,
  },
  recipientBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  circleIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  recordingHud: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  recordingTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  redRecDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recTimerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  audioWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
    height: 44,
  },
  soundWaveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  readyHintBanner: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  readyHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatedPreviewBox: {
    alignItems: 'center',
    padding: 24,
  },
  simulatedPreviewIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  simulatedPreviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  simulatedPreviewSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  simulatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  simulatedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  previewDurationBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  previewDurationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  readyControlsRow: {
    alignItems: 'center',
  },
  recordTriggerCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  recordInnerDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
  },
  recordButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 10,
  },
  recordingControlsRow: {
    alignItems: 'center',
  },
  stopRecordBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  stopInnerSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  recordingActiveLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  previewControlsWrapper: {
    width: '100%',
  },
  captionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  captionInput: {
    flex: 1,
    fontSize: 14,
    color: '#F8FAFC',
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  sendVideoBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B4FD8',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#1B4FD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sendVideoBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
