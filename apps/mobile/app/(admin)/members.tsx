import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { MainPane, PaneRow, SidePane, useWideLayout } from '../../components/ui/TwoPaneLayout';

type IconName = keyof typeof Ionicons.glyphMap;

interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  tenancyType: string | null;
  committeePosition: string | null;
  avatarUrl: string | null;
  flat: { flatNumber: string; tower: string } | null;
}

interface RoleRequest {
  id: string;
  fromRole: string;
  fromTenancy: string | null;
  toRole: string;
  toTenancy: string | null;
  reason: string | null;
  createdAt: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  decidedAt?: string | null;
  user: { id: string; name: string };
  requestedBy: { id: string; name: string };
  decidedBy?: { id: string; name: string } | null;
}

/** Same keys as MEMBER_ROLES in packages/api/src/members/member-roles.ts. */
const ROLE_CHOICES: { key: string; role: string; tenancy: string | null; label: string; icon: IconName }[] = [
  { key: 'RESIDENT_OWNER', role: 'RESIDENT', tenancy: 'OWNER', label: 'Flat owner', icon: 'home' },
  { key: 'RESIDENT_TENANT', role: 'RESIDENT', tenancy: 'TENANT', label: 'Tenant', icon: 'key' },
  { key: 'COMMITTEE', role: 'COMMITTEE', tenancy: null, label: 'Committee member', icon: 'ribbon' },
  { key: 'GUARD', role: 'GUARD', tenancy: null, label: 'Security guard', icon: 'shield-checkmark' },
  { key: 'VENDOR', role: 'VENDOR', tenancy: null, label: 'Mart vendor', icon: 'storefront' },
  { key: 'SUPPLIER', role: 'SUPPLIER', tenancy: null, label: 'Supplier', icon: 'cube' },
  { key: 'ADMIN', role: 'ADMIN', tenancy: null, label: 'Admin', icon: 'settings' },
];

function roleLabel(role: string, tenancy: string | null) {
  const exact = ROLE_CHOICES.find((c) => c.role === role && c.tenancy === tenancy);
  if (exact) return exact.label;
  return role === 'RESIDENT' ? 'Resident' : role.charAt(0) + role.slice(1).toLowerCase();
}

const errorText = (e: any, fallback: string) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m[0] : m || fallback;
};

/**
 * Admins change members' roles; the society President approves each change.
 * A change made by the President applies straight away.
 */
