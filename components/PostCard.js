'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

export default function PostCard({ post, currentUser, isAdmin, onChanged }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('user_id', currentUser.id)
      .then(({ count }) => setLiked(count > 0));
  }, [post.id, currentUser]);

  async function toggleLike() {
    if (!currentUser || busy) return;
    setBusy(true);
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id);
      setLikeCount((c) => c - 1);
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: currentUser.id });
      setLikeCount((c) => c + 1);
      // Notify the author (fire and forget)
      if (post.author_id !== currentUser.id) {
        fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: post.author_id,
            title: 'New like',
            body: `@${currentUser.username || 'someone'} liked your post`,
            url: '/',
          }),
        }).catch(() => {});
      }
    }
    setLiked(!liked);
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this post?')) return;
    await supabase.from('posts').update({ is_deleted: true }).eq('id', post.id);
    onChanged && onChanged();
  }

  const canDelete = currentUser && (currentUser.id === post.author_id || isAdmin);

  return (
    <article className="border-b border-border p-4">
      <div className="flex gap-3">
        <Link href={`/profile/${post.author?.username}`}>
          <img
            src={post.author?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author?.username}`}
            className="w-10 h-10 rounded-full bg-surface"
            alt=""
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/profile/${post.author?.username}`} className="font-semibold hover:underline">
              {post.author?.display_name}
            </Link>
            <span className="text-muted">@{post.author?.username}</span>
            <span className="text-muted">· {formatDistanceToNowStrict(new Date(post.created_at))}</span>
            {canDelete && (
              <button onClick={handleDelete} className="ml-auto text-muted hover:text-danger text-xs">
                Delete
              </button>
            )}
          </div>

          {post.content && <p className="mt-1 whitespace-pre-wrap break-words">{post.content}</p>}

          {post.media_url && (
            <div className="mt-2 rounded-xl overflow-hidden border border-border">
              {post.media_type === 'video' ? (
                <video src={post.media_url} controls className="w-full max-h-96" />
              ) : (
                <img src={post.media_url} className="w-full max-h-96 object-cover" alt="" />
              )}
            </div>
          )}

          <div className="flex gap-6 mt-3 text-muted text-sm">
            <button onClick={toggleLike} className={liked ? 'text-danger' : 'hover:text-danger'}>
              {liked ? '❤️' : '🤍'} {likeCount}
            </button>
            <Link href={`/status/${post.id}`} className="hover:text-accent">💬 Reply</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
