import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CHI, laSoTuVi, type Gender, type TuViChart, type TuViStar } from 'lunar-core';
import { useTheme } from './design';
import type { Theme } from './design';

const ELEMENT_KEY: Record<string, keyof Theme['color']['element']> = {
  Kim: 'kim',
  Mộc: 'moc',
  Thủy: 'thuy',
  Hỏa: 'hoa',
  Thổ: 'tho',
};

const starColor = (st: { element: string }, theme: Theme) =>
  theme.color.element[ELEMENT_KEY[st.element]];

/** Standalone tứ hóa entries shown in the star columns (like the reference). */
const HOA_ELEMENT: Record<string, string> = {
  'Hóa Lộc': 'Mộc',
  'Hóa Quyền': 'Thủy',
  'Hóa Khoa': 'Thủy',
  'Hóa Kỵ': 'Thủy',
};

interface ColItem {
  name: string;
  element: string;
  nature: 'cat' | 'hung';
}

/** Cát/hung columns: phụ tinh, then tứ hóa entries, then lưu niên stars. */
function columns(stars: TuViStar[]): { cat: ColItem[]; hung: ColItem[] } {
  const items: ColItem[] = [
    ...stars.filter((st) => st.kind === 'phu'),
    ...stars
      .filter((st) => st.hoa)
      .map((st) => ({
        name: st.hoa!,
        element: HOA_ELEMENT[st.hoa!],
        nature: (st.hoa === 'Hóa Kỵ' ? 'hung' : 'cat') as ColItem['nature'],
      })),
    ...stars.filter((st) => st.kind === 'luu'),
  ];
  return {
    cat: items.filter((it) => it.nature === 'cat'),
    hung: items.filter((it) => it.nature === 'hung'),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Label for a giờ chi with its two-hour band, e.g. "Giờ Mão (05:00 – 06:59)". */
const hourLabel = (chi: number) =>
  `Giờ ${CHI[chi]} (${pad((chi * 2 + 23) % 24)}:00 – ${pad((chi * 2) % 24)}:59)`;

/**
 * Birth-place time zones as IANA identifiers — daylight saving time is
 * resolved automatically per birth year via Intl. `off` is only the
 * standard-offset fallback for runtimes without time-zone data.
 */
const TIMEZONES: ReadonlyArray<{ label: string; tz: string; off: number }> = [
  { label: 'Việt Nam (GMT+7)', tz: 'Asia/Ho_Chi_Minh', off: 420 },
  { label: 'Singapore, Malaysia', tz: 'Asia/Singapore', off: 480 },
  { label: 'Đài Loan', tz: 'Asia/Taipei', off: 480 },
  { label: 'Trung Quốc', tz: 'Asia/Shanghai', off: 480 },
  { label: 'Nhật Bản', tz: 'Asia/Tokyo', off: 540 },
  { label: 'Hàn Quốc', tz: 'Asia/Seoul', off: 540 },
  { label: 'Úc — Sydney, Melbourne', tz: 'Australia/Sydney', off: 600 },
  { label: 'Úc — Perth', tz: 'Australia/Perth', off: 480 },
  { label: 'New Zealand', tz: 'Pacific/Auckland', off: 720 },
  { label: 'Anh', tz: 'Europe/London', off: 0 },
  { label: 'Đức, Pháp, Séc, Ba Lan', tz: 'Europe/Berlin', off: 60 },
  { label: 'Nga — Moscow', tz: 'Europe/Moscow', off: 180 },
  { label: 'Ấn Độ', tz: 'Asia/Kolkata', off: 330 },
  { label: 'Mỹ — bờ Đông, Canada (Toronto)', tz: 'America/New_York', off: -300 },
  { label: 'Mỹ — miền Trung (Chicago, Houston)', tz: 'America/Chicago', off: -360 },
  { label: 'Mỹ — miền núi (Denver)', tz: 'America/Denver', off: -420 },
  { label: 'Mỹ — bờ Tây, Canada (Vancouver)', tz: 'America/Los_Angeles', off: -480 },
  { label: 'Hawaii', tz: 'Pacific/Honolulu', off: -600 },
];

/** Wall-clock time of a UTC instant in an IANA zone, as a UTC-encoded ms value. */
function wallInZone(utcMs: number, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
}

/**
 * Convert a local birth datetime (mid-hour) at the birth place to
 * Vietnam time (GMT+7), where the lunar calendar and giờ chi are
 * defined. DST at the birth place and date is resolved via Intl.
 */
function toVietnamTime(
  d: number,
  m: number,
  y: number,
  hour: number,
  zone: { tz: string; off: number },
) {
  const localWall = Date.UTC(y, m - 1, d, hour, 30);
  let utcMs = localWall - zone.off * 60000;
  try {
    // Iterate: adjust the UTC guess until its wall time in the zone matches.
    for (let i = 0; i < 3; i++) {
      utcMs += localWall - wallInZone(utcMs, zone.tz);
    }
  } catch {
    utcMs = localWall - zone.off * 60000; // no tz data: fixed standard offset
  }
  const offsetUsed = Math.round((localWall - utcMs) / 60000);
  const vn = new Date(utcMs + 420 * 60000);
  const minutes = vn.getUTCHours() * 60 + vn.getUTCMinutes();
  return {
    day: vn.getUTCDate(),
    month: vn.getUTCMonth() + 1,
    year: vn.getUTCFullYear(),
    hourChi: Math.floor(((minutes + 60) % 1440) / 120),
    offsetUsed,
  };
}

const fmtOffset = (min: number) => {
  const sign = min < 0 ? '-' : '+';
  const a = Math.abs(min);
  return `GMT${sign}${Math.floor(a / 60)}${a % 60 ? ':' + pad(a % 60) : ''}`;
};

/** Grid placement of the 12 chi palaces: [row, col] in a 4×4 board. */
const GRID_POS: Record<number, [number, number]> = {
  5: [0, 0], 6: [0, 1], 7: [0, 2], 8: [0, 3],
  4: [1, 0], 9: [1, 3],
  3: [2, 0], 10: [2, 3],
  2: [3, 0], 1: [3, 1], 0: [3, 2], 11: [3, 3],
};

interface FormState {
  name: string;
  day: string;
  month: string;
  year: string;
  hour: number;
  tzIndex: number;
  gender: Gender;
  namXem: string;
}

/**
 * Module-level store so the form and the last computed chart survive
 * navigating away from the tab (the view unmounts on tab switch).
 */
const memory: { form: FormState | null; submitted: FormState | null } = {
  form: null,
  submitted: null,
};

function computeResult(f: FormState) {
  const d = parseInt(f.day, 10);
  const m = parseInt(f.month, 10);
  const y = parseInt(f.year, 10);
  if (!d || !m || !y || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) {
    return { error: 'Nhập ngày sinh dương lịch hợp lệ (1900–2100).' } as const;
  }
  const maxDay = new Date(y, m, 0).getDate();
  if (d > maxDay) return { error: `Tháng ${m}/${y} chỉ có ${maxDay} ngày.` } as const;
  const nx = parseInt(f.namXem, 10);
  if (!nx || nx < 1900 || nx > 2100) {
    return { error: 'Nhập năm xem hợp lệ (1900–2100).' } as const;
  }
  // f.hour is a giờ chi index; convert via the band's midpoint clock hour.
  const vn = toVietnamTime(d, m, y, (f.hour * 2) % 24, TIMEZONES[f.tzIndex]);
  const converted =
    f.tzIndex !== 0
      ? `Nơi sinh ${fmtOffset(vn.offsetUsed)} → giờ Việt Nam: ${vn.day}/${vn.month}/${vn.year} · Giờ ${CHI[vn.hourChi]}`
      : null;
  return {
    chart: laSoTuVi(vn.day, vn.month, vn.year, vn.hourChi, f.gender, nx),
    converted,
    name: f.name,
  } as const;
}

export default function TuViView({ initial }: { initial: { day: number; month: number; year: number } }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const s = useMemo(() => styles(theme, isWide), [theme, isWide]);

  const [form, setForm] = useState<FormState>(
    () =>
      memory.form ?? {
        name: '',
        day: String(initial.day),
        month: String(initial.month),
        year: String(initial.year),
        hour: 0,
        tzIndex: 0,
        gender: 'nam',
        namXem: String(new Date().getFullYear()),
      },
  );
  const [submitted, setSubmitted] = useState<FormState | null>(memory.submitted);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      memory.form = next;
      return next;
    });

  const submit = () => {
    memory.form = form;
    memory.submitted = form;
    setSubmitted(form);
  };

  const result = useMemo(() => (submitted ? computeResult(submitted) : null), [submitted]);
  const { name, day, month, year, hour, tzIndex, gender, namXem } = form;

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
        <Text style={s.fieldLabel}>Họ tên (tùy chọn)</Text>
        <TextInput
          style={[s.input, { marginBottom: theme.space.md }]}
          value={name}
          onChangeText={(v) => set('name', v)}
          placeholder="Nguyễn Văn A"
          placeholderTextColor={theme.color.text.disabled}
        />
        <Text style={s.sectionLabel}>Ngày sinh — dương lịch</Text>
        <View style={s.inputRow}>
          <Field label="Ngày" value={day} onChange={(v) => set('day', v)} s={s} />
          <Field label="Tháng" value={month} onChange={(v) => set('month', v)} s={s} />
          <Field label="Năm" value={year} onChange={(v) => set('year', v)} wide s={s} />
        </View>

        <Text style={s.fieldLabel}>Giờ sinh (giờ tại nơi sinh)</Text>
        <Dropdown
          title="Giờ sinh"
          accessibilityLabel="Chọn giờ sinh"
          options={Array.from({ length: 12 }, (_, chi) => hourLabel(chi))}
          value={hour}
          onChange={(i) => set('hour', i)}
          s={s}
          theme={theme}
        />

        <Text style={s.fieldLabel}>Nơi sinh (múi giờ)</Text>
        <Dropdown
          title="Nơi sinh (múi giờ)"
          accessibilityLabel="Chọn múi giờ nơi sinh"
          options={TIMEZONES.map((t) => t.label)}
          value={tzIndex}
          onChange={(i) => set('tzIndex', i)}
          s={s}
          theme={theme}
        />

        <View style={s.bottomRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Năm xem (lưu niên)</Text>
            <TextInput
              style={s.input}
              value={namXem}
              onChangeText={(t) => set('namXem', t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          <View style={{ flex: 1.4 }}>
            <Text style={s.fieldLabel}>Giới tính</Text>
            <View style={s.genderRow}>
              {(['nam', 'nu'] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => set('gender', g)}
                  style={[s.segment, gender === g && s.segmentActive]}
                >
                  <Text style={[s.segmentText, gender === g && s.segmentTextActive]}>
                    {g === 'nam' ? 'Nam' : 'Nữ'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <Pressable style={s.submitBtn} onPress={submit} accessibilityRole="button">
          <Text style={s.submitText}>Lập lá số</Text>
        </Pressable>
        {result && 'converted' in result && result.converted && (
          <Text style={s.convertedNote}>{result.converted}</Text>
        )}
      </View>

      {result === null ? (
        <View style={s.card}>
          <Text style={s.hint}>Nhập thông tin sinh và bấm "Lập lá số" để xem lá số.</Text>
        </View>
      ) : 'error' in result ? (
        <View style={s.card}>
          <Text style={s.error}>{result.error}</Text>
        </View>
      ) : (
        <Board chart={result.chart} name={result.name} s={s} theme={theme} />
      )}
    </ScrollView>
  );
}

function Dropdown({
  title,
  accessibilityLabel,
  options,
  value,
  onChange,
  s,
  theme,
}: {
  title: string;
  accessibilityLabel: string;
  options: string[];
  value: number;
  onChange: (i: number) => void;
  s: any;
  theme: Theme;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        style={s.dropdown}
        onPress={() => setOpen(true)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="combobox"
      >
        <Text style={s.dropdownText} numberOfLines={1}>{options[value]}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.color.text.tertiary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>{title}</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {options.map((label, i) => (
                <Pressable
                  key={i}
                  style={[s.modalOption, i === value && s.modalOptionOn]}
                  onPress={() => {
                    onChange(i);
                    setOpen(false);
                  }}
                >
                  <Text style={[s.modalOptionText, i === value && s.modalOptionTextOn]}>
                    {label}
                  </Text>
                  {i === value && (
                    <Ionicons name="checkmark" size={16} color={theme.color.text.accent} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** Hour range of a giờ chi, e.g. Tuất → "19h–21h". */
const chiRange = (h: number) => `${(h * 2 + 23) % 24}h–${(h * 2 + 1) % 24}h`;

function CenterRow({ label, value, s }: { label: string; value: string; s: any }) {
  return (
    <View style={s.centerRow}>
      <Text style={s.centerLabel}>{label}</Text>
      <Text style={s.centerValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Board({ chart, name, s, theme }: { chart: TuViChart; name: string; s: any; theme: Theme }) {
  const [detail, setDetail] = useState<number | null>(null);
  return (
    <View style={s.boardWrap}>
      <View style={s.board}>
        {chart.palaces.map((p) => {
          const [row, col] = GRID_POS[p.chiIndex];
          return (
            <Pressable
              key={p.chiIndex}
              onPress={() => setDetail(p.chiIndex)}
              accessibilityLabel={`Cung ${p.cung}`}
              style={({ pressed }) => [
                s.palace,
                { top: `${row * 25}%`, left: `${col * 25}%` },
                p.cung === 'Mệnh' && s.palaceMenh,
                pressed && { backgroundColor: theme.color.bg.elevated },
              ]}
            >
              <View style={s.palaceHead}>
                <Text style={s.palaceCanChi} numberOfLines={1}>{p.canChi}</Text>
                <Text style={s.palaceDaiVan}>{p.daiVan}</Text>
              </View>
              <View style={s.cungRow}>
                <Text style={s.palaceCung} numberOfLines={1}>
                  {p.cung}
                  {p.than ? ' · Thân' : ''}
                </Text>
                {chart.tuan.includes(p.chiIndex) && <Text style={s.tag}>TUẦN</Text>}
                {chart.triet.includes(p.chiIndex) && <Text style={s.tag}>TRIỆT</Text>}
              </View>
              {p.stars
                .filter((st) => st.kind === 'chinh')
                .map((st) => (
                  <Text
                    key={st.name}
                    style={[s.starMajor, { color: starColor(st, theme) }]}
                    numberOfLines={1}
                  >
                    {st.name}
                  </Text>
                ))}
              {(() => {
                const cols = columns(p.stars);
                return (
                  <View style={s.minorRow}>
                    <View style={s.minorCol}>
                      {cols.cat.map((it) => (
                        <Text
                          key={it.name}
                          style={[s.starMinor, { color: starColor(it, theme) }]}
                          numberOfLines={1}
                        >
                          {it.name}
                        </Text>
                      ))}
                    </View>
                    <View style={s.minorCol}>
                      {cols.hung.map((it) => (
                        <Text
                          key={it.name}
                          style={[s.starMinor, s.starMinorHung, { color: starColor(it, theme) }]}
                          numberOfLines={1}
                        >
                          {it.name}
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              })()}
              <Text style={s.palaceTrangSinh}>{p.trangSinh}</Text>
            </Pressable>
          );
        })}

        <View style={s.center}>
          <Text style={s.centerTitle} numberOfLines={1}>
            {name.trim() || 'Lá số tử vi'}
          </Text>
          <View style={s.centerDivider} />
          <CenterRow label="Năm" value={`${chart.input.year} · ${chart.yearCanChi}`} s={s} />
          <CenterRow
            label="Tháng"
            value={`${chart.input.month} (âm ${chart.lunar.month}${chart.lunar.leap ? ' nhuận' : ''})`}
            s={s}
          />
          <CenterRow
            label="Ngày"
            value={`${chart.input.day} (âm ${chart.lunar.day}) · ${chart.dayCanChi}`}
            s={s}
          />
          <CenterRow
            label="Giờ"
            value={`${chart.hourCanChi} (${chiRange(chart.input.hourChi)})`}
            s={s}
          />
          {chart.namXem && (
            <CenterRow
              label="Năm xem"
              value={`${chart.namXem.canChi} (${chart.namXem.year}) · ${chart.namXem.tuoi} tuổi`}
              s={s}
            />
          )}
          <View style={s.centerDivider} />
          <CenterRow label="Âm dương" value={chart.amDuong} s={s} />
          <CenterRow label="Bản mệnh" value={chart.banMenh} s={s} />
          <CenterRow label="Cục" value={chart.cuc.name} s={s} />
          <CenterRow label="Sinh khắc" value={chart.cucRelation} s={s} />
          <CenterRow label="Chủ mệnh" value={chart.menhChu} s={s} />
          <CenterRow label="Chủ thân" value={chart.thanChu} s={s} />
        </View>
      </View>
      <PalaceSheet
        palace={detail !== null ? chart.palaces[detail] : null}
        chart={chart}
        onClose={() => setDetail(null)}
        s={s}
        theme={theme}
      />
    </View>
  );
}

function PalaceSheet({
  palace,
  chart,
  onClose,
  s,
  theme,
}: {
  palace: TuViChart['palaces'][number] | null;
  chart: TuViChart;
  onClose: () => void;
  s: any;
  theme: Theme;
}) {
  if (!palace) return null;
  const cols = columns(palace.stars);
  const majors = palace.stars.filter((st) => st.kind === 'chinh');
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable style={s.modalSheet} onPress={() => {}}>
          <View style={s.sheetHead}>
            <Text style={s.sheetCung}>
              {palace.cung}
              {palace.than ? ' · Thân' : ''}
            </Text>
            {chart.tuan.includes(palace.chiIndex) && <Text style={s.sheetTag}>TUẦN</Text>}
            {chart.triet.includes(palace.chiIndex) && <Text style={s.sheetTag}>TRIỆT</Text>}
          </View>
          <Text style={s.sheetSub}>
            {palace.canChi} · {palace.trangSinh} · Đại vận {palace.daiVan}
          </Text>
          <ScrollView style={{ maxHeight: 460 }}>
            {majors.map((st) => (
              <Text key={st.name} style={[s.sheetMajor, { color: starColor(st, theme) }]}>
                {st.name}
              </Text>
            ))}
            <View style={s.sheetCols}>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetColTitle}>Cát tinh</Text>
                {cols.cat.map((it) => (
                  <Text key={it.name} style={[s.sheetStar, { color: starColor(it, theme) }]}>
                    {it.name}
                  </Text>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetColTitle}>Hung tinh</Text>
                {cols.hung.map((it) => (
                  <Text key={it.name} style={[s.sheetStar, { color: starColor(it, theme) }]}>
                    {it.name}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
    sectionLabel: {
      ...t.type.label,
      color: t.color.text.accent,
      marginBottom: t.space.sm,
    } as object,
    convertedNote: {
      ...t.type.caption,
      color: t.color.text.lunar,
      marginTop: t.space.md,
      textAlign: 'center',
    } as object,
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
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderColor: t.color.border.strong,
      borderRadius: t.radius.input,
      paddingHorizontal: t.space.md,
      paddingVertical: t.space.md,
      backgroundColor: t.color.bg.elevated,
      marginBottom: t.space.md,
    },
    dropdownText: { fontSize: 16, ...t.face.semibold, color: t.color.text.primary } as object,
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.space.lg,
    },
    modalSheet: {
      backgroundColor: t.color.bg.surface,
      borderRadius: t.radius.modal,
      padding: t.space.sm,
      width: '100%',
      maxWidth: 360,
      ...t.shadow.floating,
    },
    modalTitle: {
      ...t.type.headline,
      color: t.color.text.primary,
      textAlign: 'center',
      paddingVertical: t.space.md,
    } as object,
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: t.space.lg,
      paddingVertical: t.space.md,
      borderRadius: t.radius.input,
    },
    modalOptionOn: { backgroundColor: t.color.bg.accentSoft },
    modalOptionText: { ...t.type.body, color: t.color.text.primary } as object,
    modalOptionTextOn: { ...t.face.semibold, color: t.color.text.accent } as object,
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
    hint: { ...t.type.body, color: t.color.text.secondary, textAlign: 'center' } as object,
    submitBtn: {
      backgroundColor: t.color.accent.solid,
      borderRadius: t.radius.button,
      paddingVertical: t.space.md + 2,
      alignItems: 'center',
      marginTop: t.space.lg,
    },
    submitText: { ...t.type.headline, color: t.color.text.onAccent } as object,

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
      textAlign: 'center',
      marginBottom: 1,
    } as object,
    cungRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginBottom: 1,
    },
    bottomRow: { flexDirection: 'row', gap: t.space.sm, alignItems: 'flex-end' },
    tag: {
      fontSize: isWide ? 9 : 6.5,
      ...t.face.bold,
      color: t.color.state.bad,
      borderWidth: 1,
      borderColor: t.color.state.bad,
      borderRadius: 3,
      paddingHorizontal: 3,
      overflow: 'hidden',
    } as object,
    starMajor: {
      fontSize: isWide ? 12 : 8.5,
      ...t.face.bold,
      textAlign: 'center',
      textTransform: 'uppercase',
    } as object,
    starHoa: { color: t.color.text.lunar, ...t.face.semibold } as object,
    minorRow: { flexDirection: 'row', flex: 1, gap: 2, marginTop: 1 },
    minorCol: { flex: 1, minWidth: 0 },
    starMinor: {
      fontSize: isWide ? 9.5 : 6.5,
      lineHeight: isWide ? 13 : 9,
      ...t.face.medium,
    } as object,
    starMinorHung: { textAlign: 'right' },
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
      justifyContent: 'center',
      paddingHorizontal: isWide ? t.space.xl : t.space.md,
      paddingVertical: t.space.sm,
      backgroundColor: t.color.bg.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.color.border.subtle,
    },
    centerTitle: {
      fontSize: isWide ? 16 : 11,
      ...t.face.bold,
      color: t.color.text.accent,
      textAlign: 'center',
      textTransform: 'uppercase',
    } as object,
    centerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: t.space.sm,
      marginVertical: isWide ? 1.5 : 0.5,
    },
    centerLabel: {
      fontSize: isWide ? 12 : 8,
      ...t.face.semibold,
      color: t.color.text.tertiary,
    } as object,
    centerValue: {
      fontSize: isWide ? 12.5 : 8.5,
      ...t.face.semibold,
      color: t.color.text.primary,
      flexShrink: 1,
      textAlign: 'right',
    } as object,
    centerDivider: {
      height: 1,
      alignSelf: 'stretch',
      backgroundColor: t.color.border.strong,
      marginVertical: isWide ? t.space.sm : 4,
    },
    note: {
      ...t.type.caption,
      color: t.color.text.tertiary,
      textAlign: 'center',
      paddingVertical: t.space.md,
    } as object,
    sheetHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingTop: t.space.md,
    },
    sheetCung: {
      ...t.type.headline,
      color: t.color.text.accent,
      textTransform: 'uppercase',
    } as object,
    sheetTag: {
      fontSize: 11,
      ...t.face.bold,
      color: t.color.state.bad,
      borderWidth: 1,
      borderColor: t.color.state.bad,
      borderRadius: 4,
      paddingHorizontal: 5,
      overflow: 'hidden',
    } as object,
    sheetSub: {
      ...t.type.caption,
      color: t.color.text.secondary,
      textAlign: 'center',
      paddingBottom: t.space.sm,
    } as object,
    sheetMajor: {
      ...t.type.headline,
      textAlign: 'center',
      textTransform: 'uppercase',
      marginVertical: 1,
    } as object,
    sheetCols: {
      flexDirection: 'row',
      gap: t.space.lg,
      paddingHorizontal: t.space.lg,
      paddingVertical: t.space.md,
    },
    sheetColTitle: {
      ...t.type.micro,
      color: t.color.text.tertiary,
      marginBottom: 4,
    } as object,
    sheetStar: { ...t.type.body, ...t.face.semibold, marginVertical: 1 } as object,
  });
