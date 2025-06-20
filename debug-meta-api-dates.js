const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const accountId = process.env.META_ACCOUNT_ID.startsWith('act_') ? process.env.META_ACCOUNT_ID : `act_${process.env.META_ACCOUNT_ID}`;
const accessToken = process.env.META_ACCESS_TOKEN;

const formatDate = d => d.toISOString().split('T')[0];

async function checkMetaAPIDates() {
  console.log('🔍 VERIFICANDO DATAS DISPONÍVEIS NA META API\\n');
  console.log('🏢 Account ID:', accountId);
  console.log('🔑 Access Token:', accessToken ? 'Presente' : 'Ausente');
  console.log('');

  // Testar diferentes períodos para ver quais têm dados
  const periods = [
    { name: 'Hoje (20/06)', start: '2025-06-20', end: '2025-06-20' },
    { name: 'Ontem (19/06)', start: '2025-06-19', end: '2025-06-19' },
    { name: 'Anteontem (18/06)', start: '2025-06-18', end: '2025-06-18' },
    { name: '17/06', start: '2025-06-17', end: '2025-06-17' },
    { name: '16/06', start: '2025-06-16', end: '2025-06-16' },
    { name: '15/06', start: '2025-06-15', end: '2025-06-15' },
    { name: '14/06', start: '2025-06-14', end: '2025-06-14' },
    { name: 'Últimos 7 dias', start: '2025-06-14', end: '2025-06-20' },
    { name: 'Últimos 30 dias', start: '2025-05-21', end: '2025-06-20' }
  ];

  for (const period of periods) {
    console.log(`📅 Testando: ${period.name}`);
    
    const url = `https://graph.facebook.com/v23.0/${accountId}/insights?level=campaign&fields=campaign_name,actions,spend,impressions,clicks&time_range={\"since\":\"${period.start}\",\"until\":\"${period.end}\"}&time_increment=1&access_token=${accessToken}`;
    
    try {
      const res = await fetch(url);
      const json = await res.json();
      
      if (json.error) {
        console.error('  ❌ Erro na Meta API:', json.error.message);
      } else if (!json.data || json.data.length === 0) {
        console.log('  📊 0 registros encontrados');
      } else {
        console.log(`  📊 ${json.data.length} registros encontrados`);
        
        // Mostrar as datas dos registros
        const dates = [...new Set(json.data.map(item => item.date_start))];
        console.log(`  📅 Datas: ${dates.join(', ')}`);
        
        // Mostrar totais
        const totals = json.data.reduce((acc, item) => {
          // Extrair leads dos actions
          const leadAction = item.actions?.find(action => action.action_type === 'onsite_conversion.lead_grouped');
          const leads = leadAction ? parseInt(leadAction.value) : 0;
          
          acc.leads += leads;
          acc.spend += parseFloat(item.spend || 0);
          acc.impressions += parseInt(item.impressions || 0);
          acc.clicks += parseInt(item.clicks || 0);
          return acc;
        }, { leads: 0, spend: 0, impressions: 0, clicks: 0 });
        
        console.log(`  📈 Totais: ${totals.leads} leads, R$ ${totals.spend.toFixed(2)}, ${totals.impressions.toLocaleString()} impressões, ${totals.clicks.toLocaleString()} cliques`);
      }
    } catch (error) {
      console.error('  ❌ Erro na requisição:', error.message);
    }
    
    console.log('');
  }
}

checkMetaAPIDates(); 