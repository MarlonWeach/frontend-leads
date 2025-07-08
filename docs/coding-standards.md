# Padrões de Código - Frontend Leads

## Visão Geral
Este documento define os padrões de código e boas práticas para o projeto Frontend Leads, garantindo consistência, qualidade e manutenibilidade.

## Configuração do ESLint

### Regras Principais

#### Variáveis Não Utilizadas
- **Regra**: `@typescript-eslint/no-unused-vars`
- **Padrão**: Prefixar variáveis não utilizadas com `_`
- **Exemplo**:
  ```typescript
  // ✅ Correto
  const [data, _setData] = useState(null);
  const { key: _key, value } = props;
  
  // ❌ Incorreto
  const [data, setData] = useState(null);
  const { key, value } = props;
  ```

#### Dependências de Hooks React
- **Regra**: `react-hooks/exhaustive-deps`
- **Padrão**: Incluir todas as dependências necessárias
- **Exemplo**:
  ```typescript
  // ✅ Correto
  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange]);
  
  // ❌ Incorreto
  useEffect(() => {
    fetchData(dateRange);
  }, []); // Falta dependência
  ```

#### Acessibilidade
- **Regra**: `jsx-a11y/alt-text`
- **Padrão**: Sempre incluir `alt` em imagens
- **Exemplo**:
  ```jsx
  // ✅ Correto
  <img src="logo.png" alt="Logo da empresa" />
  <img src="decorative.png" alt="" />
  
  // ❌ Incorreto
  <img src="logo.png" />
  ```

## Estrutura de Arquivos

### Componentes React
```
src/components/
├── ui/           # Componentes de UI reutilizáveis
├── ai/           # Componentes relacionados à IA
├── filters/      # Componentes de filtros
└── [feature]/    # Componentes específicos de features
```

### Hooks Customizados
```
src/hooks/
├── use[Feature]Data.ts    # Hooks de dados
├── use[Feature]Actions.ts # Hooks de ações
└── use[Feature]State.ts   # Hooks de estado
```

### APIs
```
app/api/
├── [feature]/
│   ├── route.ts           # Endpoint principal
│   └── [action]/
│       └── route.ts       # Sub-endpoints
```

## Convenções de Nomenclatura

### Componentes
- **PascalCase** para componentes React
- **Sufixo descritivo** para tipos específicos
- **Exemplo**: `DashboardOverview`, `AdCreativePreview`

### Hooks
- **camelCase** com prefixo `use`
- **Sufixo descritivo** para funcionalidade
- **Exemplo**: `useDashboardData`, `useAnomalyDetection`

### Variáveis e Funções
- **camelCase** para variáveis e funções
- **UPPER_SNAKE_CASE** para constantes
- **Exemplo**: `userData`, `fetchCampaigns`, `API_BASE_URL`

## Imports

### Ordem de Imports
1. Imports do React/Next.js
2. Imports de bibliotecas externas
3. Imports de componentes/hooks internos
4. Imports de tipos/interfaces
5. Imports relativos

### Exemplo
```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardOverview } from '@/components/DashboardOverview';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { DashboardData } from '@/types/dashboard';
import './styles.css';
```

## Tratamento de Erros

### Try-Catch
```typescript
try {
  const data = await fetchData();
  setState(data);
} catch (error) {
  console.error('Erro ao buscar dados:', error);
  setError(error instanceof Error ? error.message : 'Erro desconhecido');
}
```

### Error Boundaries
```typescript
<ErrorBoundary fallback={<ErrorMessage />}>
  <Component />
</ErrorBoundary>
```

## Performance

### Memoização
```typescript
// ✅ Use useMemo para cálculos custosos
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ Use useCallback para funções passadas como props
const handleClick = useCallback(() => {
  // lógica
}, [dependencies]);
```

### Lazy Loading
```typescript
const LazyComponent = lazy(() => import('./LazyComponent'));

<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

## Testes

### Estrutura de Testes
```
test/
├── unit/         # Testes unitários
├── integration/  # Testes de integração
└── e2e/          # Testes end-to-end
```

### Convenções de Nomenclatura
- **Arquivos**: `[Component].test.tsx`
- **Descrever**: `describe('Component', () => {})`
- **Testar**: `it('should [behavior]', () => {})`

## Git

### Commits
- **Formato**: `[tipo]: [descrição]`
- **Tipos**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Exemplo**: `feat: add dashboard overview component`

### Branches
- **Formato**: `[tipo]/[descrição]`
- **Tipos**: `feature`, `bugfix`, `hotfix`, `refactor`
- **Exemplo**: `feature/dashboard-overview`

## Checklist de Qualidade

### Antes do Commit
- [ ] Código segue padrões de nomenclatura
- [ ] Imports organizados corretamente
- [ ] Tratamento de erros implementado
- [ ] Performance otimizada (useMemo, useCallback)
- [ ] Acessibilidade verificada (alt, aria-labels)
- [ ] Testes passando
- [ ] ESLint sem erros

### Antes do Merge
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Build sem warnings críticos
- [ ] Documentação atualizada
- [ ] Performance testada

## Ferramentas

### Desenvolvimento
- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **Husky**: Git hooks
- **lint-staged**: Linting de arquivos staged

### CI/CD
- **GitHub Actions**: Automação de build e deploy
- **Vercel**: Deploy automático
- **Sentry**: Monitoramento de erros

## Recursos Adicionais

- [ESLint Rules](https://eslint.org/docs/rules/)
- [React Hooks Rules](https://react.dev/warnings/invalid-hook-call-warning)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Best Practices](https://nextjs.org/docs/basic-features/eslint) 