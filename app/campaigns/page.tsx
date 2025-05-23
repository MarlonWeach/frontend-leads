'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import { exportToCSV } from '../../lib/exportUtils'

type Campaign = {
  id: string
  name: string
  status: string
  objective: string
  created_at: string
}

type Alert = {
  type: 'warning' | 'info'
  message: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filtered, setFiltered] = useState<Campaign[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('name')

      if (!error && data) {
        setCampaigns(data)
        setFiltered(data)
        
        // Gerar alertas
        const newAlerts: Alert[] = []
        const activeCampaigns = data.filter(c => c.status === 'ACTIVE')
        if (activeCampaigns.length > 0) {
          newAlerts.push({
            type: 'info',
            message: `${activeCampaigns.length} campanhas ativas`
          })
        }
        
        const pausedCampaigns = data.filter(c => c.status === 'PAUSED')
        if (pausedCampaigns.length > 5) {
          newAlerts.push({
            type: 'warning',
            message: `${pausedCampaigns.length} campanhas pausadas - considere revisar`
          })
        }
        
        setAlerts(newAlerts)
      }
      setLoading(false)
    }

    fetchCampaigns()
  }, [])

  useEffect(() => {
    let result = campaigns

    // Filtro por nome
    if (search) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter)
    }

    setFiltered(result)
  }, [search, statusFilter, campaigns])

  const handleExport = () => {
    const dataToExport = filtered.map(c => ({
      ID: c.id,
      Nome: c.name,
      Status: c.status,
      Objetivo: c.objective,
      'Criado em': new Date(c.created_at).toLocaleDateString('pt-BR')
    }))
    
    exportToCSV(dataToExport, 'campanhas')
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="text-center">Carregando campanhas...</div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Campanhas</h1>
        
        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded ${
                  alert.type === 'warning' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Filtros e Exportação */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded flex-1"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="all">Todos os status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="PAUSED">Pausadas</option>
          </select>
          
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Exportar CSV
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          Exibindo {filtered.length} de {campaigns.length} campanhas
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Objetivo</th>
              <th className="p-3 text-left">Criado em</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{c.id}</td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    c.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-3">{c.objective}</td>
                <td className="p-3">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-3">
                  <Link
                    href={`/campaigns/${c.id}/adsets`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Ver AdSets
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}