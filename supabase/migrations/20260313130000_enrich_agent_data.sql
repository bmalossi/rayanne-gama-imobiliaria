-- =============================================================================
-- Migração: Enriquecer retorno da conversa com dados do Lead e Agente
-- =============================================================================

-- Remover funções existentes para permitir a mudança na estrutura do retorno (RETURNS TABLE)
DROP FUNCTION IF EXISTS public.get_conversation_by_session_id(TEXT);
DROP FUNCTION IF EXISTS public.get_conversation_by_phone(TEXT);

-- Atualizar RPC de busca por session_id para incluir dados do agente
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
    updated_at TIMESTAMPTZ,
    lead_id UUID,
    agent_name TEXT,
    agent_phone TEXT
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
        c.updated_at,
        c.lead_id,
        p.full_name AS agent_name,
        p.phone AS agent_phone
    FROM public.chatbot_conversations c
    LEFT JOIN public.leads l ON l.id = c.lead_id
    LEFT JOIN public.profiles p ON p.id = l.agent_id
    WHERE c.session_id = sid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar RPC de busca por telefone para incluir dados do agente
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
    updated_at TIMESTAMPTZ,
    lead_id UUID,
    agent_name TEXT,
    agent_phone TEXT
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
        c.updated_at,
        c.lead_id,
        p.full_name AS agent_name,
        p.phone AS agent_phone
    FROM public.chatbot_conversations c
    LEFT JOIN public.leads l ON l.id = c.lead_id
    LEFT JOIN public.profiles p ON p.id = l.agent_id
    WHERE c.telefone = phone_number
      AND c.status != 'arquivado'
    ORDER BY c.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar save_chatbot_conversation para também retornar os dados do agente após o upsert
-- (Esta função retorna JSONB, então o REPLACE costuma funcionar, mas garantimos aqui)
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
    v_session_id := payload->>'session_id';
    v_nome := payload->>'nome';
    v_telefone := payload->>'telefone';
    v_history := COALESCE((payload->'historico_conversa')::jsonb, '[]'::jsonb);
    
    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'session_id is required';
    END IF;

    FOR v_msg IN SELECT * FROM jsonb_to_recordset(v_history) AS x(role TEXT, content TEXT, timestamp TEXT)
    LOOP
        v_formatted_history := v_formatted_history || 
                               '[' || COALESCE(v_msg.timestamp, '') || '] ' || 
                               (CASE WHEN v_msg.role = 'bot' THEN 'IA' ELSE 'Cliente' END) || ': ' || 
                               v_msg.content || E'\n';
    END LOOP;

    SELECT lead_id INTO v_lead_id FROM public.chatbot_conversations WHERE session_id = v_session_id;

    IF v_lead_id IS NULL AND v_telefone IS NOT NULL THEN
        SELECT id INTO v_lead_id FROM public.leads WHERE phone = v_telefone ORDER BY created_at DESC LIMIT 1;
    END IF;

    IF v_lead_id IS NULL AND v_nome IS NOT NULL AND v_telefone IS NOT NULL THEN
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
            'chatbot@automa.ai',
            'Novo',
            v_agent_id,
            v_formatted_history
        ) RETURNING id INTO v_lead_id;
    END IF;

    IF v_lead_id IS NOT NULL THEN
        UPDATE public.leads 
        SET 
            notes = v_formatted_history,
            name = COALESCE(v_nome, name)
        WHERE id = v_lead_id;
    END IF;

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
    RETURNING (
        SELECT to_jsonb(sub) FROM (
            SELECT 
                chatbot_conversations.*,
                p.full_name AS agent_name,
                p.phone AS agent_phone
            FROM public.chatbot_conversations
            LEFT JOIN public.leads l ON l.id = chatbot_conversations.lead_id
            LEFT JOIN public.profiles p ON p.id = l.agent_id
            WHERE chatbot_conversations.session_id = v_session_id
        ) sub
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
