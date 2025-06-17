#!/usr/bin/env node

/**
 * Script de Auditoria Diária - Compara dados do Supabase com Meta API
 * Executa diariamente para garantir paridade entre os sistemas
 * 
 * Uso:
 *   node scripts/audit-daily.js          # Execução normal
 *   node scripts/audit-daily.js --test   # Modo de teste (GitHub Actions)
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração da Meta API
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_ACCOUNT_ID = process.env.META_ACCOUNT_ID;

// Constantes
const DAYS_TO_AUDIT = 7;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Verificar se é modo de teste
const isTestMode = process.argv.includes('--test');

/**
 * Calcula as datas para auditoria (últimos N dias)
 */
function getAuditDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - DAYS_TO_AUDIT);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * Busca dados agregados da Meta API
 */
async function fetchMetaApiData(dateFrom, dateTo) {
  const url = `https://graph.facebook.com/v19.0/act_${META_ACCOUNT_ID}/insights`;
  
  const params = {
    access_token: META_ACCESS_TOKEN,
    level: 'ad',
    fields: 'campaign_name,ad_name,ad_id,impressions,clicks,spend,actions',
    time_range: JSON.stringify({
      since: dateFrom,
      until: dateTo
    }),
    status: 'ACTIVE',
    limit: 1000
  };

  let allData = [];
  let nextUrl = url;

  try {
    while (nextUrl) {
      const response = await axios.get(nextUrl, { params });
      
      if (response.data.data) {
        allData = allData.concat(response.data.data);
      }

      // Paginação
      nextUrl = response.data.paging?.next || null;
      
      // Rate limiting - pausa entre requisições
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Processa os dados para extrair leads
    const processedData = allData.map(item => {
      const leadCount = item.actions?.find(action => 
        action.action_type === 'onsite_conversion.lead_grouped'
      )?.value || 0;

      return {
        campaign_name: item.campaign_name,
        ad_name: item.ad_name,
        ad_id: item.ad_id,
        impressions: parseInt(item.impressions) || 0,
        clicks: parseInt(item.clicks) || 0,
        spend: parseFloat(item.spend) || 0,
        lead_count: parseInt(leadCount) || 0,
        created_time: dateFrom + 'T00:00:00+00:00'
      };
    });

    return processedData;
  } catch (error) {
    console.error('Erro ao buscar dados da Meta API:', error.message);
    throw error;
  }
}

/**
 * Busca dados do Supabase
 */
async function fetchSupabaseData(dateFrom, dateTo) {
  try {
    const { data, error } = await supabase
      .from('meta_leads')
      .select('*')
      .gte('created_time', dateFrom + 'T00:00:00+00:00')
      .lte('created_time', dateTo + 'T23:59:59+00:00');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar dados do Supabase:', error.message);
    throw error;
  }
}

/**
 * Compara dados e identifica divergências
 */
function compareData(metaData, supabaseData) {
  const metaAggregated = aggregateData(metaData);
  const supabaseAggregated = aggregateData(supabaseData);
  
  const discrepancies = [];
  
  // Compara métricas agregadas
  const metrics = ['totalLeads', 'totalSpend', 'totalImpressions', 'totalClicks'];
  
  metrics.forEach(metric => {
    const metaValue = metaAggregated[metric];
    const supabaseValue = supabaseAggregated[metric];
    const difference = Math.abs(metaValue - supabaseValue);
    const percentageDiff = metaValue > 0 ? (difference / metaValue) * 100 : 0;
    
    if (difference > 0) {
      discrepancies.push({
        metric,
        metaValue,
        supabaseValue,
        difference,
        percentageDiff: percentageDiff.toFixed(2)
      });
    }
  });
  
  return {
    discrepancies,
    metaAggregated,
    supabaseAggregated,
    hasDiscrepancies: discrepancies.length > 0
  };
}

/**
 * Agrega dados por métricas
 */
function aggregateData(data) {
  return data.reduce((acc, item) => {
    acc.totalLeads += parseInt(item.lead_count) || 0;
    acc.totalSpend += parseFloat(item.spend) || 0;
    acc.totalImpressions += parseInt(item.impressions) || 0;
    acc.totalClicks += parseInt(item.clicks) || 0;
    return acc;
  }, {
    totalLeads: 0,
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0
  });
}

/**
 * Registra resultado da auditoria
 */
async function logAuditResult(auditResult, dateFrom, dateTo) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    date_from: dateFrom,
    date_to: dateTo,
    has_discrepancies: auditResult.hasDiscrepancies,
    discrepancies_count: auditResult.discrepancies.length,
    meta_leads: auditResult.metaAggregated.totalLeads,
    supabase_leads: auditResult.supabaseAggregated.totalLeads,
    meta_spend: auditResult.metaAggregated.totalSpend,
    supabase_spend: auditResult.supabaseAggregated.totalSpend,
    meta_impressions: auditResult.metaAggregated.totalImpressions,
    supabase_impressions: auditResult.supabaseAggregated.totalImpressions,
    meta_clicks: auditResult.metaAggregated.totalClicks,
    supabase_clicks: auditResult.supabaseAggregated.totalClicks,
    details: JSON.stringify(auditResult.discrepancies)
  };

  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([logEntry]);

    if (error) {
      console.error('Erro ao salvar log de auditoria:', error);
    } else {
      console.log('Log de auditoria salvo com sucesso');
    }
  } catch (error) {
    console.error('Erro ao salvar log de auditoria:', error);
  }
}

