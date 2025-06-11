require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Variáveis de Ambiente Carregadas:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '***** (presente)' : 'NÃO DEFINIDO');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***** (presente)' : 'NÃO DEFINIDO');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  console.log('Consultando a tabela meta_leads...');
  const { data, error } = await supabase.from('meta_leads').select('created_time, lead_count').limit(50).order('created_time', { ascending: false });
  if (error) {
    console.error('Erro ao consultar meta_leads:', error);
  } else {
    console.log('Dados da meta_leads (50 registros mais recentes):', data);
  }
})();