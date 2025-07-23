-- Migration: Create alerts system
-- PBI 25 - Task 25-10: Sistema de Alertas Inteligentes
-- Created: 2025-01-22

-- Create alert_rules table (configurações de alertas)
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    name TEXT NOT NULL,
    description TEXT,
    adset_id TEXT, -- NULL = regra global
    campaign_id TEXT,
    user_id TEXT,
    
    -- Configuração da regra
    alert_type TEXT NOT NULL, -- 'goal_deviation', 'high_cpl', 'budget_depletion', 'quality_drop'
    severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
    is_active BOOLEAN DEFAULT true,
    
    -- Thresholds específicos por tipo
    thresholds JSONB NOT NULL DEFAULT '{}',
    
    -- Configuração de notificações
    notification_channels TEXT[] DEFAULT ARRAY['dashboard'], -- 'email', 'webhook', 'dashboard'
    notification_template TEXT,
    
    -- Cooldown e rate limiting
    cooldown_minutes INTEGER DEFAULT 60,
    max_notifications_per_hour INTEGER DEFAULT 5,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    
    -- Constraints
    CONSTRAINT alert_rules_type_check 
        CHECK (alert_type IN ('goal_deviation', 'high_cpl', 'budget_depletion', 'quality_drop', 'performance_anomaly')),
    CONSTRAINT alert_rules_severity_check 
        CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Create alerts table (alertas gerados)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
    adset_id TEXT NOT NULL,
    campaign_id TEXT,
    
    -- Dados do alerta
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Contexto e dados
    context JSONB DEFAULT '{}', -- métricas que geraram o alerta
    suggested_actions TEXT[],
    
    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'snoozed'
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    snoozed_until TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT alerts_type_check 
        CHECK (alert_type IN ('goal_deviation', 'high_cpl', 'budget_depletion', 'quality_drop', 'performance_anomaly')),
    CONSTRAINT alerts_severity_check 
        CHECK (severity IN ('info', 'warning', 'critical')),
    CONSTRAINT alerts_status_check 
        CHECK (status IN ('active', 'acknowledged', 'resolved', 'snoozed'))
);

-- Create alert_notifications table (histórico de notificações)
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamento
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
    
    -- Configuração da notificação
    channel TEXT NOT NULL, -- 'email', 'webhook', 'dashboard'
    recipient TEXT, -- email ou webhook URL
    
    -- Conteúdo
    subject TEXT,
    content TEXT NOT NULL,
    template_used TEXT,
    
    -- Status de entrega
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT alert_notifications_channel_check 
        CHECK (channel IN ('email', 'webhook', 'dashboard', 'sms')),
    CONSTRAINT alert_notifications_status_check 
        CHECK (status IN ('pending', 'sent', 'failed', 'skipped'))
);

-- Create alert_stats table (estatísticas de alertas)
CREATE TABLE IF NOT EXISTS alert_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Período
    date_period DATE NOT NULL,
    hour_period INTEGER, -- NULL para stats diárias, 0-23 para stats horárias
    
    -- Identificação
    adset_id TEXT,
    campaign_id TEXT,
    alert_type TEXT,
    
    -- Estatísticas
    total_alerts INTEGER DEFAULT 0,
    critical_alerts INTEGER DEFAULT 0,
    warning_alerts INTEGER DEFAULT 0,
    info_alerts INTEGER DEFAULT 0,
    resolved_alerts INTEGER DEFAULT 0,
    avg_resolution_time_minutes INTEGER,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(date_period, hour_period, adset_id, campaign_id, alert_type)
);

-- Create indexes for performance
CREATE INDEX idx_alert_rules_adset_id ON alert_rules(adset_id);
CREATE INDEX idx_alert_rules_campaign_id ON alert_rules(campaign_id);
CREATE INDEX idx_alert_rules_type_active ON alert_rules(alert_type, is_active);

CREATE INDEX idx_alerts_adset_id ON alerts(adset_id);
CREATE INDEX idx_alerts_campaign_id ON alerts(campaign_id);
CREATE INDEX idx_alerts_type_severity ON alerts(alert_type, severity);
CREATE INDEX idx_alerts_status_created ON alerts(status, created_at);
CREATE INDEX idx_alerts_rule_id ON alerts(rule_id);

CREATE INDEX idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_channel_status ON alert_notifications(channel, status);
CREATE INDEX idx_alert_notifications_created_at ON alert_notifications(created_at);

CREATE INDEX idx_alert_stats_period ON alert_stats(date_period, hour_period);
CREATE INDEX idx_alert_stats_adset ON alert_stats(adset_id, date_period);

-- Create functions for alert management

