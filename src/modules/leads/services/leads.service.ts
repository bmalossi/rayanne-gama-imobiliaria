import { supabase, isSupabaseConfigured } from "@/services/supabase";
import type { Lead, LeadStatus } from "@/types/domain";

export type LeadFilters = {
    search?: string;
    status?: string;
    propertyId?: string;
    dateStart?: string;
    dateEnd?: string;
    agentId?: string;
};

export type LeadPayload = {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    notes?: string;
    property_id?: string;
    status?: LeadStatus;
    agent_id?: string;
};

function normalizeLead(lead: { properties?: unknown;[key: string]: unknown }): Lead {
    const relatedProperty = Array.isArray(lead.properties) ? lead.properties[0] : lead.properties;
    return {
        ...lead,
        property: relatedProperty ?? undefined,
        properties: relatedProperty ?? undefined,
    } as Lead;
}

export async function createLead(payload: {
    agent_id?: string;
    property_id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
}) {
    if (!isSupabaseConfigured) return;

    // Obtém o corretor pela roleta (RPC). Se falhar, faz fallback para o agent_id do imóvel.
    let finalAgentId = payload.agent_id;
    const { data: nextAgentId, error: rpcError } = await supabase.rpc("get_next_lead_agent" as any);

    if (!rpcError && nextAgentId) {
        finalAgentId = nextAgentId as string;
    }

    if (!finalAgentId) {
        throw new Error("Não foi possível determinar o corretor para este lead.");
    }

    const { error } = await supabase.from("leads").insert({
        ...payload,
        agent_id: finalAgentId,
        status: "Novo" as LeadStatus,
        source: "site"
    });
    if (error) throw error;
}

export async function fetchDashboardLeads(userId: string, isAdmin: boolean, filters?: LeadFilters) {
    if (!isSupabaseConfigured) return [] as Lead[];

    let query = supabase
        .from("leads")
        .select("id, agent_id, property_id, name, email, phone, message, notes, status, created_at, properties(id, title, city, transaction), agent:profiles(full_name)")
        .order("created_at", { ascending: false });

    if (!isAdmin) query = query.eq("agent_id", userId);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
    if (filters?.agentId) query = query.eq("agent_id", filters.agentId);
    if (filters?.dateStart) query = query.gte("created_at", filters.dateStart);
    if (filters?.dateEnd) query = query.lte("created_at", filters.dateEnd);
    if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(normalizeLead);
}

export async function createManualLead(userId: string, payload: LeadPayload) {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured");

    if (!payload.name || !payload.email || !payload.phone || !payload.property_id) {
        throw new Error("Preencha nome, e-mail, telefone e imóvel do lead.");
    }

    const { data, error } = await supabase
        .from("leads")
        .insert({
            agent_id: userId,
            property_id: payload.property_id,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            message: payload.message || null,
            notes: payload.notes || null,
            status: payload.status ?? "Novo",
        })
        .select("*")
        .single();

    if (error) throw error;
    return data as Lead;
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
    const { data, error } = await supabase.from("leads").update({ status }).eq("id", leadId).select("*").single();
    if (error) throw error;
    return data as Lead;
}

export async function updateLead(leadId: string, payload: Partial<LeadPayload>) {
    const { data, error } = await supabase
        .from("leads")
        .update({
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            message: payload.message ?? null,
            notes: payload.notes ?? null,
            status: payload.status,
            property_id: payload.property_id,
            agent_id: payload.agent_id,
        })
        .eq("id", leadId)
        .select("*")
        .single();

    if (error) throw error;
    return data as Lead;
}

export async function deleteLead(leadId: string) {
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) throw error;
}
