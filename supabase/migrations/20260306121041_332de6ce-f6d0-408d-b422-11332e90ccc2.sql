-- Garante que agent_id seja sempre derivado do imóvel, não do input do cliente
DROP TRIGGER IF EXISTS trg_assign_lead_agent ON public.leads;

CREATE TRIGGER trg_assign_lead_agent
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.assign_lead_agent();

-- Reforça policy anônima com validação final após trigger
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