import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function canTriggerSync() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variáveis de ambiente do Supabase não definidas');
  }
  const supabase = createClient(
    supabaseUrl,
    supabaseKey
  );

  const { data, error } = await supabase
    .from('sync_status')
    .select('status, updated_at')
    .eq('id', 'meta_leads_sync')
    .single();

  if (error || !data) {
    // Se não houver registro, permite iniciar
    return true;
  }
  
  if (data.status === 'syncing') {
    // Se já está sincronizando, verifica há quanto tempo
    const lastUpdate = new Date(data.updated_at).getTime();
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Se a última atualização foi há mais de 5 minutos, permite nova tentativa
    if (now - lastUpdate > fiveMinutes) {
      return true;
    }
    return false; // Bloqueia se a sincronização for recente
  }

  return true;
}

export async function POST() {
  try {
    const isAllowed = await canTriggerSync();
    if (!isAllowed) {
      return NextResponse.json(
        { message: 'Uma sincronização já está em andamento.' },
        { status: 429 } // Too Many Requests
      );
    }
    
    const scriptPath = path.resolve(process.cwd(), 'scripts/sync-meta-aggregates-full.js');
    
    console.log(`Disparando script de sincronização: ${scriptPath}`);

    const child = spawn('node', [scriptPath], {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    return NextResponse.json({ message: 'Sincronização iniciada com sucesso.' });

  } catch (error) {
    console.error('Erro ao disparar a sincronização:', error);
    let details = 'Erro desconhecido';
    if (error instanceof Error) {
      details = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      details = String((error as any).message);
    } else if (typeof error === 'string') {
      details = error;
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor ao iniciar a sincronização.', details },
      { status: 500 }
    );
  }
} 