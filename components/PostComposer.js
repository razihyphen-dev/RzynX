'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export default function PostComposer({ userId, onPosted, replyTo = null }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef();

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      alert('File too large (50MB max)');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setPosting(true);

    let media_url = null;
    let media_type = null;

    try {
      if (file) {
        setProgress(1);
        const result = await uploadToCloudinary(file, setProgress);
        media_url = result.url;
        media_type = result.type;
      }

      const { error } = await supabase.from('posts').insert({
        author_id: userId,
        content: content.trim() || null,
        media_url,
        media_type,
        reply_to: replyTo,
      });

      if (error) throw error;

      setContent('');
      setFile(null);
      setPreview(null);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
      onPosted && onPosted();
    } catch (err) {
      alert(err.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-border p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={replyTo ? 'Post your reply' : "What's happening?"}
        rows={3}
        maxLength={500}
        className="w-full bg-transparent outline-none resize-none text-lg placeholder:text-muted"
      />
      {preview && (
        <div className="relative mt-2 rounded-xl overflow-hidden border border-border">
          {file.type.startsWith('video') ? (
            <video src={preview} controls className="w-full max-h-80" />
          ) : (
            <img src={preview} alt="preview" className="w-full max-h-80 object-cover" />
          )}
          <button
            type="button"
            onClick={() => { setFile(null); setPreview(null); }}
            className="absolute top-2 right-2 bg-black/70 rounded-full w-8 h-8"
          >✕</button>
        </div>
      )}
      {posting && file && (
        <div className="w-full bg-border h-1 rounded mt-2">
          <div className="bg-accent h-1 rounded transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <label className="cursor-pointer text-accent px-2 py-1">
          📷
          <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
        </label>
        <button
          type="submit"
          disabled={posting || (!content.trim() && !file)}
          className="bg-accent px-5 py-2 rounded-full font-medium disabled:opacity-40"
        >
          {posting ? 'Posting…' : replyTo ? 'Reply' : 'Post'}
        </button>
      </div>
    </form>
  );
}
