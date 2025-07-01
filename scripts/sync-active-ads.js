#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const pino = require('pino');

// Configuração do logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração da Meta API
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_ACCOUNT_ID = process.env.META_ACCOUNT_ID;

// Constantes
const BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 segundos

/**
 * Busca anúncios ativos da Meta API
 */
async function fetchActiveAdsFromMeta() {
  logger.info('Iniciando busca de anúncios ativos da Meta API');
  
  const activeAds = [];
  let after = null;
  let retryCount = 0;
  
  try {
    do {
      const url = new URL(`https://graph.facebook.com/v18.0/act_${META_ACCOUNT_ID}/ads`);
      url.searchParams.append('access_token', META_ACCESS_TOKEN);
      url.searchParams.append('fields', 'id,name,status,effective_status,adset_id,campaign_id,created_time,updated_time');
      url.searchParams.append('effective_status', 'ACTIVE');
      url.searchParams.append('limit', BATCH_SIZE);
      
      if (after) {
        url.searchParams.append('after', after);
      }
      
      logger.info(`Fazendo requisição para Meta API: ${url.toString()}`);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Erro na Meta API: ${response.status} - ${errorText}`);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          logger.info(`Tentativa ${retryCount} de ${MAX_RETRIES}. Aguardando ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        } else {
          throw new Error(`Falha na Meta API após ${MAX_RETRIES} tentativas`);
        }
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        activeAds.push(...data.data);
        logger.info(`Recebidos ${data.data.length} anúncios ativos`);
      }
      
      // Verificar se há mais páginas
      if (data.paging && data.paging.cursors && data.paging.cursors.after) {
        after = data.paging.cursors.after;
      } else {
        after = null;
      }
      
      // Rate limiting - aguardar entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } while (after);
    
    logger.info(`Total de anúncios ativos encontrados: ${activeAds.length}`);
    return activeAds;
    
  } catch (error) {
    logger.error('Erro ao buscar anúncios ativos da Meta API:', error);
    throw error;
  }
}

/**
 * Atualiza status dos anúncios no Supabase
 */
async function updateAdsStatusInSupabase(activeAds) {
  logger.info('Iniciando atualização de status dos anúncios no Supabase');
  
  try {
    // Primeiro, marcar todos os anúncios como inativos
    const { error: deactivateError } = await supabase
      .from('ads')
      .update({ 
        effective_status: 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .neq('effective_status', 'INACTIVE');
    
    if (deactivateError) {
      logger.error('Erro ao desativar anúncios:', deactivateError);
      throw deactivateError;
    }
    
    logger.info('Todos os anúncios foram marcados como inativos');
    
    // Agora, atualizar apenas os anúncios ativos
    const activeAdIds = activeAds.map(ad => ad.id);
    
    if (activeAdIds.length > 0) {
      const { error: activateError } = await supabase
        .from('ads')
        .update({ 
          effective_status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .in('ad_id', activeAdIds);
      
      if (activateError) {
        logger.error('Erro ao ativar anúncios:', activateError);
        throw activateError;
      }
      
      logger.info(`${activeAdIds.length} anúncios foram marcados como ativos`);
    }
    
    // Inserir novos anúncios que não existem no banco
    const newAds = [];
    for (const ad of activeAds) {
      const { data: existingAd } = await supabase
        .from('ads')
        .select('id')
        .eq('ad_id', ad.id)
        .single();
      
      if (!existingAd) {
        newAds.push({
          ad_id: ad.id,
          name: ad.name,
          status: ad.status,
          effective_status: ad.effective_status,
          adset_id: ad.adset_id,
          campaign_id: ad.campaign_id,
          created_time: ad.created_time,
          updated_time: ad.updated_time,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    if (newAds.length > 0) {
      const { error: insertError } = await supabase
        .from('ads')
        .insert(newAds);
      
      if (insertError) {
        logger.error('Erro ao inserir novos anúncios:', insertError);
        throw insertError;
      }
      
      logger.info(`${newAds.length} novos anúncios foram inseridos`);
    }
    
    logger.info('Atualização de status dos anúncios concluída com sucesso');
    
  } catch (error) {
    logger.error('Erro ao atualizar status dos anúncios no Supabase:', error);
    throw error;
  }
}

/**
 * Atualiza métricas agregadas baseadas em anúncios ativos
 */
async function updateAggregatedMetrics() {
  logger.info('Iniciando atualização de métricas agregadas');
  
  try {
    // Atualizar métricas de campanhas
    const { error: campaignsError } = await supabase.rpc('update_campaign_metrics_from_active_ads');
    if (campaignsError) {
      logger.error('Erro ao atualizar métricas de campanhas:', campaignsError);
    } else {
      logger.info('Métricas de campanhas atualizadas');
    }
    
    // Atualizar métricas de adsets
    const { error: adsetsError } = await supabase.rpc('update_adset_metrics_from_active_ads');
    if (adsetsError) {
      logger.error('Erro ao atualizar métricas de adsets:', adsetsError);
    } else {
      logger.info('Métricas de adsets atualizadas');
    }
    
    // Atualizar métricas de ads
    const { error: adsError } = await supabase.rpc('update_ad_metrics_from_active_ads');
    if (adsError) {
      logger.error('Erro ao atualizar métricas de ads:', adsError);
    } else {
      logger.info('Métricas de ads atualizadas');
    }
    
    logger.info('Atualização de métricas agregadas concluída');
    
  } catch (error) {
    logger.error('Erro ao atualizar métricas agregadas:', error);
    throw error;
  }
}

/**
 * Registra status da sincronização
 */
async function logSyncStatus(success, details = {}) {
  try {
    const { error } = await supabase
      .from('sync_status')
      .insert({
        sync_type: 'active_ads',
        status: success ? 'success' : 'error',
        details: details,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      logger.error('Erro ao registrar status da sincronização:', error);
    } else {
      logger.info('Status da sincronização registrado');
    }
    
  } catch (error) {
    logger.error('Erro ao registrar status da sincronização:', error);
  }
}

/**
 * Função principal
 */
async function main() {
  const startTime = Date.now();
  logger.info('=== Iniciando sincronização de anúncios ativos ===');
  
  try {
    // Verificar variáveis de ambiente
    if (!META_ACCESS_TOKEN || !META_ACCOUNT_ID) {
      throw new Error('Variáveis de ambiente META_ACCESS_TOKEN e META_ACCOUNT_ID são obrigatórias');
    }
    
    // Buscar anúncios ativos da Meta API
    const activeAds = await fetchActiveAdsFromMeta();
    
    // Atualizar status no Supabase
    await updateAdsStatusInSupabase(activeAds);
    
    // Atualizar métricas agregadas
    await updateAggregatedMetrics();
    
    const duration = Date.now() - startTime;
    logger.info(`=== Sincronização concluída com sucesso em ${duration}ms ===`);
    
    // Registrar sucesso
    await logSyncStatus(true, {
      activeAdsCount: activeAds.length,
      duration: duration
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`=== Sincronização falhou após ${duration}ms ===`);
    logger.error('Erro:', error);
    
    // Registrar erro
    await logSyncStatus(false, {
      error: error.message,
      duration: duration
    });
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    logger.error('Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  fetchActiveAdsFromMeta,
  updateAdsStatusInSupabase,
  updateAggregatedMetrics,
  logSyncStatus
}; 