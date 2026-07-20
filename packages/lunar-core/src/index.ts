export * from './astronomy';
export * from './lunar';
export * from './canchi';
export * from './hoangdao';
export * from './tietkhi';
export * from './holidays';
export * from './nguhanh';
export * from './tuvi';

import { jdFromDate, VIETNAM_TZ } from './astronomy';
import { solarToLunar, type LunarDate } from './lunar';
import { dayCanChi, monthCanChi, yearCanChi, type CanChi } from './canchi';
import { auspiciousHours, dayStar, type AuspiciousHour, type DayStar } from './hoangdao';
import { solarTerm } from './tietkhi';
import { lunarHolidays, solarHolidays, type Holiday } from './holidays';
import { napAm, type NapAm } from './nguhanh';

export interface DayInfo {
  solar: { day: number; month: number; year: number; weekday: number };
  lunar: LunarDate;
  canChi: { day: CanChi; month: CanChi; year: CanChi };
  /** Ngũ hành (nạp âm) of the day and year can-chi */
  element: { day: NapAm; year: NapAm };
  dayStar: DayStar;
  auspiciousHours: AuspiciousHour[];
  solarTerm: string;
  holidays: Holiday[];
  isRam: boolean;
  isMung1: boolean;
}

/** Everything a lịch vạn niên shows about one solar day, in one call. */
export function getDayInfo(day: number, month: number, year: number): DayInfo {
  const jd = jdFromDate(day, month, year);
  const lunar = solarToLunar(day, month, year, VIETNAM_TZ);
  const dCanChi = dayCanChi(jd);
  const yCanChi = yearCanChi(lunar.year);
  return {
    solar: { day, month, year, weekday: (jd + 1) % 7 },
    lunar,
    canChi: {
      day: dCanChi,
      month: monthCanChi(lunar.month, lunar.year),
      year: yCanChi,
    },
    element: {
      day: napAm(dCanChi.canIndex, dCanChi.chiIndex),
      year: napAm(yCanChi.canIndex, yCanChi.chiIndex),
    },
    dayStar: dayStar(lunar.month, dCanChi.chiIndex),
    auspiciousHours: auspiciousHours(dCanChi.chiIndex),
    solarTerm: solarTerm(jd),
    holidays: [
      ...solarHolidays(day, month),
      ...lunarHolidays(lunar.day, lunar.month, lunar.leap),
    ],
    isRam: lunar.day === 15,
    isMung1: lunar.day === 1,
  };
}
