# Tasks for PBI 30: Autenticação e Controle de Acesso do Dashboard

This document lists all tasks associated with PBI 30.

**Parent PBI**: [PBI 30: Autenticação e Controle de Acesso do Dashboard](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| 30-1 | Definir arquitetura de autenticação e ameaça | Proposed | Documentar provedor, modelo de sessão, superfícies de ataque e controles mínimos de segurança |
| 30-2 | Implementar login seguro e sessão server-side | Proposed | Criar fluxo de login/logout com sessão segura (cookies httpOnly/secure/sameSite) |
| 30-3 | Proteger rotas de página com middleware/auth guard | Proposed | Bloquear acesso não autenticado nas rotas privadas e redirecionar para `/login` |
| 30-4 | Proteger APIs com autenticação e autorização | Proposed | Exigir identidade válida e aplicar autorização por perfil/escopo nas APIs sensíveis |
| 30-5 | Hardening de sessão e segredos | Proposed | Garantir expiração, renovação segura, revogação e ausência de segredo no client |
| 30-6 | Auditoria e observabilidade de autenticação | Proposed | Registrar eventos de login, falha, logout e acesso negado com rastreabilidade mínima |
| 30-7 | Teste E2E de CoS de autenticação (obrigatório) | Proposed | Validar ponta a ponta os critérios de acesso negado, login, sessão expirada e logout |
