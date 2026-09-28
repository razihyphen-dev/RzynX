'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import Feed from '@/components/Feed';

export default function ProfilePage({ params }) {
  const { username } = params;
  const { user } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (!p) return;
      setProfileData(p);

      const [{ count: followers }, { count: followingCount }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id),
      ]);
      setCounts({ followers: followers || 0, following: followingCount || 0 });

      if (user) {
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id)
          .eq('following_id', p.id);
        setFollowing(count > 0);
      }
    }
    load();
  }, [username, user]);

  async function toggleFollow() {
    if (!user || !profileData) return;
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileData.id);
      setCounts((c) => ({ ...c, followers: c.followers - 1 }));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profileData.id });
      setCounts((c) => ({ ...c, followers: c.followers + 1 }));
    }
    setFollowing(!following);
  }

  if (!profileData) return <p className="p-6 text-muted text-center">Loading…</p>;

  return (
    <div>
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <img
            src={profileData.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profileData.username}`}
            className="w-20 h-20 rounded-full bg-surface"
            alt=""
          />
          {user && user.id !== profileData.id && (
            <button
              onClick={toggleFollow}
              className={`px-5 py-2 rounded-full font-medium ${following ? 'border border-border' : 'bg-accent'}`}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
          {user && user.id === profileData.id && (
            <a href={`/settings`} className="px-5 py-2 rounded-full border border-border hover:bg-surface">Edit profile</a>
          )}
        </div>
        <h1 className="text-xl font-semibold mt-3 flex items-center gap-1">
          {profileData.display_name}
          {profileData.is_verified && <span title="Verified">✅</span>}
          {profileData.is_admin && <span className="text-xs bg-accent px-2 py-0.5 rounded-full ml-1">Admin</span>}
        </h1>
        <p className="text-muted">@{profileData.username}</p>
        {profileData.bio && <p className="mt-2">{profileData.bio}</p>}
        <div className="flex gap-4 mt-3 text-sm">
          <span><b>{counts.following}</b> <span className="text-muted">Following</span></span>
          <span><b>{counts.followers}</b> <span className="text-muted">Followers</span></span>
        </div>
      </div>
      <Feed currentUser={user} authorId={profileData.id} />
    </div>
  );
}
