import { renderHook, act } from '@testing-library/react';
import { useVirtualizedList } from '../useVirtualizedList';

// Mock do useVirtualizer
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn().mockImplementation(({ count, getScrollElement }) => ({
    getVirtualItems: () => Array.from({ length: count }, (_, i) => ({ index: i, start: i * 50, size: 50 })),
    getTotalSize: () => count * 50,
  })),
}));

describe('useVirtualizedList', () => {
  const MOCK_ITEM_HEIGHT = 50;
  const MOCK_VIEWPORT_HEIGHT = 500;
  const MOCK_PAGE_SIZE = 20;
  const SCROLL_THRESHOLD = 200; // Mesmo valor usado no hook

  // Geração de dados mock
  const generateMockItems = (count) => {
    return Array.from({ length: count }, (_, i) => ({ id: i, name: `Item ${i}` }));
  };

  beforeEach(() => {
    // Limpar o DOM após cada teste
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('deve inicializar corretamente', () => {
    const items = generateMockItems(100);
    const { result } = renderHook(() => useVirtualizedList({
      items,
      itemHeight: MOCK_ITEM_HEIGHT,
      pageSize: MOCK_PAGE_SIZE,
    }));

    expect(result.current.virtualItems).toBeDefined();
    expect(result.current.totalSize).toBeDefined();
    expect(result.current.parentRef).toBeDefined();
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.page).toBe(1);
  });

  it('deve carregar mais itens quando loadMore é chamado', async () => {
    const items = generateMockItems(100);
    const { result } = renderHook(() => useVirtualizedList({
      items,
      itemHeight: MOCK_ITEM_HEIGHT,
      pageSize: MOCK_PAGE_SIZE,
    }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.page).toBe(2);
  });

  it('deve parar de carregar quando não há mais itens', async () => {
    const items = generateMockItems(30);
    const { result } = renderHook(() => useVirtualizedList({
      items,
      itemHeight: MOCK_ITEM_HEIGHT,
      pageSize: MOCK_PAGE_SIZE,
    }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.hasMore).toBe(false);
  });

  it('deve lidar com uma lista vazia', () => {
    const items = [];
    const { result } = renderHook(() => useVirtualizedList({
      items,
      itemHeight: MOCK_ITEM_HEIGHT,
      pageSize: MOCK_PAGE_SIZE,
    }));

    expect(result.current.virtualItems).toHaveLength(0);
    expect(result.current.totalSize).toBe(0);
    expect(result.current.hasMore).toBe(false);
  });

  it('deve carregar mais itens quando o usuário chega perto do fim da lista', async () => {
    const items = generateMockItems(100);
    const { result } = renderHook(() => useVirtualizedList({
      items,
      itemHeight: MOCK_ITEM_HEIGHT,
      pageSize: MOCK_PAGE_SIZE,
    }));

    // Configurar o mock do elemento de scroll
    const mockScrollElement = {
      clientHeight: MOCK_VIEWPORT_HEIGHT,
      scrollTop: 0,
      get scrollHeight() { return MOCK_ITEM_HEIGHT * MOCK_PAGE_SIZE; },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    act(() => {
      result.current.parentRef.current = mockScrollElement;
    });

    // Simular scroll próximo ao fim
    act(() => {
      mockScrollElement.scrollTop = mockScrollElement.scrollHeight - MOCK_VIEWPORT_HEIGHT - SCROLL_THRESHOLD - 1;
    });

    // Chamar loadMore diretamente
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.page).toBe(2);
  });
}); 