# Permissões Meta: leads na Graph API vs métricas em Insights

Este guia cobre o que falta quando aparecem erros como **`(#200) Requires pages_manage_ads`** ou **`Unsupported get request`** ao chamar `leadgen_forms` ou `/{form-id}/leads`.

**Resumo:** ler **contatos** (cada lead do Instant Form) exige permissões **na Página** e escopos específicos. Já **números de conversão** (quantos leads) vêm da API de **Insights** com `ads_read` — veja `scripts/sync-ad-insights-account.js`.

---

## Passo a passo (Meta for Developers)

### 1. Abrir o app

1. Acesse [developers.facebook.com](https://developers.facebook.com/) → **Meus Apps** → selecione o app usado no projeto.

### 2. Colocar o app em modo **Live**

1. No menu do app: **Painel** ou **Configurações do app** → **Modo do app**.
2. Se estiver **Desenvolvimento**, só contas com função no app (administrador, desenvolvedor, tester) veem dados reais de leads de terceiros.
3. Para produção: alterne para **Ao vivo** quando o app estiver pronto e as permissões necessárias aprovadas (ou em uso padrão permitida).

### 3. Adicionar produtos e permissões

1. **Casos de uso** / **Permissões e recursos** (ou **App Review** → **Permissions and Features**).
2. Solicite ou ative (conforme o tipo de app e acesso):

| Permissão | Para quê |
|-----------|----------|
| **`ads_read`** | Ler campanhas, anúncios e **Insights** (inclui contagens de lead em `actions` / `results`). |
| **`ads_management`** | Se você também cria/edita anúncios pelo app (muitas integrações server-side usam). |
| **`pages_show_list`** | Listar páginas às quais o usuário/sistema tem acesso. |
| **`pages_read_engagement`** | Ler dados de engajamento da Página. |
| **`pages_manage_ads`** | Gerir anúncios **ligados à Página** — exigida para a edge **`/{page-id}/leadgen_forms`**. |
| **`leads_retrieval`** | Ler envios em **`/{leadgen-form-id}/leads`** e dados de lead (conforme política da Meta). |

3. Permissões **avançadas** podem exigir **Análise do aplicativo (App Review)** e **Verificação da empresa**. Siga o assistente na própria Meta até o status **Aprovado** ou **Acesso padrão** disponível.

### 4. Vincular o Ativo Comercial (Business)

1. **Configurações do app** → **Básico** → seção **Ativo comercial** → associe a **Conta Comercial** correta.
2. A conta de anúncios e a Página dos formulários devem estar nessa mesma estrutura (ou com compartilhamento adequado).

### 5. Dar acesso do app à Página (Facebook)

1. No **Gerenciador de Negócios** (Business Manager): **Configurações da empresa** → **Contas** → **Páginas**.
2. Abra a Página cujo ID você usa em `META_PAGE_ID`.
3. Garanta que o **usuário ou sistema** que gera o token tenha **controle total** ou permissões de **anúncios** na Página.
4. Em **Integrações** / **Ativos conectados**, confira se o **app** aparece com as tarefas necessárias (gerir anúncios, etc.), se a Meta exibir essa tela para o seu caso.

### 6. Gerar o token certo

**Opção A — Token de usuário (OAuth)**  
1. **Ferramentas** → [Explorador da Graph API](https://developers.facebook.com/tools/explorer/).  
2. Selecione o app → **Obter token** → marque `ads_read`, `pages_show_list`, `pages_read_engagement`, `pages_manage_ads`, `leads_retrieval` (e `ads_management` se precisar).  
3. Conclua o login e aceite as telas da Página.  
4. Troque por **token de longa duração** conforme a documentação oficial da Meta (endpoint `oauth/access_token`).

**Opção B — Usuário do sistema (System User) no Business Manager**  
1. **Configurações da empresa** → **Usuários** → **Usuários do sistema** → crie ou use um existente.  
2. Atribua **ativos** (conta de anúncios, Página) e gere **token** com os escopos acima.  
3. Use esse token no `.env.local` como `META_ACCESS_TOKEN` / `NEXT_PUBLIC_META_ACCESS_TOKEN`.

**Dois tokens, duas regras:** a Meta trata **`/{page-id}/leadgen_forms`** e **`/{form-id}/leads`** de forma diferente:

| Chamada | Token que costuma funcionar |
|---------|------------------------------|
| `GET /{PAGE_ID}/leadgen_forms` | **Page Access Token** (token da própria Página). Com **User Access Token**, mesmo com `pages_manage_ads`, é comum receber **`(#190) This method must be called with a Page Access Token`**. |
| `GET /{FORM_ID}/leads` | **User Access Token** com `leads_retrieval`. Se você usar o token **da Página** (Page Access Token) aqui, costuma falhar **em todos** os forms com *Unsupported get request*. No Explorador, use token de **usuário** com os escopos, não só o token gerado ao selecionar a página. |

**Diagnóstico rápido:** com o mesmo token do `.env`, `GET /me` — se o `id` retornado for **igual** ao `META_PAGE_ID`, esse token é de **Página**; para `/leads` nos forms precisa de **token de usuário** (`META_USER_ACCESS_TOKEN` ou `META_ACCESS_TOKEN` correto). O script `sync-meta-leads.js` avisa isso automaticamente quando `META_PAGE_ID` está definido.

Para **Insights** (`ads_read`) costuma bastar token ligado à **conta de anúncios**.

### 7. Testar antes de colocar no `.env.local`

**A) Token de usuário (Explorador)** — para **`/{FORM_ID}/leads`:**

- `GET /{FORM_ID}/leads?fields=id,created_time&limit=5` — deve retornar `data` (com itens ou vazio), sem erro de permissão.

**B) Listar formulários da página — `leadgen_forms`:**

