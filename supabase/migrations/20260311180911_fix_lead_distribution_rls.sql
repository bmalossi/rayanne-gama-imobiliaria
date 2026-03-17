-- Supabase RLS Fix for lead_distribution_settings
-- Replaces the overarching "ALL" policy with specific CRUD policies
-- to ensure upserts and updates work correctly without being blocked.

DROP POLICY IF EXISTS "Admins can manage lead distribution settings" ON public.lead_distribution_settings;

CREATE POLICY "Admins can select lead distribution settings"
ON public.lead_distribution_settings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert lead distribution settings"
ON public.lead_distribution_settings
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lead distribution settings"
ON public.lead_distribution_settings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lead distribution settings"
ON public.lead_distribution_settings
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
