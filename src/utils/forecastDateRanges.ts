import { format, subDays } from 'date-fns';

const DATE_ONLY_TIME_SUFFIX = 'T00:00:00';
const DATE_ONLY_FORMAT = 'yyyy-MM-dd';

function parseDateOnly(date: string): Date {
  return new Date(`${date}${DATE_ONLY_TIME_SUFFIX}`);
}

export function buildDailyDateRange(startDate: Date, endDate: Date): string[] {
  const currentDate = new Date(startDate);
  const dates: string[] = [];

  while (currentDate <= endDate) {
    dates.push(format(currentDate, DATE_ONLY_FORMAT));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function buildHistoricalDateRange(endDate: string, days: number): string[] {
  if (!Number.isInteger(days) || days <= 0) {
    return [];
  }

  const requestedEndDate = parseDateOnly(endDate);
  if (Number.isNaN(requestedEndDate.getTime())) {
    return [];
  }

  const lastHistoricalDate = subDays(requestedEndDate, 1);
  const firstHistoricalDate = subDays(lastHistoricalDate, days - 1);

  return buildDailyDateRange(firstHistoricalDate, lastHistoricalDate);
}
