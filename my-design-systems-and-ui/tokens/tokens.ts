/**
 * Scribe Design System - TypeScript Tokens
 * Production Type Definitions & Constant Tokens
 */

export const COLOR_TOKENS = {
  canvas: {
    base: '#07080a',
    subtle: '#0a0b0d',
    surface: '#0d0d0d',
    card: '#141414',
    cardHover: '#1a1a1a',
    dock: 'rgba(26, 26, 26, 0.8)',
  },
  text: {
    primary: '#f2f2f7',
    secondary: '#a1a1aa',
    muted: '#71717a',
    faint: 'rgba(234, 234, 234, 0.2)',
    onAccent: '#000000',
  },
  hairline: {
    default: 'rgba(255, 255, 255, 0.08)',
    subtle: 'rgba(255, 255, 255, 0.04)',
    strong: 'rgba(255, 255, 255, 0.16)',
    focus: '#ff4d00',
  },
  signals: {
    orange: '#ff4d00',
    orangeGlow: 'rgba(255, 77, 0, 0.25)',
    red: '#ff453a',
    mint: '#32d74b',
    blue: '#0a84ff',
    violet: '#bf5af2',
    amber: '#fbbf24',
    rose: '#ffccd9',
  },
  glass: {
    tactical: 'rgba(18, 20, 23, 0.72)',
    card: 'rgba(20, 20, 20, 0.65)',
  }
} as const;

export const TYPOGRAPHY_TOKENS = {
  fonts: {
    sans: 'DM Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    serif: 'Playfair Display, Georgia, serif',
    mono: 'JetBrains Mono, Fira Code, ui-monospace, monospace',
  },
  scale: {
    display: { fontSize: '32px', lineHeight: '1.15', fontWeight: '900', letterSpacing: '-0.03em' },
    heading: { fontSize: '20px', lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.02em' },
    subhead: { fontSize: '15px', lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.01em' },
    body: { fontSize: '14px', lineHeight: '1.5', fontWeight: '400', letterSpacing: '0' },
    caption: { fontSize: '12px', lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' },
    badge: { fontSize: '9px', lineHeight: '1', fontWeight: '900', letterSpacing: '0.2em', textTransform: 'uppercase' as const },
  }
} as const;

export const RADIUS_TOKENS = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '14px',
  lg: '20px',
  xl: '28px',
  pill: '9999px',
} as const;

export const SPACING_TOKENS = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const SHADOW_TOKENS = {
  tacticalSm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  tacticalMd: '0 12px 24px -10px rgba(0, 0, 0, 0.6)',
  tacticalLg: '0 24px 48px -12px rgba(0, 0, 0, 0.8)',
  glowOrange: '0 0 20px rgba(255, 77, 0, 0.35)',
  glowMint: '0 0 20px rgba(50, 215, 75, 0.35)',
  glowBlue: '0 0 20px rgba(10, 132, 255, 0.45)',
  latestGlow: '0 0 16px rgba(10, 132, 255, 0.8), 0 0 32px rgba(10, 132, 255, 0.3)',
} as const;

export const MOTION_TOKENS = {
  spring: {
    snappy: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    linear: 'linear',
  },
  duration: {
    instant: '100ms',
    fast: '180ms',
    normal: '280ms',
    slow: '450ms',
    pulse: '1800ms',
  }
} as const;

export const TOKENS = {
  color: COLOR_TOKENS,
  typography: TYPOGRAPHY_TOKENS,
  radius: RADIUS_TOKENS,
  spacing: SPACING_TOKENS,
  shadows: SHADOW_TOKENS,
  motion: MOTION_TOKENS,
} as const;

export type ColorToken = typeof COLOR_TOKENS;
export type TypographyToken = typeof TYPOGRAPHY_TOKENS;
export type RadiusToken = keyof typeof RADIUS_TOKENS;
export type SpacingToken = keyof typeof SPACING_TOKENS;
export type SignalToken = keyof typeof COLOR_TOKENS.signals;
