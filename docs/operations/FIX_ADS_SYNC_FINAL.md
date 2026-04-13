# 🔧 Correções Finais dos Scripts de Sincronização

## ❌ Problemas Identificados

### 1. Script `sync-ads-once.js`
**Erro:** `Could not find the 'creative' column of 'ads' in the schema cache`

**Causa:** O script estava tentando salvar uma coluna `creative` que não existe na tabela `ads`.

### 2. Script `update-ad-creatives.js`
**Erro:** `column ads.creative does not exist`

**Causa:** O script estava tentando atualizar uma coluna `creative` que não existe na tabela `ads`.

## ✅ Correções Aplicadas

### 1. `scripts/sync-ads-once.js`

**Removido:**
- ❌ `creative: ad.creative ? JSON.stringify(ad.creative) : null`
- ❌ `leads_count: 0` (coluna não existe)

**Adicionado:**
- ✅ `effective_status: ad.effective_status || null`
- ✅ `created_time: ad.created_time || null`
- ✅ `updated_time: ad.updated_time || null`
- ✅ `leads: 0` (coluna correta)
- ✅ `frequency: 0`
- ✅ `created_at` e `updated_at`

**Query da API atualizada:**
- Removido `creative` dos campos
- Adicionado `effective_status`, `created_time`, `updated_time`

### 2. `scripts/update-ad-creatives.js`

**Mudança de abordagem:**
- ❌ Antes: Tentava atualizar coluna `creative` na tabela `ads`
- ✅ Agora: Salva na tabela `ad_creatives` (tabela separada)

**Correções:**
- Removido `creative` do select
- Verifica se já existe creative na tabela `ad_creatives`
- Salva dados do criativo na tabela `ad_creatives` com todos os campos corretos
- Usa `upsert` com `onConflict: 'ad_id'`

## 📋 Estrutura Correta

### Tabela `ads`
**Colunas que existem:**
- `id`, `name`, `status`, `effective_status`
- `adset_id`, `campaign_id`
- `created_time`, `updated_time`
- `spend`, `impressions`, `clicks`
- `ctr`, `cpc`, `cpm`, `leads`, `frequency`
- `created_at`, `updated_at`
- Campos de criativo individuais (creative_type, creative_text, etc.)

**Colunas que NÃO existem:**
- ❌ `creative` (JSON)
- ❌ `leads_count`

### Tabela `ad_creatives`
**Colunas:**
- `id` (SERIAL PRIMARY KEY)
- `ad_id` (VARCHAR(255) UNIQUE) - Foreign key para `ads(id)`
- `creative_id`, `title`, `body`, `image_url`, etc.
- `raw_creative_data` (JSONB)

## 🚀 Próximos Passos

Agora você pode executar os scripts novamente:

```bash
# Opção 1: Script completo
node scripts/sync-missing-tables.js

# Opção 2: Individual
node scripts/sync-ads-once.js
node scripts/update-ad-creatives.js
```

## ✅ Verificação

Após executar, verifique:

```bash
node scripts/check-tables-data.js
```

As tabelas `ads` e `ad_creatives` devem ter dados agora.

