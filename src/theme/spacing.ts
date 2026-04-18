/**
 * 4pt spacing scale.
 */
const BASE = 4;

export const spacing = {
  0: 0,
  0.5: BASE * 0.5,   // 2
  1: BASE * 1,       // 4
  1.5: BASE * 1.5,   // 6
  2: BASE * 2,       // 8
  3: BASE * 3,       // 12
  4: BASE * 4,       // 16
  5: BASE * 5,       // 20
  6: BASE * 6,       // 24
  7: BASE * 7,       // 28
  8: BASE * 8,       // 32
  10: BASE * 10,     // 40
  12: BASE * 12,     // 48
  14: BASE * 14,     // 56
  16: BASE * 16,     // 64
  20: BASE * 20,     // 80
  24: BASE * 24,     // 96
  32: BASE * 32,     // 128
} as const;

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  primary: {
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
