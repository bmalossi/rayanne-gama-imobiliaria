-- RPC for debugging: Checks counts of profiles and your own role
CREATE OR REPLACE FUNCTION public.debug_user_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_count integer;
  roles_count integer;
  current_user_roles text[];
BEGIN
  SELECT count(*) INTO profile_count FROM public.profiles;
  SELECT count(*) INTO roles_count FROM public.user_roles;
  
  SELECT array_agg(role::text) INTO current_user_roles 
  FROM public.user_roles 
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object(
    'profiles_total', profile_count,
    'roles_total', roles_count,
    'my_roles', current_user_roles,
    'my_id', auth.uid()
  );
END;
$$;

-- Grant permissions for dashboard troubleshooting
GRANT EXECUTE ON FUNCTION public.debug_user_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_user_counts() TO service_role;

