require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configurações de ambiente
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const META_ACCESS_TOKEN = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const META_ACCOUNT_ID = process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !META_ACCESS_TOKEN || !META_ACCOUNT_ID) {
  throw new Error('Variáveis de ambiente obrigatórias não configuradas.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Certifique-se de que o accountId sempre tenha o prefixo 'act_'
const getAccountId = () => {
  if (META_ACCOUNT_ID && !META_ACCOUNT_ID.startsWith('act_')) {
    return `act_${META_ACCOUNT_ID}`;
  }
  return META_ACCOUNT_ID;
};

// Função para buscar adsets da Meta API
async function getAdsetsFromMeta() {
  const accountId = getAccountId();
  const url = `https://graph.facebook.com/v18.0/${accountId}/adsets?fields=id,name,status,effective_status,campaign_id,created_time,start_time,end_time,daily_budget,lifetime_budget,optimization_goal,billing_event,targeting&access_token=${META_ACCESS_TOKEN}`;
  
  console.log('🔍 Buscando adsets da Meta API...');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Erro da Meta API: ${data.error.message}`);
    }
    
    console.log(`📊 ${data.data.length} adsets encontrados`);
    return data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar adsets da Meta API:', error);
    throw error;
  }
}

// Função para fazer o upsert dos dados dos adsets no Supabase
async function upsertAdsets(adsetsData) {
  const recordsToUpsert = adsetsData.map(adset => ({
    id: adset.id,
    name: adset.name,
    status: adset.status,
    effective_status: adset.effective_status,
    campaign_id: adset.campaign_id,
    created_time: adset.created_time,
    start_time: adset.start_time,
    end_time: adset.end_time,
    daily_budget: adset.daily_budget,
    lifetime_budget: adset.lifetime_budget,
    optimization_goal: adset.optimization_goal,
    billing_event: adset.billing_event,
    targeting: adset.targeting,
    last_synced: new Date().toISOString(),
  }));

  try {
    console.log('💾 Salvando adsets no Supabase...');
    const { error } = await supabase
      .from('adsets')
      .upsert(recordsToUpsert, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error('❌ Erro ao fazer upsert dos adsets no Supabase:', error);
      return { success: false, error };
    }

    console.log('✅ Adsets salvos com sucesso no Supabase');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro inesperado na operação de upsert dos adsets:', error);
    return { success: false, error };
  }
}

// Função principal de sincronização
async function syncAdsets() {
  const startTime = new Date();
  
  try {
    // Busca adsets da Meta API
    const adsets = await getAdsetsFromMeta();
    
    // Faz o upsert dos dados no Supabase
    const upsertResult = await upsertAdsets(adsets);

    if (!upsertResult.success) {
      throw new Error('Falha no upsert dos adsets para o Supabase.');
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    
    return {
      status: {
        success: true,
        totalAds: adsets.length,
        activeAds: adsets.filter(a => a.status === 'ACTIVE').length,
        details: {
          durationMs: durationMs,
        },
      },
      data: adsets,
    };
  } catch (error) {
    console.error('❌ Erro durante a sincronização de adsets:', error);
    const endTime = new Date();
    return {
      status: {
        success: false,
        totalAds: 0,
        activeAds: 0,
        error: error.message,
        details: {
          durationMs: endTime.getTime() - startTime.getTime(),
        },
      },
    };
  }
}

async function main() {
  console.log('🔄 Iniciando sincronização única de adsets...');
  
  try {
    const result = await syncAdsets();
    
    if (result.status.success) {
      console.log('✅ Sincronização concluída com sucesso!');
      console.log(`📊 ${result.status.totalAds} adsets sincronizados`);
      console.log(`🟢 ${result.status.activeAds} adsets ativos`);
      console.log(`⏱️  Duração: ${result.status.details.durationMs}ms`);
    } else {
      console.error('❌ Erro na sincronização:', result.status.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

main(); 