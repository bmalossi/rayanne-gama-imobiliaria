export function slugify(text: string): string {
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

export function generatePropertyUrl(property: { id: string; title: string; city?: string | null }) {
    const citySlug = property.city ? slugify(property.city) : "imovel";
    const titleSlug = slugify(property.title);
    return `/imoveis/${citySlug}/${titleSlug}-${property.id}`;
}

export function extractIdFromSlug(slug?: string): string {
    if (!slug) return "";
    // Assuming the UUID is always at the end: 36 characters
    return slug.length > 36 ? slug.slice(-36) : slug;
}
