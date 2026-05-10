/**
 * Supabase Edge Function: notify-indexing
 *
 * Recebe uma URL via POST e notifica:
 * - IndexNow (Bing/Yandex) usando INDEXNOW_KEY
 * - Google Indexing API usando GOOGLE_INDEXING_SA_EMAIL + GOOGLE_INDEXING_SA_PRIVATE_KEY
 *
 * As credenciais ficam APENAS no ambiente do Supabase (nunca expostas no frontend).
 *
 * Deploy:
 *   npx supabase functions deploy notify-indexing --no-verify-jwt
 *
 * Secrets necessários (set via Supabase Dashboard > Edge Functions > Secrets):
 *   INDEXNOW_KEY
 *   GOOGLE_INDEXING_SA_EMAIL
 *   GOOGLE_INDEXING_SA_PRIVATE_KEY
 */

const SITE_HOST = "rayannegamaimoveis.com.br";
const SITE_URL = `https://${SITE_HOST}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signJWT(payload: Record<string, unknown>, privateKeyPem: string): Promise<string> {
    const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const body = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${header}.${body}`;

    // Import the PEM private key
    const pemContents = privateKeyPem
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\s/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey.buffer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        new TextEncoder().encode(signingInput),
    );

    const signature = base64UrlEncode(
        String.fromCharCode(...new Uint8Array(signatureBuffer)),
    );

    return `${signingInput}.${signature}`;
}

// ─── IndexNow ────────────────────────────────────────────────────────────────

async function notifyIndexNow(url: string): Promise<void> {
    const key = Deno.env.get("INDEXNOW_KEY");
    if (!key) {
        console.warn("[IndexNow] INDEXNOW_KEY não definida. Pulando.");
        return;
    }

    const body = {
        host: SITE_HOST,
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList: [url],
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        console.warn(`[IndexNow] Falha (${res.status}): ${await res.text()}`);
    } else {
        console.info(`[IndexNow] Enviado: ${url}`);
    }
}

// ─── Google Indexing API ──────────────────────────────────────────────────────

async function notifyGoogle(url: string): Promise<void> {
    const email = Deno.env.get("GOOGLE_INDEXING_SA_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_INDEXING_SA_PRIVATE_KEY")?.replace(/\\n/g, "\n");

    if (!email || !privateKey) {
        console.warn("[Google Indexing] Credenciais não definidas. Pulando.");
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
        iss: email,
        sub: email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
        scope: "https://www.googleapis.com/auth/indexing",
    };

    const jwt = await signJWT(jwtPayload, privateKey);

    // Trocar JWT por access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!tokenRes.ok) {
        console.warn(`[Google Indexing] Falha ao obter token: ${await tokenRes.text()}`);
        return;
    }

    const { access_token } = await tokenRes.json();

    const indexRes = await fetch(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ url, type: "URL_UPDATED" }),
        },
    );

    if (!indexRes.ok) {
        console.warn(`[Google Indexing] Falha (${indexRes.status}): ${await indexRes.text()}`);
    } else {
        console.info(`[Google Indexing] Enviado: ${url}`);
    }
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    let url: string;
    try {
        const body = await req.json();
        url = body?.url;
        if (!url || typeof url !== "string") throw new Error("Campo 'url' obrigatório.");
    } catch (err) {
        return new Response(`Bad Request: ${(err as Error).message}`, { status: 400 });
    }

    const results = await Promise.allSettled([
        notifyIndexNow(url),
        notifyGoogle(url),
    ]);

    results.forEach((r) => {
        if (r.status === "rejected") {
            console.warn("[notify-indexing] Erro inesperado:", r.reason);
        }
    });

    return new Response(JSON.stringify({ ok: true, url }), {
        headers: { "Content-Type": "application/json" },
    });
});
