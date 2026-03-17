-- RLS Fix for profiles table: Ensure admins and moderators can list users
-- Also ensure authenticated users can see their own profile

-- 1. Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Profiles: select own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admins select all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Create fresh, structured policies

-- SELECT: Admins/Moderators see everything, users see themselves
CREATE POLICY "Admins and moderators can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'moderator')
  OR auth.uid() = id
);

-- UPDATE: Users can only update their own profile, Admins can update any (for management)
CREATE POLICY "Users can update own profile or admins update any"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'admin')
);

-- INSERT: Handled by trigger/system, but we allow authenticated if needed for specific flows
-- Usually handle_new_user() SECURITY DEFINER handles this, so we stay restrictive
CREATE POLICY "System handles profile creation"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- DELETE: Only admins
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
