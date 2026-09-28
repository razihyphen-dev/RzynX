'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPanel() {
  const { user, profile, loading } = useUser();
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('theme');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.is_admin) return;
    supabase.from('site_settings').select('*').eq('id', 1).single().then(({ data }) => setSettings(data));
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setUsers(data || []));
    supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => setPosts(data || []));
  }, [profile]);

  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('site_settings').update({
      background_css: settings.background_css,
      accent_color: settings.accent_color,
      status_message: settings.status_message,
      status_active: settings.status_active,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
  }

  async function toggleBan(u) {
    await supabase.from('profiles').update({ is_banned: !u.is_banned }).eq('id', u.id);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_banned: !x.is_banned } : x)));
  }

  async function toggleVerified(u) {
    await supabase.from('profiles').update({ is_verified: !u.is_verified }).eq('id', u.id);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_verified: !x.is_verified } : x)));
  }

  async function toggleAdmin(u) {
    await supabase.from('profiles').update({ is_admin: !u.is_admin }).eq('id', u.id);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_admin: !x.is_admin } : x)));
  }

  async function deleteUser(u) {
    if (!confirm(`Permanently delete @${u.username}? This deletes their posts and messages too.`)) return;
    await supabase.from('profiles').delete().eq('id', u.id);
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
  }

  async function deletePost(p) {
    await supabase.from('posts').update({ is_deleted: true }).eq('id', p.id);
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
  }

  if (loading) return null;
  if (!profile?.is_admin) return <p className="p-6 text-muted text-center">Admins only.</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Admin panel</h1>

      <div className="flex gap-2 mb-6 border-b border-border">
        {['theme', 'users', 'posts'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 capitalize ${tab === t ? 'border-b-2 border-accent text-ink' : 'text-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'theme' && settings && (
        <form onSubmit={saveSettings} className="flex flex-col gap-4 max-w-md">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Site background (hex, gradient, or image URL)</span>
            <input
              value={settings.background_css}
              onChange={(e) => setSettings({ ...settings, background_css: e.target.value })}
              className="bg-surface border border-border rounded-lg px-4 py-2"
              placeholder="#0A0A0A or linear-gradient(...) or url(...)"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Accent color</span>
            <input
              type="color"
              value={settings.accent_color}
              onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
              className="bg-surface border border-border rounded-lg h-11 w-full"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Site status banner message</span>
            <input
              value={settings.status_message}
              onChange={(e) => setSettings({ ...settings, status_message: e.target.value })}
              className="bg-surface border border-border rounded-lg px-4 py-2"
              placeholder="e.g. Scheduled maintenance tonight at 10pm"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.status_active}
              onChange={(e) => setSettings({ ...settings, status_active: e.target.checked })}
            />
            <span>Show banner site-wide</span>
          </label>
          <button disabled={saving} className="bg-accent rounded-full py-3 font-medium disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}

      {tab === 'users' && (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
              <img src={u.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`} className="w-9 h-9 rounded-full" alt="" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">@{u.username} {u.is_banned && <span className="text-danger text-xs">(banned)</span>}</p>
                <p className="text-muted text-xs">{u.display_name}</p>
              </div>
              <button onClick={() => toggleVerified(u)} className="text-xs px-2 py-1 border border-border rounded-full">
                {u.is_verified ? 'Unverify' : 'Verify'}
              </button>
              <button onClick={() => toggleAdmin(u)} className="text-xs px-2 py-1 border border-border rounded-full">
                {u.is_admin ? 'Remove admin' : 'Make admin'}
              </button>
              <button onClick={() => toggleBan(u)} className="text-xs px-2 py-1 border border-border rounded-full">
                {u.is_banned ? 'Unban' : 'Ban'}
              </button>
              <button onClick={() => deleteUser(u)} className="text-xs px-2 py-1 border border-danger text-danger rounded-full">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'posts' && (
        <div className="flex flex-col gap-2">
          {posts.map((p) => (
            <div key={p.id} className="flex items-start gap-3 border border-border rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted">@{p.author?.username}</p>
                <p className="truncate">{p.content}</p>
              </div>
              <button onClick={() => deletePost(p)} className="text-xs px-2 py-1 border border-danger text-danger rounded-full shrink-0">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
