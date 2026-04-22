-- Migration: Fix function search paths for security
-- Created: 2025-01-30
-- Purpose: Fix security warnings about mutable search_path in functions

-- Fix update_adset_goals_updated_at function
CREATE OR REPLACE FUNCTION public.update_adset_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_ad_creatives_updated_at function
CREATE OR REPLACE FUNCTION public.update_ad_creatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix trigger_update_alert_stats function
CREATE OR REPLACE FUNCTION public.trigger_update_alert_stats()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix validate_budget_adjustment_frequency function
CREATE OR REPLACE FUNCTION public.validate_budget_adjustment_frequency(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_budget_adjustment_stats function
CREATE OR REPLACE FUNCTION public.get_budget_adjustment_stats(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix should_suppress_alert function
CREATE OR REPLACE FUNCTION public.should_suppress_alert(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_active_alerts_for_adset function
CREATE OR REPLACE FUNCTION public.get_active_alerts_for_adset(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_alert_stats function
CREATE OR REPLACE FUNCTION public.update_alert_stats(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_cache_stats_updated_at function
CREATE OR REPLACE FUNCTION public.update_cache_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comments for documentation
COMMENT ON FUNCTION public.update_adset_goals_updated_at() IS 'Trigger function to update updated_at timestamp for adset_goals table';
COMMENT ON FUNCTION public.update_ad_creatives_updated_at() IS 'Trigger function to update updated_at timestamp for ad_creatives table';
COMMENT ON FUNCTION public.trigger_update_alert_stats() IS 'Trigger function to update alert statistics when new alerts are created';
COMMENT ON FUNCTION public.validate_budget_adjustment_frequency(TEXT, UUID) IS 'Validates if budget adjustment frequency limit is respected (max 4 per hour)';
COMMENT ON FUNCTION public.get_budget_adjustment_stats(TEXT, INTEGER) IS 'Returns budget adjustment statistics for an adset over a specified period';
COMMENT ON FUNCTION public.should_suppress_alert(UUID, TEXT, TEXT) IS 'Checks if alert should be suppressed due to cooldown period';
COMMENT ON FUNCTION public.get_active_alerts_for_adset(TEXT, TEXT) IS 'Returns active alerts for an adset with optional severity filter';
COMMENT ON FUNCTION public.update_alert_stats(DATE, INTEGER, TEXT, TEXT, TEXT, TEXT) IS 'Updates alert statistics for a given period and adset';
COMMENT ON FUNCTION public.update_cache_stats_updated_at() IS 'Trigger function to update updated_at timestamp for cache_stats table'; 