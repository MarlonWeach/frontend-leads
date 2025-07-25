-- Criação da tabela de logs de atividades da Meta
create table if not exists meta_activity_logs (
  id bigserial primary key,
  account_id text not null,
  event_type text not null,
  event_time timestamptz not null,
  object_id text,
  object_name text,
  value_old text,
  value_new text,
  application_id text,
  extra_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para busca rápida por data
create index if not exists idx_meta_activity_logs_event_time on meta_activity_logs(event_time desc);
create index if not exists idx_meta_activity_logs_account_id on meta_activity_logs(account_id); 