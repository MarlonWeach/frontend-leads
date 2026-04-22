-- Criar função para executar SQL dinâmico
-- Esta função permite executar queries SQL complexas via RPC
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE 'SELECT json_agg(t) FROM (' || sql || ') t' INTO result;
    RETURN COALESCE(result, '[]'::json);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro na execução do SQL: %', SQLERRM;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role; 