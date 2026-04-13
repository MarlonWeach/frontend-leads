/**
 * sync-meta-leads.js — grava CONTATOS (objetos Lead: id, datas, opcionalmente field_data).
 *
 * Isso e diferente de "numero de leads" no dashboard: conversoes agregadas vêm da API de
 * Insights (actions/results), ja usada em app/api/performance/* e scripts de insights.
 * Este script so e necessario se voce precisa da tabela meta_leads (CRM / qualidade por lead).
 *
 * Env uteis:
 * - SYNC_META_LEADS_SKIP_FORMS_SYNC=1  — nao chama form/page (evita erro #200 pages_manage_ads)
 * - SYNC_META_LEADS_SKIP_ADS_SYNC=1    — nao percorre /ad-id/leads (economiza quota)
 * - SYNC_META_LEADS_INCLUDE_FIELD_DATA=1 — inclui field_data (pesado; pode gerar "reduce data")
 * - SYNC_META_LEADS_PAGE_LIMIT=25      — limite por pagina na edge leads (padrao 25)
 *
 * Permissoes: docs/META_LEADS_GRAPH_PERMISSIONS.md
 * - leadgen_forms na PAGINA exige Page Access Token (erro #190 com User token).
 * - /{form-id}/leads costuma funcionar com User token + leads_retrieval.
 * - META_PAGE_ACCESS_TOKEN: so GET /{page-id}/leadgen_forms
 * - META_USER_ACCESS_TOKEN ou META_ACCESS_TOKEN: GET /{form-id}/leads e /{ad-id}/leads (token de USUARIO + leads_retrieval, NAO Page token)
 * - SYNC_META_LEADS_USE_META_ACCESS_TOKEN_ONLY=1 — forca META_ACCESS_TOKEN (evita NEXT_PUBLIC_* antigo sobrescrever)
 * - SYNC_META_LEADS_PROBE_FORM_ID=<id> — ID de form que funciona no Explorador (o primeiro da lista pode estar invalido)
 * - SYNC_META_LEADS_FORM_COOLDOWN_MS=2500 — pausa entre cada form (evita #4 Application request limit)
 * - SYNC_META_LEADS_SKIP_PROBE=1 — nao chama GET form + /leads de teste antes do lote (economiza 2+ reqs; use se o token ja e valido)
 * - SYNC_META_LEADS_INITIAL_DELAY_MS=0 — espera N ms antes da primeira chamada Graph (ex.: 120000 apos outro script ou #4)
 * - SYNC_META_LEADS_DEBUG_TOKEN=1 — loga resultado de GET /me para o token da edge /leads (diagnostico)
 * - META_GRAPH_API_VERSION=v23.0 — versao da Graph (alinhe ao Explorador se necessario)
 * - SYNC_META_LEADS_USE_LEGACY_SINCE_UNTIL=1 — usa since/until na edge /leads (legado); padrao e filtering time_created (doc Meta)
 */
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

