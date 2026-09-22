import { Platform } from 'react-native';
import { COLORS } from './colors';

export const BREAKPOINTS = {
  xs: 375,   // Compact phones (iPhone SE, small Androids)
  sm: 600,   // Standard & Plus phones (iPhone 13/14/15, Pixel, Galaxy)
  md: 900,   // Foldables unfolded, mini tablets, landscape
  lg: 1200,  // Tablets, iPad Pro, Desktop web
};

export const SPACING = {
  '3xs': 2,
  '2xs': 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const RADII = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

export const TYPOGRAPHY = {
  caption: 10,
  bodySm: 12,
  body: 14,
  subtitle: 16,
  title: 18,
  headline: 22,
  display: 28,
  hero: 34,
};

export const TOUCH_TARGET = {
  minWidth: 44,
  minHeight: 44,
};

export const SHADOWS = {
  subtle: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tactile: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  prominent: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
};

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  radii: RADII,
  typography: TYPOGRAPHY,
  breakpoints: BREAKPOINTS,
  touchTarget: TOUCH_TARGET,
  shadows: SHADOWS,
};

export default THEME;
