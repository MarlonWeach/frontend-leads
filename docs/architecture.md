# Arquitetura do Projeto – Supabase Lead Sync

## 🧱 Stack principal

- **Frontend:** Next.js (em breve)
- **Backend serverless:** Supabase Edge Functions
- **Banco de dados:** Supabase PostgreSQL
- **Agendamento:** GitHub Actions (cron alternativo ao Supabase)
- **Auth e APIs:** Supabase Auth + Meta Graph API

## 📁 Estrutura de Diretórios

```
/
├── supabase/
│   ├── functions/
│   │   └── syncCampaigns/
│   │       └── index.ts
│   └── .env.local
├── .github/
│   └── workflows/
│       └── sync.yml
├── docs/
│   ├── architecture.md
│   └── mvp_step_by_step.md
```

## 🔄 Fluxo de dados

1. A função `syncCampaigns` é executada via GitHub Actions.
2. Ela consulta a API da Meta (Lead Ads).
3. Os dados são gravados no banco do Supabase.
