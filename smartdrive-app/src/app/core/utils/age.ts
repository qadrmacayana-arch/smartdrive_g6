function parseDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;

  return { year, month, day };
}

export function calculateAgeOnDate(birthDate: string, asOfDate: string): number | null {
  const birth = parseDate(birthDate);
  const asOf = parseDate(asOfDate);
  if (!birth || !asOf) return null;

  const birthdayHasPassed = asOf.month > birth.month
    || (asOf.month === birth.month && asOf.day >= birth.day);
  const age = asOf.year - birth.year - (birthdayHasPassed ? 0 : 1);
  return age < 0 ? null : age;
}
