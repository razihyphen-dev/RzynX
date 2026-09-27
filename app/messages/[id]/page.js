'use client';
import { useEffect, useState, useRef } from 'react';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';

export default function ChatThread({ params }) {
  const { id: otherId } = params;
  const { user, profile } = useUser();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef();

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', otherId).single().then(({ data }) => setOtherUser(data));
  }, [otherId]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    }
    load();

    const channel = supabase
      .channel(`dm_${[user.id, otherId].sort().join('_')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new;
          const belongs =
            (m.sender_id === user.id && m.recipient_id === otherId) ||
            (m.sender_id === otherId && m.recipient_id === user.id);
          if (belongs) setMessages((prev) => [...prev, m]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText('');

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: otherId,
      content,
    });

    if (!error) {
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otherId,
          title: `New message from @${profile?.username}`,
          body: content,
          url: `/messages/${user.id}`,
        }),
      }).catch(() => {});
    }
  }

  if (!user) return <p className="p-6 text-muted text-center">Log in to chat.</p>;

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-border flex items-center gap-3 sticky top-0 bg-base/90 backdrop-blur z-10">
        <img src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${otherUser?.username}`} className="w-8 h-8 rounded-full" alt="" />
        <span className="font-semibold">@{otherUser?.username}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-24">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-4 py-2 rounded-2xl ${
              m.sender_id === user.id ? 'bg-accent self-end rounded-br-sm' : 'bg-surface self-start rounded-bl-sm'
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-border fixed bottom-0 md:sticky w-full max-w-content bg-base flex gap-2 safe-bottom">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start a message…"
          className="flex-1 bg-surface border border-border rounded-full px-4 py-2 outline-none"
        />
        <button className="bg-accent px-5 py-2 rounded-full font-medium">Send</button>
      </form>
    </div>
  );
}
