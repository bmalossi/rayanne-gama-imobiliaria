-- =============================================================================
-- Migração: Reestruturação do Chatbot para Persistência via RPCs
-- Baseado na arquitetura do projeto adv-edvaldo-rodrigues
-- =============================================================================

-- 0. Remover restrições de NOT NULL das colunas antigas (role, content)
-- pois a nova arquitetura usa historico_conversa JSONB
ALTER TABLE public.chatbot_conversations
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN content DROP NOT NULL;

-- 1. Adicionar colunas para persistência JSONB na tabela existente
ALTER TABLE public.chatbot_conversations
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS historico_conversa JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dados_coletados JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'em_andamento',
  ADD COLUMN IF NOT EXISTS dispositivo TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Alterar session_id para TEXT (compatibilidade com UUID gerado no frontend)
-- e torná-lo UNIQUE para permitir UPSERT
ALTER TABLE public.chatbot_conversations
  ALTER COLUMN session_id TYPE TEXT USING session_id::TEXT;

-- Criar unique constraint se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chatbot_conversations_session_id_unique'
  ) THEN
    ALTER TABLE public.chatbot_conversations
      ADD CONSTRAINT chatbot_conversations_session_id_unique UNIQUE (session_id);
  END IF;
END $$;

-- 3. Índices adicionais
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_telefone
  ON public.chatbot_conversations(telefone) WHERE telefone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status
  ON public.chatbot_conversations(status);

-- 4. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_chatbot_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chatbot_updated_at ON public.chatbot_conversations;

CREATE TRIGGER trigger_update_chatbot_updated_at
    BEFORE UPDATE ON public.chatbot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chatbot_conversation_updated_at();

-- 5. RPC: Salvar/atualizar conversa (UPSERT por session_id)
CREATE OR REPLACE FUNCTION public.save_chatbot_conversation(payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_session_id TEXT;
    v_result JSONB;
BEGIN
    v_session_id := payload->>'session_id';
    
    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'session_id is required';
    END IF;

    INSERT INTO public.chatbot_conversations (
        session_id,
        nome,
        telefone,
        historico_conversa,
        dados_coletados,
        status,
        dispositivo
    )
    VALUES (
        v_session_id,
        payload->>'nome',
        payload->>'telefone',
        COALESCE((payload->'historico_conversa')::jsonb, '[]'::jsonb),
        COALESCE((payload->'dados_coletados')::jsonb, '{}'::jsonb),
        COALESCE(payload->>'status', 'em_andamento'),
        payload->>'dispositivo'
    )
    ON CONFLICT (session_id) DO UPDATE SET
        nome = COALESCE(EXCLUDED.nome, chatbot_conversations.nome),
        telefone = COALESCE(EXCLUDED.telefone, chatbot_conversations.telefone),
        historico_conversa = EXCLUDED.historico_conversa,
        dados_coletados = EXCLUDED.dados_coletados,
        status = EXCLUDED.status,
        updated_at = NOW()
    RETURNING to_jsonb(chatbot_conversations.*) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Buscar conversa por session_id
CREATE OR REPLACE FUNCTION public.get_conversation_by_session_id(sid TEXT)
RETURNS TABLE (
    id UUID,
    session_id TEXT,
    nome TEXT,
    telefone TEXT,
    historico_conversa JSONB,
    dados_coletados JSONB,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.session_id,
        c.nome,
        c.telefone,
        c.historico_conversa,
        c.dados_coletados,
        c.status,
        c.created_at,
        c.updated_at
    FROM public.chatbot_conversations c
    WHERE c.session_id = sid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Buscar conversa por telefone (para recuperação cross-device)
CREATE OR REPLACE FUNCTION public.get_conversation_by_phone(phone_number TEXT)
RETURNS TABLE (
    id UUID,
    session_id TEXT,
    nome TEXT,
    telefone TEXT,
    historico_conversa JSONB,
    dados_coletados JSONB,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.session_id,
        c.nome,
        c.telefone,
        c.historico_conversa,
        c.dados_coletados,
        c.status,
        c.created_at,
        c.updated_at
    FROM public.chatbot_conversations c
    WHERE c.telefone = phone_number
      AND c.status != 'arquivado'
    ORDER BY c.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Remover políticas permissivas antigas e restringir acesso direto
-- (As RPCs com SECURITY DEFINER bypam RLS, então podemos negar acesso direto)
DROP POLICY IF EXISTS "Conversations: select by agent or admin" ON public.chatbot_conversations;

-- Política que permite leitura apenas para admins autenticados (dashboard)
CREATE POLICY "Conversations: admin only select"
ON public.chatbot_conversations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = chatbot_conversations.lead_id
      AND l.agent_id = auth.uid()
  )
);

-- Permitir inserção/update apenas via SECURITY DEFINER functions
-- (O anon role não tem acesso direto, mas as RPCs funcionam)