1. No [Explorador da Graph API](https://developers.facebook.com/tools/explorer/), gere o token de usuário com as permissões da página.
2. No seletor de token, escolha **a Página** (não só “User”): opção tipo **“Obter token de acesso à Página”** / dropdown da Página — o valor copiado é o **Page Access Token**.
3. Com **esse** token na URL:  
   `GET /{PAGE_ID}/leadgen_forms?fields=id,name`  
   — não deve retornar erro **#190** por “Page Access Token”.

**C) No projeto (.env.local):**

- `META_ACCESS_TOKEN` — token que você usa para anúncios e para **`/{form-id}/leads`** (ex.: user long-lived).
- `META_PAGE_ACCESS_TOKEN` *(opcional)* — **só** para o script conseguir chamar **`leadgen_forms`**. Se você já lista todos os forms em `META_FORM_ID`, pode **omitir** o Page Token e ignorar a listagem pela página.

Outros checks úteis:

- `GET /me/accounts` com user token — lista páginas às quais o usuário tem acesso.

### 8. Atualizar o projeto

1. **`META_PAGE_ACCESS_TOKEN`** (opcional) — Page token do Explorador; só para **`GET /{PAGE_ID}/leadgen_forms`**.  
2. **`META_USER_ACCESS_TOKEN`** ou **`META_ACCESS_TOKEN`** — token de **usuário** com **`leads_retrieval`**; obrigatório para **`GET /{FORM_ID}/leads`** e **`GET /{ad-id}/leads`**.  
   - Não use o Page token nessas URLs: a Meta retorna *Unsupported get request*.  
   - Se você colocou o Page token no lugar do `META_ACCESS_TOKEN`, defina explicitamente **`META_USER_ACCESS_TOKEN`** com o token de usuário.  
3. Confirme `META_PAGE_ID` e `META_FORM_ID`.  
4. Opcional: **`SYNC_META_LEADS_ONLY_META_FORM_ID=1`** — sincroniza só os IDs de `META_FORM_ID`, sem mesclar a lista longa do `leadgen_forms`.  
5. Opcional: **`SYNC_META_LEADS_SKIP_FORMS_SYNC=1`** — não chama `leadgen_forms` nem forms.

6. Se **`NEXT_PUBLIC_META_ACCESS_TOKEN`** e **`META_ACCESS_TOKEN`** forem diferentes no `.env.local`, o script **`sync-meta-leads.js`** usa por padrão o **NEXT_PUBLIC** primeiro. Se você atualizou só `META_ACCESS_TOKEN` e os leads falham, defina **`SYNC_META_LEADS_USE_META_ACCESS_TOKEN_ONLY=1`** ou **igual os dois valores**.

