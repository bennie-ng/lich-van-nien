import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { getDayInfo, type DayInfo } from 'lunar-core';
import MonthView from './src/MonthView';
import YearView from './src/YearView';
import DayDetail from './src/DayDetail';
import Converter from './src/Converter';
import TuViView from './src/TuViView';
import { FadeIn, ThemeProvider, useTheme } from './src/design';
import type { Theme } from './src/design';

type Tab = 'calendar' | 'year' | 'day' | 'convert' | 'tuvi';

/** Breakpoint above which the desktop layout (top nav, side panel) applies. */
export const WIDE_BREAKPOINT = 900;

export default function App() {
  // Inter is only referenced on web (native uses the platform system font),
  // but hooks must run unconditionally.
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!fontsLoaded) {
    return null;
  }
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}

function Shell() {
  const { theme, toggle } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const s = useMemo(() => styles(theme, isWide), [theme, isWide]);

  const today = useMemo(() => {
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
  }, []);

  const [tab, setTab] = useState<Tab>('calendar');
  const [viewYear, setViewYear] = useState(today.year);
  const [viewMonth, setViewMonth] = useState(today.month);
  const [selected, setSelected] = useState<DayInfo>(() =>
    getDayInfo(today.day, today.month, today.year),
  );

  // On desktop the day detail is a side panel of the calendar, not a tab.
  const effectiveTab: Tab = isWide && tab === 'day' ? 'calendar' : tab;

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const monthView = (
    <MonthView
      year={viewYear}
      month={viewMonth}
      today={today}
      selectedJd={selected.lunar.jd}
      onPrev={() => goMonth(-1)}
      onNext={() => goMonth(1)}
      onToday={() => {
        setViewYear(today.year);
        setViewMonth(today.month);
      }}
      onSelectDay={(info) => {
        setSelected(info);
        if (!isWide) {
          setTab('day');
        }
      }}
    />
  );

  const tabs = (
    <>
      <TabButton
        label="Tháng"
        icon="calendar"
        active={effectiveTab === 'calendar'}
        onPress={() => setTab('calendar')}
        theme={theme}
        showLabel={isWide}
      />
      <TabButton
        label="Năm"
        icon="grid"
        active={effectiveTab === 'year'}
        onPress={() => setTab('year')}
        theme={theme}
        showLabel={isWide}
      />
      {!isWide && (
        <TabButton
          label="Ngày"
          icon="sunny"
          active={effectiveTab === 'day'}
          onPress={() => setTab('day')}
          theme={theme}
          showLabel={false}
        />
      )}
      <TabButton
        label="Đổi ngày"
        icon="swap-horizontal"
        active={effectiveTab === 'convert'}
        onPress={() => setTab('convert')}
        theme={theme}
        showLabel={isWide}
      />
      <TabButton
        label="Tử vi"
        icon="planet"
        active={effectiveTab === 'tuvi'}
        onPress={() => setTab('tuvi')}
        theme={theme}
        showLabel={isWide}
      />
    </>
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />

      <View style={s.appBar}>
        <Text style={s.appTitle}>Astrologik</Text>
        {isWide && <View style={s.topTabs}>{tabs}</View>}
        <Pressable onPress={toggle} style={s.themeBtn} accessibilityLabel="Đổi giao diện sáng/tối">
          <Ionicons
            name={theme.scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={18}
            color={theme.color.text.secondary}
          />
        </Pressable>
      </View>

      <FadeIn trigger={effectiveTab} style={s.content}>
        {effectiveTab === 'calendar' &&
          (isWide ? (
            <View style={s.splitRow}>
              <ScrollView style={s.splitMain} contentContainerStyle={{ paddingBottom: 24 }}>
                {monthView}
              </ScrollView>
              <View style={s.splitPanel}>
                <DayDetail info={selected} />
              </View>
            </View>
          ) : (
            monthView
          ))}
        {effectiveTab === 'year' && (
          <YearView
            year={viewYear}
            today={today}
            onPrev={() => setViewYear(viewYear - 1)}
            onNext={() => setViewYear(viewYear + 1)}
            onThisYear={() => setViewYear(today.year)}
            onSelectMonth={(month, year) => {
              setViewMonth(month);
              setViewYear(year);
              setTab('calendar');
            }}
          />
        )}
        {effectiveTab === 'day' && <DayDetail info={selected} />}
        {effectiveTab === 'convert' && <Converter initial={today} />}
        {effectiveTab === 'tuvi' && <TuViView initial={today} />}
      </FadeIn>

      {!isWide && (
        <View style={s.tabBarShadow}>
          <BlurView
            intensity={40}
            tint={theme.scheme === 'dark' ? 'dark' : 'light'}
            style={s.tabBar}
          >
            {tabs}
          </BlurView>
        </View>
      )}
    </SafeAreaView>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
  theme,
  showLabel,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  theme: Theme;
  showLabel: boolean;
}) {
  const color = active ? theme.color.text.onAccent : theme.color.text.tertiary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={4}
      style={[
        tabStyles.btn,
        { borderRadius: theme.radius.full },
        active && { backgroundColor: theme.color.accent.solid },
      ]}
    >
      <Ionicons name={active ? icon : (`${icon}-outline` as any)} size={18} color={color} />
      {(active || showLabel) && <Text style={[{ ...theme.type.label, color } as object]}>{label}</Text>}
    </Pressable>
  );
}

const tabStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});

const styles = (t: Theme, isWide: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.color.bg.canvas },
    appBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: t.space.lg,
      paddingTop: isWide ? t.space.lg : t.space.xl,
      paddingBottom: t.space.xs,
      maxWidth: isWide ? 1160 : 560,
      width: '100%',
      alignSelf: 'center',
    },
    appTitle: {
      ...t.type.micro,
      color: t.color.text.tertiary,
      letterSpacing: 2.5,
    } as object,
    topTabs: {
      flexDirection: 'row',
      gap: 2,
      backgroundColor: t.color.bg.surface,
      borderRadius: t.radius.full,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      padding: 4,
    },
    themeBtn: {
      width: 34,
      height: 34,
      borderRadius: t.radius.full,
      backgroundColor: t.color.bg.surface,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { flex: 1, maxWidth: isWide ? 1160 : 560, width: '100%', alignSelf: 'center' },
    splitRow: {
      flex: 1,
      flexDirection: 'row',
      gap: t.space.lg,
      paddingTop: t.space.sm,
    },
    splitMain: { flexGrow: 11, flexShrink: 1, flexBasis: 0, minWidth: 0 },
    splitPanel: { flexGrow: 9, flexShrink: 1, flexBasis: 0, minWidth: 0 },
    tabBarShadow: {
      position: 'absolute',
      bottom: t.space.xl,
      alignSelf: 'center',
      borderRadius: t.radius.floating,
      ...t.shadow.floating,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor:
        t.scheme === 'dark' ? 'rgba(23,26,31,0.75)' : 'rgba(255,255,255,0.85)',
      borderRadius: t.radius.floating,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      padding: 5,
      gap: 2,
      overflow: 'hidden',
    },
  });
