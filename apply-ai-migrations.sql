-- Aplicar migrações das tabelas de IA
-- Este script deve ser executado no Supabase Dashboard > SQL Editor

-- 1. Criar tabela ai_analysis_logs
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type TEXT NOT NULL, -- 'performance', 'anomalies', 'optimization', 'chat'
  campaign_ids TEXT[], -- IDs das campanhas analisadas
  date_range JSONB, -- Período analisado
  tokens_used INTEGER, -- Tokens estimados utilizados
  cost_estimated DECIMAL(10,4), -- Custo estimado
  model_used TEXT DEFAULT 'gpt-4', -- Modelo utilizado
  status TEXT DEFAULT 'completed', -- 'completed', 'error', 'processing'
  error_message TEXT, -- Mensagem de erro se houver
  metadata JSONB, -- Dados adicionais
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_created_at ON ai_analysis_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_analysis_type ON ai_analysis_logs(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_status ON ai_analysis_logs(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_analysis_logs_updated_at 
  BEFORE UPDATE ON ai_analysis_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE ai_analysis_logs IS 'Log de análises de IA realizadas para monitoramento de uso e custos';
COMMENT ON COLUMN ai_analysis_logs.analysis_type IS 'Tipo de análise: performance, anomalies, optimization, chat';
COMMENT ON COLUMN ai_analysis_logs.tokens_used IS 'Estimativa de tokens utilizados na análise';
COMMENT ON COLUMN ai_analysis_logs.cost_estimated IS 'Custo estimado da análise em USD';

-- 2. Criar tabela ai_anomalies
CREATE TABLE IF NOT EXISTS ai_anomalies (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    affected_campaigns TEXT[] DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_type ON ai_anomalies(type);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_severity ON ai_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_created_at ON ai_anomalies(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_resolved ON ai_anomalies(resolved);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_confidence ON ai_anomalies(confidence);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_anomalies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_anomalies_updated_at
    BEFORE UPDATE ON ai_anomalies
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_anomalies_updated_at();

-- Comentários na tabela e colunas
COMMENT ON TABLE ai_anomalies IS 'Anomalias detectadas pelo sistema de IA';
COMMENT ON COLUMN ai_anomalies.id IS 'Identificador único da anomalia';
COMMENT ON COLUMN ai_anomalies.type IS 'Tipo de anomalia (HIGH_CONVERSION_RATE, SUSPICIOUS_TRAFFIC, etc.)';
COMMENT ON COLUMN ai_anomalies.severity IS 'Nível de severidade da anomalia';
COMMENT ON COLUMN ai_anomalies.title IS 'Título da anomalia';
COMMENT ON COLUMN ai_anomalies.description IS 'Descrição detalhada da anomalia';
COMMENT ON COLUMN ai_anomalies.confidence IS 'Nível de confiança na detecção (0-1)';
COMMENT ON COLUMN ai_anomalies.affected_campaigns IS 'Array com nomes das campanhas afetadas';
COMMENT ON COLUMN ai_anomalies.metrics IS 'Métricas relacionadas à anomalia (JSON)';
COMMENT ON COLUMN ai_anomalies.recommendations IS 'Array com recomendações para resolver a anomalia';
COMMENT ON COLUMN ai_anomalies.resolved IS 'Se a anomalia foi marcada como resolvida';
COMMENT ON COLUMN ai_anomalies.resolved_at IS 'Timestamp de quando foi resolvida';
COMMENT ON COLUMN ai_anomalies.resolved_by IS 'Usuário que marcou como resolvida';

-- 3. Inserir dados de teste para validação
INSERT INTO ai_analysis_logs (
  analysis_type, 
  campaign_ids, 
  date_range, 
  tokens_used, 
  cost_estimated, 
  model_used, 
  status,
  metadata
) VALUES (
  'performance',
  ARRAY['test-campaign-1', 'test-campaign-2'],
  '{"startDate": "2025-01-01", "endDate": "2025-01-07"}',
  150,
  0.0045,
  'gpt-4',
  'completed',
  '{"test": true, "source": "migration"}'
) ON CONFLICT DO NOTHING;

-- Verificar se as tabelas foram criadas
SELECT 
  'ai_analysis_logs' as table_name,
  COUNT(*) as record_count
FROM ai_analysis_logs
UNION ALL
SELECT 
  'ai_anomalies' as table_name,
  COUNT(*) as record_count
FROM ai_anomalies; 