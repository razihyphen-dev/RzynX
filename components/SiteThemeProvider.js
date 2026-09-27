'use client';
import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SiteSettingsContext = createContext(null);
export const useSiteSettings = () => useContext(SiteSettingsContext);

export default function SiteThemeProvider({ children }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let channel;

    async function load() {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
      if (data) applySettings(data);
    }

    function applySettings(data) {
      setSettings(data);
      document.documentElement.style.setProperty('--site-bg', data.background_css);
      document.documentElement.style.setProperty('--site-accent', data.accent_color);
    }

    load();

    channel = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload) => {
        applySettings(payload.new);
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}
