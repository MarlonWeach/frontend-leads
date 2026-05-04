describe('Performance forecast API', () => {
  const historicalRows = Array.from({ length: 30 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return {
      metric_date: `2026-03-${day}`,
      adset_id: 'adset-1',
      leads: index + 1,
      spend: (index + 1) * 10,
      impressions: 1000 + index,
      clicks: 100 + index
    };
  });

  const createQuery = (table: string) => {
    const query: any = {
      select: jest.fn(() => query),
      gte: jest.fn(() => query),
      lte: jest.fn(() => query),
      order: jest.fn(() => query),
      eq: jest.fn(() => query),
      in: jest.fn(() => query),
      limit: jest.fn(() => query),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      then: (resolve: any) => {
        if (table === 'v_ml_adset_daily_series') {
          return Promise.resolve({ data: historicalRows, error: null }).then(resolve);
        }
        if (table === 'adset_goals' || table === 'alerts') {
          return Promise.resolve({ data: [], error: null }).then(resolve);
        }
        return Promise.resolve({ data: null, error: null }).then(resolve);
      }
    };

    return query;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    jest.doMock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => ({
        from: jest.fn((table: string) => createQuery(table))
      }))
    }));
  });

  afterEach(() => {
    jest.dontMock('@supabase/supabase-js');
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('labels historical points with the requested baseline window instead of the server date', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-04T12:00:00Z'));

    const { POST } = await import('../../app/api/performance/forecast/route');
    const response = await POST({
      json: async () => ({
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        metrics: ['leads'],
        daysToForecast: 2
      })
    } as any);
    const payload = await response.json();

    expect(payload.success).toBe(true);
    expect(payload.data.historical.leads).toHaveLength(30);
    expect(payload.data.historical.leads[0]).toMatchObject({
      date: '2026-03-01',
      predicted: 1,
      actual: 1
    });
    expect(payload.data.historical.leads[29]).toMatchObject({
      date: '2026-03-30',
      predicted: 30,
      actual: 30
    });
    expect(payload.data.forecast.leads[0].date).toBe('2026-04-01');

    jest.useRealTimers();
  });
});
