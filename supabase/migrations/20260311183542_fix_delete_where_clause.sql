-- Fix for save_lead_distribution_settings
-- Adds a WHERE true clause to the DELETE statement to satisfy Supabase/PostgREST safety checks.

CREATE OR REPLACE FUNCTION public.save_lead_distribution_settings(
  settings_json JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_record RECORD;
  total_p INTEGER := 0;
BEGIN
  -- Verify admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem configurar a roleta.';
  END IF;

  -- Validate total 100% in JSON
  FOR setting_record IN SELECT * FROM jsonb_to_recordset(settings_json) AS x(agent_id UUID, percentage INTEGER)
  LOOP
    total_p := total_p + setting_record.percentage;
  END LOOP;

  IF total_p != 100 AND jsonb_array_length(settings_json) > 0 THEN
    RAISE EXCEPTION 'A soma das porcentagens deve ser exatamente 100%%. Total recebido: %', total_p;
  END IF;

  -- Perform atomic replace with dummy WHERE clause for safety
  DELETE FROM public.lead_distribution_settings WHERE true;
  
  IF jsonb_array_length(settings_json) > 0 THEN
    INSERT INTO public.lead_distribution_settings (agent_id, percentage)
    SELECT agent_id, percentage
    FROM jsonb_to_recordset(settings_json) AS x(agent_id UUID, percentage INTEGER);
  END IF;
END;
$$;
