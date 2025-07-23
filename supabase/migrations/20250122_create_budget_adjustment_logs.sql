-- Migration: Create budget_adjustment_logs table
-- PBI 25 - Task 25-8: Sistema de Logs e Controle de Ajustes
-- Created: 2025-01-22

-- Create budget_adjustment_logs table
CREATE TABLE IF NOT EXISTS budget_adjustment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do adset
    adset_id TEXT NOT NULL,
    campaign_id TEXT,
    
    -- Dados do ajuste
    old_budget DECIMAL(10,2) NOT NULL,
    new_budget DECIMAL(10,2) NOT NULL,
    adjustment_amount DECIMAL(10,2) NOT NULL, -- new_budget - old_budget
    adjustment_percentage DECIMAL(5,2) NOT NULL, -- percentual de mudança
    
    -- Motivo e contexto
    reason TEXT NOT NULL, -- motivo do ajuste (automático/manual)
    trigger_type TEXT NOT NULL, -- 'automatic', 'manual', 'api'
    context JSONB, -- dados adicionais sobre o contexto
    
    -- Auditoria
    user_id TEXT,
    applied_by TEXT, -- sistema/usuário que aplicou
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'failed', 'cancelled'
    error_message TEXT,
    
    -- Metadados
    meta_response JSONB, -- resposta da API Meta (se aplicável)
    
    -- Constraints
    CONSTRAINT budget_adjustment_logs_adjustment_percentage_check 
        CHECK (adjustment_percentage >= -100 AND adjustment_percentage <= 100),
    CONSTRAINT budget_adjustment_logs_status_check 
        CHECK (status IN ('pending', 'applied', 'failed', 'cancelled')),
    CONSTRAINT budget_adjustment_logs_trigger_type_check 
        CHECK (trigger_type IN ('automatic', 'manual', 'api'))
);

-- Create indexes for fast queries
CREATE INDEX idx_budget_adjustment_logs_adset_id ON budget_adjustment_logs(adset_id);
CREATE INDEX idx_budget_adjustment_logs_campaign_id ON budget_adjustment_logs(campaign_id);
CREATE INDEX idx_budget_adjustment_logs_created_at ON budget_adjustment_logs(created_at);
CREATE INDEX idx_budget_adjustment_logs_applied_at ON budget_adjustment_logs(applied_at);
CREATE INDEX idx_budget_adjustment_logs_status ON budget_adjustment_logs(status);
CREATE INDEX idx_budget_adjustment_logs_trigger_type ON budget_adjustment_logs(trigger_type);

-- Composite index for frequency control (adset + last hour)
CREATE INDEX idx_budget_adjustment_logs_frequency_control 
ON budget_adjustment_logs(adset_id, created_at) 
WHERE status = 'applied';

-- Index for user audit queries
CREATE INDEX idx_budget_adjustment_logs_user_audit 
ON budget_adjustment_logs(user_id, created_at);

-- Add comments
COMMENT ON TABLE budget_adjustment_logs IS 'Log de todos os ajustes de budget com controle de frequência';
COMMENT ON COLUMN budget_adjustment_logs.adjustment_percentage IS 'Percentual de mudança do budget (positivo = aumento, negativo = redução)';
COMMENT ON COLUMN budget_adjustment_logs.trigger_type IS 'Tipo de trigger: automatic (sistema), manual (usuário), api (externa)';
COMMENT ON COLUMN budget_adjustment_logs.context IS 'Dados JSON com contexto do ajuste (métricas, alertas, etc)';
COMMENT ON COLUMN budget_adjustment_logs.meta_response IS 'Resposta completa da Meta API quando ajuste é aplicado';

-- Create function to validate adjustment frequency (max 4 per hour)
CREATE OR REPLACE FUNCTION validate_budget_adjustment_frequency(
    p_adset_id TEXT,
    p_exclude_log_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    adjustment_count INTEGER;
BEGIN
    -- Count adjustments in the last hour for this adset
    SELECT COUNT(*)
    INTO adjustment_count
    FROM budget_adjustment_logs
    WHERE adset_id = p_adset_id
      AND status = 'applied'
      AND created_at >= NOW() - INTERVAL '1 hour'
      AND (p_exclude_log_id IS NULL OR id != p_exclude_log_id);
    
    -- Return true if less than 4 adjustments
    RETURN adjustment_count < 4;
END;
$$ LANGUAGE plpgsql;

-- Create function to get adjustment stats for an adset
CREATE OR REPLACE FUNCTION get_budget_adjustment_stats(
    p_adset_id TEXT,
    p_period_hours INTEGER DEFAULT 24
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_adjustments', COUNT(*),
        'successful_adjustments', COUNT(*) FILTER (WHERE status = 'applied'),
        'failed_adjustments', COUNT(*) FILTER (WHERE status = 'failed'),
        'avg_adjustment_percentage', ROUND(AVG(adjustment_percentage), 2),
        'total_budget_change', SUM(adjustment_amount) FILTER (WHERE status = 'applied'),
        'last_adjustment', MAX(created_at) FILTER (WHERE status = 'applied'),
        'can_adjust_now', validate_budget_adjustment_frequency(p_adset_id)
    )
    INTO result
    FROM budget_adjustment_logs
    WHERE adset_id = p_adset_id
      AND created_at >= NOW() - INTERVAL '1 hour' * p_period_hours;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust according to your RLS policies)
-- ALTER TABLE budget_adjustment_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment and adjust as needed)
-- CREATE POLICY "budget_adjustment_logs_select_policy" ON budget_adjustment_logs
--     FOR SELECT USING (true); -- Adjust based on your auth system

-- CREATE POLICY "budget_adjustment_logs_insert_policy" ON budget_adjustment_logs
--     FOR INSERT WITH CHECK (true); -- Adjust based on your auth system 