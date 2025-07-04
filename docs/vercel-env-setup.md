# Configuração de Variáveis de Ambiente no Vercel

## 🚨 Problema Atual

O projeto está apresentando erros no Vercel devido à falta de configuração das variáveis de ambiente da Meta API. **SOLUÇÃO TEMPORÁRIA IMPLEMENTADA**: O sistema agora busca dados do Supabase quando a Meta API não está configurada.

## ✅ Solução Temporária Implementada

- **Fallback para Supabase**: Quando `NEXT_PUBLIC_META_ACCESS_TOKEN` não está configurado, o sistema busca dados das tabelas `campaigns` e `campaign_insights` do Supabase
- **Funcionalidade Mantida**: A página `/campaigns` continua funcionando mesmo sem a Meta API configurada
- **Dados Limitados**: Os dados do Supabase podem estar desatualizados em relação à Meta API

## 🔧 Solução

### 1. Acessar Configurações do Projeto no Vercel

1. Acesse o [painel do Vercel](https://vercel.com/dashboard)
2. Selecione o projeto `frontend-leads`
3. Vá para a aba **Settings**
4. Clique em **Environment Variables**

### 2. Configurar Variáveis Obrigatórias

Adicione as seguintes variáveis de ambiente:

#### Meta API (Obrigatório para funcionalidades de campanhas)
```
NEXT_PUBLIC_META_ACCESS_TOKEN=seu_token_de_acesso_meta
NEXT_PUBLIC_META_ACCOUNT_ID=seu_account_id_meta
```

#### Supabase (Já configurado)
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase
```

#### OpenAI (Opcional - para funcionalidades de IA)
```
OPENAI_API_KEY=sua_chave_openai
```

### 3. Como Obter as Credenciais da Meta API

#### META_ACCESS_TOKEN
1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um app ou use um existente
3. Vá para **Tools > Graph API Explorer**
4. Gere um token de acesso com as permissões:
   - `ads_read`
   - `ads_management`
   - `business_management`

#### META_ACCOUNT_ID
1. Acesse [Facebook Ads Manager](https://www.facebook.com/adsmanager)
2. Vá para **Configurações da Conta**
3. Copie o **ID da Conta** (formato: `123456789` ou `act_123456789`)

### 4. Configuração por Ambiente

No Vercel, você pode configurar variáveis para diferentes ambientes:

- **Production**: Aplicado ao deploy principal
- **Preview**: Aplicado aos previews de PR
- **Development**: Aplicado ao desenvolvimento local

### 5. Verificar Configuração

Após configurar as variáveis:

1. Faça um novo deploy
2. Verifique os logs em **Functions**
3. Teste a página `/campaigns`

## 🚨 Erros Comuns

### "Configuração da Meta API não encontrada"
- Verificar se `NEXT_PUBLIC_META_ACCESS_TOKEN` está configurado
- Verificar se `NEXT_PUBLIC_META_ACCOUNT_ID` está configurado

### "500 Internal Server Error" em `/api/sync/status`
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está configurado
- Verificar se a tabela `sync_status` existe no Supabase

### "Failed to load resource: 404"
- Verificar se todas as variáveis `NEXT_PUBLIC_*` estão configuradas
- Verificar se o domínio está configurado corretamente

## 📝 Checklist

- [ ] `NEXT_PUBLIC_META_ACCESS_TOKEN` configurado
- [ ] `NEXT_PUBLIC_META_ACCOUNT_ID` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] Deploy realizado após configuração
- [ ] Página `/campaigns` funcionando
- [ ] API `/api/sync/status` funcionando

## 🔄 Próximos Passos

1. Configure as variáveis no Vercel
2. Faça um novo deploy
3. Teste as funcionalidades
4. Monitore os logs para erros 