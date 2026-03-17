-- Hardening de RLS para dados sensíveis de leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Remove políticas antigas para recriar com escopo explícito
DROP POLICY IF EXISTS "Leads: agent read own" ON public.leads;
DROP POLICY IF EXISTS "Leads: agent update own" ON public.leads;
DROP POLICY IF EXISTS "Leads: agent delete own" ON public.leads;
DROP POLICY IF EXISTS "Leads: authenticated insert own" ON public.leads;
DROP POLICY IF EXISTS "Leads: public insert for active property" ON public.leads;

-- SELECT apenas para usuários autenticados e somente seus próprios leads
CREATE POLICY "Leads: authenticated read own"
ON public.leads
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (auth.uid() = agent_id);

-- UPDATE apenas para usuários autenticados e somente seus próprios leads
CREATE POLICY "Leads: authenticated update own"
ON public.leads
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

-- DELETE apenas para usuários autenticados e somente seus próprios leads
CREATE POLICY "Leads: authenticated delete own"
ON public.leads
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (auth.uid() = agent_id);

-- INSERT para corretores autenticados (fluxos internos)
CREATE POLICY "Leads: authenticated insert own"
ON public.leads
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = agent_id);

-- INSERT público permitido apenas para imóvel ativo (captação pública)
CREATE POLICY "Leads: public insert for active property"
ON public.leads
AS RESTRICTIVE
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