// Design system based on the DESIGN.md spec 
// "Editorial Utility" — High-Contrast Mobility for Sudan
export const COLORS = {
  // Primary brand
  primary: '#00603e',
  primaryContainer: '#007b52',
  primaryFixed: '#8df7c1',
  
  // Surface tiers (No-Line Rule: use bg shifts instead of borders)
  surface: '#f8f9fa',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  surfaceContainerLowest: '#ffffff',
  
  // Text
  onSurface: '#1a1c1e',
  onSurfaceVariant: '#44474f',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#f0faf5',
  
  // Semantic
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  tertiary: '#883c31', // Cash payment badge
  
  // Outline
  outlineVariant: '#bdc9c2',
  
  // Dark elements
  dark: '#0a0a0a',
  darkCard: '#1a1a1a',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 44,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  display: 40,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1a1c1e',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#1a1c1e',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#1a1c1e',
    shadowOpacity: 0.06,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};
