-- =============================================================================
-- Migração: Sincronização automática do Chatbot com o CRM (Leads)
-- =============================================================================

-- 1. Adicionar coluna lead_id à tabela chatbot_conversations se não existir
-- (Nota: Ela já existe no schema atual mas garantimos aqui)
ALTER TABLE public.chatbot_conversations
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id);

-- 2. Atualizar a RPC para incluir a lógica de sincronização com Leads
CREATE OR REPLACE FUNCTION public.save_chatbot_conversation(payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_session_id TEXT;
    v_nome TEXT;
    v_telefone TEXT;
    v_history JSONB;
    v_lead_id UUID;
    v_agent_id UUID;
    v_formatted_history TEXT := '';
    v_msg RECORD;
    v_result JSONB;
BEGIN
    -- Extração de dados do payload
    v_session_id := payload->>'session_id';
    v_nome := payload->>'nome';
    v_telefone := payload->>'telefone';
    v_history := COALESCE((payload->'historico_conversa')::jsonb, '[]'::jsonb);
    
    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'session_id is required';
    END IF;

    -- Formatar o histórico para o campo notas do CRM
    FOR v_msg IN SELECT * FROM jsonb_to_recordset(v_history) AS x(role TEXT, content TEXT, timestamp TEXT)
    LOOP
        v_formatted_history := v_formatted_history || 
                               '[' || COALESCE(v_msg.timestamp, '') || '] ' || 
                               (CASE WHEN v_msg.role = 'bot' THEN 'IA' ELSE 'Cliente' END) || ': ' || 
                               v_msg.content || E'\n';
    END LOOP;

    -- 1. Buscar lead_id existente na sessão atual
    SELECT lead_id INTO v_lead_id FROM public.chatbot_conversations WHERE session_id = v_session_id;

    -- 2. Se não tiver lead_id na conversa, tentar buscar por telefone
    IF v_lead_id IS NULL AND v_telefone IS NOT NULL THEN
        SELECT id INTO v_lead_id FROM public.leads WHERE phone = v_telefone ORDER BY created_at DESC LIMIT 1;
    END IF;

    -- 3. Se ainda não houver lead e tivermos nome/telefone, criamos um novo lead
    IF v_lead_id IS NULL AND v_nome IS NOT NULL AND v_telefone IS NOT NULL THEN
        -- Obter próximo agente da roleta
        v_agent_id := public.get_next_lead_agent();
        
        INSERT INTO public.leads (
            name,
            phone,
            email,
            status,
            agent_id,
            notes
        ) VALUES (
            v_nome,
            v_telefone,
            'chatbot@automa.ai', -- Placeholder conforme padrão anterior
            'Novo',
            v_agent_id,
            v_formatted_history
        ) RETURNING id INTO v_lead_id;
    END IF;

    -- 4. Se já existe um lead (seja recuperado ou criado agora), atualizamos suas notas
    IF v_lead_id IS NOT NULL THEN
        UPDATE public.leads 
        SET 
            notes = v_formatted_history,
            name = COALESCE(v_nome, name) -- Atualiza nome se fornecido
        WHERE id = v_lead_id;
    END IF;

    -- 5. UPSERT na tabela de conversas do chatbot
    INSERT INTO public.chatbot_conversations (
        session_id,
        lead_id,
        nome,
        telefone,
        historico_conversa,
        dados_coletados,
        status,
        dispositivo
    )
    VALUES (
        v_session_id,
        v_lead_id,
        v_nome,
        v_telefone,
        v_history,
        COALESCE((payload->'dados_coletados')::jsonb, '{}'::jsonb),
        COALESCE(payload->>'status', 'em_andamento'),
        payload->>'dispositivo'
    )
    ON CONFLICT (session_id) DO UPDATE SET
        lead_id = COALESCE(EXCLUDED.lead_id, chatbot_conversations.lead_id),
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
