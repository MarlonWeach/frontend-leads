import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns';

/** Janela analítica padrão do MVP (PBI 32 / 32-1). */
export const ANALYTICS_WINDOW_DAYS = 7;

export type AdsetInsightDailyRow = {
  date: string;
  spend?: number | null;
  leads?: number | null;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
};

/** Métricas agregadas para `context_snapshot.window_7d` (32-3). */
export type Window7dMetrics = {
  start_date: string;
  end_date: string;
  spend: number;
  leads: number;
  cpl: number | null;
  ctr: number | null;
  days_with_valid_data: number;
};

function dayHasSignal(row: AdsetInsightDailyRow): boolean {
  const spend = Number(row.spend) || 0;
  const leadsCount = Number(row.leads) || 0;
  const impressions = Number(row.impressions) || 0;
  return spend > 0 || leadsCount > 0 || impressions > 0;
}

/**
 * Agrega linhas diárias de `adset_insights` nos últimos 7 dias terminando em `asOfDate` (inclusive).
 * Dias sem linha na entrada contam como ausência (não entram em `days_with_valid_data`).
 */
export function aggregateAdsetInsightsWindow7d(
  rows: AdsetInsightDailyRow[],
  asOfDate: string
): Window7dMetrics {
  const end = parseISO(asOfDate);
  const start = subDays(end, ANALYTICS_WINDOW_DAYS - 1);
  const daysInWindow = eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
  const rowByDate = new Map(rows.map((r) => [r.date, r]));

  let spend = 0;
  let leads = 0;
  let impressions = 0;
  let clicks = 0;
  let daysWithValidData = 0;

  for (const day of daysInWindow) {
    const row = rowByDate.get(day);
    if (!row) continue;
    if (dayHasSignal(row)) {
      daysWithValidData += 1;
    }
    spend += Number(row.spend) || 0;
    leads += Number(row.leads) || 0;
    impressions += Number(row.impressions) || 0;
    clicks += Number(row.clicks) || 0;
  }

  return {
    start_date: format(start, 'yyyy-MM-dd'),
    end_date: format(end, 'yyyy-MM-dd'),
    spend,
    leads,
    cpl: leads > 0 ? spend / leads : null,
    ctr: impressions > 0 ? clicks / impressions : null,
    days_with_valid_data: daysWithValidData,
  };
}
