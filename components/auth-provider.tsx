'use client';

import React, { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useStore } from '@/lib/store/useStore';
import type { UserRole } from '@/lib/types';

/**
 * AuthProvider — wraps the app and keeps Zustand's currentUser in sync
 * with the Supabase Auth session. Listens for SIGNED_IN / SIGNED_OUT
 * events and restores the session on first load.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useStore((state) => state.setUser);
  const logoutUser = useStore((state) => state.logoutUser);
  const hydrateFromSupabase = useStore((state) => state.hydrateFromSupabase);
  const initialised = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    // Restore session on first load
    const restore = async () => {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const { data: profile } = await client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (profile) {
          setUser({
            id: profile.id,
            fullName: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            role: profile.role as UserRole,
            avatarUrl: profile.avatar_url,
            createdAt: profile.created_at,
          });
          // Hydrate store data from Supabase
          hydrateFromSupabase();
        } else {
          // Session exists but no profile — clear stale state
          logoutUser();
        }
      } else {
        // No active session — ensure Zustand is clean
        const storeUser = useStore.getState().currentUser;
        if (storeUser) {
          logoutUser();
        }
      }
      initialised.current = true;
    };

    restore();

    // Listen for auth state changes (login/logout from any tab)
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        // Skip the initial event during restore
        if (!initialised.current) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          logoutUser();
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) {
            setUser({
              id: profile.id,
              fullName: profile.full_name,
              email: profile.email,
              phone: profile.phone,
              role: profile.role as UserRole,
              avatarUrl: profile.avatar_url,
              createdAt: profile.created_at,
            });
            hydrateFromSupabase();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, logoutUser, hydrateFromSupabase]);

  return <>{children}</>;
}
