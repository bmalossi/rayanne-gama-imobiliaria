-- RPC to inspect multiple tables
CREATE OR REPLACE FUNCTION public.inspect_imoveis_schema()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cols_properties jsonb;
  cols_private jsonb;
BEGIN
  -- Get columns for properties
  SELECT jsonb_agg(column_name) INTO cols_properties 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'properties';

  -- Get columns for property_private_details
  SELECT jsonb_agg(column_name) INTO cols_private 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'property_private_details';

  RETURN jsonb_build_object(
    'properties', cols_properties,
    'private_details', cols_private
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.inspect_imoveis_schema() TO authenticated;
