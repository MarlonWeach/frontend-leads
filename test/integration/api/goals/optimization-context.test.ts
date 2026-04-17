// Polyfills mínimos para importar next/server em ambiente Jest.
(global as any).Request = (global as any).Request || class {};
(global as any).Response = (global as any).Response || class {};
(global as any).Headers = (global as any).Headers || class {};

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, options?: { status?: number }) => ({
      status: options?.status ?? 200,
      json: async () => data,
    }),
  },
}));

const { GET } = require('../../../../app/api/goals/optimization-context/route');

const mockFrom = jest.fn();

jest.mock('@/lib/supabaseServer', () => ({
  supabaseServer: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function buildRequest(url: string) {
  return { url } as any;
}

describe('GET /api/goals/optimization-context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prioritizes manual delivered reference when volume_captured exists', async () => {
    const goalsResult = {
      data: [
        {
          adset_id: 'adset_1',
          adset_name: 'Adset 1',
          contract_start_date: '2026-04-05',
          volume_contracted: 100,
          volume_captured: 60,
          cpl_target: 25,
          budget_total: 1000,
        },
      ],
      error: null,
    };

    const insightsResult = {
      data: [
        { adset_id: 'adset_1', date: '2026-04-10', leads: 10, spend: 100 },
        { adset_id: 'adset_1', date: '2026-04-11', leads: 5, spend: 50 },
      ],
      error: null,
    };

    const goalsChain = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockResolvedValue(goalsResult),
    };

    const insightsChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockResolvedValue(insightsResult),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'adset_goals') return goalsChain;
      if (table === 'adset_insights') return insightsChain;
      throw new Error(`Unexpected table ${table}`);
    });

    const response = await GET(buildRequest('http://localhost:3000/api/goals/optimization-context?meta_account_id=256925527'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBe(1);
    expect(payload.data[0].delivered_reference).toBe(60);
    expect(payload.data[0].delivered_source).toBe('manual_client');
    expect(payload.data[0].volume_remaining).toBe(40);
    expect(payload.data[0].spend_to_date).toBe(150);
    expect(payload.data[0].meta_account_id).toBe('256925527');
  });

  it('falls back to historical leads when manual delivery is unavailable', async () => {
    const goalsResult = {
      data: [
        {
          adset_id: 'adset_2',
          adset_name: 'Adset 2',
          contract_start_date: '2026-04-01',
          volume_contracted: 80,
          volume_captured: null,
          cpl_target: 20,
          budget_total: 800,
        },
      ],
      error: null,
    };

    const insightsResult = {
      data: [
        { adset_id: 'adset_2', date: '2026-04-03', leads: 12, spend: 120 },
        { adset_id: 'adset_2', date: '2026-04-04', leads: 8, spend: 80 },
      ],
      error: null,
    };

    const goalsChain = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockResolvedValue(goalsResult),
    };

    const insightsChain = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockResolvedValue(insightsResult),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'adset_goals') return goalsChain;
      if (table === 'adset_insights') return insightsChain;
      throw new Error(`Unexpected table ${table}`);
    });

    const response = await GET(buildRequest('http://localhost:3000/api/goals/optimization-context?competence_month=2026-04'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data[0].delivered_source).toBe('historical_fallback');
    expect(payload.data[0].has_manual_delivery).toBe(false);
    expect(payload.data[0].delivered_reference).toBeGreaterThanOrEqual(0);
  });
});
