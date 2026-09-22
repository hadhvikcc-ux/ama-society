import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();
  let bgColor = '#F3F4F6';
  let textColor = '#374151';

  if (['OPEN', 'ISSUED', 'PENDING'].includes(normalizedStatus)) {
    bgColor = '#DBEAFE';
    textColor = '#1D4ED8';
  } else if (['IN_PROGRESS', 'CONFIRMED', 'VOTING'].includes(normalizedStatus)) {
    bgColor = '#FEF3C7';
    textColor = '#B45309';
  } else if (['CLOSED', 'PAID', 'DELIVERED', 'COMPLETED'].includes(normalizedStatus)) {
    bgColor = '#D1FAE5';
    textColor = '#059669';
  } else if (['OVERDUE', 'URGENT', 'CANCELLED'].includes(normalizedStatus)) {
    bgColor = '#FEE2E2';
    textColor = '#B91C1C';
  } else if (['LOCKED'].includes(normalizedStatus)) {
    bgColor = '#DBEAFE';
    textColor = '#1D4ED8';
  }

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, isSmall ? styles.badgeSm : styles.badgeMd]}>
      <Text style={[styles.text, { color: textColor }, isSmall ? styles.textSm : styles.textMd]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
