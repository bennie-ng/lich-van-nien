import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDayInfo, lunarToSolar, solarToLunar, yearCanChi } from 'lunar-core';
import { useTheme, WEEKDAY_FULL_VI } from './design';
import type { Theme } from './design';

type Direction = 'solar2lunar' | 'lunar2solar';

export default function Converter({ initial }: { initial: { day: number; month: number; year: number } }) {
  const { theme } = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const [direction, setDirection] = useState<Direction>('solar2lunar');
  const [day, setDay] = useState(String(initial.day));
  const [month, setMonth] = useState(String(initial.month));
  const [year, setYear] = useState(String(initial.year));
  const [leap, setLeap] = useState(false);

  const result = useMemo(() => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!d || !m || !y || m < 1 || m > 12 || d < 1 || d > 31 || y < 1800 || y > 2199) {
      return { error: 'Nhập ngày, tháng, năm hợp lệ (1800–2199).' };
    }
    if (direction === 'solar2lunar') {
      const maxDay = new Date(y, m, 0).getDate();
      if (d > maxDay) return { error: `Tháng ${m}/${y} chỉ có ${maxDay} ngày.` };
      const lunar = solarToLunar(d, m, y);
      const info = getDayInfo(d, m, y);
      return {
        text: `${lunar.day}/${lunar.month}${lunar.leap ? ' nhuận' : ''} năm ${yearCanChi(lunar.year).name}`,
        sub: `${WEEKDAY_FULL_VI[info.solar.weekday]} · ngày ${info.canChi.day.name}`,
        good: info.dayStar.auspicious,
      };
    }
    const solar = lunarToSolar(d, m, y, leap);
    if (!solar) {
      return {
        error: leap
          ? `Năm ${y} không có tháng ${m} nhuận (hoặc ngày không tồn tại).`
          : `Ngày âm lịch không tồn tại.`,
      };
    }
    const info = getDayInfo(solar.day, solar.month, solar.year);
    return {
      text: `${solar.day}/${solar.month}/${solar.year} dương lịch`,
      sub: `${WEEKDAY_FULL_VI[info.solar.weekday]} · ngày ${info.canChi.day.name}`,
      good: info.dayStar.auspicious,
    };
  }, [direction, day, month, year, leap]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: theme.space.lg, paddingBottom: 120 }}
    >
      <Text style={s.pageTitle}>Đổi ngày</Text>

      <View style={s.segmented}>
        <Segment
          active={direction === 'solar2lunar'}
          label="Dương → Âm"
          onPress={() => setDirection('solar2lunar')}
          s={s}
        />
        <Segment
          active={direction === 'lunar2solar'}
          label="Âm → Dương"
          onPress={() => setDirection('lunar2solar')}
          s={s}
        />
      </View>

      <View style={s.card}>
        <View style={s.inputRow}>
          <Field label="Ngày" value={day} onChange={setDay} s={s} />
          <Field label="Tháng" value={month} onChange={setMonth} s={s} />
          <Field label="Năm" value={year} onChange={setYear} wide s={s} />
        </View>

        {direction === 'lunar2solar' && (
          <Pressable style={s.leapRow} onPress={() => setLeap(!leap)}>
            <View style={[s.checkbox, leap && s.checkboxOn]}>
              {leap && <Ionicons name="checkmark" size={14} color={theme.color.text.onAccent} />}
            </View>
            <Text style={s.leapLabel}>Tháng nhuận</Text>
          </Pressable>
        )}
      </View>

      <View style={[s.card, s.resultCard]}>
        {'error' in result ? (
          <Text style={s.error}>{result.error}</Text>
        ) : (
          <>
            <Text style={s.resultText}>{result.text}</Text>
            <View style={s.resultSubRow}>
              <Text style={s.resultSub}>{result.sub}</Text>
              <View
                style={[
                  s.resultTag,
                  {
                    backgroundColor: result.good
                      ? theme.color.state.goodSoft
                      : theme.color.state.badSoft,
                  },
                ]}
              >
                <Text
                  style={[
                    s.resultTagText,
                    { color: result.good ? theme.color.state.good : theme.color.state.bad },
                  ]}
                >
                  {result.good ? 'hoàng đạo' : 'hắc đạo'}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Segment({
  active,
  label,
  onPress,
  s,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  s: any;
}) {
  return (
    <Pressable style={[s.segment, active && s.segmentActive]} onPress={onPress}>
      <Text style={[s.segmentText, active && s.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChange,
  wide,
  s,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  wide?: boolean;
  s: any;
}) {
  return (
    <View style={[s.field, wide && { flex: 1.6 }]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={4}
      />
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    pageTitle: {
      ...t.type.titleXL,
      color: t.color.text.primary,
      paddingTop: t.space.sm,
      paddingBottom: t.space.lg,
    } as object,
    segmented: {
      flexDirection: 'row',
      backgroundColor: t.color.bg.elevated,
      borderRadius: t.radius.button,
      padding: 3,
      marginBottom: t.space.md,
    },
    segment: {
      flex: 1,
      borderRadius: t.radius.button - 3,
      paddingVertical: t.space.sm + 2,
      alignItems: 'center',
    },
    segmentActive: { backgroundColor: t.color.bg.surface, ...t.shadow.card },
    segmentText: { ...t.type.label, color: t.color.text.tertiary } as object,
    segmentTextActive: { color: t.color.text.accent },
    card: {
      backgroundColor: t.color.bg.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      padding: t.space.lg,
      marginBottom: t.space.md,
      ...t.shadow.card,
    },
    inputRow: { flexDirection: 'row', gap: t.space.sm },
    field: { flex: 1 },
    fieldLabel: { ...t.type.micro, color: t.color.text.tertiary, marginBottom: 6 } as object,
    input: {
      borderWidth: 1.5,
      borderColor: t.color.border.strong,
      borderRadius: t.radius.input,
      paddingHorizontal: t.space.md,
      paddingVertical: t.space.md,
      fontSize: 18,
      ...t.face.semibold,
      color: t.color.text.primary,
      backgroundColor: t.color.bg.elevated,
    },
    leapRow: { flexDirection: 'row', alignItems: 'center', marginTop: t.space.lg },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: t.color.accent.solid,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: t.color.accent.solid },
    leapLabel: { marginLeft: t.space.sm, ...t.type.label, color: t.color.text.primary } as object,
    resultCard: { alignItems: 'center', paddingVertical: t.space.xl },
    resultText: { ...t.type.title, color: t.color.text.accent, textAlign: 'center' } as object,
    resultSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.space.sm,
      marginTop: t.space.sm,
    },
    resultSub: { ...t.type.caption, color: t.color.text.secondary } as object,
    resultTag: {
      borderRadius: t.radius.full,
      paddingHorizontal: t.space.sm,
      paddingVertical: 3,
    },
    resultTagText: { ...t.type.caption, ...t.face.bold } as object,
    error: { ...t.type.label, color: t.color.state.danger, textAlign: 'center' } as object,
  });
