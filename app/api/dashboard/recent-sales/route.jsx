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
      .select('id, name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados de vendas recentes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados de vendas recentes' },
      { status: 500 }
    );
  }
} 