/** Aspas ou espacos no .env quebram o token na URL */
function trimToken(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/^['"]+|['"]+$/g, '');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const USE_META_ACCESS_TOKEN_ONLY =
  process.env.SYNC_META_LEADS_USE_META_ACCESS_TOKEN_ONLY === '1';
const NEXT_PUBLIC_META = trimToken(process.env.NEXT_PUBLIC_META_ACCESS_TOKEN);
const PLAIN_META = trimToken(process.env.META_ACCESS_TOKEN);

/** Por padrao NEXT_PUBLIC_* vem primeiro (Next.js); scripts Node costumam querer META_ACCESS_TOKEN atual */
const META_ACCESS_TOKEN = USE_META_ACCESS_TOKEN_ONLY
  ? PLAIN_META || NEXT_PUBLIC_META
  : NEXT_PUBLIC_META || PLAIN_META;

if (NEXT_PUBLIC_META && PLAIN_META && NEXT_PUBLIC_META !== PLAIN_META) {
  console.warn(
    '[AVISO] NEXT_PUBLIC_META_ACCESS_TOKEN e META_ACCESS_TOKEN sao DIFERENTES no .env.local.'
  );
  console.warn(
    `  Este script usa: ${USE_META_ACCESS_TOKEN_ONLY ? 'META_ACCESS_TOKEN (forcado)' : 'NEXT_PUBLIC_META_ACCESS_TOKEN primeiro'}.`
  );
  console.warn(
    '  Se os leads falharem, iguale os dois ou defina SYNC_META_LEADS_USE_META_ACCESS_TOKEN_ONLY=1.'
  );
}
/** Token de usuario com leads_retrieval — prioridade sobre META_ACCESS_TOKEN nas edges /leads */
const META_USER_ACCESS_TOKEN = trimToken(
  process.env.META_USER_ACCESS_TOKEN || process.env.NEXT_PUBLIC_META_USER_ACCESS_TOKEN || ''
);
/** Todas as chamadas .../leads (form + ad) usam isto (NUNCA o Page token) */
const TOKEN_FOR_LEADS_EDGE = META_USER_ACCESS_TOKEN || META_ACCESS_TOKEN;
/** So para GET /{page-id}/leadgen_forms (opcional; senao use so META_FORM_ID) */
const META_PAGE_ACCESS_TOKEN = trimToken(
  process.env.NEXT_PUBLIC_META_PAGE_ACCESS_TOKEN ||
    process.env.META_PAGE_ACCESS_TOKEN ||
    ''
);
/** ID de form que voce validou no Explorador (teste antes do primeiro da lista) */
const PROBE_FORM_ID_ENV = trimToken(process.env.SYNC_META_LEADS_PROBE_FORM_ID || '');
const META_PAGE_ID =
  process.env.NEXT_PUBLIC_META_PAGE_ID || process.env.META_PAGE_ID || '';
/** IDs de Instant Forms (Leadgen). Separados por virgula — mesmo formato que voce ja usa no .env */
const META_FORM_ID_RAW =
  process.env.NEXT_PUBLIC_META_FORM_ID || process.env.META_FORM_ID || '';

const VERBOSE = process.env.SYNC_LEADS_VERBOSE === '1';
const SKIP_FORMS_SYNC = process.env.SYNC_META_LEADS_SKIP_FORMS_SYNC === '1';
const SKIP_ADS_SYNC = process.env.SYNC_META_LEADS_SKIP_ADS_SYNC === '1';
/** Se 1, nao mescla IDs do leadgen_forms da pagina — so META_FORM_ID (menos forms com erro legado) */
const ONLY_META_FORM_ID = process.env.SYNC_META_LEADS_ONLY_META_FORM_ID === '1';
/** field_data infla muito a resposta; padrao OFF para evitar erro "reduce the amount of data" */
const INCLUDE_FIELD_DATA = process.env.SYNC_META_LEADS_INCLUDE_FIELD_DATA === '1';
const LEADS_PAGE_LIMIT = Math.min(
  100,
  Math.max(10, Number(process.env.SYNC_META_LEADS_PAGE_LIMIT) || 25)
);

if (!SUPABASE_URL || !SUPABASE_KEY || !TOKEN_FOR_LEADS_EDGE) {
  throw new Error(
    'Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e META_ACCESS_TOKEN ou META_USER_ACCESS_TOKEN no .env.local'
  );
}

if (META_PAGE_ACCESS_TOKEN && TOKEN_FOR_LEADS_EDGE === META_PAGE_ACCESS_TOKEN) {
  throw new Error(
    'O token usado em /{form-id}/leads nao pode ser o Page Access Token. ' +
      'Defina META_USER_ACCESS_TOKEN com o token de USUARIO (Explorador: usuario + leads_retrieval). ' +
      'Deixe META_PAGE_ACCESS_TOKEN apenas para leadgen_forms.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RATE_LIMIT_DELAY = 500;
/** Pausa entre cada form na sync (Meta #4 = cota do app) */
const FORM_COOLDOWN_MS = Math.max(
  300,
  parseInt(process.env.SYNC_META_LEADS_FORM_COOLDOWN_MS || '2500', 10) || 2500
);
const SKIP_PROBE = process.env.SYNC_META_LEADS_SKIP_PROBE === '1';
const INITIAL_DELAY_MS = Math.max(
  0,
  parseInt(process.env.SYNC_META_LEADS_INITIAL_DELAY_MS || '0', 10) || 0
);
const BATCH_SIZE = 50;
const LEADS_DAYS = 90;
const MAX_FORM_PAGES = 30;
const MAX_LEAD_PAGES_PER_FORM = 50;

const LEAD_CAMPAIGN_OBJECTIVES = [
  'OUTCOME_LEADS',
  'LEAD_GENERATION',
  'LEADS',
];

/** Versao da Graph API — nunca coloque access_token na query string (caracteres &/+ quebram o token). */
const GRAPH_VERSION_RAW = (process.env.META_GRAPH_API_VERSION || 'v23.0').trim();
const GRAPH_VERSION = GRAPH_VERSION_RAW.startsWith('v')
  ? GRAPH_VERSION_RAW
  : `v${GRAPH_VERSION_RAW}`;
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
/** Doc Meta: filtrar leads por data usa filtering (time_created), nao since/until na edge /leads */
const USE_LEGACY_SINCE_UNTIL = process.env.SYNC_META_LEADS_USE_LEGACY_SINCE_UNTIL === '1';

function leadTimeRangeUnix() {
  const until = Math.floor(Date.now() / 1000);
  const since = until - LEADS_DAYS * 24 * 60 * 60;
  return { since, until };
}

/** Filtro de intervalo conforme Marketing API (retrieving leads) — nao usar since/until na URL. */
function leadsTimeFilteringParam(since, until) {
  const filtering = [
    { field: 'time_created', operator: 'GREATER_THAN_OR_EQUAL', value: since },
    { field: 'time_created', operator: 'LESS_THAN', value: until },
  ];
  return encodeURIComponent(JSON.stringify(filtering));
}

function leadEdgeFields(includeFieldData) {
  const light =
    'id,created_time,ad_id,adset_id,campaign_id,form_id,is_organic';
  return includeFieldData ? `${light},field_data` : light;
}

function isReduceDataError(msg) {
  if (!msg || typeof msg !== 'string') return false;
  const m = msg.toLowerCase();
  return m.includes('reduce the amount of data') || m.includes('reduce the amount');
}

/**
 * Pagina GET /{nodeId}/leads com uma retentativa se a Meta pedir menos dados.
 */
async function fetchLeadsPagesForNode(nodeId, { since, until }) {
  let fields = leadEdgeFields(INCLUDE_FIELD_DATA);
  let limit = LEADS_PAGE_LIMIT;

  async function pullAll() {
    const acc = [];
    let after = null;
    let pageCount = 0;

    while (pageCount < MAX_LEAD_PAGES_PER_FORM) {
      pageCount++;
      let url;
      if (USE_LEGACY_SINCE_UNTIL) {
        url = `${GRAPH_BASE}/${nodeId}/leads?fields=${encodeURIComponent(fields)}&limit=${limit}&since=${since}&until=${until}`;
      } else {
        url = `${GRAPH_BASE}/${nodeId}/leads?fields=${encodeURIComponent(fields)}&limit=${limit}&filtering=${leadsTimeFilteringParam(since, until)}`;
      }
      if (after) url += `&after=${encodeURIComponent(after)}`;

      const { response, data } = await fetchGraphJson(url, {
        logUrl: VERBOSE,
        accessToken: TOKEN_FOR_LEADS_EDGE,
      });

      if (!response.ok || data.error) {
        const msg = data.error?.message || '';
        return { errorMessage: msg || response.statusText, leads: acc };
      }

      if (data.data?.length) acc.push(...data.data);
      after = data.paging?.cursors?.after;
      if (!after) break;
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY));
    }

    return { errorMessage: null, leads: acc };
  }

  let result = await pullAll();

  if (
    result.errorMessage &&
    isReduceDataError(result.errorMessage) &&
    (INCLUDE_FIELD_DATA || limit > 10)
  ) {
    fields = leadEdgeFields(false);
    limit = 10;
    console.warn(
      `Node ${nodeId}: retentando leads com campos minimos e limit=10 (erro "reduce data")...`
    );
    result = await pullAll();
  }

  return {
    ok: !result.errorMessage,
    errorMessage: result.errorMessage,
    leads: result.leads,
  };
}

/**
 * Graph API: token NUNCA na query string (Meta envia caracteres que quebram &...=).
 * Usa Authorization Bearer (documentacao Meta aceita header ou query).
 * @param {{ logUrl?: boolean, maxRetries?: number, accessToken: string }} opts
 */
async function fetchGraphJson(url, { logUrl = true, maxRetries: maxRetriesOpt, accessToken } = {}) {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('fetchGraphJson: accessToken e obrigatorio');
  }
  const maxRetries = Math.min(12, Math.max(1, maxRetriesOpt ?? 6));
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (logUrl && VERBOSE) {
      console.log(`GET: ${url}`);
    }
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 429) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Rate limit HTTP 429, aguardando ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    const err = data.error;
    const errCode = err?.code;
    const errMsg = (err?.message || '').toLowerCase();
    const isAppOrUserLimit =
      err &&
      (errCode === 4 ||
        errCode === 17 ||
        errCode === 32 ||
        errMsg.includes('application request limit') ||
        errMsg.includes('user request limit') ||
        errMsg.includes('too many calls'));

    if (isAppOrUserLimit && attempt < maxRetries - 1) {
      const delay = Math.min(300000, 20000 * Math.pow(2, attempt));
      console.log(
        `Limite Meta (codigo ${errCode || 'n/a'}), aguardando ${Math.round(delay / 1000)}s — retry ${attempt + 2}/${maxRetries}...`
      );
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    return { response, data };
  }
  throw new Error('Limite Meta: esgotadas tentativas de retry');
}

