-- Remove política pública antiga que também atingia usuários autenticados
DROP POLICY IF EXISTS "Leads: public insert for active property" ON public.leads;

-- Recria política pública apenas para usuários anônimos
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
  )
);

-- Endurece política autenticada para impedir inserção em imóveis de outros agentes
DROP POLICY IF EXISTS "Leads: authenticated insert own" ON public.leads;

CREATE POLICY "Leads: authenticated insert own"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = agent_id
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = leads.property_id
      AND p.agent_id = auth.uid()
      AND p.active = true
  )
);