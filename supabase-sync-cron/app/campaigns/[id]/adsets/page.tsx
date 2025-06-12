'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type AdSet = {
  id: string
  name: string
  status: string
  campaign_id: string
  daily_budget?: string
  created_at: string
}

type Campaign = {
  id: string
  name: string
}

export default function AdSetsPage() {
  const params = useParams()
  const campaignId = params.id as string
  
  const [adsets, setAdsets] = useState<AdSet[]>([])
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Buscar dados da campanha
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('id', campaignId)
        .single()
      
      if (campaignData) {
        setCampaign(campaignData)
      }

      // Buscar adsets
      const { data: adsetsData, error } = await supabase
        .from('adsets')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('name')

      if (!error && adsetsData) {
        setAdsets(adsetsData)
      }
      
      setLoading(false)
    }

    if (campaignId) {
      fetchData()
    }
  }, [campaignId])

  if (loading) {
    return (
      <main className="p-6">
        <div className="text-center">Carregando adsets...</div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="mb-6">
        <Link href="/campaigns" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Voltar para campanhas
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">AdSets</h1>
        {campaign && (
          <p className="text-gray-600">Campanha: {campaign.name}</p>
        )}
      </div>

      {adsets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum adset encontrado para esta campanha.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Orçamento Diário</th>
                <th className="p-3 text-left">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {adsets.map((adset) => (
                <tr key={adset.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{adset.id}</td>
                  <td className="p-3 font-medium">{adset.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      adset.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {adset.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {adset.daily_budget 
                      ? `R$ ${(parseInt(adset.daily_budget) / 100).toFixed(2)}` 
                      : '-'}
                  </td>
                  <td className="p-3">
                    {new Date(adset.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}