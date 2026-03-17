export const config = {
    openai: {
        apiKey: Deno.env.get("OPENAI_API_KEY") || "",
        model: "gpt-4o-mini",
    },
    app: {
        name: "Rayanne Gama Imóveis - IA",
        baseUrl: Deno.env.get("PUBLIC_APP_URL") || "http://localhost:5173",
    },
};