export default function MemberRolesScreen() {
  const router = useRouter();
  const wide = useWideLayout();
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [recent, setRecent] = useState<RoleRequest[]>([]);
  const [viewer, setViewer] = useState<{ id: string; isPresident: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.members);
      setRequests(res.data.pendingRequests);
      setRecent(res.data.recentDecisions ?? []);
      setViewer(res.data.viewer);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(errorText(e, 'Could not load members. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingFor = useMemo(() => new Map(requests.map((r) => [r.user.id, r])), [requests]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.name, m.phone, m.email ?? '', m.flat?.flatNumber ?? '', roleLabel(m.role, m.tenancyType)].some((v) => v.toLowerCase().includes(q)),
    );
  }, [members, search]);

  const openEditor = (m: Member) => {
    setEditingId(editingId === m.id ? null : m.id);
    setChoice(null);
    setReason('');
    setNotice(null);
  };

  const submitChange = async (m: Member) => {
    if (!choice) return;
    setBusy(m.id);
    setNotice(null);
    try {
      const res = await api.post(`/members/${m.id}/role-requests`, { role: choice, reason: reason.trim() || undefined });
      const label = ROLE_CHOICES.find((c) => c.key === choice)?.label;
      setNotice({
        kind: 'ok',
        text: res.data.applied
          ? `${m.name} is now ${label}.`
          : `Sent to the President: ${m.name} → ${label}. It applies once approved.`,
      });
      setEditingId(null);
      await load();
    } catch (e: any) {
      setNotice({ kind: 'error', text: errorText(e, 'Could not send the role change.') });
    } finally {
      setBusy(null);
    }
  };

  const decide = async (r: RoleRequest, approve: boolean) => {
    setBusy(r.id);
    setNotice(null);
    try {
      await api.post(`/members/role-requests/${r.id}/${approve ? 'approve' : 'reject'}`);
      setNotice({
        kind: 'ok',
        text: approve
          ? `Approved: ${r.user.name} is now ${roleLabel(r.toRole, r.toTenancy)}.`
          : `Rejected the change for ${r.user.name}.`,
      });
      await load();
    } catch (e: any) {
      setNotice({ kind: 'error', text: errorText(e, 'Could not update the request.') });
    } finally {
      setBusy(null);
    }
  };

  const requestsPanel = (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Ionicons
          name={requests.length ? 'hourglass' : 'checkmark-done-circle'}
          size={18}
          color={requests.length ? '#B45309' : '#15803D'}
        />
        <Text style={styles.cardTitle}>{viewer?.isPresident ? 'Needs your approval' : 'Waiting for the President'}</Text>
        {requests.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{requests.length}</Text>
          </View>
        )}
      </View>
      {requests.length === 0 ? (
        <Text style={styles.muted}>
          All caught up: no role changes are waiting{viewer?.isPresident ? ' for your approval' : ''}.
        </Text>
      ) : (
        requests.map((r) => (
          <View key={r.id} style={styles.requestRow}>
            <Text style={styles.requestName}>{r.user.name}</Text>
            <Text style={styles.requestChange}>
              {roleLabel(r.fromRole, r.fromTenancy)} <Text style={{ color: '#9CA3AF' }}>→</Text>{' '}
              <Text style={{ fontWeight: '800', color: '#1B4FD8' }}>{roleLabel(r.toRole, r.toTenancy)}</Text>
            </Text>
            <Text style={styles.requestMeta}>
              Asked by {r.requestedBy.name}
              {r.reason ? ` · “${r.reason}”` : ''}
            </Text>
            {viewer?.isPresident ? (
              busy === r.id ? (
                <ActivityIndicator color="#1B4FD8" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
              ) : (
                <View style={styles.decideRow}>
                  <TouchableOpacity onPress={() => decide(r, false)} accessibilityRole="button" accessibilityLabel={`Reject change for ${r.user.name}`}>
                    <View style={[styles.smallBtn, styles.rejectBtn]}>
                      <Text style={styles.rejectText}>Reject</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => decide(r, true)} accessibilityRole="button" accessibilityLabel={`Approve change for ${r.user.name}`}>
                    <View style={[styles.smallBtn, styles.approveBtn]}>
                      <Text style={styles.approveText}>Approve</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <Text style={styles.waitingTag}>Awaiting President's approval</Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const recentPanel = recent.length > 0 && (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Ionicons name="time-outline" size={18} color="#475569" />
        <Text style={styles.cardTitle}>Recent decisions</Text>
      </View>
      {recent.map((r) => {
        const approved = r.status === 'APPROVED';
        return (
          <View key={r.id} style={styles.requestRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={approved ? 'checkmark-circle' : 'close-circle'} size={16} color={approved ? '#15803D' : '#B91C1C'} />
              <Text style={styles.requestName}>{r.user.name}</Text>
            </View>
            <Text style={styles.requestChange}>
              {roleLabel(r.fromRole, r.fromTenancy)} <Text style={{ color: '#9CA3AF' }}>→</Text>{' '}
              <Text style={{ fontWeight: '800', color: approved ? '#15803D' : '#9CA3AF', textDecorationLine: approved ? 'none' : 'line-through' }}>
                {roleLabel(r.toRole, r.toTenancy)}
              </Text>
            </Text>
            <Text style={styles.requestMeta}>
              {approved ? 'Approved' : 'Rejected'}
              {r.decidedBy ? ` by ${r.decidedBy.name}` : ''}
              {r.decidedAt ? ` · ${new Date(r.decidedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
              {r.requestedBy && r.decidedBy && r.requestedBy.id !== r.decidedBy.id ? ` · asked by ${r.requestedBy.name}` : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const howItWorks = (
    <View style={[styles.card, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
      <Text style={[styles.cardTitle, { marginBottom: 6 }]}>How it works</Text>
      <Text style={styles.muted}>
        {viewer?.isPresident
          ? 'You are the President: changes you make apply at once, and you approve the ones other admins send.'
          : 'Admins propose a new role; it takes effect only after the President approves it.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Member roles</Text>
          <Text style={styles.headerSub}>Change roles with the President's approval</Text>
        </View>
        {viewer?.isPresident && (
          <View style={styles.presidentChip}>
            <Ionicons name="star" size={12} color="#92400E" />
            <Text style={styles.presidentChipText}>You are President</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1B4FD8" />
      ) : loadError ? (
        <View style={[styles.card, { margin: 16 }]}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.link}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {notice && (
            <View style={[styles.notice, notice.kind === 'error' ? styles.noticeError : styles.noticeOk]}>
              <Ionicons name={notice.kind === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color={notice.kind === 'error' ? '#B91C1C' : '#15803D'} />
              <Text style={[styles.noticeText, { color: notice.kind === 'error' ? '#B91C1C' : '#166534' }]}>{notice.text}</Text>
            </View>
          )}
          <PaneRow wide={wide} style={{ flex: 0 }}>
            <SidePane wide={wide} style={!wide && { gap: 12, marginBottom: 12 }}>
              {requestsPanel}
              {recentPanel}
              {howItWorks}
            </SidePane>

            <MainPane wide={wide} style={!wide && { flex: 0 }}>
              <View style={styles.card}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color="#9CA3AF" />
                  <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search name, flat, phone or role" />
                </View>
                <Text style={[styles.muted, { marginBottom: 6 }]}>{filtered.length} members</Text>

                {filtered.map((m) => {
                  const pending = pendingFor.get(m.id);
                  const isSelf = m.id === viewer?.id;
                  const isPresident = m.committeePosition === 'PRESIDENT';
                  const locked = isSelf || isPresident || !!pending;
                  const editing = editingId === m.id;
                  return (
                    <View key={m.id} style={styles.memberRow}>
                      <View style={styles.memberTop}>
                        {m.avatarUrl ? (
                          <Image source={{ uri: m.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text style={styles.avatarText}>{m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {m.name}
                            {isSelf ? <Text style={styles.youTag}>  (you)</Text> : null}
                          </Text>
                          <Text style={styles.memberMeta} numberOfLines={1}>
                            {[m.flat ? `${m.flat.tower}-${m.flat.flatNumber}` : null, m.phone].filter(Boolean).join(' • ')}
                          </Text>
                          <View style={styles.chipRow}>
                            <View style={styles.roleChip}>
                              <Text style={styles.roleChipText}>{roleLabel(m.role, m.tenancyType)}</Text>
                            </View>
                            {m.committeePosition && (
                              <View style={[styles.roleChip, isPresident && styles.presidentTag]}>
                                <Text style={[styles.roleChipText, isPresident && { color: '#92400E' }]}>
                                  {m.committeePosition.charAt(0) + m.committeePosition.slice(1).toLowerCase()}
                                </Text>
                              </View>
                            )}
                            {pending && (
                              <View style={[styles.roleChip, styles.pendingTag]}>
                                <Text style={[styles.roleChipText, { color: '#B45309' }]}>→ {roleLabel(pending.toRole, pending.toTenancy)} pending</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {!locked && (
                          <TouchableOpacity onPress={() => openEditor(m)} accessibilityRole="button" accessibilityLabel={`Change role for ${m.name}`}>
                            <View style={[styles.smallBtn, editing ? styles.rejectBtn : styles.outlineBtn]}>
                              <Text style={editing ? styles.rejectText : styles.outlineText}>{editing ? 'Cancel' : 'Change role'}</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>

                      {editing && (
                        <View style={styles.editor}>
                          <Text style={styles.editorLabel}>New role for {m.name}</Text>
                          <View style={styles.choiceGrid}>
                            {ROLE_CHOICES.filter((c) => !(c.role === m.role && c.tenancy === m.tenancyType)).map((c) => {
                              const selected = choice === c.key;
                              return (
                                <TouchableOpacity key={c.key} onPress={() => setChoice(c.key)} accessibilityRole="radio" accessibilityState={{ checked: selected }}>
                                  <View style={[styles.choice, selected && styles.choiceSelected]}>
                                    <Ionicons name={c.icon} size={14} color={selected ? '#FFFFFF' : '#475569'} />
                                    <Text style={[styles.choiceText, selected && { color: '#FFFFFF' }]}>{c.label}</Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          <TextInput
                            style={styles.reasonInput}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Reason for the President (optional), e.g. elected treasurer at AGM"
                            maxLength={300}
                          />
                          <TouchableOpacity onPress={() => submitChange(m)} disabled={!choice || busy === m.id} accessibilityRole="button">
                            <View style={[styles.primaryBtn, (!choice || busy === m.id) && { opacity: 0.5 }]}>
                              {busy === m.id ? (
                                <ActivityIndicator color="#FFFFFF" />
                              ) : (
                                <Text style={styles.primaryText}>{viewer?.isPresident ? 'Change role now' : 'Send to President for approval'}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </MainPane>
          </PaneRow>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F3F9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1B4FD8', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#DBEAFE', fontSize: 13 },
  presidentChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  presidentChipText: { color: '#92400E', fontSize: 12, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', flex: 1 },
  countPill: { backgroundColor: '#FEF3C7', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  countText: { color: '#92400E', fontWeight: '800', fontSize: 12 },
  muted: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  requestRow: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  requestName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  requestChange: { fontSize: 13, color: '#374151', marginTop: 2 },
  requestMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  decideRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  waitingTag: { fontSize: 12, fontWeight: '700', color: '#B45309', marginTop: 6 },
  smallBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  approveBtn: { backgroundColor: '#15803D' },
  approveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  rejectBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FECACA' },
  rejectText: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },
  outlineBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  outlineText: { color: '#1B4FD8', fontWeight: '700', fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  memberRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: { backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#3730A3', fontWeight: '800' },
  memberName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  youTag: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  memberMeta: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  roleChip: { backgroundColor: '#EEF2FF', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  roleChipText: { fontSize: 11, fontWeight: '700', color: '#3730A3' },
  presidentTag: { backgroundColor: '#FEF3C7' },
  pendingTag: { backgroundColor: '#FFF7ED' },
  editor: { marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  editorLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  choiceSelected: { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  choiceText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  reasonInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 42, fontSize: 13 },
  primaryBtn: { backgroundColor: '#1B4FD8', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 12, marginBottom: 12, maxWidth: 1440, width: '100%', alignSelf: 'center' },
  noticeOk: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  noticeError: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  noticeText: { flex: 1, fontSize: 13, fontWeight: '600' },
  errorText: { color: '#B91C1C', fontSize: 14, marginBottom: 8 },
  link: { color: '#1B4FD8', fontWeight: '700' },
});
