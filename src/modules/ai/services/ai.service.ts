import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

// Cliente específico para funções, sem sessão de usuário
const supabaseFunctions = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        storage: undefined,
    },
});

export async function getIntelligentDescription(propertyData: Record<string, unknown>) {
    const { data, error } = await supabaseFunctions.functions.invoke("intelligent-description", {
        body: { property: propertyData },
    });
    if (error) throw error;
    return data.description;
}

export async function askAI(
    messages: { role: string; content: string }[]
): Promise<{ answer: string }> {
    const { data, error } = await supabaseFunctions.functions.invoke("chatbot-ai", {
        body: { messages },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return {
        answer: data.reply
    };
}
