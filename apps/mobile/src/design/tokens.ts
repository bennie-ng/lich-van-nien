/**
 * Semantic design tokens — what components actually consume.
 * Every color exists in a light and a dark variant; components read
 * them through `useTheme()` and never hard-code hex values.
 *
 * Spec: "Lịch Vạn Niên Design System — Modern Human Interface".
 */

import { Platform } from 'react-native';
import { palette } from './palette';

export interface ColorTokens {
  bg: {
    /** App background */
    canvas: string;
    /** Cards, sheets */
    surface: string;
    /** Secondary surface — inputs, chips */
    elevated: string;
    /** Jade wash (today, active soft states) */
    accentSoft: string;
    /** Gold wash (mùng 1 / rằm cells) */
    goldSoft: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    /** Text on accent.solid — white per spec */
    onAccent: string;
    /** Jade — links, active states */
    accent: string;
    /** Gold, darkened for AA text contrast — lunar figures */
    lunar: string;
  };
  accent: {
    /** Primary jade — filled buttons, active tab, today */
    solid: string;
    /** Pressed */
    strong: string;
    /** "Nature" gradient */
    gradient: [string, string];
  };
  /** Lunar Blue — moon layer, selected dates */
  selected: {
    solid: string;
    soft: string;
  };
  /** Text colors on top of the hero gradient */
  hero: {
    text: string;
    soft: string;
    badge: string;
  };
  state: {
    /** Hoàng đạo — auspicious (Good Day badge) */
    good: string;
    goodSoft: string;
    /** Hắc đạo — inauspicious (Bad Day badge) */
    bad: string;
    badSoft: string;
    danger: string;
  };
  holiday: {
    /** Holiday day number in the grid */
    day: string;
    /** Holiday badge */
    badgeBg: string;
    badgeText: string;
  };
  weekend: {
    sunday: string;
    saturday: string;
  };
  border: {
    subtle: string;
    strong: string;
    /** Today ring / focused input */
    ring: string;
  };
  /** Ngũ hành (Five Elements) */
  element: typeof palette.element;
  /** Zodiac day-quality indicators */
  zodiac: typeof palette.zodiac;
}

export interface Theme {
  scheme: 'light' | 'dark';
  color: ColorTokens;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  face: typeof face;
  shadow: {
    card: object;
    floating: object;
  };
}

/**
 * Typeface per spec: platform system font on native (SF Pro on iOS,
 * Roboto on Android) and Inter on web. On native, weight comes from
 * `fontWeight` on the system family; on web each weight is a loaded
 * Inter family. Components spread these tokens — never raw
 * fontFamily/fontWeight.
 */
export const face = {
  regular: Platform.select<object>({
    web: { fontFamily: 'Inter_400Regular' },
    default: { fontWeight: '400' as const },
  })!,
  medium: Platform.select<object>({
    web: { fontFamily: 'Inter_500Medium' },
    default: { fontWeight: '500' as const },
  })!,
  semibold: Platform.select<object>({
    web: { fontFamily: 'Inter_600SemiBold' },
    default: { fontWeight: '600' as const },
  })!,
  bold: Platform.select<object>({
    web: { fontFamily: 'Inter_700Bold' },
    default: { fontWeight: '700' as const },
  })!,
} as const;

/** 8pt base grid, 4pt half-step. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Corner radii per spec. */
export const radius = {
  /** Small elements, calendar cells */
  sm: 12,
  input: 14,
  button: 16,
  card: 20,
  modal: 28,
  floating: 30,
  full: 999,
} as const;

