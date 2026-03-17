import { supabase, isSupabaseConfigured } from "@/services/supabase";

export async function fetchDashboardStats(userId: string, isAdmin: boolean) {
    if (!isSupabaseConfigured) return null;

    // Constrói queries básicas
    let propertiesQuery = supabase.from("properties").select("*", { count: "exact", head: true });
    let activePropertiesQuery = supabase.from("properties").select("*", { count: "exact", head: true }).eq("active", true);
    let leadsQuery = supabase.from("leads").select("*", { count: "exact", head: true });
    let newLeads7dQuery = supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Se não for admin, filtra apenas os dados do próprio agente
    if (!isAdmin) {
        propertiesQuery = propertiesQuery.eq("agent_id", userId);
        activePropertiesQuery = activePropertiesQuery.eq("agent_id", userId);
        leadsQuery = leadsQuery.eq("agent_id", userId);
        newLeads7dQuery = newLeads7dQuery.eq("agent_id", userId);
    }

    const [
        { count: propertiesCount },
        { count: activeProperties },
        { count: leadsCount },
        { count: newLeads7d }
    ] = await Promise.all([
        propertiesQuery,
        activePropertiesQuery,
        leadsQuery,
        newLeads7dQuery
    ]);

    return {
        propertiesCount: propertiesCount ?? 0,
        activeProperties: activeProperties ?? 0,
        leadsCount: leadsCount ?? 0,
        newLeads7d: newLeads7d ?? 0,
    };
}

export async function fetchRecentLeads(userId: string, isAdmin: boolean) {
    if (!isSupabaseConfigured) return [];

    let query = supabase
        .from("leads")
        .select("*, properties(title)")
        .order("created_at", { ascending: false })
        .limit(5);

    if (!isAdmin) query = query.eq("agent_id", userId);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((lead: { properties?: unknown;[key: string]: unknown }) => ({
        ...lead,
        property: Array.isArray(lead.properties) ? lead.properties[0] : lead.properties,
    }));
}
