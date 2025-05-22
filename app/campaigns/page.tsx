'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

type Campaign = {
  id: string
  name: string
  status: string
  daily_budget?: number
  amount_spent?: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filtered, setFiltered] = useState<Campaign[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchCampaigns = async () => {
     const { data, error } = await supabase
  .from('campaigns')
  .select('id,name,status,objective,created_at')
        .order('name')

      if (!error && data) {
        setCampaigns(data)
        setFiltered(data)
      }
    }

    fetchCampaigns()
  }, [])

  useEffect(() => {
    const result = campaigns.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [search, campaigns])

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Campanhas</h1>

      <input
        type="text"
        placeholder="Buscar por nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 mb-4 w-full md:w-1/2 rounded"
      />

      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Nome</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Daily Budget</th>
            <th className="p-2 text-left">Amount Spent</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.id}</td>
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.status}</td>
              <td className="p-2">
                {c.daily_budget ? `R$ ${(c.daily_budget / 100).toFixed(2)}` : '-'}
              </td>
              <td className="p-2">
                {c.amount_spent ? `R$ ${(c.amount_spent / 100).toFixed(2)}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
