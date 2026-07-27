import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "lojista" | "consumer";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  displayName: string | null;
  loading: boolean;
  isAdmin: boolean;
  isLojista: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string | undefined) => {
    if (!uid) {
      setRoles([]);
      return;
    }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  const loadDisplayName = async (u: User | null | undefined) => {
    if (!u) {
      setDisplayName(null);
      return;
    }
    const fallback =
      u.user_metadata?.full_name ||
      u.user_metadata?.name ||
      u.email?.split("@")[0] ||
      null;
    const { data } = await supabase.from("profiles").select("full_name").eq("id", u.id).maybeSingle();
    setDisplayName(data?.full_name?.trim() || fallback);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // defer to avoid deadlocks
      setTimeout(() => {
        loadRoles(s?.user?.id);
        loadDisplayName(s?.user);
      }, 0);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      Promise.all([loadRoles(s?.user?.id), loadDisplayName(s?.user)]).finally(() =>
        setLoading(false),
      );
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    roles,
    displayName,
    loading,
    isAdmin: roles.includes("admin"),
    isLojista: roles.includes("lojista") || roles.includes("admin"),
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshRoles: () => loadRoles(user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
