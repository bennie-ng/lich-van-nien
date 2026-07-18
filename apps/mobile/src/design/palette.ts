/**
 * Primitive color palette — the raw values of the design system.
 *
 * Components never import these directly; they consume semantic tokens
 * from `tokens.ts`.
 *
 * Direction: modern Apple-HIG. Calm, minimal, premium. Jade green is the
 * primary (prosperity, harmony), imperial gold is a sparing accent, lunar
 * blue marks the moon/selection layer. Vietnamese culture shows through
 * meaningful color, not decoration.
 */

export const palette = {
  /** Jade Green — primary. Prosperity, harmony, growth. */
  jade: {
    solid: '#1E9E73',
    hover: '#1A8C66',
    pressed: '#167D5C',
    light: '#DDF7EE',
    /** Lifted variant for text/icons on dark surfaces (AA) */
    bright: '#2EB584',
    /** Dark-theme soft wash */
    softDark: '#123327',
    /** "Nature" gradient end */
    gradientEnd: '#52C18A',
  },

  /** Imperial Gold — secondary accent, used sparingly. */
  gold: {
    solid: '#D4A72C',
    light: '#F8EFD0',
    /** Darkened for text on light surfaces (AA) */
    text: '#8F6F14',
    /** Lifted for text on dark surfaces */
    textDark: '#E8C55A',
    softDark: '#31290F',
  },

  /** Lunar Blue — moon phases and selected dates. */
  lunar: {
    solid: '#4F7BFF',
    light: '#E8EEFF',
    softDark: '#1B2440',
  },

  /** Semantic */
  success: '#1DB954',
  error: '#E34B4B',
  warning: '#F59E0B',
  info: '#3B82F6',

  /** Neutrals — light theme */
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surface2: '#F2F4F7',
    divider: '#E5E7EB',
    border: '#D6DAE1',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textDisabled: '#B7BDC8',
  },

  /** Neutrals — dark theme */
  dark: {
    background: '#0B0D10',
    surface: '#171A1F',
    surface2: '#23272F',
    divider: '#31363F',
    border: '#3D4350',
    textPrimary: '#F8FAFC',
    textSecondary: '#AAB2C0',
    textTertiary: '#808998',
    textDisabled: '#626B78',
  },

  /** Ngũ hành (Five Elements) — muted, same in both themes. */
  element: {
    kim: '#B9A56B',
    moc: '#3FA66B',
    thuy: '#4A7DFF',
    hoa: '#E85D5D',
    tho: '#B68C58',
  },

  /** Zodiac / day-quality indicators */
  zodiac: {
    lucky: '#22C55E',
    neutral: '#64748B',
    caution: '#EF4444',
  },
} as const;
