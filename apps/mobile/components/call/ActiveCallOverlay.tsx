import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallStore } from '../../stores/callStore';
import { useChatStore } from '../../stores/chatStore';
import { UniversalCameraView } from '../camera/UniversalCameraView';
import { IntercomVideoFeed } from './IntercomVideoFeed';
import { VideoMessageRecorderModal } from '../media/VideoMessageRecorderModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ActiveCallOverlay() {
  const {
    activeCall,
    incomingCall,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    flipCamera,
    upgradeToVideo,
    incrementDuration,
  } = useCallStore();

  const { sendVideoMessage } = useChatStore();
  const [isSwappedVideo, setIsSwappedVideo] = useState(false);
  const [isVideoNoteOpen, setIsVideoNoteOpen] = useState(false);
  const [cachedContact, setCachedContact] = useState<any>(null);

  const handleOpenVideoNote = () => {
    if (activeCall?.contact) {
      setCachedContact(activeCall.contact);
    }
    setIsVideoNoteOpen(true);
    endCall();
  };

  const handleSendVideoNote = (payload: { videoUri: string; durationSec: number; caption?: string }) => {
    const contact = cachedContact || activeCall?.contact;
    sendVideoMessage({
      channelId: 'general',
      videoUri: payload.videoUri,
      videoDurationSec: payload.durationSec,
      caption: payload.caption
        ? `[Intercom Video Note for ${contact?.name || 'Resident'}] ${payload.caption}`
        : `Intercom video note for ${contact?.name || 'Resident'} (${contact?.flat || 'Gate'})`,
      recipientName: contact?.name,
    });
    setIsVideoNoteOpen(false);
    setCachedContact(null);
  };

  // Pulse animation for avatar rings
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(8)).current;
  const waveAnim2 = useRef(new Animated.Value(16)).current;
  const waveAnim3 = useRef(new Animated.Value(24)).current;
  const waveAnim4 = useRef(new Animated.Value(12)).current;

  // Duration timer
  useEffect(() => {
    let timer: any = null;
    if (activeCall && activeCall.status === 'CONNECTED') {
      timer = setInterval(() => {
        incrementDuration();
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  // Pulse animation loop
  useEffect(() => {
    if (activeCall || incomingCall) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [activeCall, incomingCall]);

  // Audio wave animation when connected
  useEffect(() => {
    if (activeCall?.status === 'CONNECTED' && !activeCall.isMuted) {
      const makeWave = (val: Animated.Value, max: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: max, duration: 250 + Math.random() * 200, useNativeDriver: false }),
            Animated.timing(val, { toValue: 6, duration: 250 + Math.random() * 200, useNativeDriver: false }),
          ])
        );
      };
      const w1 = makeWave(waveAnim1, 28);
      const w2 = makeWave(waveAnim2, 36);
      const w3 = makeWave(waveAnim3, 30);
      const w4 = makeWave(waveAnim4, 22);

      w1.start();
      w2.start();
      w3.start();
      w4.start();

      return () => {
        w1.stop();
        w2.stop();
        w3.stop();
        w4.stop();
      };
    }
  }, [activeCall?.status, activeCall?.isMuted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. Render Incoming Call Banner / Modal
  if (incomingCall) {
    const isVid = incomingCall.callType === 'VIDEO';
    return (
      <View style={styles.fullscreenContainer}>
        <View style={styles.incomingModalBackdrop}>
          <View style={styles.incomingCard}>
            <View style={styles.incomingBadgeRow}>
              <View style={styles.incomingBadge}>
                <Ionicons name={isVid ? 'videocam' : 'call'} size={14} color="#FFFFFF" />
                <Text style={styles.incomingBadgeText}>
                  INCOMING {isVid ? 'VIDEO' : 'VOICE'} INTERCOM
                </Text>
              </View>
            </View>

            <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.incomingAvatarBox}>
                <Text style={{ fontSize: 36 }}>{incomingCall.contact.avatar || '🛡️'}</Text>
              </View>
            </Animated.View>

            <Text style={styles.incomingName}>{incomingCall.contact.name}</Text>
            {incomingCall.contact.flat && (
              <Text style={styles.incomingFlat}>Flat {incomingCall.contact.flat}</Text>
            )}
            <Text style={styles.incomingRole}>{incomingCall.contact.role}</Text>
            <Text style={styles.incomingRingingText}>Ringing...</Text>

            {/* Answer & Decline Actions */}
            <View style={styles.incomingActionRow}>
              <TouchableOpacity
                style={[styles.callBtnCircle, { backgroundColor: '#DC2626' }]}
                onPress={declineIncomingCall}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={26} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
                <Text style={styles.btnSubLabel}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.callBtnCircle, { backgroundColor: '#16A34A', width: 72, height: 72, borderRadius: 36 }]}
                onPress={acceptIncomingCall}
                activeOpacity={0.8}
              >
                <Ionicons name={isVid ? 'videocam' : 'call'} size={30} color="#FFFFFF" />
                <Text style={styles.btnSubLabel}>Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // 2. Render Active Call
  if (!activeCall) return null;

  const isVideo = activeCall.callType === 'VIDEO';

  return (
    <View style={styles.fullscreenContainer}>
      {isVideo ? (
        // ==================== VIDEO CALL SCREEN ====================
        <View style={styles.videoContainer}>
          {/* Main Video Stage */}
          <View style={styles.remoteVideoFeed}>
            {activeCall.status !== 'CONNECTED' ? (
              // 1. Dialing or Ringing: Show Local User Camera in Full Screen immediately
              <View style={StyleSheet.absoluteFillObject}>
                {activeCall.isVideoEnabled ? (
                  <UniversalCameraView
                    mode="video-call"
                    facing={activeCall.isFrontCamera ? 'front' : 'back'}
                    isActive={true}
                    mirror={activeCall.isFrontCamera}
                    showStatusIndicator={false}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : (
                  <View style={styles.cameraOffFullScreen}>
                    <Ionicons name="videocam-off" size={48} color="#EF4444" />
                    <Text style={styles.cameraOffText}>Your Camera is Off</Text>
                  </View>
                )}

                {/* Dialing / Ringing Call Overlay */}
                <View style={styles.dialingOverlay}>
                  <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={[styles.incomingAvatarBox, { width: 88, height: 88, borderRadius: 44 }]}>
                      <Text style={{ fontSize: 44 }}>{activeCall.contact.avatar || '👤'}</Text>
                    </View>
                  </Animated.View>
                  <Text style={styles.dialingContactName}>{activeCall.contact.name}</Text>
                  {activeCall.contact.flat && (
                    <View style={styles.dialingFlatPill}>
                      <Text style={styles.dialingFlatPillText}>{activeCall.contact.flat}</Text>
                    </View>
                  )}
                  <View style={styles.dialingBadge}>
                    <Ionicons name="radio" size={14} color="#10B981" />
                    <Text style={styles.dialingBadgeText}>
                      {activeCall.status === 'RINGING' ? 'Ringing Intercom...' : 'Dialing Gate Intercom...'}
                    </Text>
                  </View>

                  {/* Leave Video Note Button */}
                  <TouchableOpacity
                    style={styles.leaveVideoNoteBtn}
                    onPress={handleOpenVideoNote}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="videocam" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.leaveVideoNoteText}>Leave Video Note</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !isSwappedVideo ? (
              // 2. Connected Default: Live Remote Intercom Video Feed full-screen
              <IntercomVideoFeed
                contact={activeCall.contact}
                isConnected={true}
                durationSeconds={activeCall.durationSeconds}
              />
            ) : (
              // 3. Connected Swapped: Local Camera full-screen
              <View style={StyleSheet.absoluteFillObject}>
                {activeCall.isVideoEnabled ? (
                  <UniversalCameraView
                    mode="video-call"
                    facing={activeCall.isFrontCamera ? 'front' : 'back'}
                    isActive={true}
                    mirror={activeCall.isFrontCamera}
                    showStatusIndicator={false}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : (
                  <View style={styles.cameraOffFullScreen}>
                    <Ionicons name="videocam-off" size={48} color="#EF4444" />
                    <Text style={styles.cameraOffText}>Your Camera is Off</Text>
                  </View>
                )}
              </View>
            )}

            {/* Top Video Header HUD */}
            <View style={styles.videoHeaderHud}>
              <View>
                <Text style={styles.hudContactName}>{activeCall.contact.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {activeCall.contact.flat && (
                    <View style={styles.hudFlatPill}>
                      <Text style={styles.hudFlatPillText}>{activeCall.contact.flat}</Text>
                    </View>
                  )}
                  <Text style={styles.hudRoleText}>{activeCall.contact.role}</Text>
                </View>
              </View>

              <View style={styles.durationPill}>
                <View style={[styles.statusDot, activeCall.status === 'CONNECTED' ? { backgroundColor: '#10B981' } : { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.durationText}>
                  {activeCall.status === 'CONNECTED'
                    ? formatTime(activeCall.durationSeconds)
                    : activeCall.status}
                </Text>
              </View>
            </View>

            {/* Picture-in-Picture Local Camera or Remote Feed (Available when connected) */}
            {activeCall.status === 'CONNECTED' && (
              <TouchableOpacity
                style={styles.pipLocalCamera}
                onPress={() => setIsSwappedVideo(!isSwappedVideo)}
                activeOpacity={0.85}
                accessibilityLabel="Tap to swap video screens"
              >
                {!isSwappedVideo ? (
                  // Local Camera in PiP
                  activeCall.isVideoEnabled ? (
                    <View style={styles.pipInnerActive}>
                      <UniversalCameraView
                        mode="video-call"
                        facing={activeCall.isFrontCamera ? 'front' : 'back'}
                        isActive={true}
                        mirror={activeCall.isFrontCamera}
                        showStatusIndicator={false}
                        style={{ width: '100%', height: '100%' }}
                      />
                      <View style={styles.pipFloatingBadge}>
                        <Text style={styles.pipFloatingText}>
                          {activeCall.isFrontCamera ? 'Front' : 'Back'} • Swap
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.pipInnerDisabled}>
                      <Ionicons name="videocam-off" size={24} color="#EF4444" />
                      <Text style={[styles.pipLabel, { color: '#EF4444' }]}>Camera Off</Text>
                    </View>
                  )
                ) : (
                  // Remote caller in PiP
                  <View style={styles.pipInnerRemoteMini}>
                    <Text style={{ fontSize: 28 }}>{activeCall.contact.avatar || '👤'}</Text>
                    <Text style={styles.pipRemoteName} numberOfLines={1}>
                      {activeCall.contact.name.split(' ')[0]}
                    </Text>
                    <View style={styles.pipFloatingBadge}>
                      <Text style={styles.pipFloatingText}>Intercom • Swap</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Network Health Badge */}
            <View style={styles.networkBadge}>
              <Ionicons name="cellular" size={13} color="#10B981" />
              <Text style={styles.networkBadgeText}>1080p 60fps • 48ms • Cam Active</Text>
            </View>
          </View>

          {/* Bottom Floating Control Dock */}
          <View style={styles.videoControlDock}>
            <TouchableOpacity
              style={[styles.dockBtn, activeCall.isFrontCamera ? styles.dockBtnInactive : styles.dockBtnActive]}
              onPress={flipCamera}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
              <Text style={styles.dockBtnLabel}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dockBtn, !activeCall.isVideoEnabled && styles.dockBtnActiveRed]}
              onPress={toggleVideo}
              activeOpacity={0.8}
            >
              <Ionicons name={activeCall.isVideoEnabled ? 'videocam-outline' : 'videocam-off-outline'} size={22} color="#FFFFFF" />
              <Text style={styles.dockBtnLabel}>{activeCall.isVideoEnabled ? 'Cam On' : 'Cam Off'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dockBtn, activeCall.isMuted && styles.dockBtnActiveRed]}
              onPress={toggleMute}
              activeOpacity={0.8}
            >
              <Ionicons name={activeCall.isMuted ? 'mic-off-outline' : 'mic-outline'} size={22} color="#FFFFFF" />
              <Text style={styles.dockBtnLabel}>{activeCall.isMuted ? 'Muted' : 'Mic'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dockBtn, activeCall.isSpeakerOn && styles.dockBtnActive]}
              onPress={toggleSpeaker}
              activeOpacity={0.8}
            >
              <Ionicons name={activeCall.isSpeakerOn ? 'volume-high-outline' : 'volume-medium-outline'} size={22} color="#FFFFFF" />
              <Text style={styles.dockBtnLabel}>Speaker</Text>
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              style={[styles.dockBtn, styles.dockBtnEndCall]}
              onPress={endCall}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={styles.dockBtnLabel}>End</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // ==================== AUDIO CALL SCREEN ====================
        <View style={styles.audioContainer}>
          {/* Top Info Header */}
          <View style={styles.audioTopBar}>
            <View style={styles.secureTag}>
              <Ionicons name="shield-checkmark" size={13} color="#10B981" />
              <Text style={styles.secureTagText}>Encrypted VoIP Intercom</Text>
            </View>

            <View style={styles.durationPill}>
              <View style={[styles.statusDot, activeCall.status === 'CONNECTED' ? { backgroundColor: '#10B981' } : { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.durationText}>
                {activeCall.status === 'CONNECTED'
                  ? formatTime(activeCall.durationSeconds)
                  : activeCall.status}
              </Text>
            </View>
          </View>

          {/* Central Caller Information */}
          <View style={styles.audioCenterContent}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.incomingAvatarBox, { width: 110, height: 110, borderRadius: 55 }]}>
                <Text style={{ fontSize: 52 }}>{activeCall.contact.avatar || '👤'}</Text>
              </View>
            </Animated.View>

            <Text style={styles.audioContactName}>{activeCall.contact.name}</Text>
            {activeCall.contact.flat && (
              <View style={styles.audioFlatBadge}>
                <Text style={styles.audioFlatBadgeText}>Flat {activeCall.contact.flat}</Text>
              </View>
            )}
            <Text style={styles.audioRole}>{activeCall.contact.role}</Text>

            {/* Audio Waveform Visualization */}
            <View style={styles.waveformContainer}>
              <Animated.View style={[styles.waveBar, { height: waveAnim1 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim2 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim3 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim4 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim2 }]} />
              <Animated.View style={[styles.waveBar, { height: waveAnim1 }]} />
            </View>

            <Text style={styles.audioStatusText}>
              {activeCall.status === 'CONNECTED'
                ? activeCall.isMuted
                  ? 'Microphone Muted'
                  : 'HD Audio Connected'
                : activeCall.status === 'RINGING'
                ? 'Ringing...'
                : 'Calling...'}
            </Text>
          </View>

          {/* Bottom Audio Action Controls */}
          <View style={styles.audioControlsContainer}>
            <View style={styles.audioControlsRow}>
              {/* Mute Button */}
              <TouchableOpacity
                style={[styles.audioControlBtn, activeCall.isMuted && styles.audioBtnActiveMute]}
                onPress={toggleMute}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={activeCall.isMuted ? 'mic-off' : 'mic'}
                  size={24}
                  color={activeCall.isMuted ? '#EF4444' : '#FFFFFF'}
                />
                <Text style={styles.audioBtnLabel}>{activeCall.isMuted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>

              {/* Speaker Button */}
              <TouchableOpacity
                style={[styles.audioControlBtn, activeCall.isSpeakerOn && styles.audioBtnActiveSpeaker]}
                onPress={toggleSpeaker}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={activeCall.isSpeakerOn ? 'volume-high' : 'volume-medium'}
                  size={24}
                  color={activeCall.isSpeakerOn ? '#3B82F6' : '#FFFFFF'}
                />
                <Text style={styles.audioBtnLabel}>Speaker</Text>
              </TouchableOpacity>

              {/* Switch to Video Button */}
              <TouchableOpacity
                style={styles.audioControlBtn}
                onPress={upgradeToVideo}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam" size={24} color="#FFFFFF" />
                <Text style={styles.audioBtnLabel}>Video</Text>
              </TouchableOpacity>

              {/* Leave Video Note Button */}
              <TouchableOpacity
                style={styles.audioControlBtn}
                onPress={handleOpenVideoNote}
                activeOpacity={0.8}
              >
                <Ionicons name="recording" size={24} color="#EF4444" />
                <Text style={styles.audioBtnLabel}>Note</Text>
              </TouchableOpacity>
            </View>

            {/* End Call Button */}
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <TouchableOpacity
                style={styles.audioEndCallBtn}
                onPress={endCall}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={30} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <Text style={[styles.audioBtnLabel, { marginTop: 6, color: '#EF4444', fontWeight: '700' }]}>
                End Call
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Video Message Recorder Modal (For leaving intercom video notes) */}
      <VideoMessageRecorderModal
        visible={isVideoNoteOpen}
        onClose={() => setIsVideoNoteOpen(false)}
        onSendVideo={handleSendVideoNote}
        recipientName={cachedContact?.name || activeCall?.contact?.name}
        recipientFlat={cachedContact?.flat || activeCall?.contact?.flat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },

  // Incoming Call Styles
  incomingModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  incomingCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 25,
  },
  incomingBadgeRow: { marginBottom: 18 },
  incomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  incomingBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  avatarRing: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    marginBottom: 16,
  },
  incomingAvatarBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  incomingName: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', textAlign: 'center' },
  incomingFlat: { fontSize: 13, fontWeight: '700', color: '#60A5FA', marginTop: 2 },
  incomingRole: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  incomingRingingText: { fontSize: 13, fontWeight: '600', color: '#10B981', marginTop: 12, letterSpacing: 1 },
  incomingActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 28,
  },
  callBtnCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  btnSubLabel: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },

  // Video Screen Styles
  videoContainer: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  remoteVideoFeed: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  remotePlaceholderCenter: {
    alignItems: 'center',
  },
  remoteFeedName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 12 },
  remoteFeedStatus: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  dialingOverlay: {
    position: 'absolute',
    top: '22%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  dialingContactName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  dialingFlatPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  dialingFlatPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
  },
  dialingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  dialingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  leaveVideoNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  leaveVideoNoteText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  videoHeaderHud: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  hudContactName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  hudFlatPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hudFlatPillText: { fontSize: 11, fontWeight: '700', color: '#93C5FD' },
  hudRoleText: { fontSize: 12, color: '#CBD5E1' },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  durationText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  pipLocalCamera: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: 18,
    width: 110,
    height: 150,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#3B82F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  pipInnerActive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  pipInnerDisabled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  pipLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 4 },
  pipCameraLabel: { fontSize: 9, color: '#64748B' },
  pipFloatingBadge: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pipFloatingText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  pipInnerRemoteMini: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  pipRemoteName: { fontSize: 10, fontWeight: '700', color: '#93C5FD', marginTop: 2 },
  cctvWatermark: {
    position: 'absolute',
    bottom: -60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cctvText: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 1 },
  cameraOffFullScreen: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOffText: { fontSize: 14, fontWeight: '700', color: '#EF4444', marginTop: 8 },
  networkBadge: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkBadgeText: { fontSize: 10, fontWeight: '700', color: '#CBD5E1' },
  videoControlDock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: '#0B0F19',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingBottom: Platform.OS === 'ios' ? 36 : 18,
  },
  dockBtn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
  },
  dockBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dockBtnActive: {
    backgroundColor: '#3B82F6',
  },
  dockBtnActiveRed: {
    backgroundColor: '#DC2626',
  },
  dockBtnEndCall: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  dockBtnLabel: { fontSize: 10, color: '#FFFFFF', fontWeight: '600', marginTop: 4 },

  // Audio Screen Styles
  audioContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 24,
  },
  audioTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  secureTagText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  audioCenterContent: {
    alignItems: 'center',
  },
  audioContactName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  audioFlatBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  audioFlatBadgeText: { fontSize: 12, fontWeight: '700', color: '#BFDBFE' },
  audioRole: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    marginTop: 24,
    marginBottom: 8,
  },
  waveBar: {
    width: 5,
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  audioStatusText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  audioControlsContainer: {
    width: '100%',
  },
  audioControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  audioControlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioBtnActiveMute: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  audioBtnActiveSpeaker: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  audioBtnLabel: { fontSize: 11, color: '#CBD5E1', fontWeight: '600', marginTop: 4 },
  audioEndCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
});
