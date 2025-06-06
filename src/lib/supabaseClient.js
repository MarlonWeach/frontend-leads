import { createClient } from '@supabase/supabase-js';

// Pegue essas variáveis do seu projeto Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
  console.log('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Função auxiliar para testar a conexão
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}