// Service: meta/budgetAdjustment.ts
// PBI 25 - Task 25-9: Integração Meta API para Ajustes de Budget

import {
  MetaAdsetBudgetInfo,
  MetaBudgetAdjustmentRequest,
  MetaBudgetAdjustmentResponse,
  MetaAPIError,
  MetaRateLimitInfo,
  MetaAPIConfig,
  AdsetBudgetValidationResult
} from '@/types/metaBudgetAdjustment';

class MetaBudgetAdjustmentService {
  private config: MetaAPIConfig;
  private rateLimitInfo: MetaRateLimitInfo | null = null;

  constructor() {
    this.config = {
      access_token: process.env.META_ACCESS_TOKEN || '',
      account_id: process.env.META_ACCOUNT_ID || '',
      api_version: process.env.META_API_VERSION || 'v18.0',
      base_url: 'https://graph.facebook.com',
      timeout_ms: 30000,
      max_retries: 3,
      retry_delay_ms: 1000
    };

    if (!this.config.access_token || !this.config.account_id) {
      console.error('Meta API credentials not configured');
    }
  }

  /**
   * Valida se um adset existe e pode receber ajustes de budget
   */
  async validateAdset(adset_id: string): Promise<AdsetBudgetValidationResult> {
    try {
      const adsetInfo = await this.getAdsetBudgetInfo(adset_id);
      
      if (!adsetInfo) {
        return {
          is_valid: false,
          errors: ['Adset não encontrado'],
          warnings: []
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validações específicas
      if (adsetInfo.status === 'DELETED') {
        errors.push('Adset foi deletado');
      }

      if (adsetInfo.status === 'ARCHIVED') {
        errors.push('Adset está arquivado');
      }

      if (!adsetInfo.daily_budget && !adsetInfo.lifetime_budget) {
        errors.push('Adset não possui budget configurado');
      }

      // Warnings
      if (adsetInfo.status === 'PAUSED') {
        warnings.push('Adset está pausado');
      }

      if (adsetInfo.budget_remaining && parseFloat(adsetInfo.budget_remaining) < 10) {
        warnings.push('Budget restante muito baixo');
      }

      return {
        is_valid: errors.length === 0,
        adset_info: adsetInfo,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating adset:', error);
      return {
        is_valid: false,
        errors: ['Erro ao validar adset'],
        warnings: []
      };
    }
  }

  /**
   * Busca informações de budget de um adset
   */
  async getAdsetBudgetInfo(adset_id: string): Promise<MetaAdsetBudgetInfo | null> {
    try {
      const response = await this.makeMetaAPICall(
        `/${adset_id}`,
        'GET',
        {
          fields: 'id,name,status,daily_budget,lifetime_budget,budget_remaining,campaign_id,account_id'
        }
      );

      if (!response.success || !response.data) {
        return null;
      }

      return {
        adset_id: response.data.id,
        name: response.data.name,
        status: response.data.status,
        daily_budget: response.data.daily_budget,
        lifetime_budget: response.data.lifetime_budget,
        budget_remaining: response.data.budget_remaining,
        campaign_id: response.data.campaign_id,
        account_id: response.data.account_id
      };
    } catch (error) {
      console.error('Error fetching adset budget info:', error);
      return null;
    }
  }

  /**
   * Aplica ajuste de budget em um adset via Meta API
   */
  async adjustAdsetBudget(
    adset_id: string,
    adjustment: MetaBudgetAdjustmentRequest
  ): Promise<MetaBudgetAdjustmentResponse> {
    try {
      // Validar adset primeiro
      const validation = await this.validateAdset(adset_id);
      if (!validation.is_valid) {
        return {
          success: false,
          error: {
            message: `Adset inválido: ${validation.errors.join(', ')}`,
            type: 'ValidationException',
            code: 400
          }
        };
      }

      // Preparar dados para a API
      const updateData: any = {};
      
      if (adjustment.daily_budget !== undefined) {
        // Meta API espera budget em centavos (para USD) ou valor direto para BRL
        updateData.daily_budget = Math.round(adjustment.daily_budget * 100).toString();
      }

      if (adjustment.lifetime_budget !== undefined) {
        updateData.lifetime_budget = Math.round(adjustment.lifetime_budget * 100).toString();
      }

      if (adjustment.status) {
        updateData.status = adjustment.status;
      }

      console.log(`[Meta API] Adjusting budget for adset ${adset_id}:`, updateData);

      const response = await this.makeMetaAPICall(
        `/${adset_id}`,
        'POST',
        updateData
      );

      if (response.success) {
        return {
          success: true,
          data: {
            adset_id: adset_id,
            daily_budget: updateData.daily_budget,
            lifetime_budget: updateData.lifetime_budget,
            updated_time: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error('Error adjusting adset budget:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          type: 'GraphMethodException',
          code: 500
        }
      };
    }
  }

  /**
   * Realiza chamada para Meta API com retry logic e rate limiting
   */
  private async makeMetaAPICall(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    params: Record<string, any> = {}
  ): Promise<{ success: boolean; data?: any; error?: MetaAPIError }> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.config.max_retries; attempt++) {
      try {
        // Verificar rate limiting
        if (this.rateLimitInfo && this.rateLimitInfo.call_count > 180) {
          console.warn('[Meta API] Approaching rate limit, delaying request');
          await this.delay(2000);
        }

        const url = this.buildApiUrl(endpoint);
        const requestOptions = this.buildRequestOptions(method, params);

        console.log(`[Meta API] Attempt ${attempt}/${this.config.max_retries}: ${method} ${url}`);

        const response = await fetch(url, {
          ...requestOptions,
          signal: AbortSignal.timeout(this.config.timeout_ms)
        });

        // Processar headers de rate limiting
        this.updateRateLimitInfo(response.headers);

        const responseData = await response.json();

        if (response.ok) {
          return { success: true, data: responseData };
        } else {
          const error: MetaAPIError = {
            message: responseData.error?.message || 'Erro da Meta API',
            type: responseData.error?.type || 'GraphMethodException',
            code: responseData.error?.code || response.status,
            error_subcode: responseData.error?.error_subcode,
            fbtrace_id: responseData.error?.fbtrace_id
          };

          // Não fazer retry para alguns tipos de erro
          if (this.shouldNotRetry(error)) {
            return { success: false, error };
          }

          lastError = error;
        }
      } catch (error) {
        console.error(`[Meta API] Attempt ${attempt} failed:`, error);
        lastError = {
          message: error instanceof Error ? error.message : 'Network error',
          type: 'GraphMethodException',
          code: 500
        };
      }

      // Delay antes do próximo retry (backoff exponencial)
      if (attempt < this.config.max_retries) {
        const delay = this.config.retry_delay_ms * Math.pow(2, attempt - 1);
        console.log(`[Meta API] Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    return { success: false, error: lastError };
  }

  private buildApiUrl(endpoint: string): string {
    const baseUrl = `${this.config.base_url}/${this.config.api_version}`;
    return `${baseUrl}${endpoint}`;
  }

  private buildRequestOptions(method: string, params: Record<string, any>) {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.access_token}`
      }
    };

    if (method === 'GET') {
      // Para GET, adicionar parâmetros na URL
      const searchParams = new URLSearchParams(params);
      searchParams.append('access_token', this.config.access_token);
    } else {
      // Para POST/PUT, enviar no body
      options.body = JSON.stringify({
        ...params,
        access_token: this.config.access_token
      });
    }

    return options;
  }

  private updateRateLimitInfo(headers: Headers) {
    try {
      const usageHeader = headers.get('x-app-usage');
      if (usageHeader) {
        const usage = JSON.parse(usageHeader);
        this.rateLimitInfo = {
          app_id_util_pct: usage.app_id_util_pct || 0,
          call_count: usage.call_count || 0,
          total_cputime: usage.total_cputime || 0,
          total_time: usage.total_time || 0,
          type: 'app_usage',
          estimated_time_to_regain_access: usage.estimated_time_to_regain_access
        };
      }
    } catch (error) {
      // Ignorar erros de parsing do header
    }
  }

  private shouldNotRetry(error: MetaAPIError): boolean {
    // Não fazer retry para erros permanentes
    const noRetryTypes = ['OAuthException', 'ValidationException'];
    const noRetryCodes = [400, 401, 403, 404];

    return noRetryTypes.includes(error.type) || noRetryCodes.includes(error.code);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém informações atuais de rate limiting
   */
  getRateLimitInfo(): MetaRateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Testa conectividade com Meta API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.makeMetaAPICall(
        `/act_${this.config.account_id}`,
        'GET',
        { fields: 'id,name' }
      );

      if (response.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error?.message || 'Falha na conexão'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conectividade'
      };
    }
  }
}

// Singleton instance
const metaBudgetService = new MetaBudgetAdjustmentService();
export default metaBudgetService; 