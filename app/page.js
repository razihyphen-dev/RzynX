'use client';
import { useUser } from '@/lib/useUser';
import PostComposer from '@/components/PostComposer';
import Feed from '@/components/Feed';

export default function HomePage() {
  const { user, profile, loading } = useUser();

  return (
    <div>
      <h1 className="text-xl font-semibold p-4 border-b border-border sticky top-0 bg-base/90 backdrop-blur z-10">
        Home
      </h1>
      {!loading && user && <PostComposer userId={user.id} onPosted={() => window.location.reload()} />}
      <Feed currentUser={user} profile={profile} />
    </div>
  );
}
