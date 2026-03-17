import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { messages } = await req.json()

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Internal Configuration Error. Missing Supabase credentials.");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch chat settings
        const { data: settings, error: settingsError } = await supabase
            .from("chatbot_settings")
            .select("*")
            .single();

        if (settingsError || !settings) {
            throw new Error("Failed to load chatbot configuration.");
        }

        if (!settings.is_active) {
            return new Response(JSON.stringify({ reply: "No momento não estou disponível." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const openAiKey = settings.openai_key || Deno.env.get('OPENAI_API_KEY');

        if (!openAiKey) {
            throw new Error('OPENAI_API_KEY is not set')
        }

        const MODEL = settings.model || 'gpt-4o-mini'

        // Get properties to inject as context if needed
        const { data: properties } = await supabase
            .from("properties")
            .select("id, title, city, price, type, bedrooms, area")
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(10);

        let propertiesContext = "";
        if (properties && properties.length > 0) {
            const SITE_BASE_URL = "https://rayannegamaimoveis.com.br";
            const propertiesWithLinks = properties.map((p: any) => ({
                ...p,
                link: `${SITE_BASE_URL}/imovel/${p.id}`,
            }));
            propertiesContext = `\n\n## Imóveis Disponíveis (Ativos)\n${JSON.stringify(propertiesWithLinks, null, 1)}`;
        }

        // Add gate instructions based on context, just like we did before but simplified
        // The frontend will ensure the prompt makes sense
        const systemPrompt = settings.system_prompt + "\n\n" + propertiesContext;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.map((m: any) => ({
                        role: m.role === 'bot' ? 'assistant' : m.role,
                        content: m.content
                    }))
                ],
                temperature: 0.7,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('OpenAI API Error:', errorData)
            throw new Error(`OpenAI API failed: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()

        if (!data.choices || data.choices.length === 0) {
            throw new Error('OpenAI returned no choices')
        }

        const reply = data.choices[0].message.content

        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error: any) {
        console.error('Error in chatbot-ai function:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
