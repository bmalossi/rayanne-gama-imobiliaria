-- =============================================================================
-- Migração: Suporte para Persistência e Memória do Chatbot
-- =============================================================================

-- 1. Torna o lead_id opcional (permite salvar conversas anônimas via session_id)
ALTER TABLE public.chatbot_conversations
  ALTER COLUMN lead_id DROP NOT NULL;

-- 2. Adiciona coluna session_id para rastreamento de visitantes anônimos
ALTER TABLE public.chatbot_conversations
  ADD COLUMN IF NOT EXISTS session_id UUID;

-- 3. Índice para busca rápida por sessão e tempo (usado na retenção de 7 dias)
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id
  ON public.chatbot_conversations (session_id, created_at);

-- 4. Comentário: A limpeza baseada em status (Vendido/Arquivado) será feita
-- via lógica de aplicação no ChatbotController, verificando o status do lead
-- associado à sessão antes de retornar o histórico.
