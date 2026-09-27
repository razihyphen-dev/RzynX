'use client';
import Link from 'next/link';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import EnableNotifications from './EnableNotifications';

export default function Sidebar() {
  const { user, profile } = useUser();

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 px-3 py-4 justify-between">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-xl font-semibold px-3 py-2">X Clone</Link>
        <Link href="/" className="px-3 py-3 rounded-full hover:bg-surface text-lg">Home</Link>
        {user && (
          <>
            <Link href="/messages" className="px-3 py-3 rounded-full hover:bg-surface text-lg">Messages</Link>
            <Link href={`/profile/${profile?.username || ''}`} className="px-3 py-3 rounded-full hover:bg-surface text-lg">Profile</Link>
            {profile?.is_admin && (
              <Link href="/admin" className="px-3 py-3 rounded-full hover:bg-surface text-lg text-accent">Admin</Link>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {user && <EnableNotifications userId={user.id} />}
      <div className="px-3">
        {user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full text-left py-2 text-muted hover:text-ink"
          >
            Sign out ({profile?.username})
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <Link href="/login" className="text-center py-2 border border-border rounded-full hover:bg-surface">Log in</Link>
            <Link href="/signup" className="text-center py-2 bg-accent rounded-full font-medium">Sign up</Link>
          </div>
        )}
      </div>
      </div>
    </aside>
  );
}
