import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error('Failed to fetch auth session', error.message);
      } else {
        setSession(data.session ?? null);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const role = useMemo<string | null>(() => {
    const appMetaRole = session?.user?.app_metadata?.role;
    if (typeof appMetaRole === 'string') {
      return appMetaRole;
    }

    const userMetaRole = session?.user?.user_metadata?.role;
    if (typeof userMetaRole === 'string') {
      return userMetaRole;
    }

    return null;
  }, [session]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    role,
    loading,
    signInWithPassword: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ?? null;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Failed to sign out', error.message);
      }
    },
  }), [loading, role, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
