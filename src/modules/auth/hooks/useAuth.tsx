import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import type { AppRole, Profile } from "@/types/domain";
import * as authService from "../services/auth.service";

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    roles: AppRole[];
    isAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [roles, setRoles] = useState<AppRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        const syncSessionState = (nextSession: Session | null) => {
            setSession(nextSession);
            setUser(nextSession?.user ?? null);

            if (!nextSession?.user) {
                setProfile(null);
                setRoles([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            void authService.hydrateUser(nextSession.user.id)
                .then((hydrated) => {
                    setProfile(hydrated.profile);
                    setRoles(hydrated.roles);
                })
                .catch(() => {
                    setProfile(null);
                    setRoles([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, nextSession) => {
            syncSessionState(nextSession);

            // Redirecionamento para definição de senha (convite ou recuperação)
            const isInviteOrRecovery =
                event === "PASSWORD_RECOVERY" ||
                window.location.hash.includes("type=invite") ||
                window.location.hash.includes("type=recovery") ||
                window.location.search.includes("type=invite") ||
                window.location.search.includes("type=recovery");

            if (isInviteOrRecovery && window.location.pathname !== "/set-password") {
                console.log("Redirecionando para set-password (evento auth)...");
                window.location.href = `${window.location.origin}/set-password`;
            }
        });

        // Verificação imediata no mount (caso o hash já esteja presente)
        const hasTokenInUrl =
            window.location.hash.includes("type=invite") ||
            window.location.hash.includes("type=recovery") ||
            window.location.search.includes("type=invite") ||
            window.location.search.includes("type=recovery");

        if (hasTokenInUrl && window.location.pathname !== "/set-password") {
            setTimeout(() => {
                if (window.location.pathname !== "/set-password") {
                    console.log("Redirecionando para set-password (mount)...");
                    window.location.href = `${window.location.origin}/set-password`;
                }
            }, 500);
        }

        void supabase.auth
            .getSession()
            .then(({ data: sessionData }) => {
                syncSessionState(sessionData.session);
            })
            .catch(() => {
                setLoading(false);
            });

        return () => subscription.unsubscribe();
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            session,
            profile,
            roles,
            isAdmin: roles.includes("admin"),
            loading,
            signOut: authService.signOut,
        }),
        [user, session, profile, roles, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
    return context;
}
