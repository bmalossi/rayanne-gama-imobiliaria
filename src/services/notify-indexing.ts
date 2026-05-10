/**
 * notify-indexing.ts
 *
 * Chama a Supabase Edge Function `notify-indexing` para notificar
 * Google e Bing sempre que uma URL de imóvel for criada/atualizada.
 *
 * As credenciais sensíveis (Google private_key) ficam exclusivamente
 * no servidor Supabase — nunca expostas no bundle do browser.
 *
 * Uso:
 *   import { notifyIndexing } from "@/services/notify-indexing";
 *   await notifyIndexing("https://rayannegamaimoveis.com.br/imoveis/praia-grande/casa-3q-abc123");
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Envia a URL para indexação no Google e no Bing via Edge Function.
 * Erros são logados como avisos e nunca propagados — o fluxo de
 * cadastro não é bloqueado por falhas de indexação.
 */
export async function notifyIndexing(url: string): Promise<void> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn("[notifyIndexing] Supabase não configurado. Pulando.");
        return;
    }

    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-indexing`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ url }),
        });

        if (!res.ok) {
            console.warn(`[notifyIndexing] Edge Function retornou (${res.status}): ${await res.text()}`);
        } else {
            console.info(`[notifyIndexing] URL enviada para indexação: ${url}`);
        }
    } catch (err) {
        console.warn("[notifyIndexing] Erro ao chamar Edge Function:", err);
    }
}
