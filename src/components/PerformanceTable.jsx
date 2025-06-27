"use client";

const COLUMNS = [
  { key: 'campaign_name', label: 'Campanha', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'leads', label: 'Leads', sortable: true },
  { key: 'spend', label: 'Gasto', sortable: true },
  { key: 'impressions', label: 'Impressões', sortable: true },
  { key: 'clicks', label: 'Cliques', sortable: true },
  { key: 'ctr', label: 'CTR', sortable: true },
  { key: 'cpl', label: 'CPL', sortable: true },
  { key: 'roi', label: 'ROI', sortable: true },
  { key: 'data_start_date', label: 'Período', sortable: true }
];

function formatValue(key, value, campaign) {
  switch (key) {
    case 'campaign_name':
      return value || 'N/A';
    
    case 'status': {
      const statusColors = {
        ACTIVE: 'bg-green-500/20 text-green-400',
        PAUSED: 'bg-yellow-500/20 text-yellow-400',
        DELETED: 'bg-red-500/20 text-red-400'
      };
      const statusLabels = {
        ACTIVE: 'Ativa',
        PAUSED: 'Pausada',
        DELETED: 'Excluída'
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-500/20 text-gray-400'}`}>
          {statusLabels[value] || value}
        </span>
      );
    }
    
    case 'leads':
    case 'impressions':
    case 'clicks': {
      return (value || 0).toLocaleString('pt-BR');
    }
    
    case 'spend':
    case 'cpl':
      return `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    case 'ctr':
    case 'roi':
      return `${(value || 0).toFixed(2)}%`;
    
    case 'data_start_date':
      return campaign.data_end_date 
        ? `${campaign.data_start_date} - ${campaign.data_end_date}`
        : campaign.data_start_date || 'N/A';
    
    default:
      return value || 'N/A';
  }
}

function SortIcon({ sortBy, sortOrder, column }) {
  if (sortBy !== column) {
    return (
      <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  
  return sortOrder === 'asc' ? (
    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function PerformanceTable({ 
  campaigns = [], 
  loading = false,
  sortBy,
  sortOrder,
  onSort
}) {
  const handleSort = (column) => {
    if (!onSort) return;
    
    let newOrder = 'desc';
    if (sortBy === column && sortOrder === 'desc') {
      newOrder = 'asc';
    }
    
    onSort(column, newOrder);
  };

  if (loading) {
    return (
      <div className="bg-card-background rounded-xl p-6 border border-card-border">
        <div className="animate-pulse">
          <div className="h-4 bg-background-secondary rounded w-1/4 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 mb-3">
              <div className="h-4 bg-background-secondary rounded flex-1"></div>
              <div className="h-4 bg-background-secondary rounded w-20"></div>
              <div className="h-4 bg-background-secondary rounded w-20"></div>
              <div className="h-4 bg-background-secondary rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!campaigns.length) {
    return (
      <div className="bg-card-background rounded-xl p-6 border border-card-border">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-sublabel-refined text-white/70">
            Nenhuma campanha encontrada com os filtros atuais.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-background rounded-xl border border-card-border overflow-hidden">
      {/* Tabela Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-secondary">
            <tr>
              {COLUMNS.map((column) => (
                <th 
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <SortIcon sortBy={sortBy} sortOrder={sortOrder} column={column.key} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {campaigns.map((campaign, index) => (
              <tr 
                key={campaign.campaign_id}
                className="hover:bg-background-secondary/50 transition-colors"
              >
                {COLUMNS.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {formatValue(column.key, campaign[column.key], campaign)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="lg:hidden space-y-4 p-4">
        {campaigns.map((campaign) => (
          <div 
            key={campaign.campaign_id}
            className="bg-background-secondary rounded-lg p-4 border border-card-border"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{campaign.campaign_name}</h3>
                <div className="flex items-center space-x-4 mt-1">
                  {formatValue('status', campaign.status, campaign)}
                  <span className="text-sublabel-refined text-white/70 text-sm">
                    {formatValue('data_start_date', campaign.data_start_date, campaign)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sublabel-refined text-white/70 text-xs uppercase">Leads</div>
                <div className="text-lg font-semibold text-white">{formatValue('leads', campaign.leads, campaign)}</div>
              </div>
              <div>
                <div className="text-sublabel-refined text-white/70 text-xs uppercase">Gasto</div>
                <div className="text-lg font-semibold text-white">{formatValue('spend', campaign.spend, campaign)}</div>
              </div>
              <div>
                <div className="text-sublabel-refined text-white/70 text-xs uppercase">CTR</div>
                <div className="text-lg font-semibold text-white">{formatValue('ctr', campaign.ctr, campaign)}</div>
              </div>
              <div>
                <div className="text-sublabel-refined text-white/70 text-xs uppercase">CPL</div>
                <div className="text-lg font-semibold text-white">{formatValue('cpl', campaign.cpl, campaign)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-card-border">
              <div>
                <div className="text-sublabel-refined text-white/70 text-xs uppercase">Impressões</div>
                <div className="text-sm font-medium text-white">{formatValue('impressions', campaign.impressions, campaign)}</div>
              </div>
              <div>
                <div className="text-sublabel-refined text-white/70 text-xs uppercase">Cliques</div>
                <div className="text-sm font-medium text-white">{formatValue('clicks', campaign.clicks, campaign)}</div>
              </div>
              <div>
                <div className="text-sublabel-refined text-white/70 text-xs uppercase">ROI</div>
                <div className="text-sm font-medium text-white">{formatValue('roi', campaign.roi, campaign)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 