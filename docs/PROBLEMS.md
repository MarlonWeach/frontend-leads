# Problemas e Melhorias - Dashboard de Performance

## Problemas Encontrados

### 1. Problemas de Integração com API
- **Status**: Resolvido
- **Descrição**: Integração com a Meta API estável, tratamento de erros e logs implementados. Dados reais sendo exibidos no dashboard.

### 2. Problemas de Estado e Renderização
- **Status**: Resolvido
- **Descrição**: Estados de loading e erro implementados, componentes de feedback visual criados e funcionando.

### 3. Problemas de Cálculo de Métricas
- **Status**: Em Progresso
- **Descrição**: Cálculos de métricas validados, mas ajustes finos e validações adicionais ainda em andamento.

### 4. Problemas de Performance
- **Status**: Resolvido
- **Descrição**: Cache implementado, queries otimizadas, virtualização e redução de chamadas à API concluídas.

### 5. Problemas de UX/UI
- **Status**: Em Progresso
- **Descrição**: Feedbacks visuais, tooltips e mensagens de erro amigáveis implementados. Melhorias de gráficos e filtros avançados ainda pendentes.

### 6. Filtros de Data Inoperantes
- **Status**: Resolvido
- **Descrição**: Filtros de data agora refletem corretamente os dados da tabela meta_leads e consideram apenas anúncios ativos.

### 7. Dados de Leads Incorretos
- **Status**: Resolvido
- **Descrição**: Dashboard agora exibe dados corretos de leads, vindos diretamente da tabela meta_leads.

### 8. Botão "Ver Dashboard Completo" Inativo
- **Status**: Resolvido

### 9. Ausência de Menu Lateral
- **Status**: Resolvido

### 10. Presença e Acessibilidade do .env em supabase-sync-cron/
- **Status**: Confirmado

### 11. RLS Desabilitado em Tabelas Públicas
- **Status**: Em Progresso

### 12. Caminho de Busca de Função Mutável
- **Status**: Resolvido

### 13. View com Security Definer
- **Status**: Resolvido

### 14. Filtro de Status para Dados de Ads
- **Status**: Resolvido
- **Descrição**: Filtro de status ativo implementado em todas as queries relevantes.

### 15. Filtragem Automática de Anúncios Ativos
- **Status**: Resolvido
- **Descrição**: Integração automática com a Meta API e sincronização de status implementadas. Dados do dashboard refletem apenas anúncios ativos.

### 16. Filtro de Data Não Funciona Corretamente - PRIORIDADE 1
- **Status**: Resolvido
- **Descrição**: O filtro de data no dashboard não estava funcionando corretamente. Mesmo selecionando períodos específicos, os dados retornados não correspondiam ao período selecionado. Os logs mostravam que a API estava retornando dados de períodos diferentes do solicitado.
- **Solução Implementada**: Corrigida a lógica de filtragem por data na rota `/api/dashboard/overview`. O problema era que `created_time` representa a data de início do período de relatório da Meta API, não a data real dos leads. Implementada conversão correta de datas e filtragem adequada.

### 17. Ausência de Métricas de Performance no Dashboard
- **Status**: Resolvido
- **Descrição**: O dashboard não exibia métricas importantes como impressões, cliques e CR (taxa de conversão). Essas informações estavam disponíveis nos dados da Meta API mas não estavam sendo exibidas no frontend.
- **Solução Implementada**: Adicionados cards/blocos no dashboard para exibir impressões, cliques e taxa de conversão (CR). O CTR já estava sendo exibido no card de investimento. Expandido o grid para 7 colunas (xl:grid-cols-7) para acomodar as novas métricas. Adicionado período selecionado ao lado dos filtros para facilitar a observação.

### 18. Discrepância nos Dados da Meta API
- **Status**: Resolvido
- **Descrição**: Os dados exibidos no dashboard (2,474 leads, R$ 114,686) eram o total histórico de todos os dados na tabela meta_leads, não apenas do período selecionado. Isso causava confusão quando comparado com os dados reais da Meta API para períodos específicos.
- **Solução Implementada**: Corrigida a lógica de filtragem na rota `/api/dashboard/overview` para aplicar corretamente os filtros de data e calcular métricas apenas do período selecionado. Agora os dados refletem corretamente o período escolhido pelo usuário.
- **Dados Reais Atualizados**: 
  - Últimos 7 dias (10-17/06): 368 leads, R$ 15.309, 936K impressões, 11K cliques
  - Período 19/05-17/06: 586 leads, R$ 22.859, 1.3M impressões, 17K cliques

