require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  console.log('🔍 DEBUGANDO DADOS ATUAIS NO SUPABASE\\n');
  
  // 1. Verificar dados mais recentes
  console.log('1️⃣ Buscando dados mais recentes...');
  const { data: recent, error: recentError } = await supabase
    .from('meta_leads')
    .select('*')
    .order('created_time', { ascending: false })
    .limit(10);
  
  if (recentError) {
    console.error('❌ Erro ao buscar dados recentes:', recentError);
    return;
  }
  
  console.log('📅 Datas mais recentes encontradas:');
  recent.forEach((record, index) => {
    console.log(`  ${index + 1}. ${record.campaign_name}: ${record.created_time} (${record.date_start} - ${record.date_stop})`);
  });
  
  // 2. Verificar dados de hoje (20/06/2025)
  console.log('\\n2️⃣ Verificando dados de HOJE (20/06/2025)...');
  const today = new Date('2025-06-20');
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  
  const { data: todayData, error: todayError } = await supabase
    .from('meta_leads')
    .select('*')
    .gte('created_time', todayStart.toISOString())
    .lte('created_time', todayEnd.toISOString());
  
  if (todayError) {
    console.error('❌ Erro ao buscar dados de hoje:', todayError);
  } else {
    console.log(`📊 Dados de hoje: ${todayData.length} registros`);
    todayData.forEach(record => {
      console.log(`  - ${record.campaign_name}: ${record.created_time}`);
    });
  }
  
  // 3. Verificar dados de ontem (19/06/2025)
  console.log('\\n3️⃣ Verificando dados de ONTEM (19/06/2025)...');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);
  
  const { data: yesterdayData, error: yesterdayError } = await supabase
    .from('meta_leads')
    .select('*')
    .gte('created_time', yesterdayStart.toISOString())
    .lte('created_time', yesterdayEnd.toISOString());
  
  if (yesterdayError) {
    console.error('❌ Erro ao buscar dados de ontem:', yesterdayError);
  } else {
    console.log(`📊 Dados de ontem: ${yesterdayData.length} registros`);
    yesterdayData.forEach(record => {
      console.log(`  - ${record.campaign_name}: ${record.created_time}`);
    });
  }
  
  // 4. Verificar dados dos últimos 7 dias
  console.log('\\n4️⃣ Verificando dados dos ÚLTIMOS 7 DIAS...');
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const sevenDaysStart = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());
  
  const { data: sevenDaysData, error: sevenDaysError } = await supabase
    .from('meta_leads')
    .select('*')
    .gte('created_time', sevenDaysStart.toISOString())
    .lte('created_time', todayEnd.toISOString());
  
  if (sevenDaysError) {
    console.error('❌ Erro ao buscar dados dos últimos 7 dias:', sevenDaysError);
  } else {
    console.log(`📊 Dados dos últimos 7 dias: ${sevenDaysData.length} registros`);
    
    // Agrupar por data
    const byDate = {};
    sevenDaysData.forEach(record => {
      const date = record.created_time.split('T')[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(record);
    });
    
    Object.keys(byDate).sort().forEach(date => {
      console.log(`  ${date}: ${byDate[date].length} registros`);
    });
  }
  
  // 5. Verificar status da sincronização
  console.log('\\n5️⃣ Verificando status da sincronização...');
  const { data: syncStatus, error: syncError } = await supabase
    .from('sync_status')
    .select('*')
    .eq('id', 'meta_leads_sync')
    .single();
  
  if (syncError) {
    console.error('❌ Erro ao buscar status da sincronização:', syncError);
  } else {
    console.log('📊 Status da sincronização:', syncStatus);
  }
  
})(); 