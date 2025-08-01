-- Habilitar RLS nas tabelas públicas para resolver erros de segurança
-- Data: 2025-01-30

-- Habilitar RLS na tabela ad_creatives
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela meta_activity_logs
ALTER TABLE public.meta_activity_logs ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela adset_goals
ALTER TABLE public.adset_goals ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para ad_creatives
-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow read access to ad_creatives" ON public.ad_creatives
    FOR SELECT USING (true);

-- Permitir inserção/atualização apenas para usuários autenticados
CREATE POLICY "Allow insert/update access to ad_creatives" ON public.ad_creatives
    FOR ALL USING (auth.role() = 'authenticated');

-- Criar políticas de acesso para meta_activity_logs
-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow read access to meta_activity_logs" ON public.meta_activity_logs
    FOR SELECT USING (true);

-- Permitir inserção apenas para usuários autenticados
CREATE POLICY "Allow insert access to meta_activity_logs" ON public.meta_activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar políticas de acesso para adset_goals
-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow read access to adset_goals" ON public.adset_goals
    FOR SELECT USING (true);

-- Permitir inserção/atualização apenas para usuários autenticados
CREATE POLICY "Allow insert/update access to adset_goals" ON public.adset_goals
    FOR ALL USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.ad_creatives IS 'Dados de criativos de anúncios com RLS habilitado';
COMMENT ON TABLE public.meta_activity_logs IS 'Logs de atividade da Meta API com RLS habilitado';
COMMENT ON TABLE public.adset_goals IS 'Metas e objetivos dos adsets com RLS habilitado'; 