/** Type scale per spec (Large Date 48 → Small 11). */
export const type = {
  /** Large Date — hero day number */
  display: { fontSize: 48, ...face.bold, letterSpacing: -1 },
  /** Large Title — screen titles */
  titleXL: { fontSize: 34, ...face.bold, letterSpacing: -0.5 },
  /** Title 2 */
  title: { fontSize: 22, ...face.bold, letterSpacing: -0.3 },
  /** Headline — card titles, emphasized values */
  headline: { fontSize: 17, ...face.semibold },
  /** Subheadline — default copy */
  body: { fontSize: 15, ...face.regular },
  /** Labels — pills, tabs, badges */
  label: { fontSize: 13, ...face.semibold },
  caption: { fontSize: 13, ...face.medium },
  /** Small — column headers, field labels */
  micro: { fontSize: 11, ...face.semibold, letterSpacing: 0.5, textTransform: 'uppercase' },
} as const;

export const lightTheme: Theme = {
  scheme: 'light',
  color: {
    bg: {
      canvas: palette.light.background,
      surface: palette.light.surface,
      elevated: palette.light.surface2,
      accentSoft: palette.jade.light,
      goldSoft: palette.gold.light,
    },
    text: {
      primary: palette.light.textPrimary,
      secondary: palette.light.textSecondary,
      tertiary: palette.light.textTertiary,
      disabled: palette.light.textDisabled,
      onAccent: '#FFFFFF',
      accent: palette.jade.solid,
      lunar: palette.gold.text,
    },
    accent: {
      solid: palette.jade.solid,
      strong: palette.jade.pressed,
      gradient: [palette.jade.solid, palette.jade.gradientEnd],
    },
    selected: {
      solid: palette.lunar.solid,
      soft: palette.lunar.light,
    },
    hero: {
      text: '#FFFFFF',
      soft: 'rgba(255,255,255,0.85)',
      badge: '#FFF9E3',
    },
    state: {
      good: palette.jade.solid,
      goodSoft: palette.jade.light,
      bad: palette.error,
      badSoft: '#FDEAEA',
      danger: palette.error,
    },
    holiday: {
      day: palette.error,
      badgeBg: '#FFF2E2',
      badgeText: '#B45309',
    },
    weekend: {
      sunday: palette.warning,
      saturday: palette.warning,
    },
    border: {
      subtle: palette.light.divider,
      strong: palette.light.border,
      ring: palette.jade.solid,
    },
    element: palette.element,
    zodiac: palette.zodiac,
  },
  space,
  radius,
  type,
  face,
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    floating: {
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },
};

export const darkTheme: Theme = {
  scheme: 'dark',
  color: {
    bg: {
      canvas: palette.dark.background,
      surface: palette.dark.surface,
      elevated: palette.dark.surface2,
      accentSoft: palette.jade.softDark,
      goldSoft: palette.gold.softDark,
    },
    text: {
      primary: palette.dark.textPrimary,
      secondary: palette.dark.textSecondary,
      tertiary: palette.dark.textTertiary,
      disabled: palette.dark.textDisabled,
      onAccent: '#FFFFFF',
      accent: palette.jade.bright,
      lunar: palette.gold.textDark,
    },
    accent: {
      solid: palette.jade.solid,
      strong: palette.jade.hover,
      gradient: ['#14664B', palette.jade.solid],
    },
    selected: {
      solid: palette.lunar.solid,
      soft: palette.lunar.softDark,
    },
    hero: {
      text: '#FFFFFF',
      soft: 'rgba(255,255,255,0.8)',
      badge: '#FFF3C9',
    },
    state: {
      good: palette.jade.bright,
      goodSoft: palette.jade.softDark,
      bad: '#F07B7B',
      badSoft: '#3A1D1D',
      danger: '#F07B7B',
    },
    holiday: {
      day: '#F07B7B',
      badgeBg: '#33260F',
      badgeText: '#F5B455',
    },
    weekend: {
      sunday: '#F5B455',
      saturday: '#F5B455',
    },
    border: {
      subtle: palette.dark.divider,
      strong: palette.dark.border,
      ring: palette.jade.bright,
    },
    element: palette.element,
    zodiac: palette.zodiac,
  },
  space,
  radius,
  type,
  face,
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    floating: {
      shadowColor: '#000000',
      shadowOpacity: 0.45,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },
};