### 1. Dados da Meta API não reais
- **Status**: Resolvido
- **Descrição**: Os dados exibidos no dashboard não refletem os dados reais da Meta API. O `META_ACCOUNT_ID` está correto, mas a chamada à API precisa do prefixo `act_` (ex: `act_123456789`).
- **Solução Sugerida**: Ajustar toda lógica de integração com a Meta API para garantir que o ID da conta seja sempre enviado com o prefixo `act_`.

### 2. Bloco "Vendas Recentes" desnecessário em /dashboard
- **Status**: Resolvido
- **Descrição**: O bloco de "Vendas Recentes" foi removido do dashboard principal conforme solicitado.
- **Solução Implementada**: Componente removido do dashboard.

### 3. Performance Geral vazia
- **Status**: Resolvido (com observação)
- **Descrição**: O bloco de "Performance Geral" no dashboard está funcionando corretamente. Fica vazio apenas quando o script de rotina de atualização de dados não roda adequadamente.
- **Solução Implementada**: Métricas agregadas implementadas e funcionais.
- **Observação**: Necessário monitoramento das rotinas de atualização para garantir funcionamento contínuo.

### 4. Página /performance completamente vazia
- **Status**: Resolvido
- **Descrição**: A página de performance foi implementada e está exibindo dados reais com filtros funcionais.
- **Solução Implementada**: Página /performance implementada com dados reais da Meta API.

### 5. Estrutura de Páginas Alinhada com Meta API
- **Status**: Resolvido
- **Descrição**: A página /advertisers foi removida por não fazer sentido na estrutura da Meta API.
- **Solução Implementada**: Removida página desnecessária. A estrutura agora segue o padrão Meta: campaigns → adsets → ads.
- **Páginas Futuras Necessárias**:
  - **/adsets**: Listar adsets por campanha com métricas (impressões, cliques, CTR, gastos, leads)
  - **/ads**: Listar ads individuais com preview de criativos e métricas detalhadas

### 6. Dados desatualizados ou inexistentes em várias páginas
- **Status**: Em Progresso
- **Descrição**: Diversas páginas exibem dados desatualizados ou inexistentes, especialmente quando a sincronização com a Meta API falha. Este problema está diretamente relacionado com as rotinas de atualização de dados.
- **Solução Sugerida**: Implementar sistema de debug e monitoramento das rotinas de atualização para identificar falhas e garantir sincronização contínua.

### 7. Dados de campanhas (/campaigns) desatualizados
- **Status**: Resolvido
- **Descrição**: A listagem de campanhas foi corrigida e agora reflete o estado real das campanhas ativas.
- **Solução Implementada**: Sincronização de campanhas com a Meta API implementada com atualização periódica dos dados.

### 19. Divergência de Dados Agregados Meta API x Supabase
- **Status**: Resolvido
- **Descrição**: Os dados agregados de campanhas, adsets e ads (impressões, cliques, CTR, leads/conversões, CR, spend, CPM) no Supabase não batiam com os dados reais da Meta API, mesmo filtrando por status ativo. O dashboard apresentava métricas inconsistentes em relação ao painel da Meta.
- **Solução Implementada**: 
  - Criado script de auditoria diária que compara dados do Supabase com Meta API
  - Implementado script de sincronização "full" que apaga e reimporta dados agregados
  - Corrigido tratamento de tipos (conversão de leads de string para número)
  - Garantido filtro por status ativo em todas as requisições
  - **Resultado**: Paridade total entre Supabase e Meta API para últimos 7 dias (368 leads, R$ 15.309, 936K impressões, 11K cliques)

### 20. Auditoria e Sincronização Full de Dados Agregados
- **Status**: Resolvido
- **Descrição**: Necessidade de garantir que os dados agregados de campaigns, adsets e ads (impressões, cliques, CTR, leads/conversões, CR, spend, CPM) estejam sempre idênticos aos da Meta API, sem considerar leads unitários. Auditoria diária e sincronização "full" devem ser implementadas para garantir paridade total.
- **Solução Implementada**:
  - ✅ Script de auditoria diária dos últimos 7 dias (comparação Supabase x Meta API)
  - ✅ Script de sincronização "full" (apaga e reimporta dados agregados)
  - ✅ Filtro por status ativo em todas as requisições
  - ✅ Tratamento correto de tipos de dados
  - ✅ **Resultado**: Sincronização concluída com sucesso, paridade total alcançada

