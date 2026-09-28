'use client';
import { useState } from 'react';
import { enablePushNotifications } from '@/lib/pushClient';

export default function EnableNotifications({ userId }) {
  const [status, setStatus] = useState('idle'); // idle | asking | done | error
  const [message, setMessage] = useState('');

  async function handleClick() {
    setStatus('asking');
    try {
      await enablePushNotifications(userId);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  if (status === 'done') {
    return <p className="text-sm text-muted px-3">🔔 Notifications enabled</p>;
  }

  return (
    <div className="px-3">
      <button
        onClick={handleClick}
        disabled={status === 'asking'}
        className="w-full text-sm border border-border rounded-full py-2 hover:bg-surface"
      >
        {status === 'asking' ? 'Requesting…' : '🔔 Enable notifications'}
      </button>
      {status === 'error' && <p className="text-danger text-xs mt-1">{message}</p>}
      <p className="text-muted text-xs mt-1">
        On iPhone: add this site to your Home Screen first (Share → Add to Home Screen), then open it from there to enable notifications.
      </p>
    </div>
  );
}
