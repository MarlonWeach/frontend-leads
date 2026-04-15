require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

function trimEnv(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/^['"]+|['"]+$/g, '');
}

// Configurações de ambiente
const SUPABASE_URL = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
const SUPABASE_KEY = trimEnv(
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);
const META_ACCESS_TOKEN = trimEnv(
  process.env.NEXT_PUBLIC_META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN
);
const META_ACCOUNT_ID = trimEnv(process.env.NEXT_PUBLIC_META_ACCOUNT_ID || process.env.META_ACCOUNT_ID);

if (!SUPABASE_URL || !SUPABASE_KEY || !META_ACCESS_TOKEN || !META_ACCOUNT_ID) {
  throw new Error('Variáveis de ambiente obrigatórias não configuradas.');
}

if (!/^https?:\/\//i.test(SUPABASE_URL)) {
  throw new Error(
    `SUPABASE_URL invalida (esperado URL com http/https): recebido "${SUPABASE_URL.substring(0, 24)}..."`
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configurações de otimização - Reduzidas para evitar rate limiting
const RATE_LIMIT_DELAY = 2000; // 2 segundos entre requisições
const CONCURRENT_REQUESTS = 1; // Apenas 1 requisição por vez
const BATCH_SIZE = 25; // Reduzido para menos campanhas por requisição
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
      let url = `https://graph.facebook.com/v25.0/${accountId}/campaigns?fields=id,name,status,effective_status,created_time,updated_time,start_time,end_time,daily_budget,lifetime_budget,objective&limit=100&access_token=${META_ACCESS_TOKEN}`;
      
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
    
    const url = `https://graph.facebook.com/v25.0/?ids=${idsParam}&fields=insights{impressions,clicks,spend,actions}&date_preset=last_90d&access_token=${META_ACCESS_TOKEN}`;
    
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
    console.log('Nenhuma campanha para salvar');
    return;
  }

  console.log(`Salvando ${campaigns.length} campanhas no Supabase...`);

  const maxRetries = 5;
  let lastErr = null;

  const isTransientMsg = (m) => {
    const s = (m || '').toLowerCase();
    return (
      s.includes('fetch failed') ||
      s.includes('network') ||
      s.includes('econnreset') ||
      s.includes('etimedout') ||
      s.includes('socket') ||
      s.includes('undici')
    );
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .upsert(campaigns, { onConflict: 'id' });

      if (error) {
        lastErr = error;
        if (isTransientMsg(error.message) && attempt < maxRetries) {
          const delay = Math.min(30000, 2000 * Math.pow(2, attempt - 1));
          console.warn(
            `Falha transiente ao salvar campanhas (tentativa ${attempt}/${maxRetries}). Aguardando ${delay}ms...`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        console.error('Erro ao salvar campanhas:', error);
        throw error;
      }

      console.log(`${campaigns.length} campanhas salvas/atualizadas com sucesso`);
      return data;
    } catch (err) {
      lastErr = err;
      if (isTransientMsg(err?.message) && attempt < maxRetries) {
        const delay = Math.min(30000, 2000 * Math.pow(2, attempt - 1));
        console.warn(
          `Excecao transiente ao salvar campanhas (tentativa ${attempt}/${maxRetries}). Aguardando ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.error('Erro ao salvar campanhas:', err.message);
      throw err;
    }
  }

  throw lastErr || new Error('Falha ao salvar campanhas apos retries');
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
    
    // 4. Preparar dados para salvar (usando apenas colunas que existem na tabela)
    const campaignsToSave = activeCampaigns.map(campaign => {
      return {
        id: campaign.id, // Usar o ID da Meta como ID primário
        name: campaign.name,
        status: campaign.status,
        effective_status: campaign.effective_status || null,
        created_time: campaign.created_time || null,
        updated_time: campaign.updated_time || null,
        objective: campaign.objective || null,
        start_time: campaign.start_time || null,
        stop_time: campaign.end_time || null, // end_time na API = stop_time na tabela
        daily_budget: campaign.daily_budget ? parseInt(campaign.daily_budget) : null,
        lifetime_budget: campaign.lifetime_budget ? parseInt(campaign.lifetime_budget) : null,
        budget_remaining: null, // Não disponível na API básica
        spend_cap: null, // Não disponível na API básica
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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