-- Corrige a política de criação de leads para permitir que usuários logados também possam enviar mensagens
-- (Anteriormente, apenas usuários anônimos podiam, ou o agente proprietário do imóvel)

DROP POLICY IF EXISTS "Leads: public insert for active property" ON public.leads;

CREATE POLICY "Leads: anyone can insert for active property"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = leads.property_id
      AND p.active = true
  )
);

-- Garante que Admins possam ver todos os leads
DROP POLICY IF EXISTS "Leads: admin read all" ON public.leads;
CREATE POLICY "Leads: admin read all"
ON public.leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = agent_id);
