require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
-- Tabela para armazenar o status da sincronização
CREATE TABLE IF NOT EXISTS public.sync_status (
  id TEXT PRIMARY KEY,
  last_sync_start TIMESTAMPTZ,
  last_sync_end TIMESTAMPTZ,
  status TEXT NOT NULL,
  error_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Inserir um registro inicial se a tabela estiver vazia
INSERT INTO public.sync_status (id, status)
VALUES ('meta_leads_sync', 'idle')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.sync_status;
CREATE POLICY "Permitir leitura para todos"
ON public.sync_status
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Permitir atualização para service_role" ON public.sync_status;
CREATE POLICY "Permitir atualização para service_role"
ON public.sync_status
FOR UPDATE
USING (auth.role() = 'service_role');
`;

(async () => {
  console.log('🔧 Aplicando migração da tabela sync_status...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erro ao aplicar migração:', error);
      return;
    }
    
    console.log('✅ Migração aplicada com sucesso!');
    
    // Verificar se a tabela foi criada
    const { data, error: checkError } = await supabase
      .from('sync_status')
      .select('*')
      .eq('id', 'meta_leads_sync')
      .single();
    
    if (checkError) {
      console.error('❌ Erro ao verificar tabela:', checkError);
    } else {
      console.log('✅ Tabela sync_status criada e populada:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
})(); 