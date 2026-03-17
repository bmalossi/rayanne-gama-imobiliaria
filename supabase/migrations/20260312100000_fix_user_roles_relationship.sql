-- Ensure explicit foreign key relationship between profiles and user_roles
-- This is required for PostgREST to perform JOINS correctly (PGRST200 error)

DO $$ 
BEGIN
    -- 1. Check if user_roles table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        
        -- 2. Add foreign key if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'user_roles_user_id_fkey' 
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.user_roles 
            ADD CONSTRAINT user_roles_user_id_fkey 
            FOREIGN KEY (user_id) 
            REFERENCES public.profiles(id) 
            ON DELETE CASCADE;
            
            RAISE NOTICE 'Foreign key constraint added to user_roles.';
        ELSE
            RAISE NOTICE 'Foreign key constraint already exists.';
        END IF;

    ELSE
        RAISE EXCEPTION 'Table public.user_roles NOT FOUND. Please ensure core schema is applied.';
    END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
