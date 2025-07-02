require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Variáveis de Ambiente Carregadas:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '***** (presente)' : 'NÃO DEFINIDO');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '***** (presente)' : 'NÃO DEFINIDO');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  console.log('Verificando se a tabela sync_status existe...');
  
  try {
    const { data, error } = await supabase.from('sync_status').select('*');
  if (error) {
      console.error('Erro ao consultar sync_status:', error);
      
      // Tentar criar a tabela se não existir
      console.log('Tentando criar a tabela sync_status...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS sync_status (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            last_sync_start TIMESTAMP WITH TIME ZONE,
            last_sync_end TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.error('Erro ao criar tabela sync_status:', createError);
      } else {
        console.log('Tabela sync_status criada com sucesso!');
        
        // Inserir registro inicial
        const { error: insertError } = await supabase.from('sync_status').insert({
          id: 'meta_leads_sync',
          status: 'not_initialized',
          last_sync_start: null,
          last_sync_end: null,
          error_message: null
        });
        
        if (insertError) {
          console.error('Erro ao inserir registro inicial:', insertError);
        } else {
          console.log('Registro inicial inserido com sucesso!');
        }
      }
  } else {
      console.log('Tabela sync_status existe e contém dados:', data);
    }
  } catch (err) {
    console.error('Erro geral:', err);
  }
})();