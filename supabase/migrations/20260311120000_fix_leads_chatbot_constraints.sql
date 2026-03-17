-- =============================================================================
-- Migração: Corrige constraints da tabela leads para suportar leads do chatbot
-- =============================================================================
-- A migração anterior (20260311110000) relaxou a RLS policy, mas NÃO alterou
-- as constraints NOT NULL das colunas property_id e agent_id.
-- A Edge Function chatbot-ai insere leads SEM property_id e potencialmente
-- SEM agent_id, o que causava falha silenciosa na criação do lead.
-- =============================================================================

-- 1. Torna property_id nullable (leads do chatbot não têm imóvel associado)
ALTER TABLE public.leads
  ALTER COLUMN property_id DROP NOT NULL;

-- 2. Torna agent_id nullable (pode não haver corretor padrão configurado)
ALTER TABLE public.leads
  ALTER COLUMN agent_id DROP NOT NULL;

-- 3. Adiciona coluna notes (referenciada no código mas nunca criada no schema)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS notes TEXT;
