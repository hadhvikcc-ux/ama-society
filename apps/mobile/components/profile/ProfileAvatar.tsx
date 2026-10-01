import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { pickAvatarImage, saveAvatar } from '../../services/avatar';

function initialsOf(name?: string) {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

interface ProfileAvatarProps {
  size?: number;
  /** Show the camera button and the Change / Remove photo actions. */
  editable?: boolean;
  /** Text colour for the actions and status line: light on the blue profile card. */
  tone?: 'light' | 'dark';
}

/**
 * The signed-in user's profile picture, falling back to their initials.
 * When editable, residents can upload a new photo or remove the current one.
 */
export function ProfileAvatar({ size = 72, editable = false, tone = 'dark' }: ProfileAvatarProps) {
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const run = async (action: () => Promise<string | null>) => {
    setStatus(null);
    setBusy(true);
    try {
      const done = await action();
      if (done) setStatus({ kind: 'ok', text: done });
    } catch (e: any) {
      setStatus({ kind: 'error', text: e?.message || 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = () =>
    run(async () => {
      const image = await pickAvatarImage();
      if (!image) return null; // cancelled
      await saveAvatar(image);
      return 'Profile picture updated';
    });

  const removePhoto = () =>
    run(async () => {
      await saveAvatar(null);
      return 'Profile picture removed';
    });

  const circle = { width: size, height: size, borderRadius: size / 2 };
  const actionColor = tone === 'light' ? '#FFFFFF' : '#1D4ED8';
  const statusColor =
    status?.kind === 'error' ? (tone === 'light' ? '#FECACA' : '#DC2626') : tone === 'light' ? '#BBF7D0' : '#15803D';

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        disabled={!editable || busy}
        onPress={changePhoto}
        activeOpacity={0.85}
        accessibilityRole={editable ? 'button' : undefined}
        accessibilityLabel={editable ? 'Change profile picture' : `${user?.name || 'User'} profile picture`}
      >
        <View style={[styles.circle, circle]}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={circle} resizeMode="cover" />
          ) : (
            <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initialsOf(user?.name)}</Text>
          )}
          {busy && (
            <View style={[styles.busyOverlay, circle]}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </View>
        {editable && (
          <View style={[styles.cameraBadge, { right: size * 0.02, bottom: size * 0.02 }]}>
            <Ionicons name="camera" size={Math.max(14, size * 0.18)} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {editable && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={changePhoto} disabled={busy} accessibilityRole="button">
            <Text style={[styles.actionText, { color: actionColor }]}>
              {user?.avatarUrl ? 'Change photo' : 'Upload photo'}
            </Text>
          </TouchableOpacity>
          {user?.avatarUrl && (
            <>
              <Text style={[styles.actionText, { color: actionColor, opacity: 0.6 }]}>•</Text>
              <TouchableOpacity onPress={removePhoto} disabled={busy} accessibilityRole="button">
                <Text style={[styles.actionText, { color: actionColor }]}>Remove</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      {status && <Text style={[styles.status, { color: statusColor }]}>{status.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  circle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  initials: { fontWeight: 'bold', color: '#1B4FD8' },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    backgroundColor: '#4338CA',
    borderRadius: 999,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  actionText: { fontSize: 13, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
});
