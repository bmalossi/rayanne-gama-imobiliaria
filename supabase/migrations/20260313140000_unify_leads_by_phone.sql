-- =============================================================================
-- Migração: Unificação de Leads por Telefone (Normalização)
-- =============================================================================

-- 1. Criar índice funcional para busca ultra-rápida por telefone normalizado
CREATE INDEX IF NOT EXISTS idx_leads_normalized_phone 
ON public.leads ((regexp_replace(phone, '\D', '', 'g')));

-- 2. Atualizar a RPC para garantir unicidade e unificação
CREATE OR REPLACE FUNCTION public.save_chatbot_conversation(payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_session_id TEXT;
    v_nome TEXT;
    v_telefone TEXT;
    v_clean_telefone TEXT := '';
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

    -- Normalizar telefone do payload (apenas dígitos)
    IF v_telefone IS NOT NULL THEN
        v_clean_telefone := regexp_replace(v_telefone, '\D', '', 'g');
    END IF;

    -- Formatar o histórico para o campo notas do CRM
    FOR v_msg IN SELECT * FROM jsonb_to_recordset(v_history) AS x(role TEXT, content TEXT, timestamp TEXT)
    LOOP
        v_formatted_history := v_formatted_history || 
                               '[' || COALESCE(v_msg.timestamp, '') || '] ' || 
                               (CASE WHEN v_msg.role = 'bot' THEN 'IA' ELSE 'Cliente' END) || ': ' || 
                               v_msg.content || E'\n';
    END LOOP;

    -- 1. Buscar lead_id existente na sessão atual (já vinculado anteriormente)
    SELECT lead_id INTO v_lead_id FROM public.chatbot_conversations WHERE session_id = v_session_id;

    -- 2. Se não estiver vinculado via sessão, buscar por telefone normalizado
    -- Isso garante a UNIFICAÇÃO mesmo que o telefone venha com formatos diferentes
    IF v_lead_id IS NULL AND v_clean_telefone != '' THEN
        SELECT id INTO v_lead_id 
        FROM public.leads 
        WHERE regexp_replace(phone, '\D', '', 'g') = v_clean_telefone 
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;

    -- 3. Se ainda não houver lead e tivermos nome/telefone, criamos um NOVO lead (Novo Cliente)
    IF v_lead_id IS NULL AND v_nome IS NOT NULL AND v_clean_telefone != '' THEN
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
            v_telefone, -- Salvamos o original formatado se vier
            'chatbot@automa.ai',
            'Novo',
            v_agent_id,
            v_formatted_history
        ) RETURNING id INTO v_lead_id;
    END IF;

    -- 4. Se encontrou ou criou um Lead, atualizamos os dados (Unificação em Tempo Real)
    IF v_lead_id IS NOT NULL THEN
        UPDATE public.leads 
        SET 
            notes = v_formatted_history,
            -- Atualiza o nome apenas se não tiver um nome salvo ou se o novo vier preenchido
            name = COALESCE(v_nome, name)
        WHERE id = v_lead_id;
    END IF;

    -- 5. UPSERT na tabela de sessões do chatbot para manter o vínculo
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
