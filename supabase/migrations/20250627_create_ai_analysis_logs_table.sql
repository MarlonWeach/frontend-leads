-- Criar tabela para logs de análise de IA
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