import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://rayannegamaimoveis.com.br";

function slugify(text: string): string {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

function generatePropertyUrl(property: { id: string; title: string; city?: string | null }) {
    const citySlug = property.city ? slugify(property.city) : "imovel";
    const titleSlug = slugify(property.title);
    return `${SITE_URL}/imoveis/${citySlug}/${titleSlug}-${property.id}`;
}

function toW3CDate(dateStr: string): string {
    return new Date(dateStr).toISOString().split("T")[0];
}

Deno.serve(async () => {
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, city, updated_at")
        .eq("active", true)
        .order("updated_at", { ascending: false });

    if (error) {
        return new Response(`Erro ao buscar imóveis: ${error.message}`, { status: 500 });
    }

    const today = new Date().toISOString().split("T")[0];

    const staticPages = [
        { loc: SITE_URL, lastmod: today, changefreq: "weekly", priority: "1.0" },
        { loc: `${SITE_URL}/imoveis`, lastmod: today, changefreq: "daily", priority: "0.9" },
    ];

    const staticUrlsXml = staticPages
        .map(
            (p) =>
                `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
        )
        .join("\n");

    const propertyUrlsXml = (properties ?? [])
        .map((p) => {
            const loc = generatePropertyUrl(p);
            const lastmod = p.updated_at ? toW3CDate(p.updated_at) : today;
            return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
        })
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrlsXml}
${propertyUrlsXml}
</urlset>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
});
