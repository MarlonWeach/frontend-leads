import { buildDailyDateRange, buildHistoricalDateRange } from '@/utils/forecastDateRanges';

describe('forecast date range helpers', () => {
  it('builds inclusive daily date ranges', () => {
    const dates = buildDailyDateRange(
      new Date('2026-04-07T00:00:00'),
      new Date('2026-04-09T00:00:00')
    );

    expect(dates).toEqual(['2026-04-07', '2026-04-08', '2026-04-09']);
  });

  it('anchors historical dates to the day before the requested end date', () => {
    expect(buildHistoricalDateRange('2026-04-10', 3)).toEqual([
      '2026-04-07',
      '2026-04-08',
      '2026-04-09'
    ]);
  });

  it('returns an empty range for invalid day counts', () => {
    expect(buildHistoricalDateRange('2026-04-10', 0)).toEqual([]);
  });
});
