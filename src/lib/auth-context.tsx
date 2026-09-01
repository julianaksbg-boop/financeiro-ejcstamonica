import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppPermission } from "@/lib/permissoes";

export type AppRole = "admin" | "viewer";
export type UserStatus = "pending" | "active" | "blocked";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  status: UserStatus;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

interface ProfileAndRoleResult {
  profile: Profile | null;
  role: AppRole | null;
  permissions: AppPermission[];
  error: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  permissions: AppPermission[];
  hasPermission: (permission: AppPermission) => boolean;
  loading: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  isActive: boolean;
  profileLoaded: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfileAndRole(userId: string): Promise<ProfileAndRoleResult> {
  const [{ data: p, error: profileError }, { data: r, error: roleError }, { data: perms }] = await Promise.all([
    supabase.from("profiles").select("id,email,full_name,status,approved_at,approved_by,created_at").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).order("role", { ascending: true }),
    supabase.from("user_permissions").select("permission").eq("user_id", userId),
  ]);
  // If user has admin role, prefer admin
  const roles = (r ?? []).map((x) => x.role as AppRole);
  const role: AppRole | null = roles.includes("admin") ? "admin" : roles.includes("viewer") ? "viewer" : null;
  return {
    profile: (p as Profile | null) ?? null,
    role,
    permissions: (perms ?? []).map((x) => x.permission as AppPermission),
    error: profileError?.message ?? roleError?.message ?? null,
  };
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    setProfileLoaded(false);
    setProfileError(null);
    if (s?.user) {
      const { profile: p, role: r, error } = await loadProfileAndRole(s.user.id);
      setProfile(p);
      setRole(r);
      setProfileError(error);
      setProfileLoaded(true);
    } else {
      setProfile(null);
      setRole(null);
      setProfileLoaded(true);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      // defer to avoid deadlocks
      setTimeout(() => { void hydrate(s); }, 0);
    });
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      await hydrate(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    setProfileLoaded(false);
    const { profile: p, role: r, error } = await loadProfileAndRole(user.id);
    setProfile(p);
    setRole(r);
    setProfileError(error);
    setProfileLoaded(true);
  };

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = role === "admin";
  const isViewer = role === "viewer";
  const isActive = profile?.status === "active";

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, isAdmin, isViewer, isActive, profileLoaded, profileError, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
