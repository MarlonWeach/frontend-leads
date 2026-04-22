-- Criar tabela cache_stats para monitoramento de performance
CREATE TABLE IF NOT EXISTS cache_stats (
  id SERIAL PRIMARY KEY,
  cache_type TEXT NOT NULL,
  hits INTEGER DEFAULT 0,
  misses INTEGER DEFAULT 0,
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cache_stats_type ON cache_stats(cache_type);
CREATE INDEX IF NOT EXISTS idx_cache_stats_created_at ON cache_stats(created_at);

-- Inserir dados iniciais
INSERT INTO cache_stats (cache_type, hits, misses, size_bytes) VALUES
  ('general', 150, 25, 1024000),
  ('api', 89, 12, 512000),
  ('dashboard', 234, 45, 2048000)
ON CONFLICT DO NOTHING;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_cache_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_cache_stats_updated_at ON cache_stats;
CREATE TRIGGER trigger_update_cache_stats_updated_at
  BEFORE UPDATE ON cache_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_stats_updated_at(); 