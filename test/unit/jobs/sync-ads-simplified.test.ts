// Testes simplificados para sync-ads com abordagem de integração
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { syncAdsSimplified, upsertActiveAds, markInactiveAds, syncAdsStatusCore } from '../../../src/jobs/sync-ads';
import { MetaAdsService } from '../../../src/services/meta/ads';
import type { SyncOptions } from '../../../src/types/sync';
import { MetaAd } from '../../../src/types/meta';
import { logger } from '../../../src/utils/logger';

// Mock simples do logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock simples do Supabase para testes unitários das funções individuais
const createMockSupabaseClient = (shouldSucceed: boolean = true) => ({
  from: jest.fn(() => ({
    upsert: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({
        data: shouldSucceed ? [] : null,
        error: shouldSucceed ? null : { message: 'DB Error', code: 'ERROR' }
      }))
    })),
    update: jest.fn(() => ({
      not: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({
          data: shouldSucceed ? [] : null,
          error: shouldSucceed ? null : { message: 'DB Error', code: 'ERROR' }
        }))
      }))
    }))
  }))
} as any);

describe('Sync Ads - Funções Individuais', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertActiveAds', () => {
    it('deve fazer upsert com sucesso', async () => {
      const mockSupabase = createMockSupabaseClient(true);
      const adsData = [
        {
          id: 'ad1',
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
          meta_data: { id: 'ad1', name: 'Ad 1' }
        }
      ];

      const result = await upsertActiveAds(mockSupabase, adsData);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('ads');
    });

    it('deve retornar erro quando upsert falha', async () => {
      const mockSupabase = createMockSupabaseClient(false);
      const adsData = [
        {
          id: 'ad1',
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
          meta_data: { id: 'ad1', name: 'Ad 1' }
        }
      ];

      const result = await upsertActiveAds(mockSupabase, adsData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('markInactiveAds', () => {
    it('deve marcar anúncios como inativos com sucesso', async () => {
      const mockSupabase = createMockSupabaseClient(true);
      const activeAdIds = ['ad1', 'ad2'];

      const result = await markInactiveAds(mockSupabase, activeAdIds);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('ads');
    });

    it('deve retornar erro quando update falha', async () => {
      const mockSupabase = createMockSupabaseClient(false);
      const activeAdIds = ['ad1', 'ad2'];

      const result = await markInactiveAds(mockSupabase, activeAdIds);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('syncAdsStatusCore', () => {
    it('deve sincronizar com sucesso no modo normal', async () => {
      const mockSupabase = createMockSupabaseClient(true);
      const activeAds = [
        { id: 'ad1', name: 'Ad 1', status: 'ACTIVE', effective_status: 'ACTIVE' }
      ];

      const result = await syncAdsStatusCore(activeAds, mockSupabase, {});

      expect(result.status.success).toBe(true);
      expect(result.status.totalAds).toBe(1);
      expect(result.status.activeAds).toBe(1);
      expect(result.data).toEqual(activeAds);
    });

    it('deve respeitar o modo dryRun', async () => {
      const mockSupabase = createMockSupabaseClient(true);
      const activeAds = [
        { id: 'ad1', name: 'Ad 1', status: 'ACTIVE', effective_status: 'ACTIVE' }
      ];

      const result = await syncAdsStatusCore(activeAds, mockSupabase, { dryRun: true });

      expect(result.status.success).toBe(true);
      expect(result.status.totalAds).toBe(1);
      expect(result.status.activeAds).toBe(1);
      expect(result.data).toEqual(activeAds);
      expect(logger.info).toHaveBeenCalledWith('Modo dryRun ativado - nenhuma alteração será feita no banco');
      
      // No modo dryRun, o Supabase não deve ser chamado
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('deve lidar com erro de upsert', async () => {
      const mockSupabase = createMockSupabaseClient(false);
      const activeAds = [
        { id: 'ad1', name: 'Ad 1', status: 'ACTIVE', effective_status: 'ACTIVE' }
      ];

      await expect(syncAdsStatusCore(activeAds, mockSupabase, {}))
        .rejects.toEqual({
          code: 'DB_ERROR',
          message: 'Database Error',
          retryable: true,
          details: { message: 'DB Error', code: 'ERROR' }
        });
    });

    it('deve processar lista vazia de anúncios', async () => {
      const mockSupabase = createMockSupabaseClient(true);
      const activeAds: any[] = [];

      const result = await syncAdsStatusCore(activeAds, mockSupabase, {});

      expect(result.status.success).toBe(true);
      expect(result.status.totalAds).toBe(0);
      expect(result.status.activeAds).toBe(0);
      expect(result.data).toEqual([]);
    });
  });
}); 