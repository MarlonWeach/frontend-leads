import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('source')
      .not('source', 'is', null);

    if (error) throw error;

    // Agrupa os leads por fonte
    const searchData = data.reduce((acc, lead) => {
      const source = lead.source || 'outros';
      acc[source] = (acc[source] || 0) + 1;
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