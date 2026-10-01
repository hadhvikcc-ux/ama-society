import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { BentoTile } from '../ui/BentoTile';
import { SIGNUP_ROLE_OPTIONS } from '../auth/SignupRolePicker';

interface PendingUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  createdAt: string;
}

const roleLabel = (role: string) => SIGNUP_ROLE_OPTIONS.find((o) => o.key === role)?.title ?? role;

/**
 * Admin dashboard tile: staff sign-ups (guard, committee, vendor, supplier) waiting for approval.
 * Hidden when the list cannot be loaded (e.g. an offline demo session).
 */
export function PendingApprovalsTile() {
  const [items, setItems] = useState<PendingUser[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/auth/approvals');
      setItems(res.data);
    } catch {
      setItems(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (user: PendingUser, approve: boolean) => {
    setBusyId(user.id);
    setMessage(null);
    try {
      await api.post(`/auth/approvals/${user.id}/${approve ? 'approve' : 'reject'}`);
      setItems((prev) => (prev ?? []).filter((u) => u.id !== user.id));
      setMessage(approve ? `${user.name} can now sign in as ${roleLabel(user.role)}.` : `${user.name}'s request was declined.`);
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Could not update the request. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (items === null) return null;

  return (
    <BentoTile color={items.length ? 'cream' : 'white'}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="person-add" size={20} color="#B45309" />
          <Text style={styles.title}>Sign-up requests</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{items.length} pending</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>No staff sign-ups waiting. Residents (owners and tenants) join without approval.</Text>
      ) : (
        items.map((u) => (
          <View key={u.id} style={styles.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>
                {u.name} <Text style={styles.role}>· {roleLabel(u.role)}</Text>
              </Text>
              <Text style={styles.contact} numberOfLines={1}>
                {[u.phone, u.email].filter(Boolean).join(' • ')}
              </Text>
            </View>
            {busyId === u.id ? (
              <ActivityIndicator color="#B45309" />
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => decide(u, false)} accessibilityRole="button" accessibilityLabel={`Decline ${u.name}`}>
                  <View style={[styles.btn, styles.declineBtn]}>
                    <Text style={styles.declineText}>Decline</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => decide(u, true)} accessibilityRole="button" accessibilityLabel={`Approve ${u.name}`}>
                  <View style={[styles.btn, styles.approveBtn]}>
                    <Text style={styles.approveText}>Approve</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
      {message && <Text style={styles.message}>{message}</Text>}
    </BentoTile>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  countPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  countText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  empty: { fontSize: 13, color: '#6B7280' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(146,64,14,0.12)',
  },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  role: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  contact: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  approveBtn: { backgroundColor: '#15803D' },
  approveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  declineBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FECACA' },
  declineText: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },
  message: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#15803D' },
});
