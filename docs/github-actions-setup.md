# 🔧 Configuração do GitHub Actions - Auditoria Automática

Este guia explica como configurar as secrets necessárias no GitHub para que a auditoria automática funcione corretamente.

## 📋 Secrets Necessárias

Para que o workflow de auditoria funcione, você precisa configurar as seguintes secrets no seu repositório GitHub:

### 1. Acessar Configurações do Repositório

1. Vá para seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### 2. Configurar as Secrets

#### **NEXT_PUBLIC_SUPABASE_URL**
- **Valor**: URL do seu projeto Supabase
- **Exemplo**: `https://your-project.supabase.co`
- **Onde encontrar**: Dashboard do Supabase → Settings → API

#### **SUPABASE_SERVICE_ROLE_KEY**
- **Valor**: Service Role Key do Supabase (não a anon key!)
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde encontrar**: Dashboard do Supabase → Settings → API → Project API keys → `service_role` key

#### **META_ACCESS_TOKEN**
- **Valor**: Token de acesso da Meta API
- **Exemplo**: `EAA...`
- **Onde encontrar**: Meta for Developers → Apps → Seu App → Tools → Graph API Explorer

#### **META_ACCOUNT_ID**
- **Valor**: ID da conta de anúncios (sem o prefixo `act_`)
- **Exemplo**: `123456789`
- **Onde encontrar**: Meta Ads Manager → Account Settings → Account ID

## 🔍 Como Verificar se as Secrets Estão Configuradas

### 1. Via GitHub Actions
Após configurar as secrets, o workflow irá verificar automaticamente se todas estão definidas. Se alguma estiver faltando, o job falhará com uma mensagem clara.

### 2. Via Interface do GitHub
1. Vá para **Settings** → **Secrets and variables** → **Actions**
2. Você verá uma lista de todas as secrets configuradas (os valores ficam ocultos)

## 🚀 Testando a Configuração

### 1. Execução Manual
1. Vá para **Actions** no seu repositório
2. Clique em **🔍 Auditoria Diária - Meta API vs Supabase**
3. Clique em **Run workflow**
4. Selecione a branch (geralmente `main`)
5. Clique em **Run workflow**

### 2. Verificando os Logs
Após a execução, você pode:
- Ver o resumo na aba **Summary**
- Baixar os logs como artifacts
- Verificar se houve divergências

## 📊 Monitoramento

### 1. Notificações Automáticas
O workflow irá:
- ✅ Executar automaticamente todos os dias às 3h UTC
- 📊 Gerar um resumo detalhado
- 📤 Fazer upload dos logs como artifacts
- 🔔 Alertar quando detectar divergências

### 2. Verificando Status
- **Actions** → **🔍 Auditoria Diária** → Ver histórico de execuções
- **Summary** de cada execução mostra os resultados
- **Artifacts** contêm logs detalhados

## 🔧 Troubleshooting

### Erro: "Secret não definida"
```
❌ NEXT_PUBLIC_SUPABASE_URL não definida
```
**Solução**: Configure a secret correspondente seguindo os passos acima.

### Erro: "Erro ao buscar dados da Meta API"
```
Erro ao buscar dados da Meta API: Invalid access token
```
**Solução**: Verifique se o `META_ACCESS_TOKEN` está correto e não expirou.

### Erro: "Erro ao buscar dados do Supabase"
```
Erro ao buscar dados do Supabase: JWT expired
```
**Solução**: Verifique se o `SUPABASE_SERVICE_ROLE_KEY` está correto.

### Workflow não executa automaticamente
**Verificar**:
1. Se o cron está configurado corretamente: `0 3 * * *`
2. Se o repositório tem atividade recente (GitHub pode pausar workflows inativos)
3. Se há commits na branch `main`

## 📈 Exemplo de Configuração Completa

Após configurar todas as secrets, você deve ver algo assim:

```
Repository secrets (4)
├── NEXT_PUBLIC_SUPABASE_URL     [Configured]
├── SUPABASE_SERVICE_ROLE_KEY    [Configured]
├── META_ACCESS_TOKEN           [Configured]
└── META_ACCOUNT_ID             [Configured]
```

## 🎯 Próximos Passos

1. ✅ Configure todas as secrets
2. 🧪 Execute o workflow manualmente para testar
3. 📊 Monitore as primeiras execuções automáticas
4. 🔔 Configure notificações adicionais (opcional)

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do workflow
2. Confirme se todas as secrets estão configuradas
3. Teste as credenciais localmente primeiro
4. Consulte a documentação do Supabase e Meta API 