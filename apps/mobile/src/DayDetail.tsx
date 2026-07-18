import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { DayInfo } from 'lunar-core';
import { useTheme, WEEKDAY_FULL_VI } from './design';
import type { Theme } from './design';

export default function DayDetail({ info }: { info: DayInfo }) {
  const { theme } = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const { solar, lunar, canChi, dayStar, auspiciousHours, solarTerm, holidays } = info;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: theme.space.lg, paddingBottom: 120 }}
    >
      <LinearGradient
        colors={theme.color.accent.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.heroWeekdayPill}>
          <Text style={s.heroWeekday}>{WEEKDAY_FULL_VI[solar.weekday]}</Text>
        </View>
        <Text style={s.heroDay}>{solar.day}</Text>
        <Text style={s.heroMonth}>
          Tháng {solar.month} năm {solar.year}
        </Text>
        <View style={s.lunarBadge}>
          <Ionicons name="moon" size={13} color={theme.color.hero.badge} />
          <Text style={s.lunarBadgeText}>
            {lunar.day}/{lunar.month}
            {lunar.leap ? ' nhuận' : ''} · {canChi.year.name}
          </Text>
        </View>
      </LinearGradient>

      {holidays.length > 0 && (
        <View style={[s.card, s.holidayCard]}>
          {holidays.map((h) => (
            <View key={h.name} style={s.holidayRow}>
              <Ionicons name="sparkles" size={16} color={theme.color.holiday.badgeText} />
              <Text style={s.holidayText}>
                {h.name}
                {h.publicHoliday ? '  ·  nghỉ lễ' : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.card}>
        <SectionTitle icon="compass-outline" title="Can chi" theme={theme} />
        <View style={s.rowBetween}>
          <Item label="Ngày" value={canChi.day.name} s={s} />
          <Item label="Tháng" value={canChi.month.name} s={s} />
          <Item label="Năm" value={canChi.year.name} s={s} />
        </View>
        <View style={s.termRow}>
          <Ionicons name="leaf-outline" size={14} color={theme.color.text.lunar} />
          <Text style={s.term}>Tiết {solarTerm}</Text>
        </View>
      </View>

      <View style={s.card}>
        <View style={s.starHeader}>
          <View
            style={[
              s.starBadge,
              {
                backgroundColor: dayStar.auspicious
                  ? theme.color.state.goodSoft
                  : theme.color.state.badSoft,
              },
            ]}
          >
            <Ionicons
              name={dayStar.auspicious ? 'checkmark-circle' : 'alert-circle-outline'}
              size={18}
              color={dayStar.auspicious ? theme.color.state.good : theme.color.state.bad}
            />
            <Text
              style={[
                s.starBadgeText,
                { color: dayStar.auspicious ? theme.color.state.good : theme.color.state.bad },
              ]}
            >
              {dayStar.auspicious ? 'Hoàng đạo' : 'Hắc đạo'}
            </Text>
          </View>
          <Text style={s.starName}>sao {dayStar.star}</Text>
        </View>
        <Text style={s.starNote}>
          {dayStar.auspicious
            ? 'Ngày tốt, thuận lợi cho các việc trọng đại.'
            : 'Ngày kém thuận lợi, nên cân nhắc việc trọng đại.'}
        </Text>
      </View>

      <View style={s.card}>
        <SectionTitle icon="time-outline" title="Giờ hoàng đạo" theme={theme} />
        <View style={s.hourWrap}>
          {auspiciousHours.map((h) => (
            <View key={h.chi} style={s.hourChip}>
              <Text style={s.hourChi}>{h.chi}</Text>
              <Text style={s.hourRange}>{h.range}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function SectionTitle({ icon, title, theme }: { icon: any; title: string; theme: Theme }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.space.md }}>
      <Ionicons name={icon} size={16} color={theme.color.text.accent} />
      <Text style={{ ...theme.type.headline, color: theme.color.text.primary } as object}>{title}</Text>
    </View>
  );
}

function Item({ label, value, s }: { label: string; value: string; s: any }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={s.itemLabel}>{label}</Text>
      <Text style={s.itemValue}>{value}</Text>
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    hero: {
      borderRadius: t.radius.modal,
      padding: t.space.xl,
      alignItems: 'center',
      marginTop: t.space.sm,
      ...t.shadow.floating,
    },
    heroWeekdayPill: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: t.radius.full,
      paddingHorizontal: t.space.md,
      paddingVertical: 4,
    },
    heroWeekday: { ...t.type.label, color: t.color.hero.soft } as object,
    heroDay: { ...t.type.display, fontSize: 64, lineHeight: 72, color: t.color.hero.text } as object,
    heroMonth: { ...t.type.body, color: t.color.hero.soft, ...t.face.semibold } as object,
    lunarBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(0,0,0,0.18)',
      borderRadius: t.radius.full,
      paddingHorizontal: t.space.lg,
      paddingVertical: 7,
      marginTop: t.space.md,
    },
    lunarBadgeText: { ...t.type.label, color: t.color.hero.badge } as object,
    card: {
      backgroundColor: t.color.bg.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      marginTop: t.space.md,
      padding: t.space.lg,
      ...t.shadow.card,
    },
    holidayCard: { backgroundColor: t.color.holiday.badgeBg, borderColor: 'transparent' },
    holidayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    holidayText: { ...t.type.headline, color: t.color.holiday.badgeText } as object,
    rowBetween: { flexDirection: 'row' },
    itemLabel: { ...t.type.micro, color: t.color.text.tertiary } as object,
    itemValue: { ...t.type.headline, color: t.color.text.primary, marginTop: 4 } as object,
    termRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: t.space.lg,
      alignSelf: 'flex-start',
      backgroundColor: t.color.bg.elevated,
      borderRadius: t.radius.full,
      paddingHorizontal: t.space.md,
      paddingVertical: 5,
    },
    term: { ...t.type.caption, color: t.color.text.lunar, ...t.face.semibold } as object,
    starHeader: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
    starBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: t.radius.full,
      paddingHorizontal: t.space.md,
      paddingVertical: 5,
    },
    starBadgeText: { ...t.type.label } as object,
    starName: { ...t.type.body, color: t.color.text.secondary } as object,
    starNote: { ...t.type.body, color: t.color.text.secondary, marginTop: t.space.md } as object,
    hourWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm },
    hourChip: {
      backgroundColor: t.color.bg.elevated,
      borderRadius: t.radius.input,
      paddingHorizontal: t.space.md,
      paddingVertical: t.space.sm,
      alignItems: 'center',
      minWidth: 86,
    },
    hourChi: { ...t.type.headline, color: t.color.text.lunar } as object,
    hourRange: { ...t.type.caption, color: t.color.text.tertiary, marginTop: 1 } as object,
  });
