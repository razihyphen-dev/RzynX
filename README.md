# X Clone

A Twitter/X-style app: posts with text + media, likes, replies, follows, real-time private chat,
an admin panel (site theme + status banner + full user/post moderation), email-confirmed signup,
and installable-app push notifications on iOS/Android.

**Stack:** Next.js (App Router) on Netlify · Supabase (Postgres + Auth + Realtime) · Cloudinary (media)

Media uploads go **directly from the browser to Cloudinary** — your Netlify server never touches the
file bytes, and Supabase Storage is never used, so neither quota gets eaten by uploads.

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough to start).
2. In **SQL Editor**, paste and run the entire contents of `supabase/schema.sql`. This creates every
   table, the auto-profile trigger, the feed view, and all Row Level Security policies.
3. In **Authentication → Email Templates**, the "Confirm signup" template already points users back
   to your app — just make sure **Authentication → URL Configuration → Site URL** is set to your
   real deployed URL once you have one (e.g. `https://yourapp.netlify.app`), and add
   `https://yourapp.netlify.app/auth/callback` to **Redirect URLs**.
4. Grab your keys from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — it's server-only)

## 2. Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy your **Cloud name**, **API Key**, and **API Secret**.
3. Uploads here are **signed** (your server issues a short-lived signature, then the browser
   uploads straight to Cloudinary) — this keeps your API secret safe without routing files through
   Netlify. You don't strictly need an upload preset for signed uploads, but if you want one for
   organization (e.g. auto-folder, auto-tagging), create one under **Settings → Upload** and set its
   mode to **Signed**, then put its name in `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
4. Cloudinary's free tier includes 25 monthly credits (~25GB storage/bandwidth combined) — plenty
   for early testing. Consider adding upload size limits (already capped at 50MB client-side in
   `PostComposer.js`) and monitoring usage as you grow.

## 3. Push notifications (VAPID)

Run once locally:

```bash
npm install
npm run generate-vapid
```

Copy the two printed keys into your `.env` (and later into Netlify's environment variables):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
```

**Important iOS note:** iOS only delivers push notifications to a site that's been **added to the
Home Screen** (Share → Add to Home Screen) and opened from there — a normal Safari tab won't
receive them, and iOS needs 16.4+. Android/Chrome supports push from a normal browser tab too, but
add-to-homescreen still gives the full app-like experience. The in-app "Enable notifications"
button (left sidebar) explains this to iOS users.

You'll also need real icon files — replace the placeholders referenced in `public/manifest.json`
and `public/sw.js` (`/icons/icon-192.png`, `/icons/icon-512.png`) with actual PNGs.

## 4. Local development

```bash
cp .env.example .env
# fill in the values from steps 1–3
npm install
npm run dev
```

Sign up through the app once, then in Supabase's **SQL Editor** run:

```sql
update public.profiles set is_admin = true where username = 'your_username';
```

That account now sees the **Admin** link and full moderation powers.

## 5. Deploy to Netlify

1. Push this project to a GitHub repo.
2. In Netlify: **Add new site → Import from Git**, pick the repo (the `@netlify/plugin-nextjs`
   plugin and `netlify.toml` are already configured — no build settings to change).
3. Add all the same environment variables from your `.env` under **Site settings → Environment
   variables**.
4. Deploy. Update Supabase's Site URL / Redirect URLs (step 1.3) to match your live Netlify domain.

## What's already built

- Email/password signup with email confirmation, login, logout
- Text + image/video posts (Cloudinary), likes, threaded replies, follow/unfollow
- Real-time home feed and real-time 1:1 private chat (Supabase Realtime)
- Push notifications on new likes and new DMs, installable as a homescreen app (PWA)
- Admin panel: live site-wide background/accent color, a toggleable status banner, and full
  power to verify, promote, ban, or permanently delete any user or post
- Row Level Security on every table — banned users are blocked from posting/messaging at the
  database level, not just hidden in the UI
- Fully responsive: 3-column desktop layout collapsing to a single column + bottom tab bar on
  mobile, with safe-area padding for notches/home indicators

## Sensible next additions

- Reposts/quote-posts (the `repost_of` column already exists in the schema — UI not wired up yet)
- Hashtag parsing + a search page
- Rate limiting on posts/uploads (e.g. via a Postgres function checking recent post count) to
  protect your Cloudinary quota from spam/abuse
- Image compression before upload (client-side, e.g. via `browser-image-compression`)
- Block/mute + the `reports` table already in the schema needs an admin UI tab
- Audit log table for admin actions (who banned/deleted what, and when)
