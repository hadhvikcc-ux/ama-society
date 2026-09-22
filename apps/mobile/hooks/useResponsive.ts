import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '../constants/theme';

export interface ResponsiveValues<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  default: T;
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < BREAKPOINTS.xs; // < 375
  const isPhone = width < BREAKPOINTS.sm;      // < 600
  const isTablet = width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg; // 600 - 1200
  const isDesktop = width >= BREAKPOINTS.lg;   // >= 1200

  // Reference base width (iPhone 14/15/16 baseline)
  const baseWidth = 390;

  /**
   * Scales a numeric value linearly with screen width
   */
  const scale = (size: number): number => {
    return Math.round((width / baseWidth) * size);
  };

  /**
   * Scales a numeric value moderately with dampening factor (0.5 by default)
   */
  const moderateScale = (size: number, factor = 0.5): number => {
    return Math.round(size + (scale(size) - size) * factor);
  };

  /**
   * Resolves a value based on the current active breakpoint
   */
  const responsiveValue = <T>(values: ResponsiveValues<T>): T => {
    if (isDesktop && values.lg !== undefined) return values.lg;
    if (isTablet && values.md !== undefined) return values.md;
    if (!isSmallPhone && values.sm !== undefined) return values.sm;
    if (isSmallPhone && values.xs !== undefined) return values.xs;
    return values.default;
  };

  /**
   * Optimal grid columns based on device screen width
   */
  const gridColumns = isSmallPhone ? 1 : isPhone ? 2 : isTablet ? 3 : 4;

  /**
   * Proportional screen gutters and tile gaps
   */
  const containerPadding = isSmallPhone ? 12 : isPhone ? 16 : 24;
  const tileGap = isSmallPhone ? 10 : isPhone ? 14 : 18;
  const maxContentWidth = 1120;

  return {
    width,
    height,
    isSmallPhone,
    isPhone,
    isTablet,
    isDesktop,
    scale,
    moderateScale,
    responsiveValue,
    gridColumns,
    containerPadding,
    tileGap,
    maxContentWidth,
  };
}

export default useResponsive;
