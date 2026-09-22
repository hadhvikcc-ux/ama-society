import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../../stores/chatStore';

export interface VideoMessageCardProps {
  message: ChatMessage;
  onPlayVideo: (message: ChatMessage) => void;
}

export function VideoMessageCard({ message, onPlayVideo }: VideoMessageCardProps) {
  const isOwn = message.isOwn;

  const formatDuration = (sec?: number) => {
    if (!sec) return '0:06';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isWebBlob =
    Platform.OS === 'web' &&
    message.videoUri &&
    (message.videoUri.startsWith('blob:') ||
      message.videoUri.startsWith('http:') ||
      message.videoUri.startsWith('https:'));

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      {!isOwn && (
        <View style={styles.senderHeaderRow}>
          <Text style={styles.senderAvatar}>{message.senderAvatar || '👤'}</Text>
          <View>
            <Text style={styles.senderName}>{message.senderName}</Text>
            {message.senderRole && <Text style={styles.senderRole}>{message.senderRole}</Text>}
          </View>
        </View>
      )}

      {/* Main Video Bubble Card */}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {/* Video Thumbnail Tile with Play Overlay */}
        <TouchableOpacity
          style={styles.thumbnailBox}
          onPress={() => onPlayVideo(message)}
          activeOpacity={0.88}
          accessibilityLabel={`Play video note from ${message.senderName}`}
        >
          {/* Simulated or Real Frame Backdrop */}
          {isWebBlob ? (
            <View style={StyleSheet.absoluteFillObject}>
              {React.createElement('video', {
                src: message.videoUri,
                muted: true,
                playsInline: true,
                style: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.85,
                  backgroundColor: '#000',
                },
              })}
            </View>
          ) : (
            <View style={styles.frameBackdrop}>
              <Ionicons name="videocam" size={32} color="rgba(255, 255, 255, 0.4)" />
            </View>
          )}

          {/* Center Play Button Overlay */}
          <View style={styles.playCircle}>
            <Ionicons name="play" size={26} color="#FFFFFF" style={{ marginLeft: 3 }} />
          </View>

          {/* Top Security CCTV Pill */}
          <View style={styles.cctvPill}>
            <View style={styles.recDotMini} />
            <Text style={styles.cctvPillText}>VIDEO NOTE</Text>
          </View>

          {/* Bottom Duration Badge */}
          <View style={styles.durationPill}>
            <Ionicons name="time" size={11} color="#FFFFFF" />
            <Text style={styles.durationText}>{formatDuration(message.videoDurationSec)}</Text>
          </View>
        </TouchableOpacity>

        {/* Caption Text (if provided) */}
        {message.caption ? (
          <View style={styles.captionContainer}>
            <Text style={[styles.captionText, isOwn ? styles.captionTextOwn : styles.captionTextOther]}>
              {message.caption}
            </Text>
          </View>
        ) : null}

        {/* Footer info: time & delivery ticks */}
        <View style={styles.footerRow}>
          <Text style={[styles.timeText, isOwn ? styles.timeTextOwn : styles.timeTextOther]}>
            {message.time}
          </Text>
          {isOwn && (
            <Ionicons
              name={message.status === 'read' ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.status === 'read' ? '#60A5FA' : 'rgba(255, 255, 255, 0.7)'}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    maxWidth: '82%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
  },
  senderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
  senderAvatar: {
    fontSize: 14,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  senderRole: {
    fontSize: 10,
    color: '#94A3B8',
  },
  bubble: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleOwn: {
    backgroundColor: '#1E40AF',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbnailBox: {
    width: 240,
    height: 160,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  frameBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(27, 79, 216, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  cctvPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  recDotMini: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  cctvPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  durationPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  captionTextOwn: {
    color: '#FFFFFF',
  },
  captionTextOther: {
    color: '#0F172A',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeTextOwn: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeTextOther: {
    color: '#94A3B8',
  },
});