/**
 * Antes do lote: confere se o objeto form existe e se /leads responde.
 * Se o primeiro ID da lista for antigo, use SYNC_META_LEADS_PROBE_FORM_ID=<id que funciona no Explorador>.
 */
async function probeLeadsTokenOnForm(formId) {
  /** Probe: menos retries que o lote — se #4, falha rapido em vez de segurar minutos na 1ª chamada */
  const probeOpts = { logUrl: true, maxRetries: 2 };
  const metaUrl = `${GRAPH_BASE}/${formId}?fields=id,name`;
  const meta = await fetchGraphJson(metaUrl, { ...probeOpts, accessToken: TOKEN_FOR_LEADS_EDGE });
  if (!meta.response.ok || meta.data.error) {
    console.error(
      '[DIAG] GET /{form-id}?fields=id,name falhou:',
      meta.data.error?.message || meta.response.statusText
    );
    console.error(
      '  Este ID pode nao ser mais um Leadgen Form acessivel a este token (form removido, outro BM, ou ID errado).'
    );
    console.error(
      '  Teste no Explorador o MESMO token do .env e outro form ID, ou defina SYNC_META_LEADS_PROBE_FORM_ID=<form_id_valido>.'
    );
  } else {
    console.log(
      `[DIAG] Form OK na API: id=${meta.data.id}${meta.data.name ? ` name="${meta.data.name}"` : ''}`
    );
  }

  const url = `${GRAPH_BASE}/${formId}/leads?fields=id&limit=1`;
  const { response, data } = await fetchGraphJson(url, {
    ...probeOpts,
    accessToken: TOKEN_FOR_LEADS_EDGE,
  });
  if (!response.ok || data.error) {
    console.error('[TESTE] GET /{form-id}/leads falhou:', data.error?.message || response.statusText);
    if (meta.response.ok && !meta.data.error) {
      console.error(
        '  O form existe, mas a edge /leads falhou: confira escopo leads_retrieval e valide o token em https://developers.facebook.com/tools/debug/accesstoken/'
      );
    } else {
      console.error(
        '  Verifique META_USER_ACCESS_TOKEN / META_ACCESS_TOKEN (mesmo valor do Explorador), aspas no .env, ou SYNC_META_LEADS_USE_META_ACCESS_TOKEN_ONLY=1. O script usa Authorization Bearer (token nao na URL).'
      );
    }
    return false;
  }
  console.log(`[TESTE] Token OK para leads (form ${formId}).`);
  return true;
}

