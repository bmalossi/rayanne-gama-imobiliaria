-- Fix foreign keys for lead distribution tables to reference public.profiles
-- This ensures that Supabase (PostgREST) can automatically detect relationships for joins.

-- Fix lead_distribution_settings
ALTER TABLE public.lead_distribution_settings 
DROP CONSTRAINT IF EXISTS lead_distribution_settings_agent_id_fkey,
ADD CONSTRAINT lead_distribution_settings_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix lead_distribution_tickets
ALTER TABLE public.lead_distribution_tickets 
DROP CONSTRAINT IF EXISTS lead_distribution_tickets_agent_id_fkey,
ADD CONSTRAINT lead_distribution_tickets_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
