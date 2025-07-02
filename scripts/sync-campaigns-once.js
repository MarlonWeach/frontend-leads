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

// Configurações de otimização
const RATE_LIMIT_DELAY = 500; // 500ms entre requisições
const CONCURRENT_REQUESTS = 3; // Máximo 3 requisições simultâneas
const BATCH_SIZE = 50; // Máximo 50 campanhas por requisição de insights
const TRAFFIC_DAYS = 60; // Buscar tráfego dos últimos 60 dias

// Função para obter o account ID com prefixo
function getAccountId() {
  return META_ACCOUNT_ID.startsWith('act_') ? META_ACCOUNT_ID : `act_${META_ACCOUNT_ID}`;
}

// Função para fazer requisições com rate limiting
async function makeRateLimitedRequest(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔗 Fazendo requisição: ${url.substring(0, 100)}...`);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      if (response.status === 429) { // Rate limit
        const delay = Math.pow(2, i) * 1000; // Backoff exponencial
        console.log(`⚠️ Rate limit atingido, aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para erro 400, vamos ver o que está sendo retornado
      if (response.status === 400) {
        const errorText = await response.text();
        console.error(`❌ Erro 400 na requisição:`);
        console.error(`URL: ${url.substring(0, 200)}...`);
        console.error(`Resposta: ${errorText}`);
        throw new Error(`Erro 400: ${errorText}`);
      }
      
      // Para outros erros
      const errorText = await response.text();
      console.error(`❌ Erro ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
      
    } catch (error) {
      console.error(`❌ Tentativa ${i + 1} falhou:`, error.message);
      
      if (i === retries - 1) {
        throw error; // Última tentativa falhou
      }
      
      const delay = Math.pow(2, i) * 1000;
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Função otimizada para buscar campanhas da Meta API com paginação completa
async function getCampaignsFromMeta() {
  const accountId = getAccountId();
  const allCampaigns = [];
  let after = null;
  let pageCount = 0;
  
  console.log('🔍 Buscando campanhas da Meta API com paginação completa...');
  
  try {
    do {
      pageCount++;
      let url = `https://graph.facebook.com/v23.0/${accountId}/campaigns?fields=id,name,status,effective_status,created_time,start_time,end_time,daily_budget,lifetime_budget,objective&limit=100&access_token=${META_ACCESS_TOKEN}`;
      
      if (after) {
        url += `&after=${after}`;
      }
      
      console.log(`📄 Buscando página ${pageCount}...`);
      const data = await makeRateLimitedRequest(url);
      
      if (data.error) {
        console.error('❌ Erro na API Meta:', data.error);
        throw new Error(`Erro Meta API: ${data.error.message}`);
      }
      
      if (data.data && data.data.length > 0) {
        allCampaigns.push(...data.data);
        console.log(`✅ Página ${pageCount}: ${data.data.length} campanhas encontradas`);
      }
      
      after = data.paging?.cursors?.after;
      
      // Rate limiting entre páginas
      if (after) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
      
    } while (after);
    
    console.log(`🎯 Total de campanhas encontradas: ${allCampaigns.length}`);
    return allCampaigns;
    
  } catch (error) {
    console.error('❌ Erro ao buscar campanhas:', error.message);
    throw error;
  }
}

// Função para buscar insights de múltiplas campanhas em lote
async function getCampaignsInsightsBatch(campaignIds) {
  if (campaignIds.length === 0) return [];
  
  const accountId = getAccountId();
  const insights = [];
  
  // Dividir em lotes de BATCH_SIZE
  for (let i = 0; i < campaignIds.length; i += BATCH_SIZE) {
    const batch = campaignIds.slice(i, i + BATCH_SIZE);
    const idsParam = batch.join(',');
    
    const url = `https://graph.facebook.com/v23.0/?ids=${idsParam}&fields=insights{impressions,clicks,spend,actions}&date_preset=last_90d&access_token=${META_ACCESS_TOKEN}`;
    
    try {
      console.log(`📊 Buscando insights para lote ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} campanhas)...`);
      const data = await makeRateLimitedRequest(url);
      
      if (data.error) {
        console.error('❌ Erro ao buscar insights:', data.error);
        continue;
      }
      
      // Processar cada campanha do lote
      for (const campaignId of batch) {
        const campaignData = data[campaignId];
        if (campaignData && campaignData.insights && campaignData.insights.data && campaignData.insights.data.length > 0) {
          const insight = campaignData.insights.data[0];
          insights.push({
            campaign_id: campaignId,
            impressions: parseInt(insight.impressions) || 0,
            clicks: parseInt(insight.clicks) || 0,
            spend: parseFloat(insight.spend) || 0,
            has_traffic: true
          });
        }
      }
      
      // Rate limiting entre lotes
      if (i + BATCH_SIZE < campaignIds.length) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
      
    } catch (error) {
      console.error(`❌ Erro no lote ${Math.floor(i/BATCH_SIZE) + 1}:`, error.message);
      continue;
    }
  }
  
  return insights;
}