function normalizePageId(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (!s) return '';
  return s.replace(/^page_/i, '');
}

/** IDs de pagina configurados no env (sem async). */
function getConfiguredPageIdsSync() {
  return META_PAGE_ID.split(',')
    .map((x) => normalizePageId(x))
    .filter(Boolean);
}

/**
 * Page Access Token: GET /me devolve o objeto Pagina (id === page id).
 * User token: GET /me devolve o usuario (id diferente da pagina).
 * Se o token da edge /leads for Page token, todos os /{form-id}/leads falham com "Unsupported get request".
 */
async function warnIfLeadsTokenIsPageScoped() {
  const pages = getConfiguredPageIdsSync();
  const debug = process.env.SYNC_META_LEADS_DEBUG_TOKEN === '1';
  const url = `${GRAPH_BASE}/me?fields=id,name`;
  const { response, data } = await fetchGraphJson(url, {
    logUrl: VERBOSE,
    maxRetries: 2,
    accessToken: TOKEN_FOR_LEADS_EDGE,
  });
  if (!response.ok || data.error) {
    console.warn(
      '[TOKEN] GET /me falhou (token invalido/expirado ou rede):',
      data.error?.message || response.statusText
    );
    return;
  }
  const meId = String(data.id || '');
  const meName = data.name || '';
  if (debug) {
    console.log(`[TOKEN] GET /me: id=${meId} name=${meName}`);
  }
  if (pages.length > 0 && pages.includes(meId)) {
    console.warn('');
    console.warn(
      '[TOKEN] >>> PROVAVEL CAUSA DOS ERROS "Unsupported get request" EM TODOS OS FORMS <<<'
    );
    console.warn(
      '  O access_token usado em /{form-id}/leads parece ser PAGE ACCESS TOKEN: GET /me retorna o MESMO id que META_PAGE_ID (' +
        meId +
        ').'
    );
    console.warn(
      '  A edge /{form-id}/leads exige USER access token (usuario) com escopo leads_retrieval — NAO o token copiado "da Pagina" no Explorador.'
    );
    console.warn(
      '  Correcao: gere token de USUARIO no Explorador (app + permissoes incl. leads_retrieval), coloque em META_USER_ACCESS_TOKEN ou substitua META_ACCESS_TOKEN.'
    );
    console.warn(
      '  Mantenha META_PAGE_ACCESS_TOKEN separado APENAS para GET /{page}/leadgen_forms se precisar listar forms pela pagina.'
    );
    console.warn('');
  } else if (debug && pages.length > 0) {
    console.log(
      `[TOKEN] GET /me id (${meId}) difere de META_PAGE_ID (${pages.join(',')}) — consistente com user token para /leads.`
    );
  }
}

