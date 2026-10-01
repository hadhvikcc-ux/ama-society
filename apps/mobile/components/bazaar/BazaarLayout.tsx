import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, LayoutChangeEvent, ViewStyle, StyleProp } from 'react-native';

/**
 * Shared two-pane layout for the Bazaar screens (Storefront, Cart & POS, Stock & Excel,
 * Khata Dues, Smart Scan): controls and filters in a left pane, content on the right.
 * Below TWO_PANE_MIN_WIDTH everything stacks in a single column as before.
 */
export const TWO_PANE_MIN_WIDTH = 900;
export const PAGE_MAX_WIDTH = 1440;
export const SIDEBAR_WIDTH = 300;
export const PANE_GAP = 16;

export function useBazaarWide() {
  const { width } = useWindowDimensions();
  return width >= TWO_PANE_MIN_WIDTH;
}

interface PaneProps {
  wide: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Row container on wide screens, plain column on phones. */
export function PaneRow({ wide, children, style }: PaneProps) {
  return <View style={[wide ? layoutStyles.row : layoutStyles.column, style]}>{children}</View>;
}

/** Fixed-width left pane on wide screens. */
export function SidePane({ wide, children, style }: PaneProps) {
  return <View style={[wide ? layoutStyles.side : null, style]}>{children}</View>;
}

/** Flexible right pane on wide screens. */
export function MainPane({ wide, children, style }: PaneProps) {
  return <View style={[wide ? layoutStyles.main : layoutStyles.mainPhone, style]}>{children}</View>;
}

interface CardGridProps {
  children: React.ReactNode;
  /** Narrowest a card may get before the grid drops a column. */
  minItemWidth?: number;
  gap?: number;
  enabled?: boolean;
}

/**
 * Lays its children out in equal-width columns that fit the available width.
 * One column on phones (or when disabled), so existing card styles are untouched.
 */
export function CardGrid({ children, minItemWidth = 380, gap = PANE_GAP, enabled = true }: CardGridProps) {
  const [width, setWidth] = useState(0);
  const items = React.Children.toArray(children).filter(Boolean);
  const columns = enabled && width > 0 ? Math.max(1, Math.floor((width + gap) / (minItemWidth + gap))) : 1;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  if (columns === 1) {
    return <View onLayout={onLayout}>{items}</View>;
  }

  const itemWidth = Math.floor((width - gap * (columns - 1)) / columns);
  return (
    <View onLayout={onLayout} style={[layoutStyles.grid, { columnGap: gap }]}>
      {items.map((child, i) => (
        <View key={(React.isValidElement(child) && child.key) || i} style={{ width: itemWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
}

export const layoutStyles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: PANE_GAP,
    width: '100%',
    maxWidth: PAGE_MAX_WIDTH,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  column: {
    flex: 1,
  },
  side: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    gap: 12,
  },
  main: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  mainPhone: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
});
