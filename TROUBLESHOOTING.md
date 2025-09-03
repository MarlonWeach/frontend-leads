# 🔧 Guia de Solução de Problemas - Login

## Problema: Erro 400 (Bad Request) no Login

### Sintomas
- Erro: `POST https://fnbxbftrhakvwsjykrio.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)`
- Não consegue fazer login na página `/login`
- AuthContext.tsx:207 gerando erros

### ✅ Solução Implementada

Foi implementado um sistema completo de autenticação com Supabase. Siga os passos abaixo:

## 1. Configurar Variáveis de Ambiente

### Criar arquivo `.env.local`
Na raiz do projeto, crie o arquivo `.env.local` com:

```env
# Supabase - OBRIGATÓRIO
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Meta API (opcional para login)
NEXT_PUBLIC_META_ACCESS_TOKEN=seu-token-meta
NEXT_PUBLIC_META_ACCOUNT_ID=seu-account-id-meta

# OpenAI (opcional para login)
OPENAI_API_KEY=sua-chave-openai

# Ambiente
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Como obter as chaves do Supabase:

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Crie um novo projeto ou acesse um existente
4. Vá em **Settings** → **API**
5. Copie:
   - **URL**: Cole em `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: Cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: Cole em `SUPABASE_SERVICE_ROLE_KEY`

## 2. Habilitar Autenticação no Supabase

### No painel do Supabase:
1. Vá em **Authentication** → **Settings**
2. Habilite **Enable email confirmations** (opcional)
3. Configure **Site URL** para `http://localhost:3000` (desenvolvimento)
4. Em **Auth Providers**, certifique-se que **Email** está habilitado

## 3. Testar Configuração

### Página de Diagnóstico
1. Acesse `http://localhost:3000/debug`
2. Verifique se a conexão com Supabase está funcionando
3. Se houver erros, siga as instruções na página

### Página de Login
1. Acesse `http://localhost:3000/login`
2. Tente criar uma conta nova
3. Depois faça login com as credenciais criadas

## 4. Estrutura Implementada

### Arquivos Criados/Modificados:
- `src/contexts/AuthContext.tsx` - Contexto de autenticação
- `app/login/page.tsx` - Página de login
- `src/components/ProtectedRoute.tsx` - Proteção de rotas
- `src/components/SupabaseConnectionTest.tsx` - Teste de conexão
- `app/debug/page.tsx` - Página de diagnóstico
- `app/layout.tsx` - Atualizado com AuthProvider
- `app/page.tsx` - Atualizado com proteção de rota

### Funcionalidades:
- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Proteção automática de rotas
- ✅ Redirecionamento automático
- ✅ Gerenciamento de estado de autenticação
- ✅ Logout
- ✅ Diagnóstico de problemas

## 5. Comandos para Reiniciar

```bash
# Parar o servidor
Ctrl+C

# Instalar dependências (se necessário)
npm install

# Reiniciar o servidor
npm run dev
```

## 6. Verificar Logs

### No Console do Navegador:
- Abra as ferramentas de desenvolvedor (F12)
- Vá na aba **Console**
- Procure por erros relacionados ao Supabase

### Logs Úteis:
- `✅ Conexão com Supabase estabelecida!` - Sucesso
- `❌ Variáveis de ambiente do Supabase não configuradas!` - Configuração
- `Auth state changed:` - Mudanças de autenticação

## 7. Problemas Comuns

### Erro: "Invalid API key"
- Verifique se `NEXT_PUBLIC_SUPABASE_ANON_KEY` está correto
- Confirme se o projeto Supabase está ativo

### Erro: "Invalid URL"
- Verifique se `NEXT_PUBLIC_SUPABASE_URL` está no formato correto
- Deve ser: `https://seu-projeto-id.supabase.co`

### Erro: "User not found"
- Primeiro crie uma conta usando o botão "Criar conta"
- Depois faça login com as credenciais criadas

### Página em branco no login
- Verifique se o arquivo `.env.local` existe
- Reinicie o servidor após alterar variáveis
- Acesse `/debug` para diagnóstico

## 8. Contato para Suporte

Se ainda houver problemas:
1. Acesse `/debug` e faça um screenshot
2. Verifique os logs do console
3. Confirme se todas as variáveis estão configuradas
4. Teste com uma conta nova primeiro

---

**Nota**: Este sistema substitui completamente qualquer implementação anterior de autenticação e resolve o erro 400 mencionado.