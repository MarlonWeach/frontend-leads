'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function useVirtualizedList({
  items = [],
  itemHeight = 64,
  overscan = 5,
  pageSize = 20,
  initialPage = 1
}) {
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(items.length > 0);
  const parentRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calcular itens visíveis baseado na página atual
  const visibleItems = items.slice(0, page * pageSize);

  // Configurar virtualizador
  const rowVirtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan
  });

  // Função para carregar mais itens
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const nextPage = page + 1;
      setPage(nextPage);
      
      // Verificar se chegamos ao fim dos dados
      if (nextPage * pageSize >= items.length) {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, pageSize, items.length, isLoadingMore, hasMore]);

  // Observar quando o usuário chega próximo ao fim da lista
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      
      // Carregar mais quando estiver a 200px do fim
      if (scrollBottom < 200 && !isLoadingMore && hasMore) {
        loadMore();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoadingMore, hasMore]);

  // Atualizar hasMore quando items mudar
  useEffect(() => {
    setHasMore(items.length > page * pageSize);
  }, [items, page, pageSize]);

  return {
    virtualItems: rowVirtualizer.getVirtualItems(),
    totalSize: rowVirtualizer.getTotalSize(),
    parentRef,
    isLoadingMore,
    hasMore,
    loadMore,
    page
  };
} 