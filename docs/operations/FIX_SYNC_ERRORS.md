# 🔧 Correções Aplicadas nos Scripts de Sincronização

## ❌ Problema Identificado

Os scripts estavam tentando usar `ad_id` como chave primária, mas a tabela `ads` usa `id` como chave primária.

**Erro encontrado:**
```
Could not find the 'ad_id' column of 'ads' in the schema cache
```

## ✅ Correções Aplicadas

### 1. `scripts/sync-ads-once.js`
- ✅ Corrigido `onConflict: 'ad_id'` → `onConflict: 'id'`
- ✅ Corrigido `ad_id: ad.id` → `id: ad.id` no objeto de inserção
- ✅ Corrigido referências a `i.ad_id` → `i.id` nos insights

### 2. `scripts/sync-ad-insights.js`
- ✅ Corrigido `select('ad_id, ...')` → `select('id, ...')`
- ✅ Corrigido `ad.ad_id` → `ad.id` nas referências
- ✅ Mantido `ad_id` na tabela `ad_insights` (correto - é foreign key)

### 3. `scripts/update-ad-creatives.js`
- ✅ Corrigido `select('ad_id, ...')` → `select('id, ...')`
- ✅ Corrigido `ad.ad_id` → `ad.id` nas referências
- ✅ Corrigido `.eq('ad_id', ad.ad_id)` → `.eq('id', ad.id)`

## 📋 Estrutura Correta das Tabelas

### Tabela `ads`
- **Chave primária:** `id` (VARCHAR(255))
- **Colunas:** `id`, `name`, `status`, `adset_id`, `campaign_id`, etc.

### Tabela `ad_insights`
- **Chave primária:** `id` (SERIAL)
- **Foreign key:** `ad_id` → `ads(id)`
- **Unique constraint:** `(ad_id, date)`

## 🚀 Próximos Passos

Agora você pode executar os scripts novamente:

```bash
# Executar sincronização das tabelas faltantes
node scripts/sync-missing-tables.js
```

Ou executar individualmente:

```bash
# 1. Campanhas
node scripts/sync-campaigns-once.js

# 2. Anúncios (agora corrigido)
node scripts/sync-ads-once.js

# 3. Insights de Ads (agora corrigido)
node scripts/sync-ad-insights.js

# 4. Criativos (agora corrigido)
node scripts/update-ad-creatives.js
```

## ✅ Verificação

Após executar, verifique:

```bash
node scripts/check-tables-data.js
```

Todas as tabelas críticas devem ter dados agora.

