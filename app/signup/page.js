'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
        <p className="text-muted">We sent a confirmation link to {email}. Click it to activate your account.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Create your account</h1>
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <input
          type="text" placeholder="Username" required value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
          className="bg-surface border border-border rounded-lg px-4 py-3"
        />
        <input
          type="email" placeholder="Email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-surface border border-border rounded-lg px-4 py-3"
        />
        <input
          type="password" placeholder="Password (min 6 chars)" required minLength={6} value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-surface border border-border rounded-lg px-4 py-3"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <button disabled={loading} className="bg-accent rounded-full py-3 font-medium disabled:opacity-50">
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-muted text-sm">
        Already have an account? <a href="/login" className="text-accent">Log in</a>
      </p>
    </div>
  );
}
