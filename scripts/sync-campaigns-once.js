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

// Função para buscar campanhas da Meta API
async function getCampaignsFromMeta() {
  const accountId = getAccountId();
  const url = `https://graph.facebook.com/v18.0/${accountId}/campaigns?fields=id,name,status,effective_status,created_time,start_time,end_time,daily_budget,lifetime_budget,objective&access_token=${META_ACCESS_TOKEN}`;
  
  console.log('🔍 Buscando campanhas da Meta API...');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Erro da Meta API: ${data.error.message}`);
    }
    
    console.log(`📊 ${data.data.length} campanhas encontradas`);
    return data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar campanhas da Meta API:', error);
    throw error;
  }
}

// Função para fazer o upsert dos dados das campanhas no Supabase
async function upsertCampaigns(campaignsData) {
  const recordsToUpsert = campaignsData.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective,
    start_time: campaign.start_time,
    end_time: campaign.end_time,
    daily_budget: campaign.daily_budget,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_meta_sync: new Date().toISOString(),
  }));

  try {
    console.log('💾 Salvando campanhas no Supabase...');
    const { error } = await supabase
      .from('campaigns')
      .upsert(recordsToUpsert, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error('❌ Erro ao fazer upsert das campanhas no Supabase:', error);
      return { success: false, error };
    }

    console.log('✅ Campanhas salvas com sucesso no Supabase');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro inesperado na operação de upsert das campanhas:', error);
    return { success: false, error };
  }
}

// Função principal de sincronização
async function syncCampaigns() {
  const startTime = new Date();
  
  try {
    // Busca campanhas da Meta API
    const campaigns = await getCampaignsFromMeta();
    
    // Faz o upsert dos dados no Supabase
    const upsertResult = await upsertCampaigns(campaigns);

    if (!upsertResult.success) {
      throw new Error('Falha no upsert das campanhas para o Supabase.');
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    
    return {
      status: {
        success: true,
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
        details: {
          durationMs: durationMs,
        },
      },
      data: campaigns,
    };
  } catch (error) {
    console.error('❌ Erro durante a sincronização de campanhas:', error);
    const endTime = new Date();
    return {
      status: {
        success: false,
        totalCampaigns: 0,
        activeCampaigns: 0,
        error: error.message,
        details: {
          durationMs: endTime.getTime() - startTime.getTime(),
        },
      },
    };
  }
}

async function main() {
  console.log('🔄 Iniciando sincronização única de campanhas...');
  
  try {
    const result = await syncCampaigns();
    
    if (result.status.success) {
      console.log('✅ Sincronização concluída com sucesso!');
      console.log(`📊 ${result.status.totalCampaigns} campanhas sincronizadas`);
      console.log(`🟢 ${result.status.activeCampaigns} campanhas ativas`);
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