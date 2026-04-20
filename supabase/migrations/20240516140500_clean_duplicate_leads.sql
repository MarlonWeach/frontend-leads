-- Função para limpar leads duplicados
CREATE OR REPLACE FUNCTION clean_duplicate_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove registros duplicados mantendo apenas o mais recente
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY created_time, ad_id
             ORDER BY created_at DESC
           ) as rn
    FROM meta_leads
  )
  DELETE FROM meta_leads
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );

  -- Log da operação
  INSERT INTO sync_logs (
    operation,
    status,
    details,
    created_at
  ) VALUES (
    'clean_duplicate_leads',
    'success',
    jsonb_build_object(
      'message', 'Limpeza de leads duplicados concluída',
      'timestamp', now()
    ),
    now()
  );
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION clean_duplicate_leads IS 'Remove registros duplicados da tabela meta_leads mantendo apenas o registro mais recente para cada combinação de created_time e ad_id';

-- Tabela de logs de sincronização (se não existir)
CREATE TABLE IF NOT EXISTS sync_logs (
  id BIGSERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_operation ON sync_logs(operation);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);

-- Comentários
COMMENT ON TABLE sync_logs IS 'Registra operações de sincronização e limpeza de dados';
COMMENT ON COLUMN sync_logs.operation IS 'Nome da operação executada';
COMMENT ON COLUMN sync_logs.status IS 'Status da operação (success/error)';
COMMENT ON COLUMN sync_logs.details IS 'Detalhes adicionais da operação em formato JSON';
COMMENT ON COLUMN sync_logs.created_at IS 'Data e hora da operação'; 