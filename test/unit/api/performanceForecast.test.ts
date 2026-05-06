import { buildHistoricalForecastSeries } from '../../../app/api/performance/forecast/route';

describe('Performance forecast API helpers', () => {
  it('labels historical points from the requested forecast window instead of server today', () => {
    const series = buildHistoricalForecastSeries([10, 20, 30], '2026-04-15');

    expect(series.map(point => point.date)).toEqual([
      '2026-04-12',
      '2026-04-13',
      '2026-04-14'
    ]);
    expect(series.map(point => point.actual)).toEqual([10, 20, 30]);
  });

  it('returns an empty historical series when there is no baseline data', () => {
    expect(buildHistoricalForecastSeries([], '2026-04-15')).toEqual([]);
  });
});