/**
 * Função principal de auditoria
 */
async function runDailyAudit() {
  console.log('🚀 Iniciando auditoria diária...');
  
  const { startDate, endDate } = getAuditDateRange();
  console.log(`📅 Período de auditoria: ${startDate} a ${endDate}`);
  
  try {
    // Busca dados da Meta API
    console.log('📊 Buscando dados da Meta API...');
    const metaData = await fetchMetaApiData(startDate, endDate);
    console.log(`✅ Meta API: ${metaData.length} registros encontrados`);
    
    // Busca dados do Supabase
    console.log('🗄️ Buscando dados do Supabase...');
    const supabaseData = await fetchSupabaseData(startDate, endDate);
    console.log(`✅ Supabase: ${supabaseData.length} registros encontrados`);
    
    // Compara dados
    console.log('🔍 Comparando dados...');
    const auditResult = compareData(metaData, supabaseData);
    
    // Exibe resultados
    console.log('\n📈 Resultados da Auditoria:');
    console.log('='.repeat(50));
    
    if (auditResult.hasDiscrepancies) {
      console.log('❌ DIVERGÊNCIAS ENCONTRADAS:');
      auditResult.discrepancies.forEach(d => {
        console.log(`  ${d.metric}:`);
        console.log(`    Meta API: ${d.metaValue}`);
        console.log(`    Supabase: ${d.supabaseValue}`);
        console.log(`    Diferença: ${d.difference} (${d.percentageDiff}%)`);
        console.log('');
      });
    } else {
      console.log('✅ PARIDADE TOTAL - Dados idênticos entre Meta API e Supabase');
    }
    
    console.log('📊 Métricas Agregadas:');
    console.log(`  Leads: ${auditResult.metaAggregated.totalLeads} (Meta) vs ${auditResult.supabaseAggregated.totalLeads} (Supabase)`);
    console.log(`  Investimento: R$ ${auditResult.metaAggregated.totalSpend.toFixed(2)} (Meta) vs R$ ${auditResult.supabaseAggregated.totalSpend.toFixed(2)} (Supabase)`);
    console.log(`  Impressões: ${auditResult.metaAggregated.totalImpressions.toLocaleString()} (Meta) vs ${auditResult.supabaseAggregated.totalImpressions.toLocaleString()} (Supabase)`);
    console.log(`  Cliques: ${auditResult.metaAggregated.totalClicks.toLocaleString()} (Meta) vs ${auditResult.supabaseAggregated.totalClicks.toLocaleString()} (Supabase)`);
    
    // Salva log da auditoria (apenas se não for modo de teste)
    if (!isTestMode) {
      await logAuditResult(auditResult, startDate, endDate);
    }
    
    console.log('\n✅ Auditoria diária concluída com sucesso!');
    
    // Retorna resultado para possível uso em CI/CD
    return {
      success: true,
      hasDiscrepancies: auditResult.hasDiscrepancies,
      discrepanciesCount: auditResult.discrepancies.length
    };
    
  } catch (error) {
    console.error('❌ Erro durante auditoria:', error.message);
    
    // Salva log de erro (apenas se não for modo de teste)
    if (!isTestMode) {
      await logAuditResult({
        hasDiscrepancies: false,
        discrepancies: [],
        metaAggregated: {},
        supabaseAggregated: {}
      }, startDate, endDate);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  runDailyAudit()
    .then(result => {
      if (result.success) {
        process.exit(result.hasDiscrepancies ? 1 : 0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });

  // Garante mensagem de erro se o script terminar com exit code 1 sem mensagem
  process.on('exit', (code) => {
    if (code !== 0) {
      console.error('❌ Auditoria finalizada com erro inesperado. Nenhuma mensagem detalhada foi impressa.');
    }
  });
}

module.exports = { runDailyAudit }; 