-- Function to check if alert should be suppressed due to cooldown
CREATE OR REPLACE FUNCTION should_suppress_alert(
    p_rule_id UUID,
    p_adset_id TEXT,
    p_alert_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    rule_cooldown INTEGER;
    last_alert_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get rule cooldown
    SELECT cooldown_minutes INTO rule_cooldown
    FROM alert_rules 
    WHERE id = p_rule_id;
    
    IF rule_cooldown IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get last alert of same type for same adset
    SELECT MAX(created_at) INTO last_alert_time
    FROM alerts
    WHERE rule_id = p_rule_id 
      AND adset_id = p_adset_id 
      AND alert_type = p_alert_type
      AND status IN ('active', 'acknowledged');
    
    -- If no previous alert, don't suppress
    IF last_alert_time IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Suppress if within cooldown period
    RETURN (NOW() - last_alert_time) < (rule_cooldown || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to get active alerts for adset
CREATE OR REPLACE FUNCTION get_active_alerts_for_adset(
    p_adset_id TEXT,
    p_severity TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'alert_type', alert_type,
            'severity', severity,
            'title', title,
            'message', message,
            'context', context,
            'suggested_actions', suggested_actions,
            'created_at', created_at,
            'snoozed_until', snoozed_until
        )
    )
    INTO result
    FROM alerts
    WHERE adset_id = p_adset_id
      AND status IN ('active', 'snoozed')
      AND (p_severity IS NULL OR severity = p_severity)
      AND (snoozed_until IS NULL OR snoozed_until < NOW())
    ORDER BY 
        CASE severity 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
            WHEN 'info' THEN 3 
        END,
        created_at DESC;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Function to update alert stats
CREATE OR REPLACE FUNCTION update_alert_stats(
    p_date DATE,
    p_hour INTEGER,
    p_adset_id TEXT,
    p_campaign_id TEXT,
    p_alert_type TEXT,
    p_severity TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO alert_stats (
        date_period, hour_period, adset_id, campaign_id, alert_type,
        total_alerts,
        critical_alerts,
        warning_alerts,
        info_alerts
    )
    VALUES (
        p_date, p_hour, p_adset_id, p_campaign_id, p_alert_type,
        1,
        CASE WHEN p_severity = 'critical' THEN 1 ELSE 0 END,
        CASE WHEN p_severity = 'warning' THEN 1 ELSE 0 END,
        CASE WHEN p_severity = 'info' THEN 1 ELSE 0 END
    )
    ON CONFLICT (date_period, hour_period, adset_id, campaign_id, alert_type)
    DO UPDATE SET
        total_alerts = alert_stats.total_alerts + 1,
        critical_alerts = alert_stats.critical_alerts + 
            CASE WHEN p_severity = 'critical' THEN 1 ELSE 0 END,
        warning_alerts = alert_stats.warning_alerts + 
            CASE WHEN p_severity = 'warning' THEN 1 ELSE 0 END,
        info_alerts = alert_stats.info_alerts + 
            CASE WHEN p_severity = 'info' THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when alerts are created
CREATE OR REPLACE FUNCTION trigger_update_alert_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update hourly stats
    PERFORM update_alert_stats(
        DATE(NEW.created_at),
        EXTRACT(HOUR FROM NEW.created_at)::INTEGER,
        NEW.adset_id,
        NEW.campaign_id,
        NEW.alert_type,
        NEW.severity
    );
    
    -- Update daily stats (hour_period = NULL)
    PERFORM update_alert_stats(
        DATE(NEW.created_at),
        NULL,
        NEW.adset_id,
        NEW.campaign_id,
        NEW.alert_type,
        NEW.severity
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alerts_update_stats
    AFTER INSERT ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_alert_stats();

-- Insert default alert rules
INSERT INTO alert_rules (name, description, alert_type, severity, thresholds, notification_channels) VALUES
('Desvio de Meta Crítico', 'Alerta quando meta está com desvio > 30%', 'goal_deviation', 'critical', 
 '{"deviation_threshold": 30, "min_days_elapsed": 3}', ARRAY['email', 'dashboard']),
 
('Desvio de Meta Atenção', 'Alerta quando meta está com desvio > 15%', 'goal_deviation', 'warning', 
 '{"deviation_threshold": 15, "min_days_elapsed": 2}', ARRAY['dashboard']),
 
('CPL Elevado Crítico', 'Alerta quando CPL > 50% da meta', 'high_cpl', 'critical', 
 '{"cpl_threshold_percentage": 50, "min_leads": 5}', ARRAY['email', 'dashboard']),
 
('CPL Elevado Atenção', 'Alerta quando CPL > 20% da meta', 'high_cpl', 'warning', 
 '{"cpl_threshold_percentage": 20, "min_leads": 3}', ARRAY['dashboard']),
 
('Budget Esgotando', 'Alerta quando budget > 90% usado mas meta < 70%', 'budget_depletion', 'warning', 
 '{"budget_used_threshold": 90, "goal_progress_threshold": 70}', ARRAY['email', 'dashboard']);

-- Add comments
COMMENT ON TABLE alert_rules IS 'Regras configuráveis para geração de alertas';
COMMENT ON TABLE alerts IS 'Alertas gerados pelo sistema de monitoramento';
COMMENT ON TABLE alert_notifications IS 'Histórico de notificações enviadas';
COMMENT ON TABLE alert_stats IS 'Estatísticas agregadas de alertas por período';

-- Grant permissions (adjust according to your RLS policies)
-- ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY; 