'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNowStrict } from 'date-fns';

export default function MessagesInbox() {
  const { user, loading } = useUser();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadConversations();

    const channel = supabase
      .channel('inbox_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => loadConversations()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  async function loadConversations() {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(username, display_name, avatar_url), recipient:recipient_id(username, display_name, avatar_url)')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const map = new Map();
    (data || []).forEach((m) => {
      const other = m.sender_id === user.id ? m.recipient : m.sender;
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!map.has(otherId)) map.set(otherId, { other, otherId, last: m });
    });
    setConversations([...map.values()]);
  }

  async function handleSearch(q) {
    setSearch(q);
    if (!q.trim()) return setResults([]);
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`).limit(5);
    setResults(data || []);
  }

  if (loading) return null;
  if (!user) return <p className="p-6 text-muted text-center">Log in to see your messages.</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold p-4 border-b border-border sticky top-0 bg-base/90 backdrop-blur z-10">
        Messages
      </h1>
      <div className="p-4 border-b border-border">
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search people to message…"
          className="w-full bg-surface border border-border rounded-full px-4 py-2"
        />
        {results.map((r) => (
          <Link key={r.id} href={`/messages/${r.id}`} className="flex items-center gap-3 mt-2 hover:bg-surface p-2 rounded-lg">
            <img src={r.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${r.username}`} className="w-8 h-8 rounded-full" alt="" />
            <span>@{r.username}</span>
          </Link>
        ))}
      </div>
      {conversations.length === 0 && <p className="p-6 text-muted text-center">No conversations yet — search a username above.</p>}
      {conversations.map(({ other, otherId, last }) => (
        <Link key={otherId} href={`/messages/${otherId}`} className="flex items-center gap-3 p-4 border-b border-border hover:bg-surface">
          <img src={other?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${other?.username}`} className="w-10 h-10 rounded-full" alt="" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{other?.display_name} <span className="text-muted font-normal">@{other?.username}</span></p>
            <p className="text-muted truncate text-sm">{last.content}</p>
          </div>
          <span className="text-muted text-xs">{formatDistanceToNowStrict(new Date(last.created_at))}</span>
        </Link>
      ))}
    </div>
  );
}
