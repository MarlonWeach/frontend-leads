# Tasks for PBI 17: Interface ultra-refinada inspirada em Apple Vision Pro + Baremetrics

This document lists all tasks associated with PBI 17.

**Parent PBI**: [PBI 17: Interface ultra-refinada inspirada em Apple Vision Pro + Baremetrics](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
| :------ | :--------------------------------------- | :------- | :--------------------------------- |
| 17-1 | Definir tokens de design e tema global | Done | Variáveis de cor, radius, sombras, glassmorphism e dark mode |
| 17-2 | Implementar tipografia refinada | Done | Fonte moderna, títulos grandes, sublabels com brilho |
| 17-3 | Refatorar layout base e containers | Done | Containers, cartões e painéis com novo padrão visual |
| 17-4 | Sidebar minimalista e elegante | Done | Sidebar só com ícones, brilho ao hover, animação de expansão - Acessibilidade corrigida com nova paleta |
| 17-5 | Cartões interativos e animações | Done | Cartões expansíveis, tooltips fade-in, transições de seção |
| 17-6 | [Gráficos interativos e animados](./17-6.md) | Done | Gráficos de barras, pizza e linha animados |
| 17-7 | [Filtros avançados e UI de seleção](./17-7.md) | Done | Implementar sistema de filtros avançados com glassmorphism |
| 17-8 | [Glassmorphism e detalhes visuais](./17-8.md) | Done | Aplicar glassmorphism refinado e identidade visual unificada |
| 17-9 | [Testes de usabilidade e refinamento](./17-9.md) | Done | Validação de usabilidade, microinterações e performance |
| 17-10 | Responsividade de fontes e encaixe nos cards | Done | Ajustar responsividade real das métricas nos cards, garantir legibilidade e centralização em todos os tamanhos |
| 17-11 | [Atualizar paleta de cores (remover menta, adicionar violeta)](./17-11.md) | Done | Garantir aplicação correta da cor violeta (#8A2BE2) como acento em títulos, métricas, botões ou elementos de destaque. Corrigir textos em preto ou branco puro para tons adequados ao dark mode e garantir contraste. |
| 17-12 | Aplicar glassmorphism refinado nos cards de métricas | Done | Efeito glassmorphism com blur(12px), bordas e sombras específicas |
| 17-13 | Padronizar cards de alerta com glassmorphism | Done | Alertas com mesmo padrão visual dos cards superiores |
| 17-14 | Refinar tipografia com headers e sublabels | Done | Headers com Satoshi bold 28-32px, sublabels com brilho sutil |
| 17-15 | Ajustar espaçamento e layout para mais respiro | Done | Aumentar gaps, paddings e espaçamento vertical |
| 17-16 | Implementar projeção futura no gráfico de tendências | Proposed | Adicionar projeção de 3-5 dias futuros com dados simulados baseados em tendência histórica |

---

## Detalhamento das Tasks

### 17-1 Definir tokens de design e tema global
**Descrição:**
- Criar variáveis de cor (dark mode #0E1117, azul elétrico, violeta, verde menta), radius, sombras e glassmorphism no Tailwind/config.
- Garantir consistência visual e fácil manutenção do tema.

**Plano de Implementação:**
- Atualizar tailwind.config.js com tokens customizados.
- Definir classes utilitárias para glassmorphism.
- Documentar tokens no README do design system.

**Critérios de Aceitação:**
- Todas as cores, radius e sombras disponíveis como utilitários.
- Glassmorphism aplicável via classe utilitária.
- Tema dark mode aplicado globalmente.

**Checklist:**
- [x] Cores e acentos definidos
- [x] Radius e sombras customizados
- [x] Glassmorphism documentado
- [x] Dark mode global

**Status:**
✅ Task concluída. Tokens de design implementados e documentados.

---

### 17-2 Implementar tipografia refinada
**Descrição:**
- Adicionar fonte Satoshi, Geist ou Space Grotesk.
- Ajustar títulos (28-32px), sublabels e descrições com brilho sutil.

**Plano de Implementação:**
- Instalar e importar fonte escolhida.
- Atualizar Tailwind para usar a fonte como padrão.
- Definir classes para títulos, sublabels e descrições.

**Critérios de Aceitação:**
- Fonte moderna aplicada globalmente.
- Títulos e sublabels seguem especificação visual.

**Checklist:**
- [x] Fonte instalada e configurada
- [x] Classes de título e sublabel criadas
- [x] Brilho sutil aplicado em descrições

---

### 17-3 Refatorar layout base e containers
**Descrição:**
- Aplicar cantos arredondados, sombras suaves e espaçamento negativo nos cartões/seções.
- Garantir responsividade e "respiro" visual.

**Plano de Implementação:**
- Refatorar componentes de container e card.
- Ajustar grid e espaçamentos.
- Testar em diferentes tamanhos de tela.

**Critérios de Aceitação:**
- Layout responsivo e visualmente "leve".
- Cartões e painéis seguem padrão visual.

**Checklist:**
- [x] Containers refatorados
- [x] Espaçamento negativo aplicado
- [x] Testes de responsividade

---

### 17-4 Sidebar minimalista e elegante
**Descrição:**
- Sidebar apenas com ícones, efeito de brilho ao hover, rótulos opcionais ao passar o mouse.
- Animação de expansão/retração suave.

**Plano de Implementação:**
- Refatorar componente Sidebar.
- Adicionar animações e tooltips.
- Garantir acessibilidade.

**Critérios de Aceitação:**
- Sidebar minimalista, animada e acessível.

**Checklist:**
- [x] Ícones implementados
- [x] Animação de hover/expansão
- [x] Tooltips com rótulo
- [x] Acessibilidade validada

**Status:**
✅ Task concluída. Sidebar minimalista implementada com:
- Ícones apenas no modo colapsado (20px de largura)
- Expansão/retração suave com animação de 500ms
- Tooltips elegantes com glassmorphism ao hover
- Efeito de brilho nos ícones ativos e hover
- Botão de expansão/retração com rotação do ícone
- Responsividade mantida para mobile

---

### 17-5 Cartões interativos e animações
**Descrição:**
- Cartões que expandem ao hover/tap.
- Tooltips com transição fade-in.
- Mudança de seções com animação tipo mola (spring).

**Plano de Implementação:**
- Adicionar animações com Framer Motion ou CSS.
- Refatorar tooltips para fade-in.
- Implementar transições de seção.

**Critérios de Aceitação:**
- Cartões e tooltips animados conforme especificação.

**Checklist:**
- [x] Animação de expansão em cartões
- [x] Tooltips com fade-in
- [x] Transição de seção tipo mola

**✅ CONCLUÍDO COM SUCESSO**: Todos os cartões, tooltips e transições animadas aplicados globalmente em todas as páginas principais, seguindo o padrão visual do dashboard.

---

### 17-6 Gráficos interativos e animados
**Descrição:**
- Gráficos de barras com animação de subida.
- Gráficos de pizza com rotação suave.
- Gráficos de linha com pulso em tempo real.
- Integrar biblioteca de gráficos customizada.

**Plano de Implementação:**
- Escolher biblioteca de gráficos.
- Implementar exemplos de cada tipo de gráfico.
- Customizar visual conforme tema.

**Critérios de Aceitação:**
- Gráficos animados e integrados ao tema.

**Checklist:**
- [ ] Biblioteca escolhida
- [ ] Gráfico de barras animado
- [ ] Gráfico de pizza animado
- [ ] Gráfico de linha animado

---

### 17-7 Filtros avançados e UI de seleção
**Descrição:**
- Filtros de data, métricas e segmentos com UI refinada e animada.
- Feedback visual ao aplicar filtros.

**Plano de Implementação:**
- Refatorar componentes de filtro.
- Adicionar animações e feedbacks visuais.

**Critérios de Aceitação:**
- Filtros funcionais, animados e integrados ao layout.

**Checklist:**
- [ ] Filtros de data/métrica animados
- [ ] Feedback visual ao aplicar

---

### 17-8 Glassmorphism e detalhes visuais
**Descrição:**
- Aplicar glassmorphism nos painéis principais.
- Ajustar opacidade, blur e camadas para efeito sofisticado.

**Plano de Implementação:**
- Criar classes utilitárias para glassmorphism.
- Aplicar nos principais painéis e cartões.

**Critérios de Aceitação:**
- Glassmorphism visível e sofisticado.

**Checklist:**
- [ ] Classes utilitárias criadas
- [ ] Glassmorphism aplicado

---

### 17-9 Testes de usabilidade e refinamento
**Descrição:**
- Validar experiência em diferentes dispositivos.
- Ajustar microinterações e performance de animações.

**Plano de Implementação:**
- Testar em desktop, tablet e mobile.
- Coletar feedback e ajustar detalhes.

**Critérios de Aceitação:**
- Experiência consistente e fluida em todos os dispositivos.

**Checklist:**
- [ ] Testes em múltiplos dispositivos
- [ ] Microinterações refinadas
- [ ] Performance validada

### 17-10 Responsividade de fontes e encaixe nos cards
**Status:**
Review. Ajustar responsividade real das métricas nos cards, garantir que números grandes não estourem o layout, centralização e legibilidade em todos os tamanhos de tela.

### 17-11 Atualizar paleta de cores (remover menta, adicionar violeta)
**Status:**
Review. Garantir aplicação correta da cor violeta (#8A2BE2) como acento em títulos, métricas, botões ou elementos de destaque. Corrigir textos em preto ou branco puro para tons adequados ao dark mode e garantir contraste. 