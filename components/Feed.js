'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PostCard from './PostCard';

export default function Feed({ currentUser, profile, authorId = null, replyTo = null }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let query = supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (authorId) query = query.eq('author_id', authorId);
    if (replyTo) query = query.eq('reply_to', replyTo);
    else query = query.is('reply_to', null);

    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  }, [authorId, replyTo]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('feed_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  if (loading) return <p className="p-6 text-muted text-center">Loading…</p>;
  if (posts.length === 0) return <p className="p-6 text-muted text-center">Nothing here yet.</p>;

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUser={currentUser || profile} isAdmin={profile?.is_admin} onChanged={load} />
      ))}
    </div>
  );
}
