import { supabase, isSupabaseConfigured } from "@/services/supabase";
import type { Profile, AppRole } from "@/types/domain";

export async function hydrateUser(userId: string) {
    const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    return {
        profile: (profile as Profile | null) ?? null,
        roles: (roles?.map((item) => item.role) ?? []) as AppRole[],
    };
}

export async function signUp(email: string, password: string, fullName: string) {
    return supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
        },
    });
}

export const signOut = async () => {
    await supabase.auth.signOut();
};

export async function deleteMyAccount() {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;
}
