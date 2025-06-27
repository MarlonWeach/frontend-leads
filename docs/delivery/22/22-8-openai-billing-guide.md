# Guia da API de Billing da OpenAI - Task 22-8

**Data:** 27 de Junho de 2025  
**Fonte:** [OpenAI Cookbook - Usage API](https://cookbook.openai.com/examples/completions_usage_api)

## Visão Geral

A OpenAI oferece duas APIs principais para monitoramento de uso e custos:

1. **Completions Usage API** (`/v1/organization/usage/completions`)
2. **Costs API** (`/v1/organization/costs`)

## Completions Usage API

### Endpoint
```
GET https://api.openai.com/v1/organization/usage/completions
```

### Autenticação
Requer **Admin API Key** (não a chave normal da API):
- Acesse: https://platform.openai.com/settings/organization/admin-keys
- Crie uma Admin Key específica para billing

### Parâmetros Disponíveis

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `start_time` | int | ✅ | Timestamp Unix (segundos) - início do período |
| `end_time` | int | ❌ | Timestamp Unix (segundos) - fim do período |
| `bucket_width` | string | ❌ | Granularidade: '1m', '1h', '1d' (padrão: '1d') |
| `project_ids` | array | ❌ | Lista de IDs de projetos |
| `user_ids` | array | ❌ | Lista de IDs de usuários |
| `api_key_ids` | array | ❌ | Lista de IDs de chaves API |
| `models` | array | ❌ | Lista de modelos específicos |
| `batch` | boolean | ❌ | true para batch jobs, false para não-batch |
| `group_by` | array | ❌ | Campos para agrupar: ["model", "project_id", etc.] |
| `limit` | int | ❌ | Número de buckets a retornar |
| `page` | string | ❌ | Cursor para paginação |

### Estrutura da Resposta

```json
{
  "object": "bucket",
  "start_time": 1736616660,
  "end_time": 1736640000,
  "results": [
    {
      "object": "organization.usage.completions.result",
      "input_tokens": 141201,
      "output_tokens": 9756,
      "num_model_requests": 470,
      "project_id": null,
      "user_id": null,
      "api_key_id": null,
      "model": null,
      "batch": null,
      "input_cached_tokens": 0,
      "input_audio_tokens": 0,
      "output_audio_tokens": 0
    }
  ]
}
```

### Campos de Dados

| Campo | Descrição |
|-------|-----------|
| `input_tokens` | Tokens de entrada (prompt) |
| `output_tokens` | Tokens de saída (resposta) |
| `input_cached_tokens` | Tokens de cache de entrada |
| `input_audio_tokens` | Tokens de áudio de entrada |
| `output_audio_tokens` | Tokens de áudio de saída |
| `num_model_requests` | Número de requisições ao modelo |

## Costs API

### Endpoint
```
GET https://api.openai.com/v1/organization/costs
```

### Parâmetros Disponíveis

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `start_time` | int | ✅ | Timestamp Unix (segundos) - início do período |
| `end_time` | int | ❌ | Timestamp Unix (segundos) - fim do período |
| `bucket_width` | string | ❌ | Atualmente apenas '1d' suportado |
| `group_by` | array | ❌ | Campos para agrupar: ["line_item", "project_id"] |
| `limit` | int | ❌ | Número de buckets a retornar |
| `page` | string | ❌ | Cursor para paginação |

### Estrutura da Resposta

```json
{
  "object": "bucket",
  "start_time": 1736553600,
  "end_time": 1736640000,
  "results": [
    {
      "object": "organization.costs.result",
      "amount": {
        "value": 0.13080438340307526,
        "currency": "usd"
      },
      "line_item": null,
      "project_id": null,
      "organization_id": "org-GLHrIv00VVN9dEQC2b4wsBkf"
    }
  ]
}
```

## Limitações Importantes

### 1. Rate Limits
- APIs de billing têm rate limits mais restritivos
- Recomendado: Cache por pelo menos 5-10 minutos
- Evitar chamadas excessivas

### 2. Latência de Dados
- Dados podem ter delay de algumas horas
- Não são dados em tempo real
- Melhor para análises retrospectivas

### 3. Granularidade
- Costs API: apenas buckets diários ('1d')
- Usage API: minutos, horas ou dias

### 4. Autenticação
- Requer Admin API Key (não a chave normal)
- Permissões elevadas necessárias

## Exemplos de Uso

### 1. Buscar Uso dos Últimos 7 Dias

```javascript
const startTime = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

const params = {
  start_time: startTime,
  bucket_width: '1d',
  group_by: ['model'],
  limit: 7
};
```

### 2. Buscar Custos por Projeto

```javascript
const params = {
  start_time: startTime,
  bucket_width: '1d',
  group_by: ['project_id', 'line_item']
};
```

## Cálculo de Custos

### Preços por Modelo (Dezembro 2024)

| Modelo | Input (por 1K tokens) | Output (por 1K tokens) |
|--------|---------------------|----------------------|
| GPT-4 | $0.03 | $0.06 |
| GPT-3.5 Turbo | $0.001 | $0.002 |

### Fórmula de Cálculo

```javascript
const inputCost = (inputTokens / 1000) * inputPricePerK;
const outputCost = (outputTokens / 1000) * outputPricePerK;
const totalCost = inputCost + outputCost;
```

## Implementação Recomendada

### 1. Cache Strategy
```javascript
// Cache por 10 minutos
const CACHE_TTL = 10 * 60 * 1000;
```

### 2. Error Handling
```javascript
try {
  const response = await fetch(url, { headers });
  if (response.status === 429) {
    // Rate limit - aguardar e tentar novamente
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
} catch (error) {
  // Fallback para dados locais ou estimativas
}
```

### 3. Paginação
```javascript
let allData = [];
let nextPage = null;

do {
  const params = { ...baseParams };
  if (nextPage) params.page = nextPage;
  
  const response = await fetchData(params);
  allData.push(...response.data);
  nextPage = response.next_page;
} while (nextPage);
```

## Considerações de Segurança

1. **Admin Key**: Nunca expor no frontend
2. **Proxy**: Criar API route no backend
3. **Rate Limiting**: Implementar no lado do servidor
4. **Caching**: Reduzir chamadas desnecessárias

## Ferramentas Existentes

- **OpenAI Charts**: https://open-charts.vercel.app/
- **API Usage Info**: https://www.apiusage.info/
- **OpenAI Dashboard**: Painel oficial da OpenAI

## Próximos Passos

1. Obter Admin API Key
2. Implementar API route no backend
3. Criar componente de widget
4. Adicionar cache e error handling
5. Integrar na interface do usuário 