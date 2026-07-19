import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LUNAR_HOLIDAYS,
  SOLAR_HOLIDAYS,
  lunarToSolar,
  napAm,
  yearCanChi,
} from 'lunar-core';
import { FadeIn, useTheme } from './design';
import type { Theme } from './design';

interface Props {
  year: number;
  today: { day: number; month: number; year: number };
  onSelectMonth: (month: number, year: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onThisYear: () => void;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** "d/m" keys of every holiday falling in the given solar year. */
function holidayKeys(year: number): Set<string> {
  const keys = new Set<string>();
  for (const h of SOLAR_HOLIDAYS) {
    keys.add(`${h.day}/${h.month}`);
  }
  // A lunar holiday of lunar year Y can land in solar year Y or Y+1
  // (e.g. ông Táo 23/12 ÂL falls in January), so check both candidates.
  for (const h of LUNAR_HOLIDAYS) {
    for (const lunarYear of [year - 1, year]) {
      const solar = lunarToSolar(h.day, h.month, lunarYear, false);
      if (solar && solar.year === year) {
        keys.add(`${solar.day}/${solar.month}`);
      }
    }
  }
  return keys;
}

export default function YearView({ year, today, onSelectMonth, onPrev, onNext, onThisYear }: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const holidays = useMemo(() => holidayKeys(year), [year]);
  const canChi = useMemo(() => {
    const cc = yearCanChi(year);
    return { name: cc.name, element: napAm(cc.canIndex, cc.chiIndex) };
  }, [year]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {year} <Text style={s.headerCanChi}>{canChi.name}</Text>
          </Text>
          <View style={s.headerControls}>
            <Text style={s.headerSub} numberOfLines={1}>
              Mệnh {canChi.element.name}
            </Text>
            {year !== today.year && (
              <Pressable onPress={onThisYear} style={s.todayPill} hitSlop={6}>
                <Text style={s.todayPillText}>Năm nay</Text>
              </Pressable>
            )}
            <Pressable onPress={onPrev} style={s.navBtn} hitSlop={6} accessibilityLabel="Năm trước">
              <Ionicons name="chevron-back" size={20} color={theme.color.text.accent} />
            </Pressable>
            <Pressable onPress={onNext} style={s.navBtn} hitSlop={6} accessibilityLabel="Năm sau">
              <Ionicons name="chevron-forward" size={20} color={theme.color.text.accent} />
            </Pressable>
          </View>
        </View>

        <FadeIn trigger={year} style={s.grid}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <MiniMonth
              key={month}
              year={year}
              month={month}
              today={today}
              holidays={holidays}
              onPress={() => onSelectMonth(month, year)}
              s={s}
            />
          ))}
        </FadeIn>
      </View>
    </ScrollView>
  );
}

function MiniMonth({
  year,
  month,
  today,
  holidays,
  onPress,
  s,
}: {
  year: number;
  month: number;
  today: { day: number; month: number; year: number };
  holidays: Set<string>;
  onPress: () => void;
  s: ReturnType<typeof styles>;
}) {
  const rows = useMemo(() => {
    const n = daysInMonth(year, month);
    // Monday-first column of the 1st
    const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const flat: Array<number | null> = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: n }, (_, i) => i + 1),
    ];
    while (flat.length % 7 !== 0) flat.push(null);
    const r: Array<Array<number | null>> = [];
    for (let i = 0; i < flat.length; i += 7) r.push(flat.slice(i, i + 7));
    return r;
  }, [year, month]);

  const isCurrentMonth = year === today.year && month === today.month;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.miniMonth, pressed && s.miniMonthPressed]}
      accessibilityLabel={`Tháng ${month} năm ${year}`}
    >
      <Text style={[s.miniTitle, isCurrentMonth && s.miniTitleCurrent]}>Tháng {month}</Text>
      {rows.map((row, ri) => (
        <View key={ri} style={s.miniRow}>
          {row.map((day, ci) => {
            if (!day) return <View key={ci} style={s.miniCell} />;
            const isToday = isCurrentMonth && day === today.day;
            const isHoliday = holidays.has(`${day}/${month}`);
            return (
              <View key={ci} style={[s.miniCell, isToday && s.miniToday]}>
                <Text
                  style={[
                    s.miniDay,
                    isHoliday && s.miniHoliday,
                    isToday && s.miniTodayText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </Pressable>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    container: { paddingHorizontal: t.space.lg },
    header: {
      paddingTop: t.space.sm,
      paddingBottom: t.space.lg,
      gap: t.space.sm,
    },
    headerTitle: { ...t.type.titleXL, color: t.color.text.primary } as object,
    headerCanChi: { color: t.color.text.tertiary, ...t.face.semibold },
    headerControls: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
    headerSub: { ...t.type.label, color: t.color.text.lunar, flex: 1 } as object,
    todayPill: {
      backgroundColor: t.color.bg.accentSoft,
      borderRadius: t.radius.full,
      paddingHorizontal: t.space.md,
      paddingVertical: 6,
    },
    todayPillText: { ...t.type.label, color: t.color.text.accent } as object,
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: t.radius.full,
      backgroundColor: t.color.bg.surface,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.space.sm,
    },
    miniMonth: {
      // three columns with two gaps of space.sm between them
      flexBasis: '31%',
      flexGrow: 1,
      backgroundColor: t.color.bg.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      padding: t.space.sm,
      ...t.shadow.card,
    },
    miniMonthPressed: { backgroundColor: t.color.bg.elevated },
    miniTitle: {
      ...t.type.label,
      color: t.color.text.secondary,
      marginBottom: 4,
    } as object,
    miniTitleCurrent: { color: t.color.text.accent },
    miniRow: { flexDirection: 'row' },
    miniCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.full,
    },
    miniToday: { backgroundColor: t.color.accent.solid },
    miniDay: { fontSize: 9, ...t.face.medium, color: t.color.text.secondary } as object,
    miniTodayText: { color: t.color.text.onAccent, ...t.face.bold },
    miniHoliday: { color: t.color.holiday.day, ...t.face.bold },
  });
