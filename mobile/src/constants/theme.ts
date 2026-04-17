// Design system based on the DESIGN.md spec 
// "Editorial Utility" — High-Contrast Mobility for Sudan
export const COLORS = {
  // --- New Wedo Logo Base Colors ---
  // The vibrant, friendly sky/ocean blue matching the 'wedo' text and map pin
  primary: '#0084FF',       
  primaryContainer: '#005CBE', // Deeper shade from the pin shadow
  primaryFixed: '#E0F2FE',     // Light icy blue for card backgrounds

  // Accent (Sky Blue highlights from the top of the pin)
  accent: '#38BDF8',       
  accentLight: '#F0F9FF',
  
  // Surfaces (Clean, bright friendly aesthetic)
  surface: '#FFFFFF',
  surfaceContainerLow: '#F8FAFC',
  surfaceContainerHigh: '#F1F5F9',
  surfaceContainerHighest: '#E2E8F0',
  surfaceContainerLowest: '#FFFFFF',
  
  // Text (Friendly soft slate, avoiding harsh blacks)
  onSurface: '#1E293B',        
  onSurfaceVariant: '#64748B', 
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#FFFFFF',
  onAccent: '#FFFFFF',
  
  // Semantic 
  success: '#10B981', 
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#2094F3',
  tertiary: '#94A3B8',         
  
  // Dark Elements (for contrast if needed, soft navy)
  dark: '#0F172A',             
  darkCard: '#1E293B',         
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
