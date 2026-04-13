# 🔄 Guia de Recuperação de Tabelas do Supabase

## ⚠️ Situação

As tabelas do Supabase foram deletadas acidentalmente ao iniciar outro projeto Cursor que usa o mesmo projeto Supabase.

## 🎯 Solução

### Opção 1: Restaurar via Backup (RECOMENDADO - se houver backup)

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Verifique Backups Disponíveis**
   - No menu lateral, vá em **Settings** > **Database** > **Backups**
   - Verifique se há backups automáticos disponíveis
   - Os backups do Supabase são feitos automaticamente diariamente

3. **Restaure o Backup**
   - Se houver backup, clique em **Restore** no backup mais recente
   - Isso restaurará TODAS as tabelas e DADOS

### Opção 2: Recriar Estrutura via SQL (se não houver backup)

Se não houver backup disponível, você pode recriar a estrutura das tabelas usando o script SQL gerado:

1. **Gerar o Script SQL de Recuperação**
   ```bash
   node scripts/restore-supabase-tables.js --generate-sql
   ```
   
   Isso criará o arquivo `supabase-recovery.sql` na raiz do projeto.

2. **Executar no Supabase Dashboard**
   - Abra o Supabase Dashboard
   - Vá em **SQL Editor**
   - Clique em **New query**
   - Abra o arquivo `supabase-recovery.sql` e cole todo o conteúdo
   - Clique em **Run** (ou pressione Ctrl+Enter)
   - Aguarde a execução (pode levar alguns minutos)

3. **Verificar Tabelas Criadas**
   - Vá em **Table Editor** no menu lateral
   - Verifique se todas as tabelas foram criadas:
     - `campaigns`
     - `adsets`
     - `ads`
     - `ad_insights`
     - `adset_insights`
     - `meta_leads`
     - `adset_goals`
     - `ai_analysis_logs`
     - `ai_anomalies`
     - E outras...

4. **Repovoar Dados da Meta API**
   
   Após recriar a estrutura, execute os scripts de sincronização para repovoar os dados:
   
   ```bash
   # Sincronizar campanhas
   node scripts/sync-campaigns-once.js
   
   # Sincronizar adsets
   node scripts/sync-adsets-once.js
   
   # Sincronizar anúncios
   node scripts/sync-ads-once.js
   
   # Sincronizar leads (se aplicável)
   node scripts/sync-meta-leads.js
   ```

## 📋 Tabelas Principais que Serão Recriadas

### Tabelas Core
- `campaigns` - Campanhas da Meta API
- `adsets` - Conjuntos de anúncios
- `ads` - Anúncios individuais
- `meta_leads` - Leads capturados

### Tabelas de Insights
- `ad_insights` - Métricas diárias de anúncios
- `adset_insights` - Métricas diárias de adsets

### Tabelas de Sistema
- `sync_status` - Status de sincronização
- `audit_logs` - Logs de auditoria
- `cache_stats` - Estatísticas de cache

### Tabelas de IA
- `ai_analysis_logs` - Logs de análises de IA
- `ai_anomalies` - Anomalias detectadas

### Tabelas de Metas
- `adset_goals` - Metas contratuais por adset
- `adset_progress_tracking` - Acompanhamento de progresso
- `adset_progress_alerts` - Alertas de progresso
- `adset_budget_adjustments` - Ajustes de orçamento

### Tabelas de Alertas
- `alert_rules` - Regras de alerta
- `alerts` - Alertas gerados
- `alert_notifications` - Notificações de alerta

### Tabelas Auxiliares
- `ad_creatives` - Dados de criativos
- `meta_activity_logs` - Logs de atividade
- E outras...

## ⚠️ Importante

1. **Dados Perdidos**: Se não houver backup, os dados históricos serão perdidos. Apenas a estrutura será recriada.

2. **Sincronização**: Após recriar a estrutura, você precisará executar os scripts de sincronização para repovoar os dados da Meta API.

3. **Projetos Separados**: Para evitar que isso aconteça novamente, considere:
   - Usar projetos Supabase separados para cada projeto Cursor
   - Ou usar schemas diferentes no mesmo projeto Supabase
   - Ou usar prefixos diferentes nas tabelas

## 🔍 Verificação Pós-Recuperação

Após executar a recuperação, verifique:

1. **Estrutura das Tabelas**
   ```sql
   -- No SQL Editor do Supabase
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Contagem de Registros** (após sincronização)
   ```sql
   SELECT 
     'campaigns' as tabela, COUNT(*) as registros FROM campaigns
   UNION ALL
   SELECT 'adsets', COUNT(*) FROM adsets
   UNION ALL
   SELECT 'ads', COUNT(*) FROM ads
   UNION ALL
   SELECT 'ad_insights', COUNT(*) FROM ad_insights
   UNION ALL
   SELECT 'adset_insights', COUNT(*) FROM adset_insights;
   ```

## 🆘 Problemas Comuns

### Erro: "relation already exists"
- Algumas tabelas podem já existir. O script usa `CREATE TABLE IF NOT EXISTS`, então isso não deve ser um problema.

### Erro: "foreign key constraint"
- Execute as migrations na ordem correta (o script já faz isso).
- Certifique-se de que as tabelas base (`campaigns`, `adsets`, `ads`) sejam criadas antes das tabelas de insights.

### Erro: "permission denied"
- Certifique-se de estar usando a `SUPABASE_SERVICE_ROLE_KEY` (não a anon key).
- Verifique as permissões no Supabase Dashboard.

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Supabase Dashboard > Logs
2. Execute as migrations uma por uma para identificar qual está falhando
3. Verifique se todas as dependências estão criadas

