# 🔍 Auditoria Automática Diária

Sistema de auditoria que compara dados do Supabase com a Meta API para garantir paridade entre os sistemas.

## 🚀 Configuração Rápida - GitHub Actions (Recomendado)

### 1. Configurar Secrets no GitHub
Siga o guia completo: [docs/github-actions-setup.md](docs/github-actions-setup.md)

**Secrets necessárias:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `META_ACCESS_TOKEN`
- `META_ACCOUNT_ID`

### 2. Executar Manualmente (Teste)
1. Vá para **Actions** no seu repositório
2. Clique em **🔍 Auditoria Diária - Meta API vs Supabase**
3. Clique em **Run workflow**
4. Selecione a branch `main`
5. Clique em **Run workflow**

### 3. Monitoramento Automático
- ✅ Executa automaticamente todos os dias às 3h UTC
- 📊 Gera resumo detalhado na aba **Summary**
- 📤 Faz upload dos logs como artifacts
- 🔔 Alerta quando detecta divergências

## 📊 O que a Auditoria Faz

- **Compara** dados dos últimos 7 dias entre Supabase e Meta API
- **Métricas** analisadas: leads, investimento, impressões, cliques
- **Salva** resultados na tabela `audit_logs` do Supabase
- **Registra** logs locais em `logs/audit-daily.log`
- **Alerta** quando encontra divergências

## 🛠️ Comandos Úteis (Desenvolvimento Local)

### Execução Manual
```bash
# Executar auditoria agora
npm run audit:run

# Executar com debug
DEBUG=* npm run audit:run

# Modo de teste (não salva logs)
node scripts/audit-daily.js --test
```

### Monitoramento Local
```bash
# Ver logs em tempo real
tail -f logs/audit-daily.log

# Ver últimas auditorias no Supabase
npx supabase db query "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5;"
```

### Verificar Status
```bash
# Verificar se script funciona
npm run audit:run

# Verificar estrutura da tabela
npx supabase db query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs';"
```

## 📈 Exemplo de Saída

```
🚀 Iniciando auditoria diária...
📅 Período de auditoria: 2025-06-10 a 2025-06-17
📊 Buscando dados da Meta API...
✅ Meta API: 56 registros encontrados
🗄️ Buscando dados do Supabase...
✅ Supabase: 5 registros encontrados
🔍 Comparando dados...

📈 Resultados da Auditoria:
==================================================
❌ DIVERGÊNCIAS ENCONTRADAS:
  totalLeads:
    Meta API: 1916
    Supabase: 1753
    Diferença: 163 (8.51%)

📊 Métricas Agregadas:
  Leads: 1916 (Meta) vs 1753 (Supabase)
  Investimento: R$ 92100.12 (Meta) vs R$ 90549.68 (Supabase)
  Impressões: 4,079,381 (Meta) vs 3,964,288 (Supabase)
  Cliques: 56,575 (Meta) vs 54,774 (Supabase)

✅ Auditoria diária concluída com sucesso!
```

## 🔧 Troubleshooting

### GitHub Actions

#### Erro: "Secret não definida"
```
❌ NEXT_PUBLIC_SUPABASE_URL não definida
```
**Solução**: Configure todas as secrets seguindo [docs/github-actions-setup.md](docs/github-actions-setup.md)

#### Workflow não executa automaticamente
**Verificar**:
1. Se o cron está configurado: `0 3 * * *`
2. Se o repositório tem atividade recente
3. Se há commits na branch `main`

### Desenvolvimento Local

#### Erro: "Cannot find module 'axios'"
```bash
npm install axios
```

#### Erro: "column meta_leads.status does not exist"
- ✅ Já corrigido no script
- O filtro de status foi removido

#### Erro: "Cannot find module"
```bash
# Verificar se todas as dependências estão instaladas
npm install
```

#### Logs não aparecem
```bash
# Verificar permissões
chmod +x scripts/audit-daily.js
chmod 755 logs/
```

## 📋 Estrutura de Arquivos

```
├── .github/workflows/
│   └── audit-daily.yml              # Workflow do GitHub Actions
├── scripts/
│   ├── audit-daily.js               # Script principal de auditoria
│   └── setup-audit-cron.sh          # Script de configuração local
├── logs/
│   ├── .gitkeep                     # Mantém diretório no git
│   └── audit-daily.log              # Logs de execução local
├── supabase/migrations/
│   └── 20240618_create_audit_logs_table.sql  # Tabela de logs
└── docs/
    ├── auditoria-automatica.md      # Documentação completa
    └── github-actions-setup.md      # Guia de configuração GitHub
```

## 🎯 Status de Implementação

- ✅ Script de auditoria funcionando
- ✅ Tabela de logs criada no Supabase
- ✅ Workflow GitHub Actions configurado
- ✅ Documentação completa
- ✅ Configuração automática via GitHub Actions
- ⏳ Configuração das secrets (aguardando usuário)

## 📞 Suporte

Se encontrar problemas:

1. **GitHub Actions**: Verifique os logs do workflow
2. **Local**: Verifique os logs: `tail -f logs/audit-daily.log`
3. **Credenciais**: Teste execução manual: `npm run audit:run`
4. **Documentação**: Consulte `docs/github-actions-setup.md`
5. **Variáveis**: Verifique `.env.local` para desenvolvimento local 

## 🎨 Tokens de Design e Tema Global (UX/UI)

Os principais tokens de design definidos em `tailwind.config.js` para o novo layout ultra-refinado são:

- **Cores:**
  - `background`: #0E1117 (dark mode)
  - `electric`: #3A8DFF (azul elétrico)
  - `violet`: #7C3AED (violeta)
  - `mint`: #2FFFC3 (verde menta)
- **Radius:**
  - `xl`: 1.25rem
  - `2xl`: 2rem
  - `3xl`: 3rem
  - `full`: 9999px
- **Sombras:**
  - `soft`: 0 4px 24px 0 rgba(16, 30, 54, 0.12)
  - `glass`: 0 8px 32px 0 rgba(31, 38, 135, 0.18)
- **Glassmorphism:**
  - Utilitário: `backdrop-blur-{xs|sm|md|lg|xl}`
  - Cor de fundo: `bg-glass` (rgba(255,255,255,0.08))
- **Dark mode:**
  - Ativado via classe `dark` no elemento root

**Exemplo de uso:**
```jsx
<div className="bg-background text-mint rounded-2xl shadow-glass backdrop-blur-lg bg-glass dark">
  ...
</div>
```

Consulte o arquivo `tailwind.config.js` para a lista completa e atualizada de tokens. 

Para visualizar rapidamente as diferenças entre as duas pastas, recomendo rodar o comando abaixo diretamente no seu terminal (ele mostrará as 50 primeiras diferenças):

```sh
diff -qr . ~/Library/Mobile\ Documents/com~apple~CloudDocs/Downloads/frontend-leads-main | head -n 50
``` 