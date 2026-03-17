-- Create chatbot_settings table
CREATE TABLE IF NOT EXISTS public.chatbot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN NOT NULL DEFAULT false,
    openai_key TEXT,
    system_prompt TEXT NOT NULL DEFAULT 'Você é Ray, assistente virtual da Rayanne Gama Imóveis. Seja cordial, elegante e objetiva. Entenda o que o cliente busca e sugira os imóveis mais compatíveis com base na lista fornecida. Nunca invente imóveis, nunca mencione dados de leads ou corretores, nunca prometa condições não descritas. Responda sempre em português brasileiro de forma concisa.',
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admins can view chatbot settings"
ON public.chatbot_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update settings
CREATE POLICY "Admins can update chatbot settings"
ON public.chatbot_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert settings (mostly for initial seed if needed)
CREATE POLICY "Admins can insert chatbot settings"
ON public.chatbot_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete settings
CREATE POLICY "Admins can delete chatbot settings"
ON public.chatbot_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_chatbot_settings_updated_at
BEFORE UPDATE ON public.chatbot_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial row if not exists
INSERT INTO public.chatbot_settings (is_active, model, system_prompt)
SELECT false, 'gpt-4o-mini', 'Você é Ray, assistente virtual da Rayanne Gama Imóveis. Seja cordial, elegante e objetiva. Entenda o que o cliente busca e sugira os imóveis mais compatíveis com base na lista fornecida. Nunca invente imóveis, nunca mencione dados de leads ou corretores, nunca prometa condições não descritas. Responda sempre em português brasileiro de forma concisa.'
WHERE NOT EXISTS (SELECT 1 FROM public.chatbot_settings);

-- Create a SECURITY DEFINER function to check if chatbot is active without exposing the table to public
CREATE OR REPLACE FUNCTION public.is_chatbot_active()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    active boolean;
BEGIN
    SELECT is_active INTO active FROM public.chatbot_settings LIMIT 1;
    RETURN COALESCE(active, false);
END;
$$;

-- Allow anyone (including anon) to execute the is_chatbot_active function
GRANT EXECUTE ON FUNCTION public.is_chatbot_active() TO public;
GRANT EXECUTE ON FUNCTION public.is_chatbot_active() TO anon;
GRANT EXECUTE ON FUNCTION public.is_chatbot_active() TO authenticated;
