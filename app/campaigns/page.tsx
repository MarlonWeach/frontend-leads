'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

type Campaign = {
  id: string
  name: string
  status: string
  daily_budget: number
  amount_spent?: number
}

export default function CampaignsPage() {
  const supabase = createClient()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const fetchCampaigns = async () => {
      let query = supabase
        .from('campaigns')
        .select('id, name, status, daily_budget, amount_spent')
        .order('name', { ascending: true })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (!error && data) {
        setCampaigns(data)
      } else {
        console.error(error)
      }
    }

    fetchCampaigns()
  }, [statusFilter])

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Campanhas</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-2 py-1 rounded w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="PAUSED">Pausados</option>
        </select>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Nome</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Daily Budget</th>
            <th className="border px-2 py-1">Amount Spent</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td className="border px-2 py-1">{c.id}</td>
              <td className="border px-2 py-1">{c.name}</td>
              <td className="border px-2 py-1">{c.status}</td>
              <td className="border px-2 py-1">R$ {(c.daily_budget / 100).toFixed(2)}</td>
              <td className="border px-2 py-1">R$ {(c.amount_spent || 0 / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
