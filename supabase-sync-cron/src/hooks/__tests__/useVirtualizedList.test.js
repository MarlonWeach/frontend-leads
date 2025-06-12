import { renderHook, act } from '@testing-library/react';
import { useVirtualizedList } from '../useVirtualizedList';

describe('useVirtualizedList', () => {
  const MOCK_ITEM_HEIGHT = 50;
  const MOCK_VIEWPORT_HEIGHT = 500; // 10 itens visíveis

  // Mock para simular o ref de um container com scroll
  const mockContainerRef = {
    current: {
      clientHeight: MOCK_VIEWPORT_HEIGHT,
      scrollTop: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };

  // Geração de dados mock
  const generateMockItems = (count) => {
    return Array.from({ length: count }, (_, i) => ({ id: i, name: `Item ${i}` }));
  };

  it('deve inicializar com o número correto de itens visíveis', () => {
    const items = generateMockItems(100);
    const { result } = renderHook(() => useVirtualizedList(items, MOCK_ITEM_HEIGHT, mockContainerRef));

    expect(result.current.visibleItems.length).toBe(10); // MOCK_VIEWPORT_HEIGHT / MOCK_ITEM_HEIGHT
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(9);
  });

  it('deve atualizar os itens visíveis ao rolar para baixo', () => {
    const items = generateMockItems(100);
    const { result } = renderHook(() => useVirtualizedList(items, MOCK_ITEM_HEIGHT, mockContainerRef));

    act(() => {
      mockContainerRef.current.scrollTop = MOCK_ITEM_HEIGHT * 5; // Rola 5 itens para baixo
      // Dispara o evento de scroll (simulando a ação do navegador)
      fireEvent.scroll(mockContainerRef.current);
    });

    expect(result.current.startIndex).toBe(5);
    expect(result.current.endIndex).toBe(14);
    expect(result.current.visibleItems[0].id).toBe(5);
  });

  it('deve atualizar os itens visíveis ao rolar para o final', () => {
    const items = generateMockItems(100);
    const { result } = renderHook(() => useVirtualizedList(items, MOCK_ITEM_HEIGHT, mockContainerRef));

    act(() => {
      mockContainerRef.current.scrollTop = MOCK_ITEM_HEIGHT * (items.length - 10); // Rola para perto do final
      fireEvent.scroll(mockContainerRef.current);
    });

    // O startIndex deve ser ajustado para garantir que os últimos 10 itens sejam visíveis
    expect(result.current.startIndex).toBe(items.length - 10);
    expect(result.current.endIndex).toBe(items.length - 1);
    expect(result.current.visibleItems[9].id).toBe(items.length - 1);
  });

  it('deve lidar com uma lista vazia', () => {
    const items = [];
    const { result } = renderHook(() => useVirtualizedList(items, MOCK_ITEM_HEIGHT, mockContainerRef));

    expect(result.current.visibleItems).toEqual([]);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(0);
  });

  it('deve lidar com uma lista menor que o número de itens visíveis', () => {
    const items = generateMockItems(5);
    const { result } = renderHook(() => useVirtualizedList(items, MOCK_ITEM_HEIGHT, mockContainerRef));

    expect(result.current.visibleItems.length).toBe(5);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(4);
  });

  it('deve ter o tamanho correto do container de virtualização', () => {
    const items = generateMockItems(100);
    const { result } = renderHook(() => useVirtualizedList(items, MOCK_ITEM_HEIGHT, mockContainerRef));

    expect(result.current.listHeight).toBe(items.length * MOCK_ITEM_HEIGHT);
  });

  it('deve remover o event listener no unmount', () => {
    const items = generateMockItems(100);
    const { unmount } = renderHook(() => useVirtualizedList(items, MOCK_ITEM_HEIGHT, mockContainerRef));

    expect(mockContainerRef.current.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));

    unmount();

    expect(mockContainerRef.current.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
}); 