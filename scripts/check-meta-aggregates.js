const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const accountId = process.env.META_ACCOUNT_ID.startsWith('act_') ? process.env.META_ACCOUNT_ID : `act_${process.env.META_ACCOUNT_ID}`;
const accessToken = process.env.META_ACCESS_TOKEN;

const dateTo = new Date();
const dateFrom = new Date();
dateFrom.setDate(dateTo.getDate() - 7);

const formatDate = d => d.toISOString().split('T')[0];

async function fetchAggregates(level) {
  const fields = [
    'campaign_name',
    'adset_name',
    'ad_name',
    'impressions',
    'clicks',
    'spend',
    'cpm',
    'ctr',
    'actions',
    'date_start',
    'date_stop'
  ];
  const url = `https://graph.facebook.com/v19.0/${accountId}/insights?level=${level}&fields=${fields.join(',')}&time_range={\"since\":\"${formatDate(dateFrom)}\",\"until\":\"${formatDate(dateTo)}\"}&filtering=[{\"field\":\"ad.effective_status\",\"operator\":\"IN\",\"value\":[\"ACTIVE\"]}]&access_token=${accessToken}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.data) {
    console.error('Erro ao buscar dados da Meta API:', json);
    return [];
  }
  return json.data;
}

(async () => {
  for (const level of ['campaign', 'adset', 'ad']) {
    console.log(`\n=== Meta API: Agregado por ${level} (últimos 7 dias) ===`);
    const data = await fetchAggregates(level);
    data.forEach(row => {
      const leads = (row.actions || []).find(a => a.action_type === 'lead')?.value || 0;
      const clicks = parseInt(row.clicks) || 0;
      const impressions = parseInt(row.impressions) || 0;
      const spend = parseFloat(row.spend) || 0;
      const ctr = parseFloat(row.ctr) || 0;
      const cr = clicks ? (leads / clicks * 100).toFixed(2) : '0';
      const cpm = parseFloat(row.cpm) || 0;
      console.log(`Nome: ${row.campaign_name || row.adset_name || row.ad_name}`);
      console.log(`  Leads: ${leads}`);
      console.log(`  Spend: R$ ${spend.toFixed(2)}`);
      console.log(`  Impressões: ${impressions}`);
      console.log(`  Cliques: ${clicks}`);
      console.log(`  CTR: ${ctr}%`);
      console.log(`  CR: ${cr}%`);
      console.log(`  CPM: R$ ${cpm}`);
    });
  }
})(); 