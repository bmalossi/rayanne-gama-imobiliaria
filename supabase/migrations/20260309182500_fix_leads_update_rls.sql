-- Remove todas as políticas restritivas que estão bloqueando os Administradores
-- No Supabase, políticas RESTRICTIVE agem como filtros obrigatórios (AND). 
-- Se uma política restritiva diz "apenas o dono", nem o Admin consegue passar.

-- 1. Limpa políticas SELECT
DROP POLICY IF EXISTS "Leads: authenticated read own" ON public.leads;
DROP POLICY IF EXISTS "Leads: admin read all" ON public.leads;

-- 2. Limpa políticas UPDATE
DROP POLICY IF EXISTS "Leads: authenticated update own" ON public.leads;

-- 3. Limpa políticas DELETE
DROP POLICY IF EXISTS "Leads: authenticated delete own" ON public.leads;

-- 4. Cria novas políticas PERMISSIVAS (padrão) que permitem Dono OU Admin

-- SELECT: Dono do lead ou Admin vê tudo
CREATE POLICY "Leads: select ownership or admin"
ON public.leads
FOR SELECT
TO authenticated
USING (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

-- UPDATE: Dono do lead ou Admin atualiza tudo
CREATE POLICY "Leads: update ownership or admin"
ON public.leads
FOR UPDATE
TO authenticated
USING (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

-- DELETE: Dono do lead ou Admin deleta tudo
CREATE POLICY "Leads: delete ownership or admin"
ON public.leads
FOR DELETE
TO authenticated
USING (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

-- Garante que a inserção continue funcionando para todos em imóveis ativos (corrigido na anterior)
-- Mantemos a política "Leads: anyone can insert for active property" que acabamos de criar.
