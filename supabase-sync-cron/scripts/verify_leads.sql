-- Verifica o total de leads por anúncio
SELECT 
    ad_name,
    ad_id,
    created_time,
    lead_count,
    spend,
    impressions,
    clicks,
    raw_data->'results'->0->'values'->0->>'value' as raw_lead_count,
    ROUND((spend::numeric / lead_count), 2) as cost_per_lead,
    ROUND((clicks::numeric / impressions * 100), 2) as ctr,
    ROUND((lead_count::numeric / clicks * 100), 2) as conversion_rate
FROM meta_leads
WHERE created_time >= '2025-05-11'
ORDER BY created_time DESC, ad_name, ad_id;

-- Verifica se há duplicatas (mesmo anúncio, mesmo dia)
SELECT 
    created_time,
    ad_id,
    ad_name,
    COUNT(*) as total_records
FROM meta_leads
GROUP BY created_time, ad_id, ad_name
HAVING COUNT(*) > 1
ORDER BY created_time DESC, ad_name;

-- Métricas consolidadas por anúncio
SELECT 
    ad_name,
    SUM(lead_count) as total_leads,
    SUM(spend::numeric) as total_spend,
    SUM(impressions) as total_impressions,
    SUM(clicks) as total_clicks,
    ROUND(AVG(spend::numeric / lead_count), 2) as avg_cost_per_lead,
    ROUND(AVG(clicks::numeric / impressions * 100), 2) as avg_ctr,
    ROUND(AVG(lead_count::numeric / clicks * 100), 2) as avg_conversion_rate
FROM meta_leads
WHERE created_time >= '2025-05-11'
GROUP BY ad_name
ORDER BY total_leads DESC; 