# PBI-30: Autenticação e Controle de Acesso do Dashboard

## Overview
O dashboard atualmente pode ser acessado diretamente por URL sem autenticação. Este PBI define e implementa autenticação, autorização e hardening de sessão para bloquear acesso público e reduzir risco de exposição de dados, priorizando segurança por padrão.

## Problem Statement
- A aplicação está acessível sem login, criando risco de vazamento de métricas e dados sensíveis.
- APIs internas podem ser consumidas sem validação consistente de identidade/autorização.
- Não há trilha de auditoria mínima para eventos críticos de autenticação.
- A ausência de proteção de sessão aumenta risco de uso indevido por compartilhamento de URL, refresh tokens expostos, e falhas de configuração.

## User Stories
- Como responsável pelo produto, quero que apenas usuários autorizados acessem o dashboard.
- Como gestor, quero login estável e seguro, sem abrir mão de usabilidade.
- Como equipe técnica, quero políticas claras de autenticação e autorização para front e APIs.
- Como operação, quero observabilidade para detectar acessos suspeitos e falhas de login.

## Technical Approach
1. Definir provedor de autenticação principal (Supabase Auth) e modelo de sessão (cookies httpOnly + validação server-side).
2. Proteger páginas privadas com middleware/check server-side e redirecionar não autenticado para login.
3. Proteger APIs por autenticação obrigatória e autorização por papel/escopo quando aplicável.
4. Remover qualquer dependência de segredo no client para fluxos sensíveis.
5. Implementar eventos de auditoria de auth (login sucesso/falha, logout, acesso negado).
6. Definir estratégia de rollout com feature flag e rollback seguro.

## UI
- Tela de login dedicada (`/login`) com estados de erro/sucesso claros.
- Mensagem de sessão expirada com ação de relogin.
- Fluxo de logout acessível no layout principal.
- Nenhuma rota de dashboard deve renderizar conteúdo sensível sem sessão válida.

## Conditions of Satisfaction (CoS)
1. Usuário não autenticado não acessa `/dashboard`, `/performance`, `/campaigns`, `/ads`, `/adsets`, `/leads`, `/settings`.
2. Rotas de API sensíveis respondem `401/403` quando sem autenticação/autorização.
3. Sessão usa armazenamento seguro (cookie httpOnly/secure/sameSite) e expiração adequada.
4. Chaves sensíveis permanecem apenas server-side e não aparecem no bundle client.
5. Há logging de eventos críticos de autenticação e acesso negado.
6. Fluxo de login/logout e sessão expirada funciona em ambiente local e produção.
7. Task de teste E2E de CoS executada e aprovada (obrigatória).

## Dependencies
- Supabase Auth configurado (providers e políticas mínimas).
- Variáveis de ambiente de autenticação nos ambientes local/CI/Vercel.
- Definição de papéis de acesso (mínimo inicial: `admin`, `analyst`, `viewer` ou equivalente acordado).

## Open Questions
- Quais provedores de login serão permitidos na fase 1 (email/senha, magic link, SSO)?
- Há necessidade de MFA já na primeira entrega?
- Quais rotas/API podem permanecer públicas (se houver)?
- Qual política de timeout de sessão será adotada?

## Related Tasks
- [tasks.md](./tasks.md)

[Back to Backlog](../backlog.md)
