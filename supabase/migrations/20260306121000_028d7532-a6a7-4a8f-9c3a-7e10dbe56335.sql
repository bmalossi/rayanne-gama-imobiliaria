-- Endurece a política de insert público para impedir agent_id arbitrário
DROP POLICY IF EXISTS "Leads: public insert for active property" ON public.leads;

CREATE POLICY "Leads: public insert for active property"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = leads.property_id
      AND p.active = true
      AND p.agent_id = leads.agent_id
  )
);