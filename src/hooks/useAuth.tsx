import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'donor' | 'recipient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  rolesLoaded: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole, additionalRoles?: AppRole[]) => Promise<{ error: Error | null; user?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const fetchUserRoles = async (userId: string) => {
    setRolesLoaded(false);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (!error && data) {
      setRoles(data.map(r => r.role as AppRole));
    }
    setRolesLoaded(true);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setRolesLoaded(true);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: AppRole,
    additionalRoles?: AppRole[]
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
      // Add primary user role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: role
      });

      // Add additional roles if provided
      if (additionalRoles && additionalRoles.length > 0) {
        const additionalInserts = additionalRoles
          .filter(r => r !== role) // Avoid duplicates
          .map(r => ({
            user_id: data.user.id,
            role: r
          }));
        
        if (additionalInserts.length > 0) {
          await supabase.from('user_roles').insert(additionalInserts);
        }
      }

      // Create loyalty card for recipients
      const hasRecipientRole = role === 'recipient' || additionalRoles?.includes('recipient');
      if (hasRecipientRole) {
        const cardNumber = `CD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await supabase.from('loyalty_cards').insert({
          user_id: data.user.id,
          card_number: cardNumber
        });
      }
    }

    return { error: error as Error | null, user: data?.user };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setRolesLoaded(false);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, rolesLoaded, signUp, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
