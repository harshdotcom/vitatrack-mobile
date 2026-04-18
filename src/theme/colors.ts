/**
 * vitatrack.ai Design Tokens — matches the web app exactly.
 * Light palette mirrors CSS variables in styles.css; dark mirrors html[data-theme='dark'].
 */

export const palette = {
  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  teal200: '#99f6e4',
  teal400: '#2dd4bf',
  teal500: '#14b8a6',
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal900: '#134e4a',

  blue400: '#38bdf8',
  blue600: '#0284c7',
  blue700: '#0369a1',
  blue800: '#075985',

  purple400: '#a78bfa',
  purple600: '#7c3aed',
  purple700: '#6d28d9',

  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',

  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const lightColors = {
  // Brand
  primary: palette.teal600,       // #0d9488
  primaryHover: palette.teal700,  // #0f766e
  secondary: palette.blue700,     // #0369a1
  accent: palette.purple600,      // #7c3aed

  // Backgrounds
  background: '#e0efe5',
  surface: palette.white,
  surfaceElevated: 'rgba(255, 255, 255, 0.88)',
  surfaceSoft: 'rgba(255, 255, 255, 0.72)',
  surfaceMuted: palette.slate50,
  surfaceSubtle: '#f3f7f9',
  surfaceHover: '#eef4f6',

  // Text
  textMain: palette.gray800,      // #1f2937
  textMuted: palette.gray600,     // #4b5563
  textPlaceholder: palette.slate400, // #94a3b8
  textInverse: palette.white,

  // Borders
  border: palette.gray200,        // #e5e7eb
  borderSubtle: palette.slate200, // #e2e8f0
  borderStrong: '#d6e0e7',

  // Inputs
  inputBg: palette.slate50,
  inputHoverBg: palette.slate100,
  inputFocusBg: palette.white,

  // Status
  error: palette.red600,
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  errorText: palette.red700,

  successBg: '#ecfdf5',
  successBorder: '#a7f3d0',
  successText: '#047857',

  warningBg: '#fef3c7',
  warningBorder: '#fcd34d',
  warningText: '#92400e',

  infoBg: '#eff6ff',
  infoBorder: '#bfdbfe',
  infoText: '#1d4ed8',

  // Glass morphism
  glassSurface: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
  glassHighlight: 'rgba(255, 255, 255, 0.5)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Gradient stops
  gradientStart: '#e0efe5',
  gradientMid: '#bce4db',
  gradientEnd: '#9ce0d3',
  orbPrimary: 'rgba(13, 148, 136, 0.4)',
  orbSecondary: 'rgba(3, 105, 161, 0.3)',

  // Tab bar
  tabActive: palette.teal600,
  tabInactive: palette.slate400,
  tabBar: palette.white,
} as const;

export const darkColors = {
  // Brand
  primary: palette.teal400,       // #2dd4bf
  primaryHover: palette.teal500,  // #14b8a6
  secondary: palette.blue400,     // #38bdf8
  accent: palette.purple400,      // #a78bfa

  // Backgrounds
  background: '#081416',
  surface: '#0f1d20',
  surfaceElevated: 'rgba(17, 31, 35, 0.9)',
  surfaceSoft: 'rgba(18, 33, 37, 0.74)',
  surfaceMuted: '#132529',
  surfaceSubtle: '#162b30',
  surfaceHover: '#1b3337',

  // Text
  textMain: '#ecfeff',
  textMuted: '#9eb5b9',
  textPlaceholder: '#6f8b90',
  textInverse: palette.gray900,

  // Borders
  border: '#294247',
  borderSubtle: '#314b50',
  borderStrong: '#3b565c',

  // Inputs
  inputBg: '#112125',
  inputHoverBg: '#16282c',
  inputFocusBg: '#1a2e33',

  // Status
  error: palette.red400,
  errorBg: '#2b1518',
  errorBorder: '#6f2a31',
  errorText: '#fecaca',

  successBg: '#10251d',
  successBorder: '#22553a',
  successText: '#6ee7b7',

  warningBg: '#2c2112',
  warningBorder: '#6b4f19',
  warningText: '#fde68a',

  infoBg: '#122234',
  infoBorder: '#244767',
  infoText: '#93c5fd',

  // Glass morphism
  glassSurface: 'rgba(13, 24, 27, 0.8)',
  glassBorder: 'rgba(96, 125, 132, 0.22)',
  glassHighlight: 'rgba(255, 255, 255, 0.04)',

  // Overlay
  overlay: 'rgba(2, 6, 23, 0.72)',

  // Gradient stops
  gradientStart: '#071516',
  gradientMid: '#0d2024',
  gradientEnd: '#113135',
  orbPrimary: 'rgba(45, 212, 191, 0.18)',
  orbSecondary: 'rgba(56, 189, 248, 0.16)',

  // Tab bar
  tabActive: palette.teal400,
  tabInactive: '#6f8b90',
  tabBar: '#0f1d20',
} as const;

export type ColorScheme = Record<keyof typeof lightColors, string>;
