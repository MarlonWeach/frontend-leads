import { config } from 'dotenv';
import { resolve } from 'path';
import { MetaLeadsSyncService } from '../src/services/meta/syncLeads';
import { logger } from '../src/utils/logger';

// Carrega variáveis de ambiente do .env.local usando caminho absoluto
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

// Log do caminho do arquivo .env.local (apenas para debug)
logger.info({ msg: 'Carregando variáveis de ambiente de', envPath });

// Verifica variáveis de ambiente necessárias
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'META_ACCESS_TOKEN',
  'META_ACCOUNT_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error({
    msg: 'Variáveis de ambiente necessárias não encontradas',
    missing: missingEnvVars
  });
  process.exit(1);
}

function normalizeAccountId(accountId: string): string {
  if (!accountId) return '';
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

async function getDateRange(): Promise<{ startDate: string; endDate: string }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Últimos 7 dias por padrão

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

async function main() {
  try {
    logger.info('Iniciando script de sincronização de leads do Meta');

    // Log das variáveis de ambiente (sem expor valores sensíveis)
    logger.info({
      msg: 'Configuração do ambiente',
      supabaseUrl: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
      metaAccountId: process.env.META_ACCOUNT_ID ? 'Configurado' : 'Não configurado',
      accessToken: process.env.META_ACCESS_TOKEN ? 'Configurado' : 'Não configurado'
    });

    // Configuração do serviço
    const syncService = new MetaLeadsSyncService({
      accessToken: process.env.META_ACCESS_TOKEN!,
      accountId: normalizeAccountId(process.env.META_ACCOUNT_ID!),
      retryAttempts: 3,
      retryDelay: 1000
    });

    // Obtém período para sincronização
    const { startDate, endDate } = await getDateRange();
    logger.info({ msg: 'Período de sincronização', startDate, endDate });

    // Executa sincronização
    await syncService.syncLeads(startDate, endDate);

    logger.info('Sincronização concluída com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error({ 
      msg: 'Erro durante sincronização', 
      error: error instanceof Error ? error.message : error 
    });
    if (error instanceof Error && error.stack) {
      logger.error({ msg: 'Stack trace', stack: error.stack });
    }
    process.exit(1);
  }
}

// Executa o script
main(); 