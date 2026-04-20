import {
  aggregateAdsetInsightsWindow7d,
  ANALYTICS_WINDOW_DAYS
} from '../../../../src/lib/optimization/adsetInsightsWindow7d';

describe('PBI 32 / Task 32-6: aggregateAdsetInsightsWindow7d', () => {
  const asOf = '2026-04-17';

  it('usa janela de 7 dias inclusive terminando em asOfDate', () => {
    const rows = [
      { date: '2026-04-11', spend: 10, leads: 2, impressions: 100, clicks: 5 },
      { date: '2026-04-17', spend: 5, leads: 1, impressions: 50, clicks: 2 }
    ];
    const m = aggregateAdsetInsightsWindow7d(rows, asOf);
    expect(m.start_date).toBe('2026-04-11');
    expect(m.end_date).toBe('2026-04-17');
    expect(ANALYTICS_WINDOW_DAYS).toBe(7);
  });

  it('soma spend e leads e calcula CPL e CTR', () => {
    const rows = [
      { date: '2026-04-16', spend: 100, leads: 4, impressions: 200, clicks: 10 },
      { date: '2026-04-17', spend: 50, leads: 1, impressions: 100, clicks: 5 }
    ];
    const m = aggregateAdsetInsightsWindow7d(rows, asOf);
    expect(m.spend).toBe(150);
    expect(m.leads).toBe(5);
    expect(m.cpl).toBeCloseTo(30);
    expect(m.ctr).toBeCloseTo(15 / 300);
  });

  it('conta days_with_valid_data apenas em dias com linha e sinal', () => {
    const rows = [{ date: '2026-04-17', spend: 0, leads: 0, impressions: 0, clicks: 0 }];
    const m = aggregateAdsetInsightsWindow7d(rows, asOf);
    expect(m.days_with_valid_data).toBe(0);
  });

  it('retorna CPL e CTR nulos quando não aplicável', () => {
    const rows = [{ date: '2026-04-17', spend: 10, leads: 0, impressions: 0, clicks: 0 }];
    const m = aggregateAdsetInsightsWindow7d(rows, asOf);
    expect(m.cpl).toBeNull();
    expect(m.ctr).toBeNull();
  });
});
