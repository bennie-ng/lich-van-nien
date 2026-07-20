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
import {
  BRIGHTNESS_NAME,
  CHI,
  laSoTuVi,
  starBrightness,
  type Brightness,
  type Gender,
  type TuViChart,
  type TuViStar,
} from 'lunar-core';
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
  /** Độ sáng letter (M/V/Đ/B/H), when the star is rated at this palace */
  dac?: string;
}

/** Cát/hung columns: phụ tinh, then tứ hóa entries, then lưu niên stars. */
function columns(stars: TuViStar[], chi: number): { cat: ColItem[]; hung: ColItem[] } {
  const items: ColItem[] = [
    ...stars.filter((st) => st.kind === 'phu'),
    ...stars
      .filter((st) => st.hoa)
      .map((st) => ({
        name: st.hoa!,
        element: HOA_ELEMENT[st.hoa!],
        nature: (st.hoa === 'Hóa Kỵ' ? 'hung' : 'cat') as ColItem['nature'],
        dac: starBrightness(st.hoa!, chi),
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
const TIMEZONES: ReadonlyArray<{ label: string; tz: string; off: number; lon: number }> = [
  { label: 'Việt Nam (GMT+7)', tz: 'Asia/Ho_Chi_Minh', off: 420, lon: 105.85 },
  { label: 'Singapore, Malaysia', tz: 'Asia/Singapore', off: 480, lon: 103.82 },
  { label: 'Đài Loan', tz: 'Asia/Taipei', off: 480, lon: 121.56 },
  { label: 'Trung Quốc', tz: 'Asia/Shanghai', off: 480, lon: 121.47 },
  { label: 'Nhật Bản', tz: 'Asia/Tokyo', off: 540, lon: 139.69 },
  { label: 'Hàn Quốc', tz: 'Asia/Seoul', off: 540, lon: 126.98 },
  { label: 'Úc — Sydney, Melbourne', tz: 'Australia/Sydney', off: 600, lon: 151.21 },
  { label: 'Úc — Perth', tz: 'Australia/Perth', off: 480, lon: 115.86 },
  { label: 'New Zealand', tz: 'Pacific/Auckland', off: 720, lon: 174.76 },
  { label: 'Anh', tz: 'Europe/London', off: 0, lon: -0.13 },
  { label: 'Đức, Pháp, Séc, Ba Lan', tz: 'Europe/Berlin', off: 60, lon: 13.4 },
  { label: 'Nga — Moscow', tz: 'Europe/Moscow', off: 180, lon: 37.62 },
  { label: 'Ấn Độ', tz: 'Asia/Kolkata', off: 330, lon: 88.36 },
  { label: 'Mỹ — bờ Đông, Canada (Toronto)', tz: 'America/New_York', off: -300, lon: -74.01 },
  { label: 'Mỹ — miền Trung (Chicago, Houston)', tz: 'America/Chicago', off: -360, lon: -87.63 },
  { label: 'Mỹ — miền núi (Denver)', tz: 'America/Denver', off: -420, lon: -104.99 },
  { label: 'Mỹ — bờ Tây, Canada (Vancouver)', tz: 'America/Los_Angeles', off: -480, lon: -118.24 },
  { label: 'Hawaii', tz: 'Pacific/Honolulu', off: -600, lon: -157.86 },
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

/** Curated birthplace database: VN provinces/cities + major diaspora cities. */
export interface City {
  name: string;
  tz: string;
  off: number; // standard offset, minutes
  lon: number;
}

const VN = (name: string, lon: number): City => ({ name, tz: 'Asia/Ho_Chi_Minh', off: 420, lon });

export const CITIES: ReadonlyArray<City> = [
  VN('Hà Nội', 105.85),
  VN('TP. Hồ Chí Minh (Sài Gòn)', 106.7),
  VN('Hải Phòng', 106.68),
  VN('Đà Nẵng', 108.22),
  VN('Cần Thơ', 105.78),
  VN('Huế', 107.59),
  // Mỹ
  { name: 'Los Angeles, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -118.24 },
  { name: 'Westminster – Little Saigon, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -117.99 },
  { name: 'San Jose, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -121.89 },
  { name: 'San Francisco, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -122.42 },
  { name: 'San Diego, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -117.16 },
  { name: 'Sacramento, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -121.49 },
  { name: 'Seattle, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -122.33 },
  { name: 'Portland, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -122.68 },
  { name: 'Las Vegas, Mỹ', tz: 'America/Los_Angeles', off: -480, lon: -115.14 },
  { name: 'Phoenix, Mỹ', tz: 'America/Phoenix', off: -420, lon: -112.07 },
  { name: 'Denver, Mỹ', tz: 'America/Denver', off: -420, lon: -104.99 },
  { name: 'Dallas, Mỹ', tz: 'America/Chicago', off: -360, lon: -96.8 },
  { name: 'Houston, Mỹ', tz: 'America/Chicago', off: -360, lon: -95.37 },
  { name: 'Austin, Mỹ', tz: 'America/Chicago', off: -360, lon: -97.74 },
  { name: 'Oklahoma City, Mỹ', tz: 'America/Chicago', off: -360, lon: -97.52 },
  { name: 'New Orleans, Mỹ', tz: 'America/Chicago', off: -360, lon: -90.07 },
  { name: 'Chicago, Mỹ', tz: 'America/Chicago', off: -360, lon: -87.63 },
  { name: 'Minneapolis, Mỹ', tz: 'America/Chicago', off: -360, lon: -93.27 },
  { name: 'Atlanta, Mỹ', tz: 'America/New_York', off: -300, lon: -84.39 },
  { name: 'Miami, Mỹ', tz: 'America/New_York', off: -300, lon: -80.19 },
  { name: 'Orlando, Mỹ', tz: 'America/New_York', off: -300, lon: -81.38 },
  { name: 'Washington DC, Mỹ', tz: 'America/New_York', off: -300, lon: -77.04 },
  { name: 'Philadelphia, Mỹ', tz: 'America/New_York', off: -300, lon: -75.17 },
  { name: 'New York, Mỹ', tz: 'America/New_York', off: -300, lon: -74.01 },
  { name: 'Boston, Mỹ', tz: 'America/New_York', off: -300, lon: -71.06 },
  { name: 'Honolulu, Mỹ', tz: 'Pacific/Honolulu', off: -600, lon: -157.86 },
  // Canada
  { name: 'Vancouver, Canada', tz: 'America/Vancouver', off: -480, lon: -123.12 },
  { name: 'Calgary, Canada', tz: 'America/Edmonton', off: -420, lon: -114.07 },
  { name: 'Toronto, Canada', tz: 'America/Toronto', off: -300, lon: -79.38 },
  { name: 'Ottawa, Canada', tz: 'America/Toronto', off: -300, lon: -75.7 },
  { name: 'Montreal, Canada', tz: 'America/Toronto', off: -300, lon: -73.57 },
  // Châu Âu
  { name: 'London, Anh', tz: 'Europe/London', off: 0, lon: -0.13 },
  { name: 'Paris, Pháp', tz: 'Europe/Paris', off: 60, lon: 2.35 },
  { name: 'Berlin, Đức', tz: 'Europe/Berlin', off: 60, lon: 13.4 },
  { name: 'Frankfurt, Đức', tz: 'Europe/Berlin', off: 60, lon: 8.68 },
  { name: 'Munich, Đức', tz: 'Europe/Berlin', off: 60, lon: 11.58 },
  { name: 'Hamburg, Đức', tz: 'Europe/Berlin', off: 60, lon: 9.99 },
  { name: 'Praha (Prague), Séc', tz: 'Europe/Prague', off: 60, lon: 14.44 },
  { name: 'Warszawa (Warsaw), Ba Lan', tz: 'Europe/Warsaw', off: 60, lon: 21.01 },
  { name: 'Amsterdam, Hà Lan', tz: 'Europe/Amsterdam', off: 60, lon: 4.9 },
  { name: 'Brussels, Bỉ', tz: 'Europe/Brussels', off: 60, lon: 4.35 },
  { name: 'Vienna, Áo', tz: 'Europe/Vienna', off: 60, lon: 16.37 },
  { name: 'Roma (Rome), Ý', tz: 'Europe/Rome', off: 60, lon: 12.5 },
  { name: 'Madrid, Tây Ban Nha', tz: 'Europe/Madrid', off: 60, lon: -3.7 },
  { name: 'Moscow, Nga', tz: 'Europe/Moscow', off: 180, lon: 37.62 },
  { name: 'Kyiv, Ukraina', tz: 'Europe/Kyiv', off: 120, lon: 30.52 },
  // Châu Á – Thái Bình Dương
  { name: 'Tokyo, Nhật Bản', tz: 'Asia/Tokyo', off: 540, lon: 139.69 },
  { name: 'Osaka, Nhật Bản', tz: 'Asia/Tokyo', off: 540, lon: 135.5 },
  { name: 'Seoul, Hàn Quốc', tz: 'Asia/Seoul', off: 540, lon: 126.98 },
  { name: 'Đài Bắc (Taipei), Đài Loan', tz: 'Asia/Taipei', off: 480, lon: 121.56 },
  { name: 'Cao Hùng (Kaohsiung), Đài Loan', tz: 'Asia/Taipei', off: 480, lon: 120.31 },
  { name: 'Bắc Kinh, Trung Quốc', tz: 'Asia/Shanghai', off: 480, lon: 116.41 },
  { name: 'Thượng Hải, Trung Quốc', tz: 'Asia/Shanghai', off: 480, lon: 121.47 },
  { name: 'Quảng Châu, Trung Quốc', tz: 'Asia/Shanghai', off: 480, lon: 113.26 },
  { name: 'Hồng Kông', tz: 'Asia/Hong_Kong', off: 480, lon: 114.17 },
  { name: 'Ma Cao', tz: 'Asia/Macau', off: 480, lon: 113.54 },
  { name: 'Singapore', tz: 'Asia/Singapore', off: 480, lon: 103.82 },
  { name: 'Kuala Lumpur, Malaysia', tz: 'Asia/Kuala_Lumpur', off: 480, lon: 101.69 },
  { name: 'Bangkok, Thái Lan', tz: 'Asia/Bangkok', off: 420, lon: 100.5 },
  { name: 'Viêng Chăn, Lào', tz: 'Asia/Vientiane', off: 420, lon: 102.63 },
  { name: 'Phnom Penh, Campuchia', tz: 'Asia/Phnom_Penh', off: 420, lon: 104.92 },
  { name: 'Manila, Philippines', tz: 'Asia/Manila', off: 480, lon: 120.98 },
  { name: 'Jakarta, Indonesia', tz: 'Asia/Jakarta', off: 420, lon: 106.85 },
  { name: 'Sydney, Úc', tz: 'Australia/Sydney', off: 600, lon: 151.21 },
  { name: 'Melbourne, Úc', tz: 'Australia/Melbourne', off: 600, lon: 144.96 },
  { name: 'Brisbane, Úc', tz: 'Australia/Brisbane', off: 600, lon: 153.03 },
  { name: 'Adelaide, Úc', tz: 'Australia/Adelaide', off: 570, lon: 138.6 },
  { name: 'Perth, Úc', tz: 'Australia/Perth', off: 480, lon: 115.86 },
  { name: 'Auckland, New Zealand', tz: 'Pacific/Auckland', off: 720, lon: 174.76 },
  { name: 'San Antonio, Mỹ', tz: 'America/Chicago', off: -360, lon: -98.49 },
  { name: 'Kansas City, Mỹ', tz: 'America/Chicago', off: -360, lon: -94.58 },
  { name: 'St. Louis, Mỹ', tz: 'America/Chicago', off: -360, lon: -90.2 },
  { name: 'Charlotte, Mỹ', tz: 'America/New_York', off: -300, lon: -80.84 },
  { name: 'Tampa, Mỹ', tz: 'America/New_York', off: -300, lon: -82.46 },
  { name: 'Detroit, Mỹ', tz: 'America/Detroit', off: -300, lon: -83.05 },
  { name: 'Salt Lake City, Mỹ', tz: 'America/Denver', off: -420, lon: -111.89 },
  { name: 'Albuquerque, Mỹ', tz: 'America/Denver', off: -420, lon: -106.65 },
  { name: 'Anchorage, Mỹ', tz: 'America/Anchorage', off: -540, lon: -149.9 },
  { name: 'Edmonton, Canada', tz: 'America/Edmonton', off: -420, lon: -113.49 },
  { name: 'Winnipeg, Canada', tz: 'America/Winnipeg', off: -360, lon: -97.14 },
  { name: 'Halifax, Canada', tz: 'America/Halifax', off: -240, lon: -63.57 },
  { name: 'Manchester, Anh', tz: 'Europe/London', off: 0, lon: -2.24 },
  { name: 'Birmingham, Anh', tz: 'Europe/London', off: 0, lon: -1.9 },
  { name: 'Dublin, Ireland', tz: 'Europe/Dublin', off: 0, lon: -6.26 },
  { name: 'Lisbon, Bồ Đào Nha', tz: 'Europe/Lisbon', off: 0, lon: -9.14 },
  { name: 'Lyon, Pháp', tz: 'Europe/Paris', off: 60, lon: 4.84 },
  { name: 'Marseille, Pháp', tz: 'Europe/Paris', off: 60, lon: 5.37 },
  { name: 'Stuttgart, Đức', tz: 'Europe/Berlin', off: 60, lon: 9.18 },
  { name: 'Cologne (Köln), Đức', tz: 'Europe/Berlin', off: 60, lon: 6.96 },
  { name: 'Zurich, Thụy Sĩ', tz: 'Europe/Zurich', off: 60, lon: 8.54 },
  { name: 'Geneva, Thụy Sĩ', tz: 'Europe/Zurich', off: 60, lon: 6.14 },
  { name: 'Copenhagen, Đan Mạch', tz: 'Europe/Copenhagen', off: 60, lon: 12.57 },
  { name: 'Stockholm, Thụy Điển', tz: 'Europe/Stockholm', off: 60, lon: 18.07 },
  { name: 'Oslo, Na Uy', tz: 'Europe/Oslo', off: 60, lon: 10.75 },
  { name: 'Helsinki, Phần Lan', tz: 'Europe/Helsinki', off: 120, lon: 24.94 },
  { name: 'Budapest, Hungary', tz: 'Europe/Budapest', off: 60, lon: 19.04 },
  { name: 'Bucharest, Romania', tz: 'Europe/Bucharest', off: 120, lon: 26.1 },
  { name: 'Athens, Hy Lạp', tz: 'Europe/Athens', off: 120, lon: 23.73 },
  { name: 'Istanbul, Thổ Nhĩ Kỳ', tz: 'Europe/Istanbul', off: 180, lon: 28.98 },
  { name: 'Nagoya, Nhật Bản', tz: 'Asia/Tokyo', off: 540, lon: 136.91 },
  { name: 'Fukuoka, Nhật Bản', tz: 'Asia/Tokyo', off: 540, lon: 130.4 },
  { name: 'Busan, Hàn Quốc', tz: 'Asia/Seoul', off: 540, lon: 129.08 },
  { name: 'Thâm Quyến, Trung Quốc', tz: 'Asia/Shanghai', off: 480, lon: 114.06 },
  { name: 'Thành Đô, Trung Quốc', tz: 'Asia/Shanghai', off: 480, lon: 104.07 },
  { name: 'Chiang Mai, Thái Lan', tz: 'Asia/Bangkok', off: 420, lon: 98.99 },
  { name: 'Yangon, Myanmar', tz: 'Asia/Yangon', off: 390, lon: 96.16 },
  { name: 'New Delhi, Ấn Độ', tz: 'Asia/Kolkata', off: 330, lon: 77.21 },
  { name: 'Mumbai, Ấn Độ', tz: 'Asia/Kolkata', off: 330, lon: 72.88 },
  { name: 'Dubai, UAE', tz: 'Asia/Dubai', off: 240, lon: 55.27 },
  { name: 'Doha, Qatar', tz: 'Asia/Qatar', off: 180, lon: 51.53 },
  { name: 'Riyadh, Ả Rập Xê Út', tz: 'Asia/Riyadh', off: 180, lon: 46.68 },
  { name: 'Cairo, Ai Cập', tz: 'Africa/Cairo', off: 120, lon: 31.24 },
  { name: 'Johannesburg, Nam Phi', tz: 'Africa/Johannesburg', off: 120, lon: 28.05 },
  { name: 'Mexico City, Mexico', tz: 'America/Mexico_City', off: -360, lon: -99.13 },
  { name: 'São Paulo, Brazil', tz: 'America/Sao_Paulo', off: -180, lon: -46.63 },
  { name: 'Buenos Aires, Argentina', tz: 'America/Argentina/Buenos_Aires', off: -180, lon: -58.38 },
];

/** Diacritic-insensitive search key. */
const searchKey = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();

/**
 * Equation of time in minutes for a given date (NOAA approximation):
 * how far true solar time runs ahead of mean solar time (±16 min).
 */
function equationOfTime(y: number, m: number, d: number): number {
  const start = Date.UTC(y, 0, 1);
  const N = Math.floor((Date.UTC(y, m - 1, d) - start) / 86400000) + 1;
  const B = (2 * Math.PI * (N - 81)) / 364;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/**
 * Resolve the birth datetime (mid-hour, local clock at the birth place)
 * as true solar time: DST (found via Intl) is stripped to standard
 * time, then corrected by the birthplace longitude (4 min/degree from
 * the zone meridian) plus the equation of time — so giờ Ngọ is actual
 * solar noon at the birthplace.
 */
function toChartTime(
  d: number,
  m: number,
  y: number,
  hour: number,
  zone: { tz: string; off: number },
  lon: number,
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
  const dstExtra = offsetUsed - zone.off;
  const standardWall = localWall - dstExtra * 60000;
  const meridian = zone.off / 4; // zone meridian in degrees (15° per hour)
  const st = new Date(standardWall);
  const eot = equationOfTime(st.getUTCFullYear(), st.getUTCMonth() + 1, st.getUTCDate());
  const solarCorr = Math.round(4 * (lon - meridian) + eot);
  const t = new Date(standardWall + solarCorr * 60000);
  const minutes = t.getUTCHours() * 60 + t.getUTCMinutes();
  return {
    day: t.getUTCDate(),
    month: t.getUTCMonth() + 1,
    year: t.getUTCFullYear(),
    hourChi: Math.floor(((minutes + 60) % 1440) / 120),
    offsetUsed,
    dstExtra,
    solarCorr,
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
  /** Index into CITIES (ignored when manual) */
  city: number;
  /** Manual birthplace entry: pick a timezone + longitude yourself */
  manual: boolean;
  tzIndex: number;
  lon: string;
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
  let zone: { tz: string; off: number };
  let lonUsed: number;
  let place: string;
  if (f.manual) {
    zone = TIMEZONES[f.tzIndex];
    const lon = parseFloat(f.lon);
    lonUsed = Number.isFinite(lon) && lon >= -180 && lon <= 180 ? lon : TIMEZONES[f.tzIndex].lon;
    place = `kinh độ ${lonUsed}°`;
  } else {
    const c = CITIES[f.city];
    zone = c;
    lonUsed = c.lon;
    place = c.name;
  }
  // f.hour is a giờ chi index; resolve via the band's midpoint clock hour.
  const t = toChartTime(d, m, y, (f.hour * 2) % 24, zone, lonUsed);
  const sign = t.solarCorr >= 0 ? '+' : '−';
  const warn =
    Math.abs(t.solarCorr) > 90 ? ' ⚠ Hiệu chỉnh lớn bất thường — kiểm tra múi giờ và kinh độ.' : '';
  const converted = `Giờ mặt trời tại ${place}${t.dstExtra !== 0 ? ' (đã trừ DST)' : ''}: hiệu chỉnh ${sign}${Math.abs(t.solarCorr)} phút → ${t.day}/${t.month}/${t.year} · Giờ ${CHI[t.hourChi]}${warn}`;
  return {
    chart: laSoTuVi(t.day, t.month, t.year, t.hourChi, f.gender, nx),
    converted,
    name: f.name,
  } as const;
}

export default function TuViView({ initial }: { initial: { day: number; month: number; year: number } }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const s = useMemo(() => styles(theme, isWide), [theme, isWide]);

  const [form, setForm] = useState<FormState>(() => ({
    name: '',
    day: String(initial.day),
    month: String(initial.month),
    year: String(initial.year),
    hour: 0,
    city: 0,
    manual: false,
    tzIndex: 0,
    lon: '',
    gender: 'nam',
    namXem: String(new Date().getFullYear()),
    ...(memory.form ?? {}),
  }));
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

        <Text style={s.fieldLabel}>Nơi sinh (thành phố)</Text>
        <CityPicker
          value={form.manual ? -1 : form.city}
          onSelect={(i) => {
            set('city', i);
            set('manual', false);
          }}
          onManual={() => set('manual', true)}
          s={s}
          theme={theme}
        />

        {form.manual && (
          <>
            <Text style={s.fieldLabel}>Múi giờ nơi sinh</Text>
            <Dropdown
              title="Múi giờ nơi sinh"
              accessibilityLabel="Chọn múi giờ nơi sinh"
              options={TIMEZONES.map((t) => t.label)}
              value={tzIndex}
              onChange={(i) => set('tzIndex', i)}
              s={s}
              theme={theme}
            />
            <Text style={s.fieldLabel}>Kinh độ nơi sinh (°)</Text>
            <TextInput
              style={[s.input, { marginBottom: 4 }]}
              value={form.lon}
              onChangeText={(t) => set('lon', t.replace(/[^0-9.\-]/g, ''))}
              keyboardType="numbers-and-punctuation"
              placeholder={String(TIMEZONES[tzIndex].lon)}
              placeholderTextColor={theme.color.text.disabled}
              accessibilityLabel="Kinh độ nơi sinh"
            />
            <Text style={s.lonHint}>
              Kinh độ đông là số dương, tây là số âm. VD: Cần Giờ 106.96 · Fresno −119.79. Bỏ
              trống để dùng kinh độ tiêu biểu của múi giờ.
            </Text>
          </>
        )}

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

function CityPicker({
  value,
  onSelect,
  onManual,
  s,
  theme,
}: {
  /** CITIES index, or -1 when manual entry is active */
  value: number;
  onSelect: (i: number) => void;
  onManual: () => void;
  s: any;
  theme: Theme;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = searchKey(query.trim());
    if (!q) return CITIES.map((c, i) => [c, i] as const);
    return CITIES.map((c, i) => [c, i] as const).filter(([c]) => searchKey(c.name).includes(q));
  }, [query]);
  return (
    <>
      <Pressable
        style={s.dropdown}
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
        accessibilityLabel="Chọn nơi sinh"
        accessibilityRole="combobox"
      >
        <Text style={s.dropdownText} numberOfLines={1}>
          {value >= 0 ? CITIES[value].name : 'Nhập thủ công (múi giờ + kinh độ)'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.color.text.tertiary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>Nơi sinh</Text>
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm thành phố… (vd: da nang, san jose)"
              placeholderTextColor={theme.color.text.disabled}
              autoFocus
              accessibilityLabel="Tìm thành phố"
            />
            <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
              <Pressable
                style={[s.modalOption, value < 0 && s.modalOptionOn]}
                onPress={() => {
                  onManual();
                  setOpen(false);
                }}
              >
                <Text style={[s.modalOptionText, value < 0 && s.modalOptionTextOn]}>
                  ✎ Không tìm thấy? Nhập thủ công…
                </Text>
              </Pressable>
              {matches.map(([c, i]) => (
                <Pressable
                  key={c.name}
                  style={[s.modalOption, i === value && s.modalOptionOn]}
                  onPress={() => {
                    onSelect(i);
                    setOpen(false);
                  }}
                >
                  <Text style={[s.modalOptionText, i === value && s.modalOptionTextOn]}>
                    {c.name}
                  </Text>
                  {i === value && (
                    <Ionicons name="checkmark" size={16} color={theme.color.text.accent} />
                  )}
                </Pressable>
              ))}
              {matches.length === 0 && (
                <Text style={s.noMatch}>Không có kết quả — dùng "Nhập thủ công" ở trên.</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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

function MinorColumn({
  items,
  cap,
  right,
  showDac,
  s,
  theme,
}: {
  items: ColItem[];
  cap: number;
  right?: boolean;
  /** Append the độ sáng letter — off on phones, where it would only truncate */
  showDac?: boolean;
  s: any;
  theme: Theme;
}) {
  const overflow = items.length - cap;
  const shown = overflow > 0 ? items.slice(0, cap - 1) : items;
  return (
    <View style={s.minorCol}>
      {shown.map((it) => (
        <Text
          key={it.name}
          style={[s.starMinor, right && s.starMinorHung, { color: starColor(it, theme) }]}
          numberOfLines={1}
        >
          {it.name}
          {showDac && it.dac ? ` (${it.dac})` : ''}
        </Text>
      ))}
      {overflow > 0 && (
        <Text style={[s.starMinor, s.minorMore, right && s.starMinorHung]}>
          +{overflow + 1} sao…
        </Text>
      )}
    </View>
  );
}

function Board({ chart, name, s, theme }: { chart: TuViChart; name: string; s: any; theme: Theme }) {
  const [detail, setDetail] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
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
                    {st.dac ? ` (${st.dac})` : ''}
                  </Text>
                ))}
              {(() => {
                const cols = columns(p.stars, p.chiIndex);
                const majors = p.stars.filter((st) => st.kind === 'chinh').length;
                // Phone cells are fixed-height; cap rows so lines never overlap.
                const cap = isWide ? 99 : majors >= 2 ? 4 : majors === 1 ? 5 : 6;
                return (
                  <View style={s.minorRow}>
                    <MinorColumn items={cols.cat} cap={cap} showDac={isWide} s={s} theme={theme} />
                    <MinorColumn items={cols.hung} cap={cap} right showDac={isWide} s={s} theme={theme} />
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
  const cols = columns(palace.stars, palace.chiIndex);
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
                {st.dac ? ` (${BRIGHTNESS_NAME[st.dac]})` : ''}
              </Text>
            ))}
            <View style={s.sheetCols}>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetColTitle}>Cát tinh</Text>
                {cols.cat.map((it) => (
                  <Text key={it.name} style={[s.sheetStar, { color: starColor(it, theme) }]}>
                    {it.name}
                    {it.dac ? ` (${BRIGHTNESS_NAME[it.dac as Brightness]})` : ''}
                  </Text>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetColTitle}>Hung tinh</Text>
                {cols.hung.map((it) => (
                  <Text key={it.name} style={[s.sheetStar, { color: starColor(it, theme) }]}>
                    {it.name}
                    {it.dac ? ` (${BRIGHTNESS_NAME[it.dac as Brightness]})` : ''}
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
    lonHint: {
      ...t.type.caption,
      color: t.color.text.tertiary,
      marginBottom: t.space.md,
    } as object,
    searchInput: {
      borderWidth: 1.5,
      borderColor: t.color.border.strong,
      borderRadius: t.radius.input,
      paddingHorizontal: t.space.md,
      paddingVertical: t.space.sm,
      fontSize: 15,
      ...t.face.regular,
      color: t.color.text.primary,
      backgroundColor: t.color.bg.elevated,
      marginHorizontal: t.space.sm,
      marginBottom: t.space.sm,
    },
    noMatch: {
      ...t.type.caption,
      color: t.color.text.tertiary,
      textAlign: 'center',
      padding: t.space.lg,
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
      // Phones get taller cells so star text stays at a size Safari
      // won't inflate; desktop keeps the classic square.
      aspectRatio: isWide ? 1 : 3 / 4,
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
      fontSize: isWide ? 11 : 9,
      ...t.face.medium,
      color: t.color.text.tertiary,
      flexShrink: 1,
    } as object,
    palaceDaiVan: { fontSize: isWide ? 11 : 9, ...t.face.bold, color: t.color.text.lunar } as object,
    palaceCung: {
      fontSize: isWide ? 13 : 10,
      ...t.face.bold,
      color: t.color.text.accent,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginBottom: 1,
      flexShrink: 1,
      minWidth: 0,
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
      fontSize: isWide ? 9 : 8,
      ...t.face.bold,
      color: t.color.state.bad,
      borderWidth: 1,
      borderColor: t.color.state.bad,
      borderRadius: 3,
      paddingHorizontal: 3,
      overflow: 'hidden',
      flexShrink: 0,
    } as object,
    starMajor: {
      fontSize: isWide ? 12 : 8.5,
      lineHeight: isWide ? 16 : 12,
      ...t.face.bold,
      textAlign: 'center',
      textTransform: 'uppercase',
      flexShrink: 0,
    } as object,
    starHoa: { color: t.color.text.lunar, ...t.face.semibold } as object,
    minorRow: { flexDirection: 'row', flex: 1, gap: 2, marginTop: 1, overflow: 'hidden' },
    minorCol: { flex: 1, minWidth: 0 },
    starMinor: {
      fontSize: isWide ? 9.5 : 8,
      lineHeight: isWide ? 13 : 11,
      flexShrink: 0,
      ...t.face.medium,
    } as object,
    starMinorHung: { textAlign: 'right' },
    minorMore: { color: t.color.text.tertiary, ...t.face.semibold } as object,
    palaceTrangSinh: {
      fontSize: isWide ? 10 : 8.5,
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
      fontSize: isWide ? 16 : 12,
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
      fontSize: isWide ? 12 : 9,
      ...t.face.semibold,
      color: t.color.text.tertiary,
    } as object,
    centerValue: {
      fontSize: isWide ? 12.5 : 9.5,
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
