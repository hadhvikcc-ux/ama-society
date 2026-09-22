import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

const colors = {
  success: { bg: '#D1FAE5', text: '#065F46' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  error: { bg: '#FEE2E2', text: '#991B1B' },
  info: { bg: '#DBEAFE', text: '#1E40AF' },
  neutral: { bg: '#F3F4F6', text: '#374151' },
};

export function Badge({ label, variant, size = 'md' }: BadgeProps) {
  const scheme = colors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: scheme.bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color: scheme.text }, size === 'sm' && styles.smText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  sm: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  text: { fontSize: 14, fontWeight: '600' },
  smText: { fontSize: 12 },
});
