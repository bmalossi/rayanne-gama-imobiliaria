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
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            syncSessionState(nextSession);
        });

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
