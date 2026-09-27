import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
}

// body: { userId, title, body, url }
export async function POST(request) {
  const { userId, title, body, url } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    ensureVapid();
  } catch (err) {
    // VAPID keys not configured yet — fail quietly so likes/DMs still work without push
    return NextResponse.json({ sent: 0, error: 'Push not configured' }, { status: 200 });
  }

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = JSON.stringify({ title: title || 'X Clone', body: body || 'New notification', url: url || '/' });

  const results = await Promise.allSettled(
    (subs || []).map((row) => webpush.sendNotification(row.subscription, payload))
  );

  // Clean up subscriptions that are no longer valid (expired/unsubscribed)
  results.forEach((r, i) => {
    if (r.status === 'rejected' && (r.reason?.statusCode === 410 || r.reason?.statusCode === 404)) {
      supabaseAdmin.from('push_subscriptions').delete().eq('id', subs[i].id).then(() => {});
    }
  });

  return NextResponse.json({ sent: results.filter((r) => r.status === 'fulfilled').length });
}
