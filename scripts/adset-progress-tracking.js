// Script: adset-progress-tracking.js
// PBI 25 - Task 25-3: Monitoramento diário de volume vs meta
// Executa tracking diário para todos os adsets com meta ativa

const { createClient } = require('@supabase/supabase-js');
const { format, subDays } = require('date-fns');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const STATUS = {
  ON_TRACK: 'on_track',
  BEHIND: 'behind',
  AHEAD: 'ahead',
  AT_RISK: 'at_risk',
  COMPLETED: 'completed'
};

const ALERT_TYPE = {
  BEHIND: 'behind',
  AHEAD: 'ahead',
  AT_RISK: 'at_risk',
  COMPLETED: 'completed'
};

const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

const DEVIATION_THRESHOLD = 10; // %

async function main() {
  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`[${today}] Iniciando tracking diário de progresso de adsets...`);

  // 1. Buscar todas as metas ativas
  const { data: goals, error: goalsError } = await supabase
    .from('adset_goals')
    .select('*')
    .lte('contract_start_date', today)
    .gte('contract_end_date', today);

  if (goalsError) {
    console.error('Erro ao buscar metas ativas:', goalsError);
    process.exit(1);
  }

  for (const goal of goals) {
    try {
      await processAdsetGoal(goal, today);
    } catch (err) {
      console.error(`Erro ao processar adset ${goal.adset_id}:`, err);
    }
  }

  console.log(`[${today}] Tracking diário concluído para ${goals.length} adsets.`);
  process.exit(0);
}

async function processAdsetGoal(goal, today) {
  // 1. Buscar leads captados até hoje
  const { data: leads, error: leadsError } = await supabase
    .from('meta_leads')
    .select('id, created_time')
    .eq('adset_id', goal.adset_id)
    .lte('created_time', today + 'T23:59:59.999Z');

  if (leadsError) throw leadsError;

  // 2. Calcular leads captados até hoje
  const leadsCaptured = leads.length;

  // 3. Calcular progresso ideal até hoje
  const startDate = new Date(goal.contract_start_date);
  const endDate = new Date(goal.contract_end_date);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((new Date(today) - startDate) / (1000 * 60 * 60 * 24));
  const idealProgress = (daysElapsed / totalDays) * goal.volume_contracted;
  const dailyTarget = goal.volume_contracted / totalDays;

  // 4. Calcular desvio percentual
  const deviation = leadsCaptured - idealProgress;
  const deviationPct = (deviation / idealProgress) * 100;

  // 5. Determinar status
  let status = STATUS.ON_TRACK;
  if (leadsCaptured >= goal.volume_contracted) {
    status = STATUS.COMPLETED;
  } else if (deviationPct < -DEVIATION_THRESHOLD) {
    status = STATUS.BEHIND;
  } else if (deviationPct > DEVIATION_THRESHOLD) {
    status = STATUS.AHEAD;
  }

  // 6. Projeção de risco de não bater meta
  const daysRemaining = Math.max(0, Math.ceil((endDate - new Date(today)) / (1000 * 60 * 60 * 24)));
  const leadsRemaining = goal.volume_contracted - leadsCaptured;
  const projectedDaily = daysRemaining > 0 ? leadsRemaining / daysRemaining : 0;
  if (status !== STATUS.COMPLETED && projectedDaily > dailyTarget * 1.5) {
    status = STATUS.AT_RISK;
  }

  // 7. Registrar tracking no banco
  const { data: tracking, error: trackingError } = await supabase
    .from('adset_progress_tracking')
    .upsert({
      adset_id: goal.adset_id,
      date: today,
      leads_captured: leadsCaptured,
      daily_target: dailyTarget,
      status,
      deviation_pct: deviationPct,
      created_at: new Date().toISOString()
    }, { onConflict: ['adset_id', 'date'] })
    .select();

  if (trackingError) throw trackingError;

  // 8. Gerar alerta se necessário
  await maybeGenerateAlert(goal.adset_id, today, status, deviationPct);
}

async function maybeGenerateAlert(adsetId, date, status, deviationPct) {
  // Buscar último alerta para este adset
  const { data: lastAlert } = await supabase
    .from('adset_progress_alerts')
    .select('*')
    .eq('adset_id', adsetId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  // Só gerar alerta se status mudou ou não existe alerta
  if (!lastAlert || lastAlert.type !== status) {
    let severity = ALERT_SEVERITY.INFO;
    let message = '';
    if (status === STATUS.BEHIND) {
      severity = ALERT_SEVERITY.WARNING;
      message = `Atraso de ${Math.abs(deviationPct).toFixed(1)}% em relação à meta.`;
    } else if (status === STATUS.AHEAD) {
      severity = ALERT_SEVERITY.INFO;
      message = `Adiantamento de ${Math.abs(deviationPct).toFixed(1)}% em relação à meta.`;
    } else if (status === STATUS.AT_RISK) {
      severity = ALERT_SEVERITY.CRITICAL;
      message = `Risco de não bater meta: desvio de ${Math.abs(deviationPct).toFixed(1)}%.`;
    } else if (status === STATUS.COMPLETED) {
      severity = ALERT_SEVERITY.INFO;
      message = `Meta contratual atingida!`;
    }

    if (status !== STATUS.ON_TRACK) {
      await supabase
        .from('adset_progress_alerts')
        .insert({
          adset_id: adsetId,
          date,
          type: status,
          severity,
          message,
          resolved: false,
          created_at: new Date().toISOString()
        });
      console.log(`[${date}] ALERTA: ${adsetId} - ${status} - ${message}`);
    }
  }
}

main(); 