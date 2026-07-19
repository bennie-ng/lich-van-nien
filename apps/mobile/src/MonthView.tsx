import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDayInfo, type DayInfo } from 'lunar-core';
import { FadeIn, useTheme, WEEKDAYS_VI } from './design';
import type { Theme } from './design';

interface Props {
  year: number;
  month: number; // 1-12
  today: { day: number; month: number; year: number };
  /** JDN of the currently selected day */
  selectedJd: number;
  onSelectDay: (info: DayInfo) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function MonthView({
  year,
  month,
  today,
  selectedJd,
  onSelectDay,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => styles(theme), [theme]);

  const cells = useMemo(() => {
    const n = daysInMonth(year, month);
    const infos: DayInfo[] = [];
    for (let d = 1; d <= n; d++) {
      infos.push(getDayInfo(d, month, year));
    }
    const lead = (infos[0].solar.weekday + 6) % 7; // Monday-first
    return { infos, lead };
  }, [year, month]);

  const rows: Array<Array<DayInfo | null>> = useMemo(() => {
    const flat: Array<DayInfo | null> = [
      ...Array.from({ length: cells.lead }, () => null),
      ...cells.infos,
    ];
    while (flat.length % 7 !== 0) flat.push(null);
    const r: Array<Array<DayInfo | null>> = [];
    for (let i = 0; i < flat.length; i += 7) r.push(flat.slice(i, i + 7));
    return r;
  }, [cells]);

  const monthLunarLabel = useMemo(() => {
    const first = cells.infos[0].lunar;
    const last = cells.infos[cells.infos.length - 1].lunar;
    const fmt = (l: typeof first) => `${l.month}${l.leap ? ' nhuận' : ''}`;
    return first.month === last.month && first.leap === last.leap
      ? `Tháng ${fmt(first)} âm lịch`
      : `Tháng ${fmt(first)} – ${fmt(last)} âm lịch`;
  }, [cells]);

  const isCurrentMonth = year === today.year && month === today.month;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle} numberOfLines={1}>
          Tháng {month} <Text style={s.headerYear}>{year}</Text>
        </Text>
        <View style={s.headerControls}>
          <Text style={s.headerSub} numberOfLines={1}>
            {monthLunarLabel}
          </Text>
          {!isCurrentMonth && (
            <Pressable onPress={onToday} style={s.todayPill} hitSlop={6}>
              <Text style={s.todayPillText}>Hôm nay</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onPrev}
            style={s.navBtn}
            hitSlop={6}
            accessibilityLabel="Tháng trước"
          >
            <Ionicons name="chevron-back" size={20} color={theme.color.text.accent} />
          </Pressable>
          <Pressable
            onPress={onNext}
            style={s.navBtn}
            hitSlop={6}
            accessibilityLabel="Tháng sau"
          >
            <Ionicons name="chevron-forward" size={20} color={theme.color.text.accent} />
          </Pressable>
        </View>
      </View>

      <FadeIn trigger={`${year}-${month}`} style={s.card}>
        <View style={s.weekRow}>
          {WEEKDAYS_VI.map((w, i) => (
            <Text
              key={w}
              style={[
                s.weekday,
                i === 6 && { color: theme.color.weekend.sunday },
                i === 5 && { color: theme.color.weekend.saturday },
              ]}
            >
              {w}
            </Text>
          ))}
        </View>

        {rows.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((info, ci) => {
              if (!info) return <View key={ci} style={s.cell} />;
              const isToday =
                info.solar.day === today.day &&
                info.solar.month === today.month &&
                info.solar.year === today.year;
              const isSelected = info.lunar.jd === selectedJd && !isToday;
              const special = info.isMung1 || info.isRam;
              const holiday = info.holidays.length > 0;
              return (
                <Pressable
                  key={ci}
                  style={({ pressed }) => [
                    s.cell,
                    special && !isToday && !isSelected && s.specialCell,
                    isSelected && s.selectedCell,
                    isToday && s.todayCell,
                    pressed && s.cellPressed,
                  ]}
                  onPress={() => onSelectDay(info)}
                >
                  <Text
                    style={[
                      s.solarDay,
                      ci === 6 && { color: theme.color.weekend.sunday },
                      ci === 5 && { color: theme.color.weekend.saturday },
                      holiday && { color: theme.color.holiday.day },
                      isSelected && s.selectedText,
                      isToday && s.todayText,
                    ]}
                  >
                    {info.solar.day}
                  </Text>
                  <Text style={[s.lunarDay, special && s.lunarSpecial]}>
                    {info.lunar.day === 1
                      ? `1/${info.lunar.month}${info.lunar.leap ? 'n' : ''}`
                      : info.lunar.day}
                  </Text>
                  <View
                    style={[
                      s.dot,
                      info.dayStar.auspicious && { backgroundColor: theme.color.state.good },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </FadeIn>

      <View style={s.legendRow}>
        <View style={[s.legendDot, { backgroundColor: theme.color.state.good }]} />
        <Text style={s.legend}>ngày hoàng đạo</Text>
        <View style={[s.legendSwatch, { backgroundColor: theme.color.bg.goldSoft }]} />
        <Text style={s.legend}>mùng 1 · rằm</Text>
      </View>
    </View>
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
    headerYear: { color: t.color.text.tertiary, ...t.face.semibold },
    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space.sm,
    },
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
    card: {
      backgroundColor: t.color.bg.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      padding: t.space.sm,
      ...t.shadow.card,
    },
    weekRow: { flexDirection: 'row', marginBottom: t.space.xs },
    weekday: {
      flex: 1,
      textAlign: 'center',
      ...t.type.micro,
      color: t.color.text.tertiary,
      paddingVertical: t.space.sm,
    } as object,
    row: { flexDirection: 'row' },
    cell: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 7,
      paddingBottom: 4,
      margin: 1,
      borderRadius: t.radius.sm,
      minHeight: 56,
    },
    specialCell: { backgroundColor: t.color.bg.goldSoft },
    todayCell: {
      backgroundColor: t.color.bg.accentSoft,
      borderWidth: 1.5,
      borderColor: t.color.border.ring,
    },
    selectedCell: {
      backgroundColor: t.color.selected.soft,
      borderWidth: 1.5,
      borderColor: t.color.selected.solid,
    },
    cellPressed: { backgroundColor: t.color.bg.elevated },
    solarDay: { fontSize: 17, ...t.face.semibold, color: t.color.text.primary },
    todayText: { color: t.color.text.accent, ...t.face.bold },
    selectedText: { color: t.color.selected.solid, ...t.face.bold },
    lunarDay: { fontSize: 11, ...t.face.regular, color: t.color.text.tertiary, marginTop: 1 },
    lunarSpecial: { color: t.color.text.lunar, ...t.face.bold },
    dot: { width: 4, height: 4, borderRadius: 2, marginTop: 3, backgroundColor: 'transparent' },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: t.space.md,
    },
    legendDot: { width: 6, height: 6, borderRadius: 3 },
    legendSwatch: { width: 12, height: 12, borderRadius: 4, marginLeft: t.space.md },
    legend: { ...t.type.caption, color: t.color.text.tertiary } as object,
  });
