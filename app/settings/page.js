'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export default function SettingsPage() {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const fileRef = useRef();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image')) {
      setError('Please choose an image file for your profile picture.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Image too large (10MB max).');
      return;
    }
    setError('');
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        setProgress(1);
        const result = await uploadToCloudinary(avatarFile, setProgress);
        finalAvatarUrl = result.url;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || profile.username,
          bio: bio.trim(),
          avatar_url: finalAvatarUrl,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setSaved(true);
      setTimeout(() => router.push(`/profile/${profile.username}`), 800);
    } catch (err) {
      setError(err.message || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
      setProgress(0);
    }
  }

  if (loading) return null;
  if (!user) return <p className="p-6 text-muted text-center">Log in to edit your profile.</p>;

  return (
    <div className="p-4 max-w-md">
      <h1 className="text-xl font-semibold mb-6">Edit profile</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <img
            src={avatarPreview || avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.username}`}
            className="w-20 h-20 rounded-full object-cover bg-surface border border-border"
            alt=""
          />
          <div>
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="border border-border rounded-full px-4 py-2 text-sm hover:bg-surface"
            >
              Change photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>
        </div>

        {saving && avatarFile && (
          <div className="w-full bg-border h-1 rounded">
            <div className="bg-accent h-1 rounded transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            className="bg-surface border border-border rounded-lg px-4 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="bg-surface border border-border rounded-lg px-4 py-2 resize-none"
          />
        </label>

        {error && <p className="text-danger text-sm">{error}</p>}
        {saved && <p className="text-accent text-sm">Saved — taking you to your profile…</p>}

        <button disabled={saving} className="bg-accent rounded-full py-3 font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
