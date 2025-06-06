import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTables() {
  console.log('\n🔍 Verificando tabelas no Supabase...\n');
  
  // Listar todas as tabelas disponíveis
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables', {});
    
  if (tablesError) {
    // Se não funcionar, vamos testar cada tabela individualmente
    console.log('Testando tabelas individualmente...\n');
    
    // Testar campaigns
    const { count: campaignsCount, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ Tabela campaigns:', campaignsError ? `❌ ${campaignsError.message}` : `✓ Existe (${campaignsCount} registros)`);
    
    // Testar adsets
    const { count: adsetsCount, error: adsetsError } = await supabase
      .from('adsets')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ Tabela adsets:', adsetsError ? `❌ ${adsetsError.message}` : `✓ Existe (${adsetsCount} registros)`);
    
    // Testar ads
    const { count: adsCount, error: adsError } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ Tabela ads:', adsError ? `❌ ${adsError.message}` : `✓ Existe (${adsCount} registros)`);
    
    // Testar advertisers (mencionado no erro)
    const { count: advertisersCount, error: advertisersError } = await supabase
      .from('advertisers')
      .select('*', { count: 'exact', head: true });
    
    console.log('✅ Tabela advertisers:', advertisersError ? `❌ ${advertisersError.message}` : `✓ Existe (${advertisersCount} registros)`);
  }
  
  console.log('\n📊 Teste concluído!\n');
  process.exit(0);
}

testTables().catch(console.error);
