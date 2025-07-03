import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Garantir que as variáveis de ambiente estejam definidas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não definidas');
    }
    // Acesso seguro ao Supabase no lado do servidor
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        db: { schema: 'public' },
        auth: {
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('id', 'meta_leads_sync')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ status: 'not_initialized', last_sync_end: null }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar status da sincronização:', error);
    let details = 'Erro desconhecido';
    if (error instanceof Error) {
      details = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      details = String((error as any).message);
    } else if (typeof error === 'string') {
      details = error;
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor', details },
      { status: 500 }
    );
  }
} 