'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import MainLayout from '../../../../src/components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../src/components/ui/card'

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

  const breadcrumbs = [
    { name: 'Campanhas', href: '/campaigns' },
    { name: campaign?.name || 'Campanha', href: `/campaigns/${campaignId}` },
    { name: 'AdSets', href: `/campaigns/${campaignId}/adsets` }
  ];

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
      <MainLayout title="AdSets" breadcrumbs={breadcrumbs}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sublabel-refined text-white/70">Carregando adsets...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="AdSets" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-header text-white mb-2">AdSets</h1>
          {campaign && (
            <p className="text-sublabel-refined text-white/70">Campanha: {campaign.name}</p>
          )}
        </div>

        {adsets.length === 0 ? (
          <Card className="glass-medium">
            <CardContent className="text-center py-8">
              <p className="text-sublabel-refined text-white/70">Nenhum adset encontrado para esta campanha.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-medium">
            <CardHeader>
              <CardTitle className="text-white">Lista de AdSets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-3 text-left text-white/70">ID</th>
                      <th className="p-3 text-left text-white/70">Nome</th>
                      <th className="p-3 text-left text-white/70">Status</th>
                      <th className="p-3 text-left text-white/70">Orçamento Diário</th>
                      <th className="p-3 text-left text-white/70">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adsets.map((adset) => (
                      <tr key={adset.id} className="border-b border-white/5 hover:glass-light">
                        <td className="p-3 text-white/80">{adset.id}</td>
                        <td className="p-3 font-medium text-white">{adset.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            adset.status === 'ACTIVE' 
                              ? 'bg-success/20 text-success' 
                              : 'glass-light text-white/70'
                          }`}>
                            {adset.status}
                          </span>
                        </td>
                        <td className="p-3 text-white/80">
                          {adset.daily_budget 
                            ? `R$ ${(parseInt(adset.daily_budget) / 100).toFixed(2)}` 
                            : '-'}
                        </td>
                        <td className="p-3 text-white/80">
                          {new Date(adset.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}