# Operações: Supabase, sync Meta e recuperação

Documentação de apoio para **recuperação de dados**, **sincronização manual** e **permissões Graph API**. O fluxo automatizado de produção está em `.github/workflows/sync-dados-3x-dia.yml`.

## Documentos

| Arquivo | Uso |
|--------|-----|
| [SUPABASE_RECOVERY_INSTRUCTIONS.md](./SUPABASE_RECOVERY_INSTRUCTIONS.md) | Passo a passo para rodar SQL de recuperação no Supabase sem erro de sintaxe |
| [SUPABASE_RECOVERY_GUIDE.md](./SUPABASE_RECOVERY_GUIDE.md) | Guia amplo de recuperação de tabelas |
| [SYNC_DATA_GUIDE.md](./SYNC_DATA_GUIDE.md) | Visão geral da sincronização de dados |
| [SYNC_MISSING_TABLES.md](./SYNC_MISSING_TABLES.md) | Tabelas ausentes e como alinhar |
| [META_LEADS_GRAPH_PERMISSIONS.md](./META_LEADS_GRAPH_PERMISSIONS.md) | Permissões necessárias para leads na Graph API |

### Histórico de incidentes (referência)

| Arquivo | Conteúdo |
|---------|----------|
| [FIX_ADS_SYNC_FINAL.md](./FIX_ADS_SYNC_FINAL.md) | Ajustes em `sync-ads-once` / criativos (coluna `creative`, whitelist) |
| [FIX_CAMPAIGNS_SYNC.md](./FIX_CAMPAIGNS_SYNC.md) | Incidentes de sync de campanhas |
| [FIX_SYNC_ERRORS.md](./FIX_SYNC_ERRORS.md) | Erros gerais de sync |

## Scripts (raiz `scripts/`)

| Script | Função |
|--------|--------|
| `sync-all-data.js` | Orquestra scripts de sync na ordem correta (local/CI manual) |
| `sync-missing-tables.js` | Alinha tabelas faltantes |
| `check-tables-data.js` | Inspeção rápida de dados nas tabelas |
| `restore-supabase-tables.js` | Restauração auxiliar via Supabase |
| `validate-sql.js` | Validação de SQL |

## SQL manual

- `supabase-recovery.sql` (raiz do repositório): script de recuperação; executar no SQL Editor do Supabase conforme [supabase-recovery-instructions.md](./supabase-recovery-instructions.md).
