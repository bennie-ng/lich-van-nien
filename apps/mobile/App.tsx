import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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
import DayDetail from './src/DayDetail';
import Converter from './src/Converter';
import { FadeIn, ThemeProvider, useTheme } from './src/design';
import type { Theme } from './src/design';

type Tab = 'calendar' | 'day' | 'convert';

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
  const s = useMemo(() => styles(theme), [theme]);

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

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />

      <View style={s.appBar}>
        <Text style={s.appTitle}>Astrologik</Text>
        <Pressable onPress={toggle} style={s.themeBtn} accessibilityLabel="Đổi giao diện sáng/tối">
          <Ionicons
            name={theme.scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={18}
            color={theme.color.text.secondary}
          />
        </Pressable>
      </View>

      <FadeIn trigger={tab} style={s.content}>
        {tab === 'calendar' && (
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
              setTab('day');
            }}
          />
        )}
        {tab === 'day' && <DayDetail info={selected} />}
        {tab === 'convert' && <Converter initial={today} />}
      </FadeIn>

      <View style={s.tabBarShadow}>
        <BlurView
          intensity={40}
          tint={theme.scheme === 'dark' ? 'dark' : 'light'}
          style={s.tabBar}
        >
          <TabButton
            label="Lịch"
            icon="calendar"
            active={tab === 'calendar'}
            onPress={() => setTab('calendar')}
            theme={theme}
          />
          <TabButton
            label="Ngày"
            icon="sunny"
            active={tab === 'day'}
            onPress={() => setTab('day')}
            theme={theme}
          />
          <TabButton
            label="Đổi ngày"
            icon="swap-horizontal"
            active={tab === 'convert'}
            onPress={() => setTab('convert')}
            theme={theme}
          />
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
  theme,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  const color = active ? theme.color.text.onAccent : theme.color.text.tertiary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        tabStyles.btn,
        { borderRadius: theme.radius.full },
        active && { backgroundColor: theme.color.accent.solid },
      ]}
    >
      <Ionicons name={active ? icon : (`${icon}-outline` as any)} size={18} color={color} />
      <Text style={[{ ...theme.type.label, color } as object]}>{label}</Text>
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

const styles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.color.bg.canvas },
    appBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: t.space.lg,
      paddingTop: t.space.xl,
      paddingBottom: t.space.xs,
      maxWidth: 560,
      width: '100%',
      alignSelf: 'center',
    },
    appTitle: {
      ...t.type.micro,
      color: t.color.text.tertiary,
      letterSpacing: 2.5,
    } as object,
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
    content: { flex: 1, maxWidth: 560, width: '100%', alignSelf: 'center' },
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
