// API Route: alerts
// PBI 25 - Task 25-7: Dashboard de Acompanhamento de Metas

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import alertEngine from '@/services/alertEngine';
import {
  AlertsQuery,
  AlertsResponse,
  UpdateAlertStatusRequest,
  AlertActionRequest,
  AlertActionResponse
} from '@/types/alertSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: AlertsQuery = {
      adset_id: searchParams.get('adset_id') || undefined,
      campaign_id: searchParams.get('campaign_id') || undefined,
      alert_type: searchParams.getAll('alert_type') as any[] || undefined,
      severity: searchParams.getAll('severity') as any[] || undefined,
      status: searchParams.getAll('status') as any[] || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: searchParams.get('sort_by') as any || 'created_at',
      sort_order: searchParams.get('sort_order') as any || 'desc'
    };

    // Construir query Supabase
    let supabaseQuery = supabase
      .from('alerts')
      .select('*');

    // Aplicar filtros
    if (query.adset_id) {
      supabaseQuery = supabaseQuery.eq('adset_id', query.adset_id);
    }

    if (query.campaign_id) {
      supabaseQuery = supabaseQuery.eq('campaign_id', query.campaign_id);
    }

    if (query.alert_type && query.alert_type.length > 0) {
      supabaseQuery = supabaseQuery.in('alert_type', query.alert_type);
    }

    if (query.severity && query.severity.length > 0) {
      supabaseQuery = supabaseQuery.in('severity', query.severity);
    }

    if (query.status && query.status.length > 0) {
      supabaseQuery = supabaseQuery.in('status', query.status);
    }

    if (query.start_date) {
      supabaseQuery = supabaseQuery.gte('created_at', query.start_date);
    }

    if (query.end_date) {
      supabaseQuery = supabaseQuery.lte('created_at', query.end_date);
    }

    // Aplicar ordenação
    supabaseQuery = supabaseQuery.order(query.sort_by!, { ascending: query.sort_order === 'asc' });

    // Aplicar paginação
    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }

    if (query.offset) {
      supabaseQuery = supabaseQuery.range(query.offset, (query.offset + (query.limit || 50)) - 1);
    }

    const { data: alerts, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json(
        { 
          success: false, 
          count: 0,
          alerts: [],
          error: error.message
        },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const statsQuery = supabase
      .from('alerts')
      .select('severity, status');

    // Aplicar os mesmos filtros para as stats
    if (query.adset_id) {
      statsQuery.eq('adset_id', query.adset_id);
    }
    if (query.campaign_id) {
      statsQuery.eq('campaign_id', query.campaign_id);
    }

    const { data: statsData } = await statsQuery;
    
    const stats = {
      active: statsData?.filter(a => a.status === 'active').length || 0,
      critical: statsData?.filter(a => a.severity === 'critical' && a.status === 'active').length || 0,
      warning: statsData?.filter(a => a.severity === 'warning' && a.status === 'active').length || 0,
      info: statsData?.filter(a => a.severity === 'info' && a.status === 'active').length || 0
    };

    const response: AlertsResponse = {
      success: true,
      count: alerts?.length || 0,
      total_count: count || undefined,
      alerts: alerts || [],
      stats
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in alerts GET API:', error);
    return NextResponse.json(
      { 
        success: false, 
        count: 0,
        alerts: [],
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateAlertStatusRequest = await request.json();
    
    // Validações básicas
    if (!body.alert_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'alert_id é obrigatório'
        },
        { status: 400 }
      );
    }

    if (!body.status || !['active', 'acknowledged', 'resolved', 'snoozed'].includes(body.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'status deve ser: active, acknowledged, resolved ou snoozed'
        },
        { status: 400 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString()
    };

    switch (body.status) {
      case 'acknowledged':
        updateData.acknowledged_at = new Date().toISOString();
        updateData.acknowledged_by = body.user_id;
        break;
      
      case 'resolved':
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = body.user_id;
        if (body.resolution_note) {
          updateData.context = { resolution_note: body.resolution_note };
        }
        break;
      
      case 'snoozed':
        if (body.snooze_until) {
          updateData.snoozed_until = body.snooze_until;
        } else {
          // Snooze por 4 horas por padrão
          const snoozeUntil = new Date();
          snoozeUntil.setHours(snoozeUntil.getHours() + 4);
          updateData.snoozed_until = snoozeUntil.toISOString();
        }
        break;
    }

    const { data, error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', body.alert_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating alert status:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alert: data
    });
  } catch (error) {
    console.error('Error in alerts PUT API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'bulk') {
      // Ações em lote
      const body: AlertActionRequest = await request.json();
      
      if (!body.alert_ids || body.alert_ids.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            affected_count: 0,
            errors: ['alert_ids é obrigatório']
          },
          { status: 400 }
        );
      }

      if (body.alert_ids.length > 100) {
        return NextResponse.json(
          { 
            success: false, 
            affected_count: 0,
            errors: ['Máximo de 100 alertas por ação em lote']
          },
          { status: 400 }
        );
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      
      switch (body.action) {
        case 'bulk_acknowledge':
          updateData.status = 'acknowledged';
          updateData.acknowledged_at = new Date().toISOString();
          updateData.acknowledged_by = body.user_id;
          break;
        
        case 'bulk_resolve':
          updateData.status = 'resolved';
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = body.user_id;
          if (body.resolution_note) {
            updateData.context = { resolution_note: body.resolution_note };
          }
          break;
        
        case 'snooze':
          updateData.status = 'snoozed';
          if (body.snooze_duration_hours) {
            const snoozeUntil = new Date();
            snoozeUntil.setHours(snoozeUntil.getHours() + body.snooze_duration_hours);
            updateData.snoozed_until = snoozeUntil.toISOString();
          }
          break;
        
        default:
          return NextResponse.json(
            { 
              success: false, 
              affected_count: 0,
              errors: ['Ação não suportada']
            },
            { status: 400 }
          );
      }

      const { error, count } = await supabase
        .from('alerts')
        .update(updateData)
        .in('id', body.alert_ids);

      if (error) {
        return NextResponse.json(
          { 
            success: false, 
            affected_count: 0,
            errors: [error.message]
          },
          { status: 500 }
        );
      }

      const response: AlertActionResponse = {
        success: true,
        affected_count: count || 0,
        errors: []
      };

      return NextResponse.json(response);

    } else if (action === 'run_monitoring') {
      // Executar ciclo de monitoramento manualmente
      console.log('[Alerts API] Manual monitoring cycle requested');
      
      const result = await alertEngine.runMonitoringCycle();
      
      return NextResponse.json(result);

    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ação não especificada ou inválida'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in alerts POST API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 