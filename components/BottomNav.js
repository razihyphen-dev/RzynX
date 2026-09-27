'use client';
import Link from 'next/link';
import { useUser } from '@/lib/useUser';

export default function BottomNav() {
  const { user, profile } = useUser();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base/95 backdrop-blur border-t border-border flex justify-around py-2 safe-bottom">
      <Link href="/" className="px-4 py-2 text-lg">🏠</Link>
      {user ? (
        <>
          <Link href="/messages" className="px-4 py-2 text-lg">✉️</Link>
          <Link href={`/profile/${profile?.username || ''}`} className="px-4 py-2 text-lg">👤</Link>
          {profile?.is_admin && <Link href="/admin" className="px-4 py-2 text-lg">🛠️</Link>}
        </>
      ) : (
        <Link href="/login" className="px-4 py-2 text-lg">🔑</Link>
      )}
    </nav>
  );
}
