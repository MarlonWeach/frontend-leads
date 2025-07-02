# Configuração do Vercel - Guia Completo

## 🚀 Configuração Inicial

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Fazer login no Vercel
```bash
vercel login
```

### 3. Configurar o projeto
```bash
vercel
```

## 🔧 Configurações de Ambiente

### Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel do Vercel:

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Meta API
- `NEXT_PUBLIC_META_ACCESS_TOKEN`
- `NEXT_PUBLIC_META_ACCOUNT_ID`

#### OpenAI (para IA)
- `OPENAI_API_KEY`

#### Sentry (opcional)
- `NEXT_PUBLIC_SENTRY_DSN`

#### Configurações Gerais
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`

## 🔄 Integração com GitHub

### 1. Conectar repositório no Vercel
1. Acesse o painel do Vercel
2. Clique em "New Project"
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente

### 2. Configurar GitHub Secrets
Adicione os seguintes secrets no seu repositório GitHub:

- `VERCEL_TOKEN` - Token de acesso do Vercel
- `VERCEL_ORG_ID` - ID da organização
- `VERCEL_PROJECT_ID` - ID do projeto

### 3. Obter Vercel Token
```bash
vercel login
vercel whoami
```

## 🛠️ Configurações de Build

### Framework Preset
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Configurações Avançadas

#### vercel.json
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### next.config.js
```javascript
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};
```

## 🚨 Resolução de Problemas Comuns

### 1. Erro de Build
```bash
# Verificar logs de build
vercel logs

# Fazer build local para testar
npm run build
```

### 2. Erro de Variáveis de Ambiente
- Verificar se todas as variáveis estão configuradas no Vercel
- Confirmar que as variáveis `NEXT_PUBLIC_*` estão corretas

### 3. Erro de Dependências
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install

# Verificar versões
npm outdated
```

### 4. Erro de Supabase
- Verificar se as variáveis do Supabase estão corretas
- Confirmar se o projeto está na região correta
- Verificar se as políticas RLS estão configuradas

## 📊 Monitoramento

### 1. Logs em Tempo Real
```bash
vercel logs --follow
```

### 2. Métricas de Performance
- Acesse o painel do Vercel
- Vá para a aba "Analytics"
- Monitore Core Web Vitals

### 3. Alertas
- Configure alertas para erros de build
- Monitore tempo de resposta das APIs

## 🔄 Deploy Automático

### 1. Configurar Webhooks
- O Vercel detecta automaticamente pushes para `main`
- Cria previews para pull requests

### 2. Configurar Domínio Customizado
1. Vá para as configurações do projeto no Vercel
2. Adicione seu domínio
3. Configure os registros DNS

### 3. Configurar Branch de Produção
- Padrão: `main`
- Pode ser alterado nas configurações do projeto

## 🧪 Testes Antes do Deploy

### 1. Teste Local
```bash
npm run build
npm start
```

### 2. Teste de Preview
```bash
vercel --prod
```

### 3. Teste de Variáveis de Ambiente
```bash
vercel env pull .env.local
```

## 📝 Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build local funcionando
- [ ] Testes passando
- [ ] Linting sem erros
- [ ] Type checking sem erros
- [ ] Domínio configurado (se aplicável)
- [ ] Monitoramento configurado

## 🔗 Links Úteis

- [Documentação do Vercel](https://vercel.com/docs)
- [Next.js no Vercel](https://vercel.com/docs/frameworks/nextjs)
- [CLI do Vercel](https://vercel.com/docs/cli)
- [Variáveis de Ambiente](https://vercel.com/docs/environment-variables) 