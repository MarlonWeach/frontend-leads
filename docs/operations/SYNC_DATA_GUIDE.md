# 🔄 Guia de Sincronização de Dados

## 📋 Visão Geral

Após recriar as tabelas do Supabase, você precisa sincronizar os dados da Meta API para repovoar as tabelas.

## 🚀 Método Rápido (Recomendado)

Execute o script master que faz tudo automaticamente:

```bash
node scripts/sync-all-data.js
```

Este script executa todos os syncs na ordem correta:
1. ✅ Campanhas (campaigns)
2. ✅ Adsets (adsets)
3. ✅ Anúncios (ads)
4. ✅ Insights de Adsets (adset_insights)
5. ✅ Insights de Ads (ad_insights)
6. ✅ Leads (meta_leads)
7. ✅ Criativos (ad_creatives)
8. ✅ Relacionamentos (atualiza FKs)

## 📝 Método Manual (Passo a Passo)

Se preferir executar manualmente ou se algum script falhar:

### Fase 1: Dados Base (Ordem Crítica)

```bash
# 1. Campanhas (base - não depende de nada)
node scripts/sync-campaigns-once.js

# 2. Adsets (depende de campaigns)
node scripts/sync-adsets-once.js

# 3. Anúncios (depende de adsets)
node scripts/sync-ads-once.js
```

### Fase 2: Insights (Dependem dos Dados Base)

```bash
# 4. Insights de Adsets
node scripts/sync-adset-insights.js

# 5. Insights de Ads
node scripts/sync-ad-insights.js
```

### Fase 3: Dados Complementares

```bash
# 6. Leads
node scripts/sync-meta-leads.js

# 7. Criativos (opcional)
node scripts/update-ad-creatives.js

# 8. Relacionamentos (opcional)
node scripts/update-table-relationships.js
```

## ⚙️ Pré-requisitos

Antes de executar, certifique-se de que o arquivo `.env.local` contém:

```env
NEXT_PUBLIC_SUPABASE_URL=seu_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXT_PUBLIC_META_ACCESS_TOKEN=seu_token_meta
NEXT_PUBLIC_META_ACCOUNT_ID=seu_account_id
```

## ⏱️ Tempo Estimado

- **Fase 1 (Dados Base)**: 5-15 minutos
- **Fase 2 (Insights)**: 10-30 minutos (depende do volume)
- **Fase 3 (Complementares)**: 5-10 minutos

**Total**: ~20-55 minutos (depende do volume de dados)

## 🔍 Verificação

Após a sincronização, verifique os dados:

### No Supabase Dashboard

1. Acesse **Table Editor**
2. Verifique as tabelas:
   - `campaigns` - deve ter campanhas
   - `adsets` - deve ter adsets
   - `ads` - deve ter anúncios
   - `adset_insights` - deve ter métricas
   - `ad_insights` - deve ter métricas
   - `meta_leads` - deve ter leads (se aplicável)

### Via SQL

```sql
-- Contar registros por tabela
SELECT 
  'campaigns' as tabela, COUNT(*) as total FROM campaigns
UNION ALL
SELECT 'adsets', COUNT(*) FROM adsets
UNION ALL
SELECT 'ads', COUNT(*) FROM ads
UNION ALL
SELECT 'adset_insights', COUNT(*) FROM adset_insights
UNION ALL
SELECT 'ad_insights', COUNT(*) FROM ad_insights
UNION ALL
SELECT 'meta_leads', COUNT(*) FROM meta_leads
ORDER BY tabela;
```

## ⚠️ Problemas Comuns

### Rate Limiting da Meta API

Se você receber erros 429 (rate limit):

1. **Aguarde alguns minutos** antes de tentar novamente
2. **Execute os scripts individualmente** com intervalos maiores
3. **Reduza o período de dados** nos scripts (altere `TRAFFIC_DAYS`)

### Erro: "relation does not exist"

- Certifique-se de que executou o script de recuperação de tabelas primeiro
- Verifique se todas as migrations foram executadas com sucesso

### Erro: "foreign key constraint"

- Execute os scripts na ordem correta (Fase 1 → Fase 2 → Fase 3)
- Certifique-se de que `campaigns` foi sincronizado antes de `adsets`
- Certifique-se de que `adsets` foi sincronizado antes de `ads`

### Dados Incompletos

- Execute novamente os scripts que falharam
- Verifique os logs para identificar problemas específicos
- Alguns dados podem precisar de múltiplas execuções (ex: insights históricos)

## 🔄 Sincronização Contínua

Após a sincronização inicial, configure a sincronização automática:

### Via GitHub Actions

O projeto já tem um workflow configurado em `.github/workflows/sync-dados-3x-dia.yml` que executa automaticamente 3x ao dia.

### Manualmente

Execute periodicamente:
```bash
# Sincronização rápida (apenas dados recentes)
node scripts/sync-recent-insights.js

# Sincronização completa (quando necessário)
node scripts/sync-all-data.js
```

## 📊 Monitoramento

Após sincronizar, monitore:

1. **Volume de dados**: Verifique se os números fazem sentido
2. **Última sincronização**: Verifique a tabela `sync_status`
3. **Erros**: Verifique os logs dos scripts
4. **Performance**: Verifique se as queries estão rápidas

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs de cada script
2. Execute os scripts individualmente para identificar qual está falhando
3. Verifique as variáveis de ambiente
4. Verifique se o token da Meta API está válido
5. Verifique se o account ID está correto

## 📚 Scripts Disponíveis

| Script | Descrição | Dependências |
|--------|-----------|--------------|
| `sync-campaigns-once.js` | Sincroniza campanhas | Nenhuma |
| `sync-adsets-once.js` | Sincroniza adsets | campaigns |
| `sync-ads-once.js` | Sincroniza anúncios | adsets |
| `sync-adset-insights.js` | Sincroniza insights de adsets | adsets |
| `sync-ad-insights.js` | Sincroniza insights de ads | ads |
| `sync-meta-leads.js` | Sincroniza leads | Nenhuma |
| `update-ad-creatives.js` | Atualiza criativos | ads |
| `update-table-relationships.js` | Atualiza relacionamentos | Todas |

## ✅ Checklist Pós-Sincronização

- [ ] Todas as tabelas têm dados
- [ ] Números de registros fazem sentido
- [ ] Insights estão sendo calculados corretamente
- [ ] Relacionamentos (FKs) estão corretos
- [ ] Dashboard está mostrando dados
- [ ] Sincronização automática está configurada

