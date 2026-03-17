-- Garante que o bmalossi@yahoo.com.br seja admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'bmalossi@yahoo.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- Atualiza a função handle_new_user para aceitar cargo via meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  initial_role public.app_role;
BEGIN
  -- Extrai cargo do meta_data se existir e for válido, senão usa 'user'
  initial_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.app_role, 
    'user'
  );

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, initial_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;
