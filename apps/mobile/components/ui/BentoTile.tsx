import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { useResponsive } from '../../hooks/useResponsive';

export type BentoTileColor = 'lavender' | 'sage' | 'cream' | 'peach' | 'powder' | 'rose' | 'white';

export interface BentoTileProps {
  children: React.ReactNode;
  color?: BentoTileColor;
  span?: 1 | 2 | 'full';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: any;
}

export function BentoTile({
  children,
  color = 'white',
  span = 1,
  style,
  onPress,
  accessibilityLabel,
  accessibilityRole,
}: BentoTileProps) {
  const { isSmallPhone, isTablet, isDesktop } = useResponsive();

  const colorToken = color === 'white' 
    ? { fill: '#FFFFFF', border: COLORS.border } 
    : COLORS.PASTEL[color];

  // Dynamic responsive padding based on screen density
  const responsivePadding = isSmallPhone ? 14 : (isTablet || isDesktop) ? 22 : 18;

  const tileStyle: ViewStyle = {
    backgroundColor: colorToken.fill,
    borderColor: colorToken.border,
    padding: responsivePadding,
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch (e) {
        // Safe fallback if not available
      }
    }
    onPress?.();
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.88}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        style={[styles.tile, tileStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.tile, tileStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
});

export default BentoTile;
