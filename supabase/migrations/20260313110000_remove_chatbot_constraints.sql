-- =============================================================================
-- Migração: Remover constraints NOT NULL antigas da tabela de conversas
-- =============================================================================

-- Remover restrições de NOT NULL das colunas antigas (role, content)
-- A nova arquitetura usa historico_conversa JSONB, e as colunas antigas ficam vazias
ALTER TABLE public.chatbot_conversations
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN content DROP NOT NULL;
