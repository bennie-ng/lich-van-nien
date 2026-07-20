import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { CHI, laSoTuVi, type Gender, type TuViChart, type TuViPalace } from 'lunar-core';
import { useTheme } from './design';
import type { Theme } from './design';

/** Grid placement of the 12 chi palaces: [row, col] in a 4×4 board. */
const GRID_POS: Record<number, [number, number]> = {
  5: [0, 0], 6: [0, 1], 7: [0, 2], 8: [0, 3],
  4: [1, 0], 9: [1, 3],
  3: [2, 0], 10: [2, 3],
  2: [3, 0], 1: [3, 1], 0: [3, 2], 11: [3, 3],
};

export default function TuViView({ initial }: { initial: { day: number; month: number; year: number } }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const s = useMemo(() => styles(theme, isWide), [theme, isWide]);

  const [day, setDay] = useState(String(initial.day));
  const [month, setMonth] = useState(String(initial.month));
  const [year, setYear] = useState(String(initial.year));
  const [hourChi, setHourChi] = useState(0);
  const [gender, setGender] = useState<Gender>('nam');

  const chart: TuViChart | { error: string } = useMemo(() => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!d || !m || !y || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) {
      return { error: 'Nhập ngày sinh dương lịch hợp lệ (1900–2100).' };
    }
    const maxDay = new Date(y, m, 0).getDate();
    if (d > maxDay) return { error: `Tháng ${m}/${y} chỉ có ${maxDay} ngày.` };
    return laSoTuVi(d, m, y, hourChi, gender);
  }, [day, month, year, hourChi, gender]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: theme.space.lg,
        paddingBottom: isWide ? theme.space.xl : 120,
      }}
    >
      <Text style={s.pageTitle}>Lá số tử vi</Text>

      <View style={s.card}>
        <View style={s.inputRow}>
          <Field label="Ngày sinh" value={day} onChange={setDay} s={s} />
          <Field label="Tháng" value={month} onChange={setMonth} s={s} />
          <Field label="Năm" value={year} onChange={setYear} wide s={s} />
        </View>

        <Text style={s.fieldLabel}>Giờ sinh</Text>
        <View style={s.hourWrap}>
          {CHI.map((chi, i) => (
            <Pressable
              key={chi}
              onPress={() => setHourChi(i)}
              style={[s.hourChip, i === hourChi && s.hourChipOn]}
            >
              <Text style={[s.hourChipText, i === hourChi && s.hourChipTextOn]}>{chi}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.genderRow}>
          {(['nam', 'nu'] as const).map((g) => (
            <Pressable
              key={g}
              onPress={() => setGender(g)}
              style={[s.segment, gender === g && s.segmentActive]}
            >
              <Text style={[s.segmentText, gender === g && s.segmentTextActive]}>
                {g === 'nam' ? 'Nam' : 'Nữ'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {'error' in chart ? (
        <View style={s.card}>
          <Text style={s.error}>{chart.error}</Text>
        </View>
      ) : (
        <Board chart={chart} s={s} theme={theme} />
      )}
    </ScrollView>
  );
}

function Board({ chart, s, theme }: { chart: TuViChart; s: any; theme: Theme }) {
  return (
    <View style={s.boardWrap}>
      <View style={s.board}>
        {chart.palaces.map((p) => {
          const [row, col] = GRID_POS[p.chiIndex];
          return (
            <View
              key={p.chiIndex}
              style={[
                s.palace,
                { top: `${row * 25}%`, left: `${col * 25}%` },
                p.cung === 'Mệnh' && s.palaceMenh,
              ]}
            >
              <View style={s.palaceHead}>
                <Text style={s.palaceCanChi} numberOfLines={1}>{p.canChi}</Text>
                <Text style={s.palaceDaiVan}>{p.daiVan}</Text>
              </View>
              <Text style={s.palaceCung} numberOfLines={1}>
                {p.cung}
                {p.than ? ' · Thân' : ''}
              </Text>
              {p.stars
                .filter((st) => st.kind === 'chinh')
                .map((st) => (
                  <Text key={st.name} style={s.starMajor} numberOfLines={1}>
                    {st.name}
                    {st.hoa ? <Text style={s.starHoa}> {st.hoa}</Text> : null}
                  </Text>
                ))}
              <Text style={s.starMinor} numberOfLines={4}>
                {p.stars
                  .filter((st) => st.kind === 'phu')
                  .map((st) => st.name + (st.hoa ? ` (${st.hoa})` : ''))
                  .join(' · ')}
              </Text>
              <Text style={s.palaceTrangSinh}>{p.trangSinh}</Text>
            </View>
          );
        })}

        <View style={s.center}>
          <Text style={s.centerTitle}>
            {chart.input.day}/{chart.input.month}/{chart.input.year} · {chart.hourName}
          </Text>
          <Text style={s.centerLine}>
            Âm lịch: {chart.lunar.day}/{chart.lunar.month}
            {chart.lunar.leap ? ' nhuận' : ''} năm {chart.yearCanChi}
          </Text>
          <Text style={s.centerLine}>Ngày {chart.dayCanChi}</Text>
          <View style={s.centerDivider} />
          <Text style={s.centerStrong}>{chart.amDuong}</Text>
          <Text style={s.centerStrong}>Bản mệnh: {chart.banMenh}</Text>
          <Text style={s.centerStrong}>{chart.cuc.name}</Text>
        </View>
      </View>
      <Text style={s.note}>
        Số ở góc phải mỗi cung là tuổi khởi đại vận (10 năm). Lá số dùng giờ địa phương Việt Nam;
        sinh 23h–1h chọn giờ Tý.
      </Text>
    </View>
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
    <View style={[{ flex: 1 }, wide && { flex: 1.6 }]}>
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

const styles = (t: Theme, isWide: boolean) =>
  StyleSheet.create({
    pageTitle: {
      ...t.type.titleXL,
      color: t.color.text.primary,
      paddingTop: t.space.sm,
      paddingBottom: t.space.lg,
    } as object,
    card: {
      backgroundColor: t.color.bg.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.color.border.subtle,
      padding: t.space.lg,
      marginBottom: t.space.md,
      maxWidth: 560,
      width: '100%',
      alignSelf: 'center',
      ...t.shadow.card,
    },
    inputRow: { flexDirection: 'row', gap: t.space.sm, marginBottom: t.space.md },
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
    hourWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: t.space.md },
    hourChip: {
      borderRadius: t.radius.full,
      borderWidth: 1,
      borderColor: t.color.border.strong,
      paddingHorizontal: t.space.md,
      paddingVertical: 6,
      backgroundColor: t.color.bg.elevated,
    },
    hourChipOn: { backgroundColor: t.color.accent.solid, borderColor: t.color.accent.solid },
    hourChipText: { ...t.type.label, color: t.color.text.secondary } as object,
    hourChipTextOn: { color: t.color.text.onAccent },
    genderRow: {
      flexDirection: 'row',
      backgroundColor: t.color.bg.elevated,
      borderRadius: t.radius.button,
      padding: 3,
      gap: 2,
    },
    segment: {
      flex: 1,
      borderRadius: t.radius.button - 3,
      paddingVertical: t.space.sm,
      alignItems: 'center',
    },
    segmentActive: { backgroundColor: t.color.bg.surface, ...t.shadow.card },
    segmentText: { ...t.type.label, color: t.color.text.tertiary } as object,
    segmentTextActive: { color: t.color.text.accent },
    error: { ...t.type.label, color: t.color.state.danger, textAlign: 'center' } as object,

    boardWrap: { maxWidth: isWide ? 860 : 560, width: '100%', alignSelf: 'center' },
    board: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: t.color.bg.surface,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: t.color.border.strong,
      overflow: 'hidden',
      ...t.shadow.card,
    },
    palace: {
      position: 'absolute',
      width: '25%',
      height: '25%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.color.border.subtle,
      padding: isWide ? 6 : 3,
      overflow: 'hidden',
    },
    palaceMenh: { backgroundColor: t.color.bg.accentSoft },
    palaceHead: { flexDirection: 'row', justifyContent: 'space-between' },
    palaceCanChi: {
      fontSize: isWide ? 11 : 8,
      ...t.face.medium,
      color: t.color.text.tertiary,
      flexShrink: 1,
    } as object,
    palaceDaiVan: { fontSize: isWide ? 11 : 8, ...t.face.bold, color: t.color.text.lunar } as object,
    palaceCung: {
      fontSize: isWide ? 13 : 9,
      ...t.face.bold,
      color: t.color.text.accent,
      textTransform: 'uppercase',
      marginBottom: 1,
    } as object,
    starMajor: { fontSize: isWide ? 12 : 8.5, ...t.face.semibold, color: t.color.text.primary } as object,
    starHoa: { color: t.color.text.lunar, ...t.face.semibold } as object,
    starMinor: {
      fontSize: isWide ? 10 : 7,
      ...t.face.regular,
      color: t.color.text.secondary,
      marginTop: 1,
      flex: 1,
    } as object,
    palaceTrangSinh: {
      fontSize: isWide ? 10 : 7,
      ...t.face.medium,
      color: t.color.state.good,
      textAlign: 'right',
    } as object,
    center: {
      position: 'absolute',
      top: '25%',
      left: '25%',
      width: '50%',
      height: '50%',
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.space.md,
      backgroundColor: t.color.bg.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.color.border.subtle,
    },
    centerTitle: { fontSize: isWide ? 15 : 11, ...t.face.bold, color: t.color.text.primary } as object,
    centerLine: {
      fontSize: isWide ? 12 : 9,
      ...t.face.regular,
      color: t.color.text.secondary,
      marginTop: 2,
    } as object,
    centerDivider: {
      height: 1,
      alignSelf: 'stretch',
      backgroundColor: t.color.border.strong,
      marginVertical: t.space.sm,
    },
    centerStrong: { fontSize: isWide ? 13 : 9.5, ...t.face.semibold, color: t.color.text.accent } as object,
    note: {
      ...t.type.caption,
      color: t.color.text.tertiary,
      textAlign: 'center',
      paddingVertical: t.space.md,
    } as object,
  });
