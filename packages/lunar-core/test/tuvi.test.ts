import { describe, expect, it } from 'vitest';
import { laSoTuVi, tuViPosition, CHI } from '../src';

describe('tuViPosition (an sao Tử Vi theo cục)', () => {
  it('matches the classical table for Thủy nhị cục', () => {
    // ngày 1 → Sửu, 2 → Dần, 3 → Dần, 4 → Mão
    expect(tuViPosition(2, 1)).toBe(1);
    expect(tuViPosition(2, 2)).toBe(2);
    expect(tuViPosition(2, 3)).toBe(2);
    expect(tuViPosition(2, 4)).toBe(3);
  });

  it('matches the classical table for Hỏa lục cục', () => {
    // ngày 1 → Dậu, 6 → Dần, 7 → Tuất
    expect(tuViPosition(6, 1)).toBe(9);
    expect(tuViPosition(6, 6)).toBe(2);
    expect(tuViPosition(6, 7)).toBe(10);
  });
});

describe('laSoTuVi', () => {
  // 1984-02-02 = 1/1 Giáp Tý; giờ Tý; nam
  const chart = laSoTuVi(2, 2, 1984, 0, 'nam');

  it('an Mệnh/Thân: tháng 1 giờ Tý → both at Dần', () => {
    expect(chart.lunar).toMatchObject({ day: 1, month: 1, year: 1984 });
    expect(chart.menhIndex).toBe(2);
    expect(chart.thanIndex).toBe(2);
    expect(chart.palaces[2].cung).toBe('Mệnh');
    expect(chart.palaces[2].than).toBe(true);
  });

  it('cục: năm Giáp, Mệnh tại Dần → Bính Dần → Hỏa lục cục', () => {
    expect(chart.palaces[2].canChi).toBe('Bính Dần');
    expect(chart.cuc).toMatchObject({ name: 'Hỏa lục cục', so: 6, element: 'Hỏa' });
  });

  it('năm Giáp Tý: bản mệnh Hải Trung Kim, Dương Nam', () => {
    expect(chart.yearCanChi).toBe('Giáp Tý');
    expect(chart.banMenh).toBe('Hải Trung Kim');
    expect(chart.amDuong).toBe('Dương Nam');
  });

  it('places all 14 chính tinh exactly once', () => {
    const majors = chart.palaces.flatMap((p) => p.stars.filter((s) => s.kind === 'chinh'));
    expect(majors).toHaveLength(14);
    expect(new Set(majors.map((s) => s.name)).size).toBe(14);
  });

  it('Thiên Phủ mirrors Tử Vi across the Dần–Thân axis', () => {
    const find = (name: string) =>
      chart.palaces.findIndex((p) => p.stars.some((s) => s.name === name));
    expect((find('Tử Vi') + find('Thiên Phủ')) % 12).toBe(4);
  });

  it('giờ Tý: Địa Không and Địa Kiếp cùng cung Hợi; Lộc Tồn năm Giáp tại Dần', () => {
    const hoi = chart.palaces[11].stars.map((s) => s.name);
    expect(hoi).toContain('Địa Không');
    expect(hoi).toContain('Địa Kiếp');
    expect(chart.palaces[2].stars.map((s) => s.name)).toContain('Lộc Tồn');
  });

  it('tứ hóa năm Giáp: Liêm Trinh hóa Lộc … Thái Dương hóa Kỵ', () => {
    const withHoa = new Map<string, string>();
    for (const p of chart.palaces)
      for (const s of p.stars) if (s.hoa) withHoa.set(s.name, s.hoa);
    expect(withHoa.get('Liêm Trinh')).toBe('Hóa Lộc');
    expect(withHoa.get('Phá Quân')).toBe('Hóa Quyền');
    expect(withHoa.get('Vũ Khúc')).toBe('Hóa Khoa');
    expect(withHoa.get('Thái Dương')).toBe('Hóa Kỵ');
  });

  it('đại vận: Dương Nam khởi thuận từ Mệnh với tuổi = cục số', () => {
    expect(chart.palaces[2].daiVan).toBe(6); // Mệnh
    expect(chart.palaces[3].daiVan).toBe(16); // thuận chiều
    expect(chart.palaces[1].daiVan).toBe(116);
  });

  it('12 cung names all present, đủ 12 sao vòng Tràng Sinh', () => {
    expect(new Set(chart.palaces.map((p) => p.cung)).size).toBe(12);
    expect(new Set(chart.palaces.map((p) => p.trangSinh)).size).toBe(12);
  });

  it('gender/năm âm flips direction (Âm Nữ thuận)', () => {
    // 1985 Ất Sửu (âm), nữ → thuận
    const c2 = laSoTuVi(21, 2, 1985, 3, 'nu'); // 2/2 Ất Sửu, giờ Mão
    expect(c2.amDuong).toBe('Âm Nữ');
    const menh = c2.menhIndex;
    expect(c2.palaces[(menh + 1) % 12].daiVan - c2.palaces[menh].daiVan).toBe(10);
  });

  it('hour chi is echoed and CHI labels align', () => {
    expect(chart.hourName).toBe('Giờ Tý');
    expect(CHI[chart.menhIndex]).toBe('Dần');
  });
});
