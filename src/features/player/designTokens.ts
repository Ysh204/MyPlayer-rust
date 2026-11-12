/**
 * Minimal Monochrome Design Tokens
 * Neutral, focused, content-first. Pure neutrals, no chromatic accents.
 */

export const tokens = {
  // Backgrounds
  bg: '#000000',
  surface: 'rgba(255, 255, 255, 0.04)',
  surfaceHover: 'rgba(255, 255, 255, 0.08)',
  surfaceStrong: 'rgba(20, 20, 20, 0.92)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',

  // Text
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Radius & motion
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
  duration: '180ms',
} as const;

export const motion = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.18 },
  },
  slideUp: {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18 },
  },
} as const;