### Observação Importante sobre Delay da Meta API
- **Status**: Aberto
- **Descrição**: Foi identificado que, mesmo solicitando dados para os dias mais recentes (ex: 19/06 e 20/06), a Meta API pode não retornar registros para essas datas imediatamente, apesar de os dados já aparecerem no painel da Meta. Isso pode ser causado por delay de atualização, diferenças de timezone ou limitações internas da API. O Supabase e o frontend estão corretos, mas dependem da disponibilidade dos dados na API da Meta.
- **Ação Recomendada**: Repetir a sincronização após algumas horas ou no dia seguinte. Se o problema persistir, investigar com suporte da Meta.

### 21. Debug de Rotinas de Atualização da API x Supabase
- **Status**: Aberto
- **Descrição**: Necessidade de implementar sistema de debug e monitoramento das rotinas de atualização de dados para identificar quando e por que as sincronizações falham, causando dados desatualizados em várias páginas do projeto.
- **Problemas Identificados**:
  - Performance Geral fica vazia quando rotinas não rodam
  - Dados desatualizados em múltiplas páginas
  - Falhas intermitentes na sincronização
  - Ausência de logs detalhados sobre falhas
- **Solução Proposta**:
  - Implementar sistema de logs estruturados para todas as rotinas
  - Criar dashboard de monitoramento de status das sincronizações
  - Implementar alertas automáticos para falhas
  - Adicionar métricas de performance das rotinas
  - Criar sistema de retry automático com backoff exponencial
  - Implementar health checks para todas as APIs
- **Impacto**: Resolverá problemas de dados desatualizados e melhorará a confiabilidade geral do sistema

## Observação Técnica Importante
- Ao buscar insights diários da Meta API para um adset, o objeto retornado NÃO inclui os campos de identificação (`adset_id`, `adset_name`, `campaign_id`, etc). É obrigatório injetar manualmente esses campos no momento do processamento, usando o contexto do adset no loop principal do script de sincronização.

## Próximos Passos

1. **PBI 21 - Padrão Visual de Cards Coloridos**
   - [ ] Criar estrutura de tarefas para PBI 21
   - [ ] Implementar cards coloridos em todas as páginas
   - [ ] Manter cores específicas para cada tipo de métrica
   - [ ] Implementar efeitos de hover com animações suaves

2. **Debug de Rotinas de Atualização**
   - [ ] Implementar sistema de logs estruturados
   - [ ] Criar dashboard de monitoramento de status
   - [ ] Implementar alertas automáticos para falhas
   - [ ] Adicionar métricas de performance das rotinas

3. **Testes e Validações**
   - [ ] Corrigir falhas nos testes unitários do DashboardOverview
   - [ ] Garantir cobertura total dos fluxos críticos
   - [ ] Validar funcionamento das rotinas de atualização

4. **Melhorias de UX/UI**
   - [ ] Implementar gráficos interativos e filtros avançados
   - [ ] Interface ultra-refinada inspirada em Apple Vision Pro + Baremetrics

---

### Requisitos de UX/UI para o novo layout

