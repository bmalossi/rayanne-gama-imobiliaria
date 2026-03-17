import { supabase, isSupabaseConfigured } from "@/services/supabase";
import type { Profile } from "@/types/domain";

export async function fetchDashboardProfile(userId: string) {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return (data as Profile | null) ?? null;
}

export async function updateDashboardProfile(
    userId: string,
    payload: { full_name?: string; phone?: string; creci?: string; bio?: string; avatar_url: string | null },
) {
    const { data, error } = await supabase
        .from("profiles")
        .update({
            full_name: payload.full_name || null,
            phone: payload.phone || null,
            creci: payload.creci || null,
            bio: payload.bio || null,
            avatar_url: payload.avatar_url,
        })
        .eq("id", userId)
        .select("*")
        .single();

    if (error) throw error;
    return data as Profile;
}
