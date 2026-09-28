'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import PostComposer from '@/components/PostComposer';
import PostCard from '@/components/PostCard';
import Feed from '@/components/Feed';

export default function StatusPage({ params }) {
  const { id } = params;
  const { user, profile } = useUser();
  const [post, setPost] = useState(null);

  useEffect(() => {
    supabase.from('feed_posts').select('*').eq('id', id).single().then(({ data }) => setPost(data));
  }, [id]);

  if (!post) return <p className="p-6 text-muted text-center">Loading…</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold p-4 border-b border-border sticky top-0 bg-base/90 backdrop-blur z-10">
        Post
      </h1>
      <PostCard post={post} currentUser={user} isAdmin={profile?.is_admin} onChanged={() => window.location.reload()} />
      {user && <PostComposer userId={user.id} replyTo={id} onPosted={() => window.location.reload()} />}
      <Feed currentUser={user} profile={profile} replyTo={id} />
    </div>
  );
}
