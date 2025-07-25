// Task: Sincronizar logs de atividades da Meta API para Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const META_ACCOUNT_ID = process.env.META_ACCOUNT_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !META_ACCOUNT_ID || !META_ACCESS_TOKEN) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, META_ACCOUNT_ID, META_ACCESS_TOKEN');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchMetaActivities({ since, until, after }) {
  let url = `https://graph.facebook.com/v18.0/act_${META_ACCOUNT_ID}/activities?access_token=${META_ACCESS_TOKEN}&limit=100&since=${since}&until=${until}`;
  if (after) url += `&after=${after}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Meta API error: ${res.status}`);
  return res.json();
}

function normalizeActivity(a) {
  return {
    account_id: META_ACCOUNT_ID,
    event_type: a.event_type,
    event_time: new Date(a.event_time),
    object_id: a.object_id || null,
    object_name: a.object_name || null,
    value_old: a.value?.old_value || null,
    value_new: a.value?.new_value || null,
    application_id: a.application_id || null,
    extra_data: a.extra_data || null
  };
}

async function upsertActivities(activities) {
  if (!activities.length) return;
  // Upsert por (account_id, event_type, event_time, object_id)
  const { error } = await supabase
    .from('meta_activity_logs')
    .upsert(activities, { onConflict: ['account_id', 'event_type', 'event_time', 'object_id'] });
  if (error) throw error;
}

async function main() {
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const until = now.toISOString();
  let after = undefined;
  let total = 0;
  while (true) {
    const data = await fetchMetaActivities({ since, until, after });
    if (!data.data || !Array.isArray(data.data)) break;
    const activities = data.data.map(normalizeActivity);
    await upsertActivities(activities);
    total += activities.length;
    if (data.paging && data.paging.next && data.paging.cursors && data.paging.cursors.after) {
      after = data.paging.cursors.after;
    } else {
      break;
    }
  }
  console.log(`Sync concluído. Total de atividades salvas: ${total}`);
}

main().catch(err => {
  console.error('Erro na sync:', err);
  process.exit(1);
}); 