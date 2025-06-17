# Auditoria Automática Diária - Configuração e Instruções

## Visão Geral

Este documento descreve como configurar a execução automática da auditoria diária que compara dados do Supabase com a Meta API para garantir paridade entre os sistemas.

## Componentes Implementados

### 1. Script de Auditoria
- **Arquivo**: `scripts/audit-daily.js`
- **Função**: Compara dados dos últimos 7 dias entre Supabase e Meta API
- **Comando**: `npm run audit:run`

### 2. Tabela de Logs
- **Tabela**: `audit_logs` no Supabase
- **Função**: Armazena resultados de todas as auditorias executadas
- **Migração**: `supabase/migrations/20240618_create_audit_logs_table.sql`

### 3. Diretório de Logs
- **Localização**: `logs/`
- **Função**: Armazena logs locais das execuções

## Configuração Automática

### Opção 1: Cron (Recomendado para macOS/Linux)

#### 1. Abrir o Crontab
```bash
crontab -e
```

#### 2. Adicionar a Entrada
```bash
# Executa auditoria diária às 3h da manhã
0 3 * * * cd "/Users/marlonbnogueira/Library/Mobile Documents/com~apple~CloudDocs/Downloads/frontend-leads-main" && /usr/local/bin/node scripts/audit-daily.js >> logs/audit-daily.log 2>&1
```

#### 3. Verificar o Caminho do Node.js
```bash
which node
```
Substitua `/usr/local/bin/node` pelo caminho retornado pelo comando acima.

### Opção 2: LaunchAgent (macOS)

#### 1. Criar Arquivo Plist
```bash
mkdir -p ~/Library/LaunchAgents
```

Criar arquivo `~/Library/LaunchAgents/com.frontend-leads.audit-daily.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.frontend-leads.audit-daily</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>scripts/audit-daily.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/marlonbnogueira/Library/Mobile Documents/com~apple~CloudDocs/Downloads/frontend-leads-main</string>
    <key>StandardOutPath</key>
    <string>logs/audit-daily.log</string>
    <key>StandardErrorPath</key>
    <string>logs/audit-daily-error.log</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>3</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
```

#### 2. Carregar o LaunchAgent
```bash
launchctl load ~/Library/LaunchAgents/com.frontend-leads.audit-daily.plist
```

### Opção 3: GitHub Actions (Recomendado para Produção)

#### 1. Criar Workflow
Criar arquivo `.github/workflows/audit-daily.yml`:

```yaml
name: Auditoria Diária

on:
  schedule:
    # Executa todos os dias às 3h UTC (meia-noite BRT)
    - cron: '0 3 * * *'
  workflow_dispatch: # Permite execução manual

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run daily audit
      run: npm run audit:run
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        META_ACCESS_TOKEN: ${{ secrets.META_ACCESS_TOKEN }}
        META_ACCOUNT_ID: ${{ secrets.META_ACCOUNT_ID }}
        
    - name: Upload logs
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: audit-logs
        path: logs/
        retention-days: 30
```

## Monitoramento e Alertas

### 1. Verificar Logs Locais
```bash
# Ver último log
tail -f logs/audit-daily.log

# Ver logs dos últimos 7 dias
find logs/ -name "audit-daily.log" -mtime -7 -exec cat {} \;
```

### 2. Verificar Logs no Supabase
```sql
-- Últimas 10 auditorias
SELECT * FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Auditorias com divergências
SELECT * FROM audit_logs 
WHERE has_discrepancies = true 
ORDER BY timestamp DESC;
```

### 3. Configurar Alertas (Opcional)

#### Email via Script
Adicionar ao `scripts/audit-daily.js`:

```javascript
// Após detectar divergências
if (auditResult.hasDiscrepancies) {
  // Enviar email de alerta
  await sendAlertEmail(auditResult);
}
```

#### Slack/Discord via Webhook
```javascript
// Enviar notificação para Slack
const webhookUrl = process.env.SLACK_WEBHOOK_URL;
if (webhookUrl && auditResult.hasDiscrepancies) {
  await sendSlackNotification(auditResult, webhookUrl);
}
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Permissão
```bash
# Verificar permissões do script
chmod +x scripts/audit-daily.js

# Verificar permissões do diretório
chmod 755 logs/
```

#### 2. Erro de Variáveis de Ambiente
```bash
# Verificar se .env.local existe e tem as variáveis
cat .env.local | grep -E "(SUPABASE|META)"
```

#### 3. Erro de Conexão com Supabase
```bash
# Testar conexão
npx supabase status
```

#### 4. Rate Limit da Meta API
- O script já inclui pausas entre requisições
- Se persistir, aumentar o `RETRY_DELAY` no script

### Logs de Debug
```bash
# Executar com debug
DEBUG=* npm run audit:run

# Ver logs detalhados
tail -f logs/audit-daily.log | grep -E "(ERROR|WARN|DEBUG)"
```

## Manutenção

### Limpeza de Logs Antigos
```bash
# Manter apenas logs dos últimos 30 dias
find logs/ -name "*.log" -mtime +30 -delete
```

### Backup dos Logs
```bash
# Backup mensal
tar -czf logs/audit-backup-$(date +%Y%m).tar.gz logs/*.log
```

## Status de Implementação

- ✅ Script de auditoria criado
- ✅ Tabela de logs no Supabase
- ✅ Diretório de logs local
- ✅ Comandos npm configurados
- ✅ Documentação completa
- ⏳ Configuração automática (a definir pelo usuário)

## Próximos Passos

1. Escolher método de agendamento (Cron, LaunchAgent ou GitHub Actions)
2. Configurar alertas (opcional)
3. Testar execução automática
4. Monitorar logs por alguns dias
5. Ajustar configurações conforme necessário 