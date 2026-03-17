-- Adiciona controle de destaque nos imóveis
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Garante no máximo 3 imóveis em destaque por corretor
CREATE OR REPLACE FUNCTION public.enforce_featured_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  featured_count integer;
BEGIN
  IF NEW.featured IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  -- Só valida quando estiver ligando destaque (insert ou update de false->true)
  IF TG_OP = 'UPDATE' AND OLD.featured IS TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO featured_count
  FROM public.properties p
  WHERE p.agent_id = NEW.agent_id
    AND p.featured = TRUE
    AND p.id <> NEW.id;

  IF featured_count >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 imóveis em destaque atingido';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_featured_limit ON public.properties;

CREATE TRIGGER trg_enforce_featured_limit
BEFORE INSERT OR UPDATE OF featured ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.enforce_featured_limit();