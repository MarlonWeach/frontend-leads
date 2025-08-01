import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const eventType = searchParams.get('event_type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const after = searchParams.get('after');
    const order = searchParams.get('order') || 'desc';
    const now = new Date();
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('meta_activity_logs')
      .select('*')
      .gte('event_time', since)
      .order('event_time', { ascending: order === 'asc' })
      .limit(limit);

    if (eventType) query = query.eq('event_type', eventType);
    if (after) query = query.gt('id', after);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ activities: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
} 