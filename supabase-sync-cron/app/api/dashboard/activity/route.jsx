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
      .select('status');

    if (error) throw error;

    // Agrupa os leads por status
    const activityData = data.reduce((acc, lead) => {
      const status = lead.status || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Converte para o formato esperado pelo componente Activity
    const formattedData = Object.entries(activityData).map(([status, total]) => ({
      status,
      total
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar dados de atividade:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de atividade' },
      { status: 500 }
    );
  }
} 