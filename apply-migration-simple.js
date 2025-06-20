require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  console.log('🔧 Aplicando migração da tabela sync_status...');
  
  try {
    // 1. Criar a tabela
    console.log('1️⃣ Criando tabela sync_status...');
    const { error: createError } = await supabase
      .from('sync_status')
      .select('*')
      .limit(1);
    
    if (createError && createError.code === '42P01') {
      // Tabela não existe, vamos criar manualmente
      console.log('Tabela não existe, criando...');
      // Como não podemos executar DDL via Supabase client, vamos pular por agora
      console.log('⚠️  Tabela sync_status não pode ser criada via cliente. Pulemos por enquanto.');
    }
    
    // 2. Verificar se já existe algum registro
    console.log('2️⃣ Verificando registros existentes...');
    const { data: existing, error: selectError } = await supabase
      .from('sync_status')
      .select('*')
      .eq('id', 'meta_leads_sync');
    
    if (selectError) {
      console.log('❌ Erro ao verificar registros:', selectError.message);
      console.log('⚠️  Vamos continuar sem a tabela sync_status por enquanto.');
      return;
    }
    
    if (existing && existing.length > 0) {
      console.log('✅ Registro já existe:', existing[0]);
    } else {
      console.log('3️⃣ Inserindo registro inicial...');
      const { data: insertData, error: insertError } = await supabase
        .from('sync_status')
        .insert({
          id: 'meta_leads_sync',
          status: 'idle',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir registro:', insertError);
      } else {
        console.log('✅ Registro inserido:', insertData);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
})(); 