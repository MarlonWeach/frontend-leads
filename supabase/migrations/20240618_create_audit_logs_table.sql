-- Criação da tabela audit_logs para armazenar resultados de auditorias diárias
-- Data: 2024-06-18

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  has_discrepancies BOOLEAN NOT NULL,
  discrepancies_count INTEGER DEFAULT 0,
  meta_leads INTEGER DEFAULT 0,
  supabase_leads INTEGER DEFAULT 0,
  meta_spend DECIMAL(15,2) DEFAULT 0,
  supabase_spend DECIMAL(15,2) DEFAULT 0,
  meta_impressions BIGINT DEFAULT 0,
  supabase_impressions BIGINT DEFAULT 0,
  meta_clicks INTEGER DEFAULT 0,
  supabase_clicks INTEGER DEFAULT 0,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_range ON audit_logs(date_from, date_to);
CREATE INDEX IF NOT EXISTS idx_audit_logs_discrepancies ON audit_logs(has_discrepancies);

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Logs de auditoria diária comparando dados do Supabase com Meta API';
COMMENT ON COLUMN audit_logs.has_discrepancies IS 'Indica se foram encontradas divergências entre os sistemas';
COMMENT ON COLUMN audit_logs.discrepancies_count IS 'Número de métricas com divergências';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes das divergências encontradas em formato JSON'; 