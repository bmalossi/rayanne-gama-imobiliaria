-- Dados privados por imóvel (não públicos)
CREATE TABLE IF NOT EXISTS public.property_private_details (
  property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  owner_keys TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_private_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property private: select own or admin"
ON public.property_private_details
FOR SELECT
USING (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Property private: insert own or admin"
ON public.property_private_details
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    auth.uid() = agent_id
    AND EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.id = property_private_details.property_id
        AND p.agent_id = auth.uid()
    )
  )
);

CREATE POLICY "Property private: update own or admin"
ON public.property_private_details
FOR UPDATE
USING (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Property private: delete own or admin"
ON public.property_private_details
FOR DELETE
USING (auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_property_private_details_updated_at
BEFORE UPDATE ON public.property_private_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migração de dados antigos (quando salvo no campo público description)
WITH extracted AS (
  SELECT
    p.id AS property_id,
    p.agent_id,
    NULLIF(TRIM((regexp_match(p.description, E'Dono\\(s\\) e chaves:\\s*([^\\n\\r]*)'))[1]), '') AS owner_keys
  FROM public.properties p
  WHERE p.description IS NOT NULL
    AND p.description ~ E'Dono\\(s\\) e chaves:'
)
INSERT INTO public.property_private_details (property_id, agent_id, owner_keys)
SELECT property_id, agent_id, owner_keys
FROM extracted
ON CONFLICT (property_id) DO UPDATE
SET owner_keys = COALESCE(EXCLUDED.owner_keys, public.property_private_details.owner_keys),
    agent_id = EXCLUDED.agent_id,
    updated_at = now();

-- Remove a linha sensível da descrição pública
UPDATE public.properties
SET description = NULLIF(
  TRIM(BOTH E'\n' FROM regexp_replace(description, E'\n?Dono\\(s\\) e chaves:\\s*[^\\n\\r]*', '', 'g')),
  ''
)
WHERE description IS NOT NULL
  AND description ~ E'Dono\\(s\\) e chaves:';