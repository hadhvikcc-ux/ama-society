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

export interface BentoRowProps {
  children: React.ReactNode;
  /** Relative widths of the children when side by side, e.g. [2, 1]. Defaults to equal. */
  weights?: number[];
  /** On phones, stack the tiles in reverse order (e.g. put the action tile above the brand tile). */
  reverseOnPhone?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tiles side by side on tablets and desktop, stacked on phones.
 * Each child gets its share of the width from `weights`.
 */
export function BentoRow({ children, weights, reverseOnPhone, style }: BentoRowProps) {
  const { tileGap, isPhone } = useResponsive();
  const items = React.Children.toArray(children).filter(Boolean);

  if (isPhone) {
    return <View style={[{ gap: tileGap }, style]}>{reverseOnPhone ? [...items].reverse() : items}</View>;
  }
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'stretch', gap: tileGap }, style]}>
      {items.map((child, i) => (
        <View key={i} style={{ flexGrow: weights?.[i] ?? 1, flexBasis: 0, minWidth: 0 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'column',
  },
});

export default BentoGrid;
