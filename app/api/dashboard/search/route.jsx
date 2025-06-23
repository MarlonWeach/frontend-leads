import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // Buscar leads diretamente da tabela meta_leads
    const { data: metaLeads, error: metaLeadsError } = await supabase
      .from('meta_leads')
      .select('campaign_name, lead_count')
      .not('lead_count', 'is', null);
    
    if (metaLeadsError) throw metaLeadsError;
    
    // Agrupa os leads por fonte (usando campaign_name como fonte)
    const searchData = metaLeads.reduce((acc, lead) => {
      const source = lead.campaign_name || 'outros';
      const count = lead.lead_count || 1;
      acc[source] = (acc[source] || 0) + count;
      return acc;
    }, {});

    // Converte para o formato esperado pelo componente Search
    const formattedData = Object.entries(searchData).map(([source, total]) => ({
      source,
      total
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar dados de busca:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de busca' },
      { status: 500 }
    );
  }
} 