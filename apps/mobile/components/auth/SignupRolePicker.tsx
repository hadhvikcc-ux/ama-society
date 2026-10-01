import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Roles offered at sign-up. Keys match the API's SIGNUP_ROLES
 * (packages/api/src/auth/signup-roles.ts). Admin is never offered.
 */
export const SIGNUP_ROLE_OPTIONS: { key: string; title: string; subtitle: string; icon: IconName; needsApproval: boolean }[] = [
  { key: 'RESIDENT_OWNER', title: 'Flat owner', subtitle: 'I own a flat here', icon: 'home', needsApproval: false },
  { key: 'RESIDENT_TENANT', title: 'Tenant', subtitle: 'I rent a flat here', icon: 'key', needsApproval: false },
  { key: 'COMMITTEE', title: 'Committee member', subtitle: 'RWA / managing committee', icon: 'ribbon', needsApproval: true },
  { key: 'GUARD', title: 'Security guard', subtitle: 'Gate & visitor desk', icon: 'shield-checkmark', needsApproval: true },
  { key: 'VENDOR', title: 'Mart vendor', subtitle: 'Society store or stall', icon: 'storefront', needsApproval: true },
  { key: 'SUPPLIER', title: 'Supplier', subtitle: 'Wholesale & bulk goods', icon: 'cube', needsApproval: true },
];

export const DEFAULT_SIGNUP_ROLE = 'RESIDENT_OWNER';

export const signupRoleNeedsApproval = (key: string) =>
  SIGNUP_ROLE_OPTIONS.find((o) => o.key === key)?.needsApproval ?? false;

interface Props {
  value: string;
  onChange: (key: string) => void;
}

/** Two-column grid of role tiles; staff roles carry an "Admin approval" badge. */
export function SignupRolePicker({ value, onChange }: Props) {
  return (
    <View>
      <Text style={styles.label}>I am a…</Text>
      <View style={styles.grid}>
        {SIGNUP_ROLE_OPTIONS.map((opt) => {
          const selected = opt.key === value;
          return (
            <TouchableOpacity
              key={opt.key}
              style={styles.cell}
              onPress={() => onChange(opt.key)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${opt.title}${opt.needsApproval ? ', needs admin approval' : ''}`}
            >
              <View style={[styles.tile, selected && styles.tileSelected]}>
                <View style={[styles.icon, selected && styles.iconSelected]}>
                  <Ionicons name={opt.icon} size={16} color={selected ? '#FFFFFF' : '#475569'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, selected && styles.titleSelected]} numberOfLines={1}>{opt.title}</Text>
                  <Text style={styles.subtitle} numberOfLines={1}>{opt.subtitle}</Text>
                  {opt.needsApproval && <Text style={styles.badge}>Admin approval</Text>}
                </View>
                {selected && <Ionicons name="checkmark-circle" size={18} color="#1B4FD8" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {signupRoleNeedsApproval(value) && (
        <View style={styles.note}>
          <Ionicons name="time-outline" size={16} color="#92400E" />
          <Text style={styles.noteText}>
            Your society admin approves this role before you can sign in. Residents get access straight away.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { width: '50%', padding: 4 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 62,
  },
  tileSelected: { borderColor: '#1B4FD8', backgroundColor: '#EFF6FF' },
  icon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  iconSelected: { backgroundColor: '#1B4FD8' },
  title: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  titleSelected: { color: '#1B4FD8' },
  subtitle: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  badge: { fontSize: 10, fontWeight: '800', color: '#92400E', marginTop: 3 },
  note: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, color: '#92400E' },
});
