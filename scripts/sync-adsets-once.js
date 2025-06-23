require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('🔄 Iniciando sincronização única de adsets...');
  
  try {
    // Import dinâmico para o módulo TypeScript
    const { syncAdsets } = await import('../src/jobs/sync-adsets.ts');
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