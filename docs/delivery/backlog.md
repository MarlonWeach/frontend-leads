# Backlog do Projeto

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
|----|-------|------------|--------|----------------------------------|
| 16 | Usuário | Como usuário do dashboard, quero que o sistema atualize automaticamente a lista de anúncios ativos para que eu possa ver as métricas corretas sem intervenção manual | Done | 1. O sistema deve buscar automaticamente anúncios ativos da Meta API<br>2. A lista de anúncios ativos deve ser atualizada periodicamente<br>3. O dashboard deve usar apenas dados de anúncios ativos<br>4. Não deve ser necessária intervenção manual para atualizar a lista de anúncios<br>5. O sistema deve lidar adequadamente com mudanças de status (pausa/ativação) dos anúncios<br>6. A performance do dashboard não deve ser impactada negativamente<br>7. O sistema deve implementar cache inteligente para reduzir chamadas à API<br>8. Erros na atualização da lista de anúncios devem ser tratados adequadamente e registrados<br>9. O usuário deve ser notificado caso haja problemas na atualização dos dados<br>[View Details](./16/prd.md) |
| 17 | Usuário | Como usuário, quero uma interface ultra-refinada inspirada em Apple Vision Pro e Baremetrics, para ter uma experiência visual moderna, minimalista e informativa, com gráficos animados, navegação elegante e tipografia sofisticada. | Done | - Layout dark mode com glassmorphism e acentos de cor
- Sidebar minimalista com ícones e animações
- Gráficos animados (barras, pizza, linha)
- Tipografia moderna e títulos destacados
- Cartões e painéis interativos
- Filtros avançados com UI refinada
- Testes de usabilidade e responsividade
[View Details](./17/prd.md) |
| 18 | Usuário | Como usuário, quero que todas as páginas exibam dados atualizados e funcionais para ter uma experiência consistente e confiável em todo o dashboard | Agreed | 1. Página /campaigns deve exibir dados reais e atualizados da Meta API<br>2. Filtro padrão de anunciantes ativos deve funcionar em /advertisers<br>3. Bloco "Performance Geral" no dashboard deve mostrar métricas agregadas<br>4. Páginas devem ter fallback adequado para dados indisponíveis<br>5. Status de sincronização deve ser visível para o usuário<br>6. Interface consistente com design system em todas as páginas<br>7. Tratamento de erros amigável e informativo<br>8. Performance adequada em todas as funcionalidades<br>[View Details](./18/prd.md) |
| 19 | Gestor de Marketing | Como um gestor de marketing, quero uma página de performance detalhada para analisar profundamente o desempenho das campanhas. | Done | Listagem de campanhas com métricas detalhadas (leads, gasto, CTR, CPL), filtros funcionais (data, status) e ordenação por coluna. |
| 20 | Gestor de Marketing | Como gestor de marketing, quero páginas de análise granular de adsets e ads individuais para otimizar performance em nível detalhado. | Done | 1. Página /adsets deve listar adsets por campanha com métricas completas (impressões, cliques, CTR, gastos, leads)<br>2. Página /ads deve listar ads individuais com preview de criativos e métricas detalhadas<br>3. Filtros funcionais por data, status e campanha<br>4. Ordenação por coluna em ambas as páginas<br>5. Integração com Meta API para dados em tempo real<br>6. Interface consistente com design system<br>[View Details](./20/prd.md) |
| 21 | Usuário | Como usuário, quero que todas as páginas do projeto tenham o mesmo padrão visual de cards coloridos com efeitos de hover para ter uma experiência visual consistente e moderna. | Done | 1. Aplicar o padrão de cards coloridos da página /performance em todas as outras páginas<br>2. Manter as cores específicas para cada tipo de métrica (azul para leads, verde para gastos, etc.)<br>3. Implementar efeitos de hover com animações suaves<br>4. Garantir que a formatação de números grandes seja consistente (abreviação com k, M, B)<br>5. Manter a responsividade em todos os dispositivos<br>6. Preservar a funcionalidade existente das páginas<br>[View Details](./21/prd.md) |
| 18 | Gestor de Marketing | Corrigir problemas críticos de dados e funcionalidade que impedem a análise correta e o uso básico da plataforma. | Done | Dashboard funcional com dados reais, filtros corrigidos, tratamento de erro padronizado e indicador de sincronização. |
| 22 | Usuário | Como usuário, quero que o dashboard utilize inteligência artificial para analisar dados, detectar anomalias e sugerir otimizações, tornando a gestão de campanhas mais inteligente e proativa. | Done | 1. Integração com OpenAI para análises automáticas<br>2. Painel de IA na página de performance<br>3. Análise de performance em linguagem natural<br>4. Detecção automática de anomalias<br>5. Sugestões de otimização baseadas em IA<br>6. Assistente virtual para dúvidas sobre campanhas<br>7. Observação: É necessário obter uma chave de API da OpenAI e adicioná-la ao arquivo `.env.local` como `OPENAI_API_KEY`. Para obter a chave, acesse https://platform.openai.com/api-keys, crie uma conta (ou faça login), gere uma nova API Key e copie para o arquivo de ambiente.
[View Details](./22/prd.md) |
| 23 | Desenvolvedor | Como desenvolvedor, quero que todos os warnings de build sejam corrigidos para garantir código limpo, sem avisos críticos e melhor manutenibilidade do projeto. | Done | 1. ✅ Remover todas as variáveis e imports não utilizados<br>2. ✅ Corrigir dependências de hooks React (useEffect, useMemo, useCallback)<br>3. ✅ Corrigir warnings de acessibilidade (alt em imagens, ARIA labels)<br>4. ✅ Garantir que o build seja executado sem warnings críticos<br>5. ✅ Manter código limpo e organizado seguindo padrões do projeto<br>6. ✅ Documentar padrões de código para evitar warnings futuros<br>7. ✅ Implementar linting automático para prevenir regressões<br>8. ✅ Garantir que todos os testes continuem passando após as correções<br>[View Details](./23/prd.md) |

## Tasks de Revisão e Limpeza

### REVIEW-1: Revisar e remover funcionalidades não utilizadas ✅
- **Status:** Concluído
- **Descrição:** Revisar e remover endpoints, componentes e funcionalidades não utilizados no projeto
- **Itens removidos:**
  - Endpoints: recent-sales, activity, search
  - Componentes: RecentSales, Activity, Search
  - Hooks: useDashboardRecentSales, useDashboardActivity, useDashboardSearch
  - Tipos de cache: DASHBOARD_ACTIVITY, DASHBOARD_RECENT_SALES, DASHBOARD_SEARCH
- **Data de conclusão:** 2025-07-08

### REVIEW-2: Documentar itens removidos ✅
- **Status:** Concluído
- **Descrição:** Documentar no PROBLEMS.md e no backlog todos os itens removidos ou marcados como obsoletos
- **Documentação:** Atualizada em docs/PROBLEMS.md com justificativas detalhadas
- **Data de conclusão:** 2025-07-08 