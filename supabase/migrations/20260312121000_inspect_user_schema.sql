-- RPC to inspect schema details
CREATE OR REPLACE FUNCTION public.inspect_user_schema()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cols_profiles jsonb;
  cols_roles jsonb;
  fks jsonb;
BEGIN
  -- Get columns for profiles
  SELECT jsonb_agg(column_name) INTO cols_profiles 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'profiles';

  -- Get columns for user_roles
  SELECT jsonb_agg(column_name) INTO cols_roles 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'user_roles';

  -- Get foreign keys for user_roles
  SELECT jsonb_agg(jsonb_build_object(
    'constraint_name', tc.constraint_name,
    'table_name', tc.table_name,
    'column_name', kcu.column_name,
    'foreign_table_name', ccu.table_name,
    'foreign_column_name', ccu.column_name
  )) INTO fks
  FROM information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name = 'user_roles';

  RETURN jsonb_build_object(
    'profiles_cols', cols_profiles,
    'roles_cols', cols_roles,
    'roles_fks', fks
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.inspect_user_schema() TO authenticated;
