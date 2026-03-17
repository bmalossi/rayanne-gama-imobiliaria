-- =============================================================================
-- Migração: Integração Chatbot → Leads
-- =============================================================================

-- 1. Adiciona campo de origem na tabela leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- 2. Torna o email nullable (leads do chatbot não obrigatoriamente têm email)
ALTER TABLE public.leads
  ALTER COLUMN email DROP NOT NULL;

-- 3. Adiciona agente padrão configurável no chatbot_settings
ALTER TABLE public.chatbot_settings
  ADD COLUMN IF NOT EXISTS default_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Corrige a política de INSERT em leads para permitir inserção pelo chatbot
--    (sem property_id obrigatório quando via Edge Function com service_role)
--    A Edge Function usa service_role que bypassa RLS, então não é preciso
--    alterar políticas, mas criamos a política de fallback para inserção anon:
DROP POLICY IF EXISTS "Leads: anyone can insert for active property" ON public.leads;

-- Nova política: permite inserção se:
--   a) Tem property_id ativo (formulario de imóvel), OU
--   b) É uma inserção via chatbot (sem property_id)
CREATE POLICY "Leads: insert for active property or chatbot"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  property_id IS NULL  -- chatbot ou lead sem imóvel específico
  OR EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = leads.property_id
      AND p.active = true
  )
);

-- =============================================================================
-- 5. Tabela de histórico de conversas do chatbot
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('user', 'bot')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca rápida por lead
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_lead_id
  ON public.chatbot_conversations (lead_id, created_at);

-- Habilita RLS
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- SELECT: dono do lead ou admin pode ver o histórico
CREATE POLICY "Conversations: select by agent or admin"
ON public.chatbot_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id
      AND (l.agent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- INSERT: apenas a Edge Function (service_role) pode inserir — sem política pública
-- A service_role bypassa o RLS, portanto não precisamos de política de INSERT aqui.
-- Caso queira ser explícito, basta não criar política de INSERT pública.

-- =============================================================================
-- Comentário final
-- =============================================================================
-- A Edge Function chatbot-ai usa SUPABASE_SERVICE_ROLE_KEY que bypassa RLS,
-- portanto as inserções em leads e chatbot_conversations feitas pela Edge
-- Function funcionarão independentemente das políticas acima.
-- As políticas acima protegem o acesso via frontend autenticado (dashboard).
