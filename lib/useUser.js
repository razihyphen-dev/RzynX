'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(sessionUser) {
      if (!sessionUser) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
      if (mounted) {
        setUser(sessionUser);
        setProfile(data);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => loadProfile(session?.user || null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user || null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
