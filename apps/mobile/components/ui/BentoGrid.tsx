import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

export interface BentoGridProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  columns?: number;
}

export function BentoGrid({ children, style, columns }: BentoGridProps) {
  const { tileGap, maxContentWidth, isTablet, isDesktop } = useResponsive();

  const containerStyle: ViewStyle = {
    gap: tileGap,
    maxWidth: maxContentWidth,
    width: '100%',
    alignSelf: (isTablet || isDesktop) ? 'center' : 'stretch',
  };

  return (
    <View style={[styles.grid, containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'column',
  },
});

export default BentoGrid;
