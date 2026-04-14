#!/usr/bin/env node

/**
 * Auditoria de paridade entre:
 * - API /api/performance/comparisons (fonte do heatmap)
 * - SQL oficial em adset_insights (agregação diária)
 *
 * Uso:
 *   node scripts/audit-comparisons-parity.js
 *   node scripts/audit-comparisons-parity.js --start-date 2026-03-15 --end-date 2026-04-13
 *   node scripts/audit-comparisons-parity.js --base-url http://localhost:3000
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const DEFAULT_DAYS = 30;

const TOLERANCE = {
  spend: 1.0,
  leads: 0,
  impressions: 5,
  clicks: 5,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--start-date' && args[index + 1]) {
      parsed.startDate = args[index + 1];
      index++;
    } else if (args[index] === '--end-date' && args[index + 1]) {
      parsed.endDate = args[index + 1];
      index++;
    } else if (args[index] === '--base-url' && args[index + 1]) {
      parsed.baseUrl = args[index + 1];
      index++;
    }
  }
  return parsed;
}

function getDefaultRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (DEFAULT_DAYS - 1));

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

async function fetchComparisonsDaily(baseUrl, startDate, endDate) {
  const url = `${baseUrl}/api/performance/comparisons?startDate=${startDate}&endDate=${endDate}&granularity=campaign&_audit=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });
  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Falha ao buscar comparisons: HTTP ${response.status}`);
  }

  const rows = payload?.data?.current?.campaigns || [];
  const daily = {};

  rows.forEach((row) => {
    const day = row.date;
    if (!day) return;
    if (!daily[day]) {
      daily[day] = { spend: 0, leads: 0, impressions: 0, clicks: 0 };
    }
    daily[day].spend += Number(row.spend) || 0;
    daily[day].leads += Number(row.leads) || 0;
    daily[day].impressions += Number(row.impressions) || 0;
    daily[day].clicks += Number(row.clicks) || 0;
  });

  return daily;
}

async function fetchSqlDaily(startDate, endDate) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Variáveis do Supabase não configuradas para auditoria.');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase
    .from('adset_insights')
    .select('date,spend,leads,impressions,clicks')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    throw new Error(`Erro SQL adset_insights: ${error.message}`);
  }

  const daily = {};
  (data || []).forEach((row) => {
    const day = row.date;
    if (!daily[day]) {
      daily[day] = { spend: 0, leads: 0, impressions: 0, clicks: 0 };
    }
    daily[day].spend += Number(row.spend) || 0;
    daily[day].leads += Number(row.leads) || 0;
    daily[day].impressions += Number(row.impressions) || 0;
    daily[day].clicks += Number(row.clicks) || 0;
  });

  return daily;
}

function compareDaily(apiDaily, sqlDaily) {
  const allDays = Array.from(new Set([...Object.keys(apiDaily), ...Object.keys(sqlDaily)])).sort();
  const mismatches = [];

  allDays.forEach((day) => {
    const api = apiDaily[day] || { spend: 0, leads: 0, impressions: 0, clicks: 0 };
    const sql = sqlDaily[day] || { spend: 0, leads: 0, impressions: 0, clicks: 0 };

    const diff = {
      spend: Math.abs(api.spend - sql.spend),
      leads: Math.abs(api.leads - sql.leads),
      impressions: Math.abs(api.impressions - sql.impressions),
      clicks: Math.abs(api.clicks - sql.clicks),
    };

    const hasMismatch =
      diff.spend > TOLERANCE.spend ||
      diff.leads > TOLERANCE.leads ||
      diff.impressions > TOLERANCE.impressions ||
      diff.clicks > TOLERANCE.clicks;

    if (hasMismatch) {
      mismatches.push({ day, api, sql, diff });
    }
  });

  return { allDays, mismatches };
}

async function main() {
  const args = parseArgs();
  const range = getDefaultRange();
  const startDate = args.startDate || range.startDate;
  const endDate = args.endDate || range.endDate;
  const baseUrl = args.baseUrl || BASE_URL;

  console.log(`🔎 Auditando paridade comparisons vs SQL (${startDate}..${endDate})`);
  console.log(`🌐 API base: ${baseUrl}`);

  const [apiDaily, sqlDaily] = await Promise.all([
    fetchComparisonsDaily(baseUrl, startDate, endDate),
    fetchSqlDaily(startDate, endDate),
  ]);

  const { allDays, mismatches } = compareDaily(apiDaily, sqlDaily);
  console.log(`📅 Dias analisados: ${allDays.length}`);

  if (mismatches.length === 0) {
    console.log('✅ Paridade OK: sem divergências fora da tolerância.');
    process.exit(0);
  }

  console.log(`❌ Divergências encontradas: ${mismatches.length}`);
  mismatches.slice(0, 20).forEach((item) => {
    console.log(
      `${item.day} | spend api=${item.api.spend.toFixed(2)} sql=${item.sql.spend.toFixed(2)} diff=${item.diff.spend.toFixed(2)} | ` +
        `leads api=${item.api.leads} sql=${item.sql.leads} diff=${item.diff.leads} | ` +
        `impr api=${item.api.impressions} sql=${item.sql.impressions} diff=${item.diff.impressions} | ` +
        `clicks api=${item.api.clicks} sql=${item.sql.clicks} diff=${item.diff.clicks}`
    );
  });

  process.exit(1);
}

main().catch((error) => {
  console.error('❌ Falha na auditoria de paridade:', error.message);
  process.exit(1);
});
