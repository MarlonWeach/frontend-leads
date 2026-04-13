# 🔄 Sincronizar Tabelas Faltantes

## 📋 Situação

Algumas tabelas foram sincronizadas, mas outras estão vazias. Este guia ajuda a sincronizar apenas as tabelas faltantes.

## 🔍 Verificar Status Atual

Primeiro, verifique quais tabelas estão vazias:

```bash
node scripts/check-tables-data.js
```

## 🚀 Sincronizar Tabelas Faltantes

Execute o script que sincroniza apenas as tabelas vazias:

```bash
node scripts/sync-missing-tables.js
```

Este script executa na ordem correta:
1. ✅ **campaigns** (crítico - base para tudo)
2. ✅ **ads** (crítico - depende de adsets)
3. ✅ **ad_insights** (depende de ads)
4. ✅ **meta_leads** (dados de leads)
5. ✅ **ad_creatives** (criativos dos anúncios)

## 📝 Execução Manual (Se Preferir)

Se o script automático falhar, execute manualmente na ordem:

### 1. Campanhas (CRÍTICO)

```bash
node scripts/sync-campaigns-once.js
```

**Por que é crítico:** Todas as outras tabelas dependem de campaigns.

### 2. Anúncios (CRÍTICO)

```bash
node scripts/sync-ads-once.js
```

**Por que é crítico:** Ad_insights depende de ads.

**Nota:** Adsets já foi sincronizado (438 registros), então ads pode ser executado.

### 3. Insights de Ads

```bash
node scripts/sync-ad-insights.js
```

**Depende de:** ads

### 4. Leads

```bash
node scripts/sync-meta-leads.js
```

**Independente:** Pode ser executado a qualquer momento.

### 5. Criativos

```bash
node scripts/update-ad-creatives.js
```

**Depende de:** ads

## ⚠️ Tabelas que NÃO Precisam Sincronização

Estas tabelas são preenchidas por uso do sistema, não por sincronização:

- `adset_goals` - Preencher manualmente via interface
- `ai_analysis_logs` - Preenchido quando usar análises de IA
- `ai_anomalies` - Preenchido quando detectar anomalias
- `audit_logs` - Preenchido por scripts de auditoria

## 🔍 Verificação Pós-Sincronização

Após executar os scripts, verifique novamente:

```bash
node scripts/check-tables-data.js
```

Você deve ver dados em:
- ✅ campaigns
- ✅ ads
- ✅ ad_insights
- ✅ meta_leads (se aplicável)
- ✅ ad_creatives

## ⚠️ Problemas Comuns

### Erro: "campaigns não existe"
- Certifique-se de que executou o script de recuperação de tabelas
- Verifique se a tabela foi criada no Supabase

### Erro: "foreign key constraint"
- Execute na ordem: campaigns → ads → ad_insights
- Certifique-se de que adsets já foi sincronizado

### Rate Limiting (429)
- Aguarde alguns minutos
- Execute os scripts individualmente com intervalos maiores

### Dados Incompletos
- Execute novamente os scripts que falharam
- Verifique os logs para identificar problemas

## 📊 Ordem de Dependências

```
campaigns (base)
    ↓
adsets ✅ (já sincronizado)
    ↓
ads (precisa sincronizar)
    ↓
ad_insights (precisa sincronizar)
    ↓
ad_creatives (precisa sincronizar)

meta_leads (independente - pode sincronizar a qualquer momento)
```

## ✅ Checklist

- [ ] Verificou quais tabelas estão vazias
- [ ] Executou sync-campaigns-once.js
- [ ] Executou sync-ads-once.js
- [ ] Executou sync-ad-insights.js
- [ ] Executou sync-meta-leads.js (se aplicável)
- [ ] Executou update-ad-creatives.js
- [ ] Verificou novamente com check-tables-data.js
- [ ] Todas as tabelas críticas têm dados

