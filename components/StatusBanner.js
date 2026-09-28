'use client';
import { useSiteSettings } from './SiteThemeProvider';

export default function StatusBanner() {
  const settings = useSiteSettings();
  if (!settings || !settings.status_active || !settings.status_message) return null;

  return (
    <div className="w-full text-center text-sm py-2 px-4 bg-accent text-white sticky top-0 z-50">
      {settings.status_message}
    </div>
  );
}
