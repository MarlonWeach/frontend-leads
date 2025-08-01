"use client";

import { useState } from 'react';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  loading = false
}) {
  const [inputPage, setInputPage] = useState('');

  const handlePageInput = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(inputPage);
      if (page >= 1 && page <= totalPages) {
        onPageChange(page);
        setInputPage('');
      }
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    // Always include first page
    range.push(1);

    // Calculate range around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Always include last page (if different from first)
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Add dots where there are gaps
    let prev = 0;
    for (const page of range) {
      if (page - prev === 2) {
        rangeWithDots.push(prev + 1);
      } else if (page - prev !== 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="bg-card-background rounded-xl p-4 border border-card-border">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        {/* Info de itens */}
        <div className="flex items-center space-x-4 text-sm text-white/70">
          <span>
            Mostrando {startItem.toLocaleString('pt-BR')} - {endItem.toLocaleString('pt-BR')} de {totalItems.toLocaleString('pt-BR')} itens
          </span>
          
          {/* Seletor de itens por página */}
          <div className="flex items-center space-x-2">
            <span>Itens por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              disabled={loading}
              className="px-2 py-1 bg-background-secondary border border-card-border rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center space-x-2">
          {/* Botão Anterior */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="flex items-center px-3 py-1.5 text-sm bg-background-secondary border border-card-border rounded-lg text-white hover:bg-primary/20 hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          {/* Números das páginas */}
          <div className="flex items-center space-x-1">
            {visiblePages.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`dots-${index}`} className="px-2 py-1 text-white/50">
                    ...
                  </span>
                );
              }

              const isCurrentPage = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  disabled={loading}
                  className={`
                    px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50
                    ${isCurrentPage 
                      ? 'bg-primary text-white font-medium' 
                      : 'bg-background-secondary border border-card-border text-white hover:bg-primary/20 hover:border-primary/50'
                    }
                  `}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Botão Próximo */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="flex items-center px-3 py-1.5 text-sm bg-background-secondary border border-card-border rounded-lg text-white hover:bg-primary/20 hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 