/** Parseia META_FORM_ID= id1,id2,... (espacos e linhas ignorados) */
function parseMetaFormIdsFromEnv() {
  if (!META_FORM_ID_RAW || typeof META_FORM_ID_RAW !== 'string') return [];
  const parts = META_FORM_ID_RAW.split(/[\s,]+/);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const id = String(p).trim();
    if (!id || !/^\d+$/.test(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Paginas a sincronizar: env META_PAGE_ID (varias separadas por virgula) ou /me/accounts.
 */
async function resolvePageIds() {
  const fromEnv = META_PAGE_ID.split(',')
    .map((x) => normalizePageId(x))
    .filter(Boolean);

  if (fromEnv.length > 0) {
    console.log(
      `Usando META_PAGE_ID: ${fromEnv.length} pagina(s) (definido no .env.local).`
    );
    return fromEnv;
  }

  const url = `${GRAPH_BASE}/me/accounts?fields=id,name&limit=100`;
  const { response, data } = await fetchGraphJson(url, {
    logUrl: true,
    accessToken: TOKEN_FOR_LEADS_EDGE,
  });

  if (!response.ok || data.error) {
    console.log(
      'Nao foi possivel listar paginas via /me/accounts (normal com alguns tokens).',
      data.error?.message || response.statusText
    );
    console.log(
      'Defina META_PAGE_ID no .env.local (ID numerico da Pagina do Facebook dos formularios).'
    );
    return [];
  }

  const pages = data.data || [];
  if (pages.length === 0) {
    console.log(
      '/me/accounts retornou 0 paginas. Defina META_PAGE_ID para puxar leads de Instant Forms.'
    );
    return [];
  }

  console.log(
    `Encontradas ${pages.length} pagina(s) no token:`,
    pages.map((p) => `${p.name} (${p.id})`).join(', ')
  );
  return pages.map((p) => String(p.id));
}

async function fetchAllLeadgenFormIds(pageId) {
  const formIds = [];
  let after = null;
  let page = 0;
  const tokenForPageEdge = META_PAGE_ACCESS_TOKEN || META_ACCESS_TOKEN;

  do {
    page++;
    if (page > MAX_FORM_PAGES) break;

    let url = `${GRAPH_BASE}/${pageId}/leadgen_forms?fields=id,name,status,leads_count&limit=100`;
    if (after) url += `&after=${encodeURIComponent(after)}`;

    const { response, data } = await fetchGraphJson(url, {
      logUrl: VERBOSE,
      accessToken: tokenForPageEdge,
    });

    if (!response.ok || data.error) {
      const code = data.error?.code;
      const msg = data.error?.message || response.statusText;
      console.warn(`leadgen_forms pagina ${pageId}:`, msg);
      if (typeof msg === 'string' && msg.includes('pages_manage_ads')) {
        console.warn(
          '  O token usado em leadgen_forms precisa do escopo pages_manage_ads (Page token com esse escopo). Regenere ou use SYNC_META_LEADS_ONLY_META_FORM_ID=1 e ignore leadgen_forms.'
        );
      }
      if (
        code === 190 &&
        typeof msg === 'string' &&
        msg.includes('Page Access Token')
      ) {
        console.warn(
          '  Meta exige Page Access Token para leadgen_forms (token de usuario nao basta).'
        );
        console.warn(
          '  Opcoes: (1) defina META_PAGE_ACCESS_TOKEN no .env.local, ou (2) use so META_FORM_ID e ignore a listagem pela pagina.'
        );
        console.warn(
          '  Como obter no Explorador: token -> obter token -> selecionar a Pagina -> copiar token da pagina.'
        );
      }
      break;
    }

    for (const row of data.data || []) {
      if (row.id) formIds.push(String(row.id));
    }

    after = data.paging?.cursors?.after;
    await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY));
  } while (after);

  return formIds;
}

async function getLeadsForForm(formId) {
  const { since, until } = leadTimeRangeUnix();
  const { ok, errorMessage, leads } = await fetchLeadsPagesForNode(formId, {
    since,
    until,
  });
  if (!ok) {
    console.warn(`Form ${formId}:`, errorMessage);
  }
  return leads;
}

/**
 * Descobre IDs de formularios pela edge leadgen_forms de cada pagina (complementa META_FORM_ID).
 */
async function discoverFormIdsFromPages(pageIds) {
  const seen = new Set();
  const out = [];
  if (!META_PAGE_ACCESS_TOKEN && pageIds.length > 0) {
    console.log(
      'Dica: leadgen_forms costuma exigir Page Access Token. Sem META_PAGE_ACCESS_TOKEN, esta etapa pode falhar com #190; META_FORM_ID no env ainda funciona.'
    );
  }
  for (const pageId of pageIds) {
    console.log(`Listando leadgen_forms da pagina ${pageId}...`);
    const formIds = await fetchAllLeadgenFormIds(pageId);
    console.log(`  ${formIds.length} formulario(s) na API para esta pagina.`);
    for (const fid of formIds) {
      if (seen.has(fid)) continue;
      seen.add(fid);
      out.push(fid);
    }
  }
  return out;
}

/** Busca leads para cada form ID unico (env + descobertos na pagina). */
async function syncLeadsFromFormIds(formIds) {
  if (formIds.length === 0) return [];

  console.log(
    `Buscando leads em ${formIds.length} formulario(s)... (pausa ${FORM_COOLDOWN_MS}ms entre forms — ajuste SYNC_META_LEADS_FORM_COOLDOWN_MS se tiver #4)`
  );
  const all = [];
  let i = 0;
  for (const formId of formIds) {
    i++;
    if (i % 10 === 1 || formIds.length <= 5) {
      console.log(`  Form ${i}/${formIds.length} (id ${formId})...`);
    }
    const leads = await getLeadsForForm(formId);
    if (leads.length > 0) {
      console.log(`  Form ${formId}: ${leads.length} lead(s) no periodo`);
    }
    all.push(...leads);
    if (i < formIds.length) {
      await new Promise((r) => setTimeout(r, FORM_COOLDOWN_MS));
    }
  }

  return all;
}

/**
 * Unifica IDs: prioridade META_FORM_ID no .env + extras vindos de leadgen_forms (sem duplicar).
 */
function mergeFormIds(envFormIds, pageDiscoveredIds) {
  const seen = new Set();
  const out = [];
  for (const id of envFormIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  for (const id of pageDiscoveredIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Ads com status ou effective_status ACTIVE (como na Meta).
 */
async function getLeadGenAdIdsFromSupabase() {
  console.log(
    'Buscando anuncios ACTIVE ou effective_status ACTIVE (campanhas de lead quando existirem no banco)...'
  );

  const { data: leadCampaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id')
    .in('objective', LEAD_CAMPAIGN_OBJECTIVES);

  if (campaignsError) {
    console.warn('Aviso ao filtrar campanhas por objective:', campaignsError.message);
  }

  const leadCampaignIds = (leadCampaigns || []).map((c) => c.id).filter(Boolean);

  let adsQuery = supabase
    .from('ads')
    .select('id')
    .or('status.eq.ACTIVE,effective_status.eq.ACTIVE');

  if (leadCampaignIds.length > 0) {
    adsQuery = adsQuery.in('campaign_id', leadCampaignIds);
  }

  const { data: ads, error: adsError } = await adsQuery;
  if (adsError) {
    console.error('Erro ao buscar ads:', adsError);
    throw adsError;
  }

  let adIds = [...new Set((ads || []).map((a) => a.id).filter(Boolean))];

  if (adIds.length === 0 && leadCampaignIds.length > 0) {
    console.log(
      'Nenhum ad ACTIVE nas campanhas de lead; tentando todos os ads ACTIVE/effective ACTIVE.'
    );
    const { data: allActive, error: allErr } = await supabase
      .from('ads')
      .select('id')
      .or('status.eq.ACTIVE,effective_status.eq.ACTIVE');
    if (allErr) throw allErr;
    adIds = [...new Set((allActive || []).map((a) => a.id).filter(Boolean))];
  }

  console.log(`${adIds.length} anuncio(s) para consultar /{ad-id}/leads (so Instant Form)`);
  return adIds;
}

async function getLeadsForAd(adId) {
  if (!adId || String(adId) === 'undefined') return { leads: [], noEdge: false };

  const { since, until } = leadTimeRangeUnix();

  try {
    const { ok, errorMessage, leads } = await fetchLeadsPagesForNode(adId, {
      since,
      until,
    });

    if (!ok) {
      const msg = errorMessage || '';
      if (
        msg.includes('nonexisting field (leads)') ||
        msg.includes('nonexisting field') ||
        msg.includes('does not support this operation')
      ) {
        return { leads: [], noEdge: true };
      }
      if (VERBOSE) console.warn(`Ad ${adId}:`, msg);
      return { leads: [], noEdge: false };
    }

    return { leads, noEdge: false };
  } catch (err) {
    console.error(`Erro ao buscar leads do ad ${adId}:`, err.message);
    return { leads: [], noEdge: false };
  }
}

async function getLeadsBatch(adIds) {
  if (adIds.length === 0) return { leads: [], adsNoLeadsEdge: 0, adsWithLeads: 0 };

  const allLeads = [];
  let adsNoLeadsEdge = 0;
  let adsWithLeads = 0;

  for (let i = 0; i < adIds.length; i += BATCH_SIZE) {
    const batch = adIds.slice(i, i + BATCH_SIZE);
    console.log(`Lote ads ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} anuncio(s)...`);

    for (const adId of batch) {
      const { leads, noEdge } = await getLeadsForAd(adId);
      if (noEdge) adsNoLeadsEdge++;
      if (leads.length > 0) {
        adsWithLeads++;
        console.log(`  Ad ${adId}: ${leads.length} lead(s)`);
      }
      allLeads.push(...leads);
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
    }

    if (i + BATCH_SIZE < adIds.length) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY * 2));
    }
  }

  return { leads: allLeads, adsNoLeadsEdge, adsWithLeads };
}

function dedupeLeadsById(leads) {
  const map = new Map();
  for (const lead of leads) {
    if (lead && lead.id) map.set(lead.id, lead);
  }
  return [...map.values()];
}

function processLeadsData(leads) {
  return leads.map((lead) => {
    const formData = {};
    if (lead.field_data && Array.isArray(lead.field_data)) {
      lead.field_data.forEach((field) => {
        if (field.name && field.values && field.values.length > 0) {
          formData[field.name] = field.values[0];
        }
      });
    }

    return {
      lead_id: lead.id,
      form_id: lead.form_id || null,
      campaign_id: lead.campaign_id,
      adset_id: lead.adset_id,
      ad_id: lead.ad_id,
      created_time: lead.created_time,
      form_data: JSON.stringify(formData),
      nome: formData.name || formData.nome || formData.full_name || null,
      email: formData.email || formData.e_mail || null,
      telefone: formData.phone || formData.telefone || formData.phone_number || null,
      cidade: formData.city || formData.cidade || null,
      estado: formData.state || formData.estado || null,
      updated_at: new Date().toISOString(),
    };
  });
}

async function saveLeadsToSupabase(leads) {
  if (leads.length === 0) {
    console.log('Nenhum lead para salvar');
    return;
  }

  console.log(`Salvando ${leads.length} leads no Supabase...`);

  const extractMissingColumn = (error) => {
    const message = error?.message || '';
    const match = message.match(/Could not find the '([^']+)' column/i);
    return match?.[1] || null;
  };

  const dropColumnFromRows = (rows, columnName) =>
    rows.map((row) => {
      const { [columnName]: _removed, ...rest } = row;
      return rest;
    });

  try {
    let payload = leads;
    const removedColumns = [];

    for (let attempt = 1; attempt <= 8; attempt++) {
      const { data, error } = await supabase.from('meta_leads').upsert(payload, {
        onConflict: 'lead_id',
      });

      if (!error) {
        if (removedColumns.length > 0) {
          console.warn(
            `Aviso: colunas ausentes em meta_leads foram ignoradas neste run: ${removedColumns.join(', ')}`
          );
          console.warn(
            '  Recomendada correcao definitiva: criar essas colunas no banco para evitar perda de dados.'
          );
        }
        console.log(`${leads.length} leads salvos/atualizados com sucesso`);
        return data;
      }

      const missingColumn = extractMissingColumn(error);
      if (!missingColumn) {
        console.error('Erro ao salvar leads:', error);
        throw error;
      }
      if (attempt === 8) {
        throw new Error(
          `Muitas colunas ausentes em meta_leads. Ultima coluna faltante: ${missingColumn}`
        );
      }
      if (removedColumns.includes(missingColumn)) {
        throw new Error(`Falha recorrente ao remover coluna ausente: ${missingColumn}`);
      }
      console.warn(
        `meta_leads sem coluna "${missingColumn}" no schema cache. Retentando sem esse campo...`
      );
      removedColumns.push(missingColumn);
      payload = dropColumnFromRows(payload, missingColumn);
    }
  } catch (error) {
    console.error('Erro ao salvar leads:', error.message);
    throw error;
  }
}

async function syncLeads() {
  const startTime = Date.now();
  console.log('Iniciando sincronizacao de leads (contatos na API Graph)...');
  if (INITIAL_DELAY_MS > 0) {
    console.log(
      `SYNC_META_LEADS_INITIAL_DELAY_MS=${INITIAL_DELAY_MS} — aguardando antes da primeira chamada Graph...`
    );
    await new Promise((r) => setTimeout(r, INITIAL_DELAY_MS));
  }
  console.log(`Periodo: ultimos ${LEADS_DAYS} dias`);
  console.log(`Graph API base: ${GRAPH_BASE} (defina META_GRAPH_API_VERSION para igualar ao Explorador, ex.: v21.0)`);
  console.log(
    USE_LEGACY_SINCE_UNTIL
      ? 'Filtro de data em /leads: since/until (SYNC_META_LEADS_USE_LEGACY_SINCE_UNTIL=1)'
      : 'Filtro de data em /leads: filtering time_created (doc Meta). Auth: Authorization Bearer — token nao vai na query string.'
  );
  console.log(
    'Para NUMEROS de conversao (leads agregados): use Insights actions/results — ex.: /api/performance e scripts de ad_insights; nao depende deste script.'
  );
  console.log(
    `field_data nos leads: ${INCLUDE_FIELD_DATA ? 'sim' : 'nao'} (padrao nao — evita erro "reduce data"). CRM completo: SYNC_META_LEADS_INCLUDE_FIELD_DATA=1`
  );
  console.log(`limite por pagina na edge /leads: ${LEADS_PAGE_LIMIT}`);
  console.log(`pausa entre forms: ${FORM_COOLDOWN_MS}ms (SYNC_META_LEADS_FORM_COOLDOWN_MS)`);
  if (SKIP_PROBE) {
    console.log('SYNC_META_LEADS_SKIP_PROBE=1 — sem teste GET form + /leads antes do lote.');
  }
  console.log(
    `Token para .../leads: ${
      META_USER_ACCESS_TOKEN
        ? 'META_USER_ACCESS_TOKEN'
        : USE_META_ACCESS_TOKEN_ONLY
          ? 'META_ACCESS_TOKEN (forcado: SYNC_META_LEADS_USE_META_ACCESS_TOKEN_ONLY=1)'
          : 'NEXT_PUBLIC_META_ACCESS_TOKEN ou META_ACCESS_TOKEN (padrao: NEXT_PUBLIC primeiro)'
    }`
  );

  try {
    await warnIfLeadsTokenIsPageScoped();

    let fromForms = [];

    if (SKIP_FORMS_SYNC) {
      console.log(
        'SYNC_META_LEADS_SKIP_FORMS_SYNC=1 — pulando META_FORM_ID, pagina e leadgen_forms.'
      );
    } else {
      const formIdsFromEnv = parseMetaFormIdsFromEnv();
      if (formIdsFromEnv.length > 0) {
        console.log(
          `META_FORM_ID: ${formIdsFromEnv.length} formulario(s) explicito(s) no .env.local`
        );
      } else {
        console.log(
          'META_FORM_ID vazio: apenas formularios listados pela pagina (leadgen_forms), se houver permissao pages_manage_ads na pagina.'
        );
      }

      const pageIds = await resolvePageIds();
      let formIdsFromPages = [];
      if (ONLY_META_FORM_ID) {
        console.log(
          'SYNC_META_LEADS_ONLY_META_FORM_ID=1 — ignorando IDs extras de leadgen_forms; so META_FORM_ID.'
        );
      } else {
        formIdsFromPages = await discoverFormIdsFromPages(pageIds);
      }
      const allFormIds = mergeFormIds(formIdsFromEnv, formIdsFromPages);
      const extrasSoDaPagina = allFormIds.length - formIdsFromEnv.length;

      console.log(
        `Total de formularios unicos a consultar: ${allFormIds.length} (${formIdsFromEnv.length} do META_FORM_ID, ${extrasSoDaPagina} extras so da listagem leadgen_forms da pagina)`
      );

      const probeFormId =
        PROBE_FORM_ID_ENV || formIdsFromEnv[0] || allFormIds[0];
      if (PROBE_FORM_ID_ENV) {
        console.log(
          `SYNC_META_LEADS_PROBE_FORM_ID=${PROBE_FORM_ID_ENV} — testando este form antes do lote (nao o primeiro da lista).`
        );
      }
      if (probeFormId && !SKIP_PROBE) {
        await probeLeadsTokenOnForm(probeFormId);
      } else if (probeFormId && SKIP_PROBE) {
        console.log(
          'Probe ignorado (SYNC_META_LEADS_SKIP_PROBE=1). Se #4 na primeira URL, espere 15-60 min ou aumente INITIAL_DELAY_MS.'
        );
      }

      if (allFormIds.length === 0) {
        console.log(
          'Defina META_FORM_ID e/ou META_PAGE_ID, ou use SKIP_FORMS se so precisa de contagens via Insights.'
        );
      }

      fromForms = await syncLeadsFromFormIds(allFormIds);
    }

    let adIds = [];
    let fromAds = [];
    let adsNoLeadsEdge = 0;
    let adsWithLeads = 0;

    if (SKIP_ADS_SYNC) {
      console.log('SYNC_META_LEADS_SKIP_ADS_SYNC=1 — pulando varredura /ad-id/leads.');
    } else {
      adIds = await getLeadGenAdIdsFromSupabase();

      if (adIds.length === 0) {
        console.log(
          'Nenhum anuncio elegivel no Supabase. Sincronize ads (sync-ads-once.js) se quiser a via /ad-id/leads.'
        );
      } else {
        const batchResult = await getLeadsBatch(adIds);
        fromAds = batchResult.leads;
        adsNoLeadsEdge = batchResult.adsNoLeadsEdge;
        adsWithLeads = batchResult.adsWithLeads;
      }
    }

    const merged = dedupeLeadsById([...fromForms, ...fromAds]);

    console.log('\n--- Resumo API ---');
    console.log(`  Leads via formularios (META_FORM_ID + pagina): ${fromForms.length}`);
    console.log(`  Leads via edge /ad-id/leads: ${fromAds.length}`);
    console.log(`  Unicos (dedup por id): ${merged.length}`);
    if (adIds.length > 0) {
      console.log(`  Ads sem edge leads (nao sao Lead Ad): ${adsNoLeadsEdge}`);
      console.log(`  Ads que retornaram leads: ${adsWithLeads}`);
    }
    if (!SKIP_FORMS_SYNC && fromForms.length === 0 && parseMetaFormIdsFromEnv().length > 0) {
      console.log(
        '\nDica: se todos os forms falharam com permissao/objeto inexistente, o token precisa de acesso a leads na PAGINA (ex.: pages_manage_ads, leads_retrieval) ou Page Access Token. Contagens agregadas continuam disponiveis via Insights no app.'
      );
    }

    const processedLeads = processLeadsData(merged);
    await saveLeadsToSupabase(processedLeads);

    const duration = (Date.now() - startTime) / 1000;
    console.log('\nSincronizacao concluida.');
    console.log(`Tempo total: ${duration.toFixed(2)} segundos`);
    console.log(`Salvos no banco: ${processedLeads.length}`);
  } catch (error) {
    console.error('Erro na sincronizacao:', error.message);
    process.exit(1);
  }
}

syncLeads();
