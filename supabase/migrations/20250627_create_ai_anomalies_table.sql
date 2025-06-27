-- Criar tabela para armazenar anomalias detectadas pela IA
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