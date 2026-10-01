import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

/** Dashboard banner: role changes waiting for the President. Hidden when there are none. */
export function RoleRequestsBanner() {
  const router = useRouter();
  const [state, setState] = useState<{ count: number; isPresident: boolean } | null>(null);

  useEffect(() => {
    api
      .get('/members')
      .then((res) => setState({ count: res.data.pendingRequests.length, isPresident: res.data.viewer.isPresident }))
      .catch(() => setState(null));
  }, []);

  if (!state || state.count === 0) return null;
  const plural = state.count === 1 ? 'role change' : 'role changes';

  return (
    <TouchableOpacity onPress={() => router.push('/(admin)/members' as any)} accessibilityRole="button" activeOpacity={0.85}>
      <View style={styles.banner}>
        <Ionicons name="people-circle" size={24} color="#92400E" />
        <Text style={styles.text}>
          {state.isPresident
            ? `${state.count} ${plural} waiting for your approval`
            : `${state.count} ${plural} waiting for the President`}
        </Text>
        <Text style={styles.link}>Review →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  text: { flex: 1, color: '#92400E', fontWeight: '800', fontSize: 14 },
  link: { color: '#92400E', fontWeight: '700', fontSize: 13 },
});
