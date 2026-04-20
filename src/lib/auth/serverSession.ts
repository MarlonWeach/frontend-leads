import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AUTH_COOKIE_KEYS } from '@/lib/auth/session';

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const accessToken = request.cookies.get(AUTH_COOKIE_KEYS.accessToken)?.value;
  if (!accessToken) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.id) return null;
  return data.user.id;
}
