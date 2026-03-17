-- RPC to inspect properties table schema
CREATE OR REPLACE FUNCTION public.inspect_properties_schema()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cols jsonb;
BEGIN
  SELECT jsonb_agg(column_name) INTO cols 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'properties';

  RETURN jsonb_build_object(
    'table_name', 'properties',
    'columns', cols
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.inspect_properties_schema() TO authenticated;
