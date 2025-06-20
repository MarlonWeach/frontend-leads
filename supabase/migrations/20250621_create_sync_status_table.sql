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