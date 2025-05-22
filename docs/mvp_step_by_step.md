# MVP – Passo a Passo Granular

## 🎯 Objetivo
Construir uma plataforma que integre com a API da Meta e armazene campanhas Lead Ads no Supabase, com execução automatizada a cada hora.

## ✅ Etapas técnicas

### 1. Criar estrutura de projeto
- Inicializar projeto com `supabase init`
- Criar função `syncCampaigns`

### 2. Criar tabela `campaigns`
```sql
create table campaigns (
  id text primary key,
  name text,
  status text,
  objective text,
  created_at timestamp with time zone default now()
);
```

### 3. Criar arquivo `.env.local`
### 4. Escrever função Edge `syncCampaigns`
### 5. Testar função local e via Supabase
### 6. Configurar Secrets no Supabase
### 7. Criar workflow do GitHub Actions
### 8. Adicionar Secret no GitHub

## 🔁 Etapas finais

### 9. Agendar execução automática via GitHub Actions
### 10. Planejar expansão: adsets, ads, dashboard e novas fontes
