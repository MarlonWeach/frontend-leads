/**
 * Sincroniza metricas diarias por ANUNCIO (ad_insights) via UMA conta de anuncios:
 * GET /act_xxx/insights?level=ad&time_increment=1
 *
 * Extrai "leads" de actions/results como em app/api/performance/comparisons (agregado).
 * Nao baixa PII (sync-meta-leads.js e para contatos na Graph).
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      NEXT_PUBLIC_META_ACCESS_TOKEN|META_ACCESS_TOKEN,
 *      NEXT_PUBLIC_META_ACCOUNT_ID|META_ACCOUNT_ID
 * Opcional: SYNC_INSIGHTS_DAYS=30 (max 90)
 */
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
const META_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const META_ACCOUNT_ID =
  process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID;

const INSIGHTS_DAYS = Math.min(
  90,
  Math.max(1, parseInt(process.env.SYNC_INSIGHTS_DAYS || '30', 10) || 30)
);
const GRAPH_VERSION = 'v23.0';
const PAGE_SLEEP_MS = 600;
const UPSERT_CHUNK = 80;

const EMPTY_METRICS = {
  reach: 0,
  frequency: 0,
  unique_clicks: 0,
  unique_ctr: 0,
  unique_link_clicks: 0,
  unique_link_clicks_ctr: 0,
  social_spend: 0,
  social_impressions: 0,
  social_clicks: 0,
  social_reach: 0,
  social_frequency: 0,
  social_unique_clicks: 0,
  social_unique_link_clicks: 0,
};

function normalizeAccountId(id) {
  if (!id) return '';
  const s = String(id).trim();
  return s.startsWith('act_') ? s : `act_${s}`;
}

function aggregateLeadsFromInsight(insight) {
  const leadsFromResults = Array.isArray(insight.results)
    ? insight.results.reduce((acc, result) => {
        if (!result?.indicator?.toLowerCase().includes('lead')) return acc;
        return acc + (Number(result?.values?.[0]?.value) || 0);
      }, 0)
    : 0;

  const leadsFromActions = Array.isArray(insight.actions)
    ? insight.actions.reduce((acc, action) => {
        if (!action?.action_type?.toLowerCase().includes('lead')) return acc;
        return acc + (Number(action?.value) || 0);
      }, 0)
    : 0;

  return Math.max(leadsFromResults, leadsFromActions);
}

function rowToAdInsight(row) {
  return {
    ad_id: String(row.ad_id),
    date: row.date_start,
    spend: parseFloat(row.spend) || 0,
    impressions: parseInt(row.impressions, 10) || 0,
    clicks: parseInt(row.clicks, 10) || 0,
    ctr: parseFloat(row.ctr) || 0,
    cpc: parseFloat(row.cpc) || 0,
    cpm: parseFloat(row.cpm) || 0,
    leads: aggregateLeadsFromInsight(row),
    ...EMPTY_METRICS,
  };
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  if (!META_ACCESS_TOKEN || !META_ACCOUNT_ID) {
    console.error(
      'Defina META_ACCESS_TOKEN e META_ACCOUNT_ID (ou NEXT_PUBLIC_*).'
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const accountId = normalizeAccountId(META_ACCOUNT_ID);

  const { data: adsRows, error: adsErr } = await supabase
    .from('ads')
    .select('id');
  if (adsErr) {
    console.error('Erro ao ler ads:', adsErr.message);
    process.exit(1);
  }
  const validAdIds = new Set((adsRows || []).map((r) => String(r.id)));

  if (validAdIds.size === 0) {
    console.warn(
      'Nenhum ad na tabela ads. Rode sync-ads-once.js antes para FK ad_insights.ad_id.'
    );
  }

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - INSIGHTS_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);
  const timeRange = encodeURIComponent(
    JSON.stringify({ since: startDate, until: endDate })
  );
  const fields = encodeURIComponent(
    'ad_id,date_start,spend,impressions,clicks,ctr,cpc,cpm,actions,results'
  );

  let url = `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/insights?fields=${fields}&level=ad&time_increment=1&time_range=${timeRange}&limit=500&access_token=${META_ACCESS_TOKEN}`;

  console.log(
    `Insights conta ${accountId}: ${startDate} .. ${endDate} (${INSIGHTS_DAYS} dias), nivel=ad`
  );

  let apiRows = 0;
  let skippedNoAd = 0;
  let upserted = 0;
  const pending = [];

  const flush = async () => {
    if (pending.length === 0) return;
    const chunk = pending.splice(0, UPSERT_CHUNK);
    const { error } = await supabase.from('ad_insights').upsert(chunk, {
      onConflict: 'ad_id,date',
    });
    if (error) {
      console.error('Upsert ad_insights:', error.message);
      throw error;
    }
    upserted += chunk.length;
  };

  while (url) {
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.error) {
      console.error(
        'Meta API:',
        json.error?.message || res.statusText,
        json.error?.code != null ? `(code ${json.error.code})` : ''
      );
      process.exit(1);
    }

    const rows = Array.isArray(json.data) ? json.data : [];
    for (const row of rows) {
      if (!row.ad_id || !row.date_start) continue;
      apiRows++;
      const aid = String(row.ad_id);
      if (validAdIds.size > 0 && !validAdIds.has(aid)) {
        skippedNoAd++;
        continue;
      }
      pending.push(rowToAdInsight(row));
      if (pending.length >= UPSERT_CHUNK) await flush();
    }

    url = json.paging?.next || null;
    if (url) await new Promise((r) => setTimeout(r, PAGE_SLEEP_MS));
  }

  await flush();

  console.log('Concluido.');
  console.log(`  Linhas recebidas da API: ${apiRows}`);
  console.log(`  Ignoradas (ad nao existe no Supabase): ${skippedNoAd}`);
  console.log(`  Upserts em ad_insights: ${upserted}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { aggregateLeadsFromInsight, normalizeAccountId };
