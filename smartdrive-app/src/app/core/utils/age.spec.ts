import { calculateAgeOnDate } from './age';

describe('calculateAgeOnDate', () => {
  it('counts a birthday on the pickup date', () => {
    expect(calculateAgeOnDate('2008-06-15', '2026-06-15')).toBe(18);
  });

  it('does not count a birthday that falls after pickup', () => {
    expect(calculateAgeOnDate('2008-06-16', '2026-06-15')).toBe(17);
  });

  it('rejects invalid or future birth dates', () => {
    expect(calculateAgeOnDate('2008-02-30', '2026-06-15')).toBeNull();
    expect(calculateAgeOnDate('2027-01-01', '2026-06-15')).toBeNull();
  });
});