7. **`SYNC_META_LEADS_PROBE_FORM_ID`** — coloque um **form ID** que você já validou no Explorador com `GET /{form-id}/leads`. O script testa o **primeiro** da lista `META_FORM_ID`; se esse ID for antigo ou inválido, todos os requests falham até você colocar um ID bom no probe ou **reordenar** `META_FORM_ID`.

8. **`(#4) Application request limit`** — cota **por aplicativo** na Graph (e por usuário). Se a **primeira** chamada do script já devolve #4, não é “pausa entre forms”: a janela de cota está cheia (outro job, Insights, Zapier, ou execução anterior). **Espere 15–60 minutos** antes de rodar de novo; não rode em paralelo com `sync-ad-insights-*`, webhooks ou outros consumidores do mesmo app.

   **No `.env.local` (para o script `sync-meta-leads.js`):**

   - `SYNC_META_LEADS_SKIP_PROBE=1` — não faz o teste duplo `GET /{form}` + `GET /{form}/leads` antes do lote (economiza 2 chamadas).
   - `SYNC_META_LEADS_INITIAL_DELAY_MS=120000` — espera 2 minutos **antes** da primeira URL (útil logo após #4 ou após outro script).
   - `SYNC_META_LEADS_FORM_COOLDOWN_MS=8000` (ou mais) — pausa maior entre cada form.
   - Divida `META_FORM_ID` em **duas execuções** em horários diferentes (cron) se tiver dezenas de forms.

   **No Meta for Developers:** App → **Painel** / ferramentas de uso — acompanhe consumo; apps novos têm limites menores. Não existe botão “aumentar cota” para todos os casos; verificação de empresa e uso estável pode ajudar em alguns cenários (documentação Meta: *Rate Limits* / *Marketing API*).

9. **Script `sync-meta-leads.js` (detalhe técnico)** — o token **não** deve ir na query string (`access_token=...`): alguns tokens contêm caracteres que **quebram** a URL. O script usa **`Authorization: Bearer`**. O filtro de datas na edge `/leads` segue a doc de *Retrieving Leads* (`filtering` com `time_created`), não `since`/`until` na URL (legado: `SYNC_META_LEADS_USE_LEGACY_SINCE_UNTIL=1`). Versão da API: `META_GRAPH_API_VERSION` (ex.: alinhar ao Explorador).

---

## Confusão comum: Page ID vs Form ID

A edge **`leadgen_forms`** existe só no objeto **Página** do Facebook:

- Correto: `GET /{PAGE_ID}/leadgen_forms?fields=id,name` (lista formulários da página).
- **Errado:** `GET /{FORM_ID}/leadgen_forms` — o número que você guarda em `META_FORM_ID` é o ID do **formulário** (Leadgen Form), **não** da página. Nesse nó **não existe** `leadgen_forms`, e a Meta responde: *Tried accessing nonexisting field (leadgen_forms)* (**#100**).

Para um **ID de formulário** (ex.: `1048304897303363`), use:

- `GET /{FORM_ID}/leads?fields=id,created_time&limit=10` — envios (leads).
- Opcional: `GET /{FORM_ID}?fields=id,name` — só metadados do form.

A idade do form (ex.: um mês) **não** invalida o ID na API; o que importa é o token e o acesso ao ativo.

## Referências oficiais

- [Lead Ads – Marketing API](https://developers.facebook.com/docs/marketing-api/guides/lead-ads)  
- [Permissões da Graph API](https://developers.facebook.com/docs/permissions/reference)  
- [Página – leadgen_forms](https://developers.facebook.com/docs/graph-api/reference/page/leadgen_forms/)

---

## Contagens de lead no dashboard (sem PII)

Não depende de `leads_retrieval` na Página para **números** agregados: use Insights com `actions` e `results`:

```bash
node scripts/sync-ad-insights-account.js
```

Detalhes: comentário no topo de `scripts/sync-meta-leads.js` e seção em `docs/sync/meta-leads.md`.
