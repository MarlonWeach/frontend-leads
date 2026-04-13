# 🔧 Correção do Script de Sincronização de Campanhas

## ❌ Problema Identificado

O script estava tentando salvar colunas que não existem na tabela `campaigns`:

**Erro encontrado:**
```
Could not find the 'budget' column of 'campaigns' in the schema cache
```

**Colunas incorretas usadas:**
- ❌ `budget` (não existe - deveria ser `lifetime_budget`)
- ❌ `meta_campaign_id` (não existe)
- ❌ `impressions`, `clicks`, `spend` (não existem na tabela campaigns)
- ❌ `last_meta_sync` (não existe)
- ❌ `created_at` (deveria ser `created_time` da API)
- ❌ `end_time` (deveria ser `stop_time` na tabela)

## ✅ Correções Aplicadas

### 1. `scripts/sync-campaigns-once.js`

**Antes:**
```javascript
{
  id: campaign.id,
  meta_campaign_id: campaign.id,
  budget: campaign.lifetime_budget,
  impressions: insight?.impressions || 0,
  clicks: insight?.clicks || 0,
  spend: insight?.spend || 0,
  created_at: campaign.created_time,
  end_time: campaign.end_time,
  last_meta_sync: new Date().toISOString()
}
```

**Depois:**
```javascript
{
  id: campaign.id,
  name: campaign.name,
  status: campaign.status,
  effective_status: campaign.effective_status || null,
  created_time: campaign.created_time || null,
  updated_time: campaign.updated_time || null,
  objective: campaign.objective || null,
  start_time: campaign.start_time || null,
  stop_time: campaign.end_time || null, // end_time na API = stop_time na tabela
  daily_budget: campaign.daily_budget ? parseInt(campaign.daily_budget) : null,
  lifetime_budget: campaign.lifetime_budget ? parseInt(campaign.lifetime_budget) : null,
  budget_remaining: null,
  spend_cap: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}
```

### 2. Campos Adicionados na Query da API

Adicionado `updated_time` na query da Meta API:
```javascript
fields=id,name,status,effective_status,created_time,updated_time,start_time,end_time,daily_budget,lifetime_budget,objective
```

### 3. Upsert Corrigido

Adicionado `onConflict: 'id'` no upsert:
```javascript
.upsert(campaigns, { onConflict: 'id' });
```

## 📋 Estrutura Correta da Tabela `campaigns`

Colunas que existem na tabela:
- `id` (VARCHAR(255) PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `status` (VARCHAR(50))
- `effective_status` (VARCHAR(50))
- `created_time` (TIMESTAMP WITH TIME ZONE)
- `updated_time` (TIMESTAMP WITH TIME ZONE)
- `objective` (VARCHAR(100))
- `special_ad_categories` (JSONB)
- `special_ad_category_country` (JSONB)
- `start_time` (TIMESTAMP WITH TIME ZONE)
- `stop_time` (TIMESTAMP WITH TIME ZONE)
- `daily_budget` (INTEGER)
- `lifetime_budget` (INTEGER)
- `budget_remaining` (INTEGER)
- `spend_cap` (INTEGER)
- `source_campaign_*` (várias colunas)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

## 🚀 Próximos Passos

Agora você pode executar o script novamente:

```bash
node scripts/sync-campaigns-once.js
```

Ou executar o script completo:

```bash
node scripts/sync-missing-tables.js
```

## ✅ Verificação

Após executar, verifique:

```bash
node scripts/check-tables-data.js
```

A tabela `campaigns` deve ter dados agora.

