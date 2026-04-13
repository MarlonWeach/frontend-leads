# 🔧 Instruções de Recuperação - Passo a Passo

## ⚠️ IMPORTANTE: Como Copiar o SQL Corretamente

O erro `syntax error at or near "{"` geralmente acontece quando:
1. Você copiou código JavaScript junto com o SQL
2. O arquivo foi aberto em um editor que adicionou formatação
3. Há caracteres invisíveis ou encoding incorreto

## 📋 Passo a Passo Correto

### 1. Abrir o Arquivo SQL

```bash
# No terminal, abra o arquivo com um editor de texto simples
open supabase-recovery.sql
# ou
cat supabase-recovery.sql
```

**NÃO** abra no VS Code/Cursor se houver outros arquivos abertos - você pode copiar código errado!

### 2. Verificar o Conteúdo

O arquivo deve começar com:
```sql
-- ============================================
-- Script de Recuperação de Tabelas do Supabase
-- ============================================
```

E **NÃO** deve conter:
- `import` ou `require`
- `export`
- `function` ou `const`
- Código JavaScript/TypeScript

### 3. Copiar Corretamente

**Método 1: Via Terminal (RECOMENDADO)**
```bash
# Copiar todo o conteúdo para clipboard (macOS)
cat supabase-recovery.sql | pbcopy

# Ou no Linux
cat supabase-recovery.sql | xclip -selection clipboard
```

**Método 2: Via Editor**
1. Abra `supabase-recovery.sql` em um editor de texto simples (TextEdit, Notepad)
2. Selecione TUDO (Cmd+A / Ctrl+A)
3. Copie (Cmd+C / Ctrl+C)
4. **IMPORTANTE**: Feche o editor antes de colar no Supabase

### 4. Executar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New query**
5. **Cole o SQL** (Cmd+V / Ctrl+V)
6. **Verifique** que o SQL começa com `--` (comentário)
7. Clique em **Run** (ou Ctrl+Enter)

### 5. Se Ainda Der Erro

Se ainda aparecer erro de sintaxe:

**Opção A: Executar em Partes**

Divida o SQL em seções menores:

1. Primeiro, execute apenas as tabelas base:
```sql
-- TABELAS BASE
CREATE TABLE IF NOT EXISTS public.adsets (
    id VARCHAR(255) PRIMARY KEY,
    status TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meta_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(255) UNIQUE,
    ad_id VARCHAR(255),
    adset_id VARCHAR(255),
    campaign_id VARCHAR(255),
    form_id VARCHAR(255),
    created_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. Depois, execute as migrations uma por uma, começando por:
   - `20250625_create_campaigns_table.sql`
   - `20250627_add_ads_creative_fields.sql`
   - E assim por diante...

**Opção B: Validar o SQL**

Execute este comando para verificar se há problemas:
```bash
# Verificar se há código JavaScript no arquivo
grep -n "import\|require\|export\|function\|const\|let\|var" supabase-recovery.sql

# Se não retornar nada, o arquivo está limpo
```

**Opção C: Regenerar o Arquivo**

Se o arquivo estiver corrompido, regenere:
```bash
node scripts/restore-supabase-tables.js --generate-sql
```

## 🔍 Verificação Pós-Execução

Após executar o SQL, verifique se as tabelas foram criadas:

```sql
-- No SQL Editor do Supabase, execute:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Você deve ver tabelas como:
- `ads`
- `adsets`
- `ad_creatives`
- `ad_insights`
- `adset_goals`
- `adset_insights`
- `campaigns`
- `meta_leads`
- E outras...

## 🆘 Troubleshooting

### Erro: "relation already exists"
- Algumas tabelas podem já existir. Isso é normal, o script usa `IF NOT EXISTS`.

### Erro: "permission denied"
- Certifique-se de estar logado no Supabase Dashboard
- Verifique se você tem permissões de administrador no projeto

### Erro: "syntax error"
- Verifique se copiou apenas o conteúdo do arquivo SQL
- Não copie código JavaScript ou outros arquivos
- Use o método via terminal (pbcopy/xclip) para garantir

### Erro: "function does not exist"
- Algumas migrations podem depender de funções criadas anteriormente
- Execute as migrations na ordem correta
- Se necessário, execute migration por migration

## 📞 Próximos Passos

Após recuperar a estrutura:

1. **Repovoar Dados da Meta API**
   ```bash
   node scripts/sync-campaigns-once.js
   node scripts/sync-adsets-once.js
   node scripts/sync-ads-once.js
   node scripts/sync-meta-leads.js
   ```

2. **Verificar Dados**
   - Acesse o Table Editor no Supabase
   - Verifique se os dados estão sendo populados

3. **Prevenir Problemas Futuros**
   - Use projetos Supabase separados para cada projeto Cursor
   - Ou use schemas diferentes no mesmo projeto
   - Ou use prefixos diferentes nas tabelas

