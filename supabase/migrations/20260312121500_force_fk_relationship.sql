-- Force create the foreign key relationship between profiles and user_roles
-- This is essential for the dashboard to list users with their roles (Fixes PGRST200)

-- 1. Ensure the constraint exists and is named correctly for PostgREST
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 2. Force PostgREST to reload the schema cache again
NOTIFY pgrst, 'reload schema';

-- 3. Verify the relationship internally
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.key_column_usage 
    WHERE constraint_name = 'user_roles_user_id_fkey'
  ) THEN
    RAISE NOTICE 'RELATIONSHIP RE-ESTABLISHED SUCCESSFULLY';
  ELSE
    RAISE EXCEPTION 'FAILED TO CREATE RELATIONSHIP';
  END IF;
END $$;