// Função para salvar campanhas no Supabase
async function saveCampaignsToSupabase(campaigns) {
  if (campaigns.length === 0) {
    console.log('ℹ️ Nenhuma campanha para salvar');
    return;
  }
  
  console.log(`💾 Salvando ${campaigns.length} campanhas no Supabase...`);
  
  try {
    // Upsert direto para evitar conflitos de PK
    const { data, error } = await supabase
      .from('campaigns')
      .upsert(campaigns);
    
    if (error) {
      console.error('❌ Erro ao salvar campanhas:', error);
      throw error;
    }
    
    console.log(`✅ ${campaigns.length} campanhas salvas/atualizadas com sucesso`);
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao salvar campanhas:', error.message);
    throw error;
  }
}

// Função principal
async function syncCampaigns() {
  const startTime = Date.now();
  console.log('🚀 Iniciando sincronização otimizada de campanhas...');
  console.log(`⏰ Período de tráfego: últimos ${TRAFFIC_DAYS} dias`);
  console.log(`⚙️ Configurações: ${CONCURRENT_REQUESTS} req simultâneas, ${RATE_LIMIT_DELAY}ms delay`);
  
  try {
    // 1. Buscar todas as campanhas
    const allCampaigns = await getCampaignsFromMeta();
    
    // 2. Filtrar campanhas ativas/recentes
    const activeCampaigns = allCampaigns.filter(campaign => {
      const isActive = campaign.status === 'ACTIVE' || campaign.effective_status === 'ACTIVE';
      const isRecent = campaign.created_time && new Date(campaign.created_time) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      return isActive || isRecent;
    });
    
    console.log(`📊 Campanhas ativas/recentes: ${activeCampaigns.length}/${allCampaigns.length}`);
    
    // 3. Buscar insights em lote para campanhas com tráfego
    const campaignIds = activeCampaigns.map(c => c.id);
    const insights = await getCampaignsInsightsBatch(campaignIds);
    
    console.log(`📈 Campanhas com tráfego recente: ${insights.length}/${activeCampaigns.length}`);
    
    // 4. Preparar dados para salvar
    const campaignsToSave = activeCampaigns.map(campaign => {
      const insight = insights.find(i => i.campaign_id === campaign.id);
      return {
        id: campaign.id, // Usar o ID da Meta como ID primário
        meta_campaign_id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        created_at: campaign.created_time,
        start_time: campaign.start_time,
        end_time: campaign.end_time,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : null,
        budget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) : null,
        impressions: insight?.impressions || 0,
        clicks: insight?.clicks || 0,
        spend: insight?.spend || 0,
        updated_at: new Date().toISOString(),
        last_meta_sync: new Date().toISOString()
      };
    });
    
    // 5. Salvar no Supabase
    await saveCampaignsToSupabase(campaignsToSave);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    console.log(`⏱️ Tempo total: ${duration.toFixed(2)} segundos`);
    console.log(`📊 Resumo:`);
    console.log(`   - Total de campanhas: ${allCampaigns.length}`);
    console.log(`   - Campanhas ativas/recentes: ${activeCampaigns.length}`);
    console.log(`   - Com tráfego recente: ${insights.length}`);
    console.log(`   - Salvas no banco: ${campaignsToSave.length}`);
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    process.exit(1);
  }
}

// Executar sincronização
syncCampaigns(); 