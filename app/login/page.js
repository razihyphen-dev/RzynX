'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push('/');
  }

  return (
    <div className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Log in</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email" placeholder="Email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-surface border border-border rounded-lg px-4 py-3"
        />
        <input
          type="password" placeholder="Password" required value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-surface border border-border rounded-lg px-4 py-3"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <button disabled={loading} className="bg-accent rounded-full py-3 font-medium disabled:opacity-50">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-muted text-sm">
        No account? <a href="/signup" className="text-accent">Sign up</a>
      </p>
    </div>
  );
}
