# Backlog do Projeto

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
|----|-------|------------|--------|----------------------------------|
| 16 | Usuário | Como usuário do dashboard, quero que o sistema atualize automaticamente a lista de anúncios ativos para que eu possa ver as métricas corretas sem intervenção manual | Proposed | 1. O sistema deve buscar automaticamente anúncios ativos da Meta API<br>2. A lista de anúncios ativos deve ser atualizada periodicamente<br>3. O dashboard deve usar apenas dados de anúncios ativos<br>4. Não deve ser necessária intervenção manual para atualizar a lista de anúncios<br>5. O sistema deve lidar adequadamente com mudanças de status (pausa/ativação) dos anúncios<br>6. A performance do dashboard não deve ser impactada negativamente<br>7. O sistema deve implementar cache inteligente para reduzir chamadas à API<br>8. Erros na atualização da lista de anúncios devem ser tratados adequadamente e registrados<br>9. O usuário deve ser notificado caso haja problemas na atualização dos dados |
| 17 | Usuário | Como usuário, quero uma interface ultra-refinada inspirada em Apple Vision Pro e Baremetrics, para ter uma experiência visual moderna, minimalista e informativa, com gráficos animados, navegação elegante e tipografia sofisticada. | Proposed | - Layout dark mode com glassmorphism e acentos de cor
- Sidebar minimalista com ícones e animações
- Gráficos animados (barras, pizza, linha)
- Tipografia moderna e títulos destacados
- Cartões e painéis interativos
- Filtros avançados com UI refinada
- Testes de usabilidade e responsividade
[View Details](./17/prd.md) |
| 18 | Usuário | Como usuário, quero que todas as páginas exibam dados atualizados e funcionais para ter uma experiência consistente e confiável em todo o dashboard | Agreed | 1. Página /campaigns deve exibir dados reais e atualizados da Meta API<br>2. Filtro padrão de anunciantes ativos deve funcionar em /advertisers<br>3. Bloco "Performance Geral" no dashboard deve mostrar métricas agregadas<br>4. Páginas devem ter fallback adequado para dados indisponíveis<br>5. Status de sincronização deve ser visível para o usuário<br>6. Interface consistente com design system em todas as páginas<br>7. Tratamento de erros amigável e informativo<br>8. Performance adequada em todas as funcionalidades<br>[View Details](./18/prd.md) |
| 19 | Gestor de Marketing | Como um gestor de marketing, quero uma página de performance detalhada para analisar profundamente o desempenho das campanhas. | Proposed | Listagem de campanhas com métricas detalhadas (leads, gasto, CTR, CPL), filtros funcionais (data, status) e ordenação por coluna. |
| 18 | Gestor de Marketing | Corrigir problemas críticos de dados e funcionalidade que impedem a análise correta e o uso básico da plataforma. | Done | Dashboard funcional com dados reais, filtros corrigidos, tratamento de erro padronizado e indicador de sincronização. | 