**🎨 Estilo visual**
- Base em dark mode (#0E1117).
- Acentos luminosos em azul elétrico, violeta e verde menta, com efeitos de glassmorphism suaves nos painéis.
- Cartões e seções com cantos arredondados, sombras suaves e uso inteligente de espaçamento negativo para manter a interface respirável.

**📊 Animações e gráficos**
- Todos os gráficos devem animar ao carregar:
  - Gráficos de barras sobem de forma fluida.
  - Gráficos de pizza giram suavemente até o lugar.
  - Gráficos de linha pulsam levemente conforme transmitem dados em tempo real.

**🧭 Navegação e interações**
- Sidebar minimalista e elegante, contendo apenas ícones, com efeitos de brilho ao passar o mouse e rótulos opcionais ao hover.
- Ao interagir (hover ou tap):
  - Cartões se expandem com suavidade.
  - Tooltips aparecem com transições de fade-in.
  - Mudança de seções com animações do tipo mola (spring-like).

**✍️ Tipografia**
- Use uma fonte sans-serif moderna como Satoshi, Geist ou Space Grotesk.
- Títulos em negrito de 28 a 32px.
- Sublabels e descrições com brilho sutil, integrados de forma elegante à estética geral.

---

## Status Atual
- Integração, sincronização, cache e queries: **Concluídos**
- Testes unitários e integração: **Implementados, com falhas pontuais em DashboardOverview**
- Foco atual: **Correção dos testes do DashboardOverview e manutenção dos testes existentes**

## Melhorias Sugeridas

### 1. Arquitetura e Código
- Implementar sistema de cache com React Query ou SWR (Resolvido)
- Separar lógica de negócios em hooks customizados (Parcialmente resolvido, com `useDashboardData`, `useVirtualizedList`)
- Implementar testes unitários e de integração (Resolvido)
- Adicionar TypeScript para melhor tipagem

### 2. Performance
- Implementar virtualização para listas longas (Resolvido)
- Adicionar lazy loading de componentes
- Otimizar bundle size
- Implementar service worker para cache offline

### 3. UX/UI
- Adicionar gráficos interativos
- Implementar exportação de dados
- Adicionar filtros avançados
- Melhorar responsividade
- Implementar temas claro/escuro

### 4. Monitoramento
- Implementar logging estruturado
- Adicionar monitoramento de erros (ex: Sentry) (Resolvido)
- Implementar analytics
- Adicionar métricas de performance

### 5. Segurança
- Implementar rate limiting
- Adicionar validação de dados
- Melhorar sanitização de inputs
- Implementar autenticação robusta

### 6. Presença e Acessibilidade do .env.local
- **Status**: Confirmado
- **Descrição**: O arquivo `.env.local` está presente na raiz do projeto (`/Users/marlonbnogueira/Library/Mobile Documents/com~apple~CloudDocs/Downloads/frontend-leads-main/`) e contém as chaves de ambiente necessárias para o Supabase. Este arquivo é acessível via terminal e as variáveis podem ser lidas.
- **Impacto**: A não detecção anterior do arquivo `.env.local` gerou confusão na depuração de variáveis de ambiente. A partir de agora, esta informação deve ser considerada como um fato.

## Notas Adicionais

- Prioridade atual: Confirmação e depuração de variáveis de ambiente do Supabase
- Considerar implementar um sistema de fallback para quando a API estiver indisponível
- Documentar todas as alterações e manter um changelog
- Realizar testes de carga após as otimizações
- Considerar implementar um sistema de feature flags para deploy gradual 

## Status do Token Meta
- **Status**: Confirmado
- **Descrição**: O token de acesso do Meta (`META_ACCESS_TOKEN`) possui todas as permissões necessárias para acessar os dados de campanhas, anúncios e métricas de conversão. Especificamente, o token tem acesso às permissões: `ads_read`, `ads_management`, `

## Sincronização e Relacionamento Automático entre Tabelas (adset_insights, ads, meta_leads)

### Contexto

Para garantir a integridade dos dados e o correto funcionamento dos relatórios e APIs, é fundamental que os relacionamentos entre as tabelas de campanhas, adsets, ads e leads estejam sempre sincronizados. Muitas vezes, durante a ingestão de dados vindos da Meta API, alguns registros podem ser inseridos sem todos os IDs de relacionamento preenchidos (ex: um adset_insight sem campaign_id, um ad sem campaign_id, um meta_lead sem adset_id ou campaign_id, etc).

### Lógica Empregada

- **adset_insights:**
  - Se faltar o campaign_id, ele é preenchido automaticamente buscando o campaign_id correspondente ao adset_id na tabela adsets.
- **ads:**
  - Se faltar o campaign_id, ele é preenchido automaticamente buscando o campaign_id correspondente ao adset_id na tabela adsets.
- **meta_leads:**
  - Se faltar o adset_id, ele é preenchido automaticamente buscando o adset_id correspondente ao ad_id na tabela ads.
  - Se faltar o campaign_id, ele é preenchido automaticamente buscando primeiro pelo ad_id na tabela ads, e se não encontrar, pelo adset_id na tabela adsets.

### Automação

- Um script Node.js (`scripts/update-table-relationships.js`) foi criado para automatizar todo esse processo.
- O script pode ser executado manualmente ou automaticamente (está integrado ao workflow do GitHub Actions que roda 3x ao dia após a sincronização dos dados).
- O script é idempotente: pode ser rodado quantas vezes for necessário, sempre atualizando apenas os registros que precisam.
- O script processa em lotes de 100 registros por vez para evitar sobrecarga, mas pode ser ajustado conforme a necessidade.
- Logs detalhados são gerados a cada execução, facilitando auditoria e troubleshooting.

### Motivo

Sem essa sincronização automática, dados podem ficar inconsistentes, impactando relatórios, dashboards e APIs que dependem desses relacionamentos para agregação e filtragem correta.

### Como rodar manualmente

```bash
node scripts/update-table-relationships.js
```

### Como funciona no CI

Após cada sincronização de dados (3x ao dia), o workflow do GitHub Actions executa automaticamente o script para garantir que todos os relacionamentos estejam atualizados.

### Observação

Se novas tabelas forem criadas ou a estrutura mudar, o script deve ser revisado para garantir que todos os relacionamentos necessários continuem sendo atualizados corretamente.

### 22. Problemas na Página /ads
- **Status**: Aberto
- **Descrição**: Foram identificados os seguintes problemas na página de anúncios:
  1. O card de **CTR Médio** não está trazendo resultados (valor sempre 0 ou vazio).
  2. O card de **CPL Médio** não está trazendo resultados (valor sempre 0 ou vazio).
  3. Ao selecionar os períodos "Hoje", "Ontem" ou "Últimos 7 dias", nenhum resultado é exibido, indicando ausência de dados recentes.
- **Solução Sugerida**:
  - Corrigir o cálculo e exibição dos cards de CTR Médio e CPL Médio.
  - Investigar e debugar a rotina de atualização automática do banco de dados/Supabase, pois os dados recentes não estão sendo sincronizados corretamente.
  - Garantir que a sincronização automática esteja funcionando e que os dados estejam disponíveis para os períodos recentes.

---

## 🎯 OPORTUNIDADES IDENTIFICADAS - Análise Completa dos Documentos .md

### **Prioridade 1: Problemas Críticos Pendentes**

#### 23. PBI 16 - Atualização Automática de Anúncios Ativos
- **Status**: Proposed (não implementado)
- **Impacto**: Sistema não atualiza automaticamente lista de anúncios ativos
- **Descrição**: Como usuário do dashboard, quero que o sistema atualize automaticamente a lista de anúncios ativos para que eu possa ver as métricas corretas sem intervenção manual
- **CoS**:
  1. O sistema deve buscar automaticamente anúncios ativos da Meta API
  2. A lista de anúncios ativos deve ser atualizada periodicamente
  3. O dashboard deve usar apenas dados de anúncios ativos
  4. Não deve ser necessária intervenção manual para atualizar a lista de anúncios
  5. O sistema deve lidar adequadamente com mudanças de status (pausa/ativação) dos anúncios
  6. A performance do dashboard não deve ser impactada negativamente
  7. O sistema deve implementar cache inteligente para reduzir chamadas à API
  8. Erros na atualização da lista de anúncios devem ser tratados adequadamente e registrados
  9. O usuário deve ser notificado caso haja problemas na atualização dos dados
- **Oportunidade**: Implementar sistema de atualização automática via GitHub Actions

#### 24. PBI 18 - Dados Atualizados e Funcionais
- **Status**: Agreed (não implementado)
- **Impacto**: Páginas podem exibir dados desatualizados
- **Descrição**: Como usuário, quero que todas as páginas exibam dados atualizados e funcionais para ter uma experiência consistente e confiável em todo o dashboard
- **CoS**:
  1. Página /campaigns deve exibir dados reais e atualizados da Meta API
  2. Filtro padrão de anunciantes ativos deve funcionar em /advertisers
  3. Bloco "Performance Geral" no dashboard deve mostrar métricas agregadas
  4. Páginas devem ter fallback adequado para dados indisponíveis
  5. Status de sincronização deve ser visível para o usuário
  6. Interface consistente com design system em todas as páginas
  7. Tratamento de erros amigável e informativo
  8. Performance adequada em todas as funcionalidades
- **Oportunidade**: Garantir que todas as páginas tenham dados funcionais

#### 25. Tarefa 22-12 - Correção da Análise Individual de IA
- **Status**: Review (problemas identificados)
- **Problemas**: Análise genérica, otimização vazia, erros de processamento
- **Descrição**: Corrigir problemas identificados na análise individual implementada na tarefa 22-11
- **Oportunidade**: Finalizar correções da IA

### **Prioridade 2: Problemas Técnicos Identificados**

#### 26. Problema 22 - Página /ads com Bugs (Detalhado acima)
- **Status**: Aberto
- **Problemas**: CTR Médio, CPL Médio sempre 0, períodos recentes sem dados
- **Causa**: Rotina de atualização automática não funcionando
- **Oportunidade**: Corrigir sincronização de dados recentes

#### 27. Problema 21 - Debug de Rotinas de Atualização (Detalhado acima)
- **Status**: Aberto
- **Problemas**: Performance Geral vazia, dados desatualizados, falhas intermitentes
- **Oportunidade**: Implementar sistema de monitoramento e logs

### **Prioridade 3: Melhorias e Otimizações**

#### 28. Melhorias de UX/UI Pendentes
- **Status**: Pendente
- **Descrição**: Implementações de interface ultra-refinada
- **Itens**:
  - Gráficos interativos e filtros avançados
  - Interface ultra-refinada inspirada em Apple Vision Pro + Baremetrics
  - Implementar temas claro/escuro
  - Sidebar minimalista com ícones e animações
  - Gráficos animados (barras, pizza, linha)
  - Tipografia moderna e títulos destacados
  - Cartões e painéis interativos
  - Filtros avançados com UI refinada
  - Testes de usabilidade e responsividade

#### 29. Melhorias de Performance
- **Status**: Pendente
- **Descrição**: Otimizações de performance do sistema
- **Itens**:
  - Lazy loading de componentes
  - Otimizar bundle size
  - Implementar service worker para cache offline
  - Virtualização para listas longas (já implementado)
  - Sistema de cache com React Query ou SWR (já implementado)

#### 30. Melhorias de Segurança
- **Status**: Pendente
- **Descrição**: Implementações de segurança
- **Itens**:
  - Implementar rate limiting
  - Adicionar validação de dados
  - Melhorar sanitização de inputs
  - Implementar autenticação robusta
  - RLS habilitado em tabelas públicas (em progresso)

### **Prioridade 4: Monitoramento e Observabilidade**

#### 31. Sistema de Monitoramento
- **Status**: Pendente
- **Descrição**: Sistema completo de monitoramento e observabilidade
- **Itens**:
  - Implementar logging estruturado
  - Criar dashboard de monitoramento de status das sincronizações
  - Implementar alertas automáticos para falhas
  - Adicionar métricas de performance das rotinas
  - Sistema de retry automático com backoff exponencial
  - Health checks para todas as APIs
  - Monitoramento de erros (ex: Sentry) - já implementado

#### 32. Testes e Validações
- **Status**: Em Progresso
- **Descrição**: Melhorias no sistema de testes
- **Itens**:
  - Corrigir falhas nos testes unitários do DashboardOverview
  - Garantir cobertura total dos fluxos críticos
  - Validar funcionamento das rotinas de atualização
  - Testes unitários e de integração (já implementados)

### **Prioridade 5: Funcionalidades Avançadas**

#### 33. Funcionalidades de IA Avançadas
- **Status**: Pendente
- **Descrição**: Melhorias nas funcionalidades de IA
- **Itens**:
  - Otimização automática de campanhas
  - Geração de copies com IA
  - Predição de performance
  - Sistema avançado de scoring de leads
  - Relatórios inteligentes automatizados
  - Modelo híbrido (GPT-3.5 para análises simples)
  - API própria com endpoints de IA
  - Marketplace de prompts otimizados

#### 34. Funcionalidades de Exportação e Relatórios
- **Status**: Pendente
- **Descrição**: Sistema de exportação e relatórios
- **Itens**:
  - Implementar exportação de dados
  - Relatórios inteligentes automatizados
  - Exportação de leads em formato CSV/Excel
  - Relatórios programados por email

#### 35. Funcionalidades de Gestão de Leads
- **Status**: Baixa Prioridade
- **Descrição**: Sistema completo de gestão de leads
- **Itens**:
  - Visualizar leads gerados por campanha
  - Exportar leads em formato CSV/Excel
  - Filtrar leads por período e campanha
  - Marcar status de leads (novo/contatado/convertido)
  - Sistema de scoring de leads

### **Prioridade 6: Arquitetura e Infraestrutura**

#### 36. Melhorias de Arquitetura
- **Status**: Parcialmente Implementado
- **Descrição**: Melhorias na arquitetura do sistema
- **Itens**:
  - Separar lógica de negócios em hooks customizados (parcialmente resolvido)
  - Adicionar TypeScript para melhor tipagem
  - Implementar sistema de feature flags para deploy gradual
  - Multi-tenant (múltiplos clientes)
  - App mobile com assistente integrado

#### 37. Melhorias de Infraestrutura
- **Status**: Pendente
- **Descrição**: Melhorias na infraestrutura
- **Itens**:
  - Cache inteligente com IA
  - Sistema de fallback para quando a API estiver indisponível
  - Backup diário dos dados
  - Recuperação de falhas em < 1 hora
  - Sistema disponível 99.5% do tempo

### **Prioridade 7: Analytics e Métricas**

#### 38. Sistema de Analytics
- **Status**: Pendente
- **Descrição**: Sistema de analytics e métricas
- **Itens**:
  - Implementar analytics
  - Adicionar métricas de performance
  - Métricas de uso da IA
  - Métricas de custo por análise
  - Feedback loop para melhoria de modelos

---

## 📋 ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Estabilidade (Recomendado)**
1. **Corrigir Problema 22** - Página /ads com bugs de dados
2. **Implementar Problema 21** - Sistema de debug de rotinas
3. **Finalizar Tarefa 22-12** - Correções da análise individual de IA

### **Fase 2: Funcionalidades Core**
1. **Implementar PBI 16** - Atualização automática de anúncios ativos
2. **Implementar PBI 18** - Garantir dados funcionais em todas as páginas
3. **Melhorias de UX/UI** - Gráficos interativos e filtros avançados

### **Fase 3: Monitoramento**
1. **Sistema de logs estruturados**
2. **Dashboard de monitoramento**
3. **Alertas automáticos**
4. **Métricas de performance**

### **Fase 4: Funcionalidades Avançadas**
1. **IA Avançada** - Otimização automática, geração de copies
2. **Exportação e Relatórios** - Sistema completo de relatórios
3. **Gestão de Leads** - Sistema completo de gestão

### **Fase 5: Escala e Otimização**
1. **Multi-tenant** - Suporte a múltiplos clientes
2. **Performance** - Otimizações avançadas
3. **Mobile** - App mobile com assistente integrado

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### **Opção 1: Foco em Estabilidade (Recomendado)**
- Corrigir problemas críticos que afetam a experiência do usuário
- Garantir que dados estejam sempre atualizados
- Melhorar confiabilidade do sistema

### **Opção 2: Foco em Funcionalidades**
- Adicionar funcionalidades importantes que estão pendentes
- Implementar melhorias de UX/UI
- Expandir capacidades do sistema

### **Opção 3: Foco em Monitoramento**
- Melhorar a confiabilidade e observabilidade do sistema
- Implementar alertas e métricas
- Facilitar debugging e manutenção

---

## 📊 STATUS ATUAL DO PROJETO

### **Concluído (Done)**
- ✅ PBI 17: Interface ultra-refinada
- ✅ PBI 19: Página de performance detalhada
- ✅ PBI 20: Análise granular de adsets e ads
- ✅ PBI 21: Padrão visual de cards coloridos
- ✅ PBI 22: Integração de IA (exceto tarefa 22-12)

### **Em Progresso**
- 🔄 PBI 18: Dados atualizados e funcionais (Agreed)
- 🔄 Tarefa 22-12: Correção da análise individual (Review)
- 🔄 Problema 21: Debug de rotinas de atualização (Aberto)
- 🔄 Problema 22: Problemas na página /ads (Aberto)

### **Pendente**
- ⏳ PBI 16: Atualização automática de anúncios ativos (Proposed)
- ⏳ Melhorias de UX/UI
- ⏳ Sistema de monitoramento
- ⏳ Funcionalidades avançadas de IA
- ⏳ Melhorias de segurança
- ⏳ Sistema de analytics