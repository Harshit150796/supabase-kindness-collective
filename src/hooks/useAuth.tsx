import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { clearAllDrafts, clearAnonymousDrafts } from '@/lib/draftStorage';

type AppRole = 'admin' | 'donor' | 'recipient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  rolesLoaded: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  // Track previous user ID to detect user changes
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  // Roles belong to a user. Token refreshes for the same user keep them: refetching on
  // every auth event flashed role-gated pages back to "Loading…" about once an hour.
  const rolesForRef = useRef<string | null>(null);

  const loadRoles = useCallback(async (userId: string) => {
    if (rolesForRef.current === userId) return;
    rolesForRef.current = userId;
    setRolesLoaded(false);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (rolesForRef.current !== userId) return; // someone else signed in meanwhile
    if (error) rolesForRef.current = null; // let the next auth event retry
    setRoles(!error && data ? data.map((r) => r.role as AppRole) : []);
    setRolesLoaded(true);
  }, []);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setUser(next?.user ?? null);
    if (next?.user) {
      const id = next.user.id;
      // Deferred: Supabase must not be called from inside its own auth callback.
      setTimeout(() => { void loadRoles(id); }, 0);
    } else {
      rolesForRef.current = null;
      setRoles([]);
      setRolesLoaded(true);
    }
    setLoading(false);
  }, [loadRoles]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        const newUserId = nextSession?.user?.id ?? null;
        const prevUserId = prevUserIdRef.current;

        // Signed out (here, in another tab, or by an expired session): drop drafts and
        // every cached query so the next person on this device sees none of it.
        if (event === 'SIGNED_OUT') {
          clearAllDrafts();
          queryClient.clear();
        }

        // Detect user change (different user signed in)
        if (prevUserId !== undefined && prevUserId !== null && newUserId !== null && prevUserId !== newUserId) {
          clearAnonymousDrafts();
          queryClient.clear();
        }

        prevUserIdRef.current = newUserId;
        applySession(nextSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      if (prevUserIdRef.current === undefined) prevUserIdRef.current = current?.user?.id ?? null;
      applySession(current);
    });

    return () => subscription.unsubscribe();
  }, [applySession, queryClient]);

  // One generic account: every user can both give and receive. Roles are
  // capabilities, not account types, so both are always written.
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (!error && data.user) {
      await supabase.from('user_roles').insert([
        { user_id: data.user.id, role: 'donor' as AppRole },
        { user_id: data.user.id, role: 'recipient' as AppRole },
      ]);

      const cardNumber = `CD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await supabase.from('loyalty_cards').insert({
        user_id: data.user.id,
        card_number: cardNumber
      });
    }

    return { error: error as Error | null, user: data?.user };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error: error as Error | null };
  }, []);

  // Always signs this device out, even offline or with a broken stored session:
  // Supabase keeps the session when its logout request fails, which left people
  // "signed out" on screen but still signed in.
  const signOut = useCallback(async () => {
    // This device only; other phones and laptops stay signed in.
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      const auth = supabase.auth as unknown as { storage?: { removeItem(key: string): unknown }; storageKey?: string };
      try {
        if (auth.storage && auth.storageKey) await auth.storage.removeItem(auth.storageKey);
      } catch {
        /* storage unavailable */
      }
      // With nothing stored this only clears memory and announces SIGNED_OUT.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    }
    prevUserIdRef.current = null;
    applySession(null);
    clearAllDrafts();
    queryClient.clear();
  }, [applySession, queryClient]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const value = useMemo(
    () => ({ user, session, loading, roles, rolesLoaded, signUp, signIn, signOut, hasRole }),
    [user, session, loading, roles, rolesLoaded, signUp, signIn, signOut, hasRole],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  // During ErrorBoundary recovery, context might briefly be undefined
  // Return a safe "loading" state instead of throwing
  if (context === undefined) {
    return {
      user: null,
      session: null,
      loading: true,
      roles: [] as AppRole[],
      rolesLoaded: false,
      signUp: async () => ({ error: new Error('Auth not ready') as Error }),
      signIn: async () => ({ error: new Error('Auth not ready') as Error }),
      signOut: async () => {},
      hasRole: () => false,
    };
  }

  return context;
}
