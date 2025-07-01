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
const BATCH_SIZE = 50; // Máximo 50 campanhas por requisição de leads
const LEADS_DAYS = 90; // Buscar leads dos últimos 90 dias

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

// Função para buscar campanhas ativas do Supabase
async function getActiveCampaignsFromSupabase() {
  try {
    console.log('🔍 Buscando campanhas ativas do Supabase...');
    
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('campaign_id, name, status')
      .or('status.eq.ACTIVE,effective_status.eq.ACTIVE')
      .order('created_time', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      throw error;
    }
    
    console.log(`✅ ${campaigns.length} campanhas ativas encontradas no Supabase`);
    return campaigns;
    
  } catch (error) {
    console.error('❌ Erro ao buscar campanhas do Supabase:', error.message);
    throw error;
  }
}

// Função para buscar leads de múltiplas campanhas em lote
async function getLeadsBatch(campaignIds) {
  if (campaignIds.length === 0) return [];
  
  const allLeads = [];
  
  // Processar campanhas em lotes
  for (let i = 0; i < campaignIds.length; i += BATCH_SIZE) {
    const batch = campaignIds.slice(i, i + BATCH_SIZE);
    
    console.log(`📊 Buscando leads para lote ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} campanhas)...`);
    
    // Processar cada campanha do lote
    for (const campaignId of batch) {
      try {
        const leads = await getLeadsForCampaign(campaignId);
        allLeads.push(...leads);
        
        // Rate limiting entre campanhas
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        
      } catch (error) {
        console.error(`❌ Erro ao buscar leads da campanha ${campaignId}:`, error.message);
        continue;
      }
    }
    
    // Rate limiting entre lotes
    if (i + BATCH_SIZE < campaignIds.length) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * 2));
    }
  }
  
  return allLeads;
}

// Função para buscar leads de uma campanha específica
async function getLeadsForCampaign(campaignId) {
  const leads = [];
  let after = null;
  let pageCount = 0;
  
  try {
    do {
      pageCount++;
      let url = `https://graph.facebook.com/v23.0/${campaignId}/leads?fields=id,created_time,field_data,ad_id,adset_id,campaign_id&limit=100&date_preset=last_${LEADS_DAYS}_days&access_token=${META_ACCESS_TOKEN}`;
      
      if (after) {
        url += `&after=${after}`;
      }
      
      const data = await makeRateLimitedRequest(url);
      
      if (data.error) {
        console.error(`❌ Erro ao buscar leads da campanha ${campaignId}:`, data.error);
        break;
      }
      
      if (data.data && data.data.length > 0) {
        leads.push(...data.data);
      }
      
      after = data.paging?.cursors?.after;
      
    } while (after && pageCount < 10); // Limitar a 10 páginas por campanha
    
    if (leads.length > 0) {
      console.log(`✅ Campanha ${campaignId}: ${leads.length} leads encontrados`);
    }
    
    return leads;
    
  } catch (error) {
    console.error(`❌ Erro ao buscar leads da campanha ${campaignId}:`, error.message);
    return [];
  }
}

// Função para processar e formatar dados dos leads
function processLeadsData(leads) {
  return leads.map(lead => {
    // Extrair dados do formulário
    const formData = {};
    if (lead.field_data && Array.isArray(lead.field_data)) {
      lead.field_data.forEach(field => {
        if (field.name && field.values && field.values.length > 0) {
          formData[field.name] = field.values[0];
        }
      });
    }
    
    return {
      lead_id: lead.id,
      campaign_id: lead.campaign_id,
      adset_id: lead.adset_id,
      ad_id: lead.ad_id,
      created_time: lead.created_time,
      form_data: JSON.stringify(formData),
      // Extrair campos específicos comuns
      nome: formData.name || formData.nome || formData.full_name || null,
      email: formData.email || formData.e_mail || null,
      telefone: formData.phone || formData.telefone || formData.phone_number || null,
      cidade: formData.city || formData.cidade || null,
      estado: formData.state || formData.estado || null,
      updated_at: new Date().toISOString()
    };
  });
}

// Função para salvar leads no Supabase
async function saveLeadsToSupabase(leads) {
  if (leads.length === 0) {
    console.log('ℹ️ Nenhum lead para salvar');
    return;
  }
  
  console.log(`💾 Salvando ${leads.length} leads no Supabase...`);
  
  try {
    const { data, error } = await supabase
      .from('meta_leads')
      .upsert(leads, { onConflict: 'lead_id' });
    
    if (error) {
      console.error('❌ Erro ao salvar leads:', error);
      throw error;
    }
    
    console.log(`✅ ${leads.length} leads salvos/atualizados com sucesso`);
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao salvar leads:', error.message);
    throw error;
  }
}

// Função principal
async function syncLeads() {
  const startTime = Date.now();
  console.log('🚀 Iniciando sincronização otimizada de leads...');
  console.log(`⏰ Período de leads: últimos ${LEADS_DAYS} dias`);
  console.log(`⚙️ Configurações: ${CONCURRENT_REQUESTS} req simultâneas, ${RATE_LIMIT_DELAY}ms delay`);
  
  try {
    // 1. Buscar campanhas ativas do Supabase
    const activeCampaigns = await getActiveCampaignsFromSupabase();
    
    if (activeCampaigns.length === 0) {
      console.log('ℹ️ Nenhuma campanha ativa encontrada');
      return;
    }
    
    // 2. Buscar leads de todas as campanhas ativas
    const campaignIds = activeCampaigns.map(c => c.campaign_id);
    const allLeads = await getLeadsBatch(campaignIds);
    
    console.log(`📊 Total de leads encontrados: ${allLeads.length}`);
    
    // 3. Processar e formatar dados dos leads
    const processedLeads = processLeadsData(allLeads);
    
    // 4. Salvar no Supabase
    await saveLeadsToSupabase(processedLeads);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    console.log(`⏱️ Tempo total: ${duration.toFixed(2)} segundos`);
    console.log(`📊 Resumo:`);
    console.log(`   - Campanhas ativas: ${activeCampaigns.length}`);
    console.log(`   - Leads encontrados: ${allLeads.length}`);
    console.log(`   - Leads processados: ${processedLeads.length}`);
    console.log(`   - Salvos no banco: ${processedLeads.length}`);
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    process.exit(1);
  }
}

// Executar sincronização
syncLeads(); 