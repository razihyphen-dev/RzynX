-- ============================================================
-- X-CLONE SUPABASE SCHEMA
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Extra profile data on top of Supabase's built-in auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text default '',
  is_admin boolean default false,
  is_banned boolean default false,
  is_verified boolean default false,
  created_at timestamptz default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  media_url text,        -- Cloudinary secure_url
  media_type text,       -- 'image' | 'video' | null
  reply_to uuid references public.posts(id) on delete cascade,
  repost_of uuid references public.posts(id) on delete cascade,
  is_deleted boolean default false,   -- soft delete
  created_at timestamptz default now()
);

create table public.likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subscription jsonb not null,
  created_at timestamptz default now(),
  unique (user_id, subscription)
);

-- Single-row table the admin panel edits: background theme + site status banner
create table public.site_settings (
  id int primary key default 1,
  background_css text default '#0A0A0A',      -- hex, gradient, or image url
  accent_color text default '#3B82F6',
  status_message text default '',              -- shows as a banner site-wide
  status_active boolean default false,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into public.site_settings (id) values (1);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index posts_author_idx on public.posts(author_id);
create index posts_created_idx on public.posts(created_at desc);
create index messages_thread_idx on public.messages(sender_id, recipient_id, created_at);
create index follows_following_idx on public.follows(following_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'display_name', 'New User')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.messages enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.site_settings enable row level security;
alter table public.reports enable row level security;

-- Helper: is the current user an admin?
create function public.is_admin()
returns boolean as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$ language sql security definer stable;

-- Helper: is the current user banned? (banned users can read but not write)
create function public.is_banned()
returns boolean as $$
  select coalesce((select is_banned from public.profiles where id = auth.uid()), false);
$$ language sql security definer stable;

-- PROFILES: anyone can read; users edit only their own row; admins edit/delete any
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id or public.is_admin());
create policy "profiles_delete_admin" on public.profiles for delete using (public.is_admin());

-- POSTS: anyone can read non-deleted posts; only the author can insert as themself;
-- author OR admin can update/delete
create policy "posts_select_all" on public.posts for select using (is_deleted = false or public.is_admin());
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = author_id and not public.is_banned());
create policy "posts_update_own_or_admin" on public.posts for update using (auth.uid() = author_id or public.is_admin());
create policy "posts_delete_own_or_admin" on public.posts for delete using (auth.uid() = author_id or public.is_admin());

-- LIKES: anyone can read; users manage only their own like rows
create policy "likes_select_all" on public.likes for select using (true);
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id or public.is_admin());

-- FOLLOWS: anyone can read; users manage only their own follow rows
create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id or public.is_admin());

-- MESSAGES: only sender or recipient can read; only sender can insert as themself;
-- admin can moderate (read/delete) for safety reports
create policy "messages_select_participant" on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id or public.is_admin());
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = sender_id and not public.is_banned());
create policy "messages_update_participant" on public.messages for update
  using (auth.uid() = recipient_id or public.is_admin()); -- e.g. marking read
create policy "messages_delete_admin_or_sender" on public.messages for delete
  using (auth.uid() = sender_id or public.is_admin());

-- PUSH SUBSCRIPTIONS: users manage only their own
create policy "push_select_own" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "push_insert_own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_delete_own" on public.push_subscriptions for delete using (auth.uid() = user_id);

-- SITE SETTINGS: anyone can read; only admins can update
create policy "settings_select_all" on public.site_settings for select using (true);
create policy "settings_update_admin" on public.site_settings for update using (public.is_admin());

-- REPORTS: any logged-in user can file one; only admins can read/resolve
create policy "reports_insert_any" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "reports_select_admin" on public.reports for select using (public.is_admin());
create policy "reports_update_admin" on public.reports for update using (public.is_admin());

-- ============================================================
-- REALTIME (for live feed + private chat)
-- ============================================================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.site_settings;

-- ============================================================
-- FEED VIEW: posts joined with author + like/reply counts
-- ============================================================
create view public.feed_posts as
select
  p.*,
  json_build_object(
    'username', pr.username,
    'display_name', pr.display_name,
    'avatar_url', pr.avatar_url,
    'is_verified', pr.is_verified
  ) as author,
  (select count(*) from public.likes l where l.post_id = p.id) as like_count,
  (select count(*) from public.posts r where r.reply_to = p.id and r.is_deleted = false) as reply_count
from public.posts p
join public.profiles pr on pr.id = p.author_id
where p.is_deleted = false;

-- ============================================================
-- TO MAKE YOURSELF ADMIN (run after you sign up once):
-- update public.profiles set is_admin = true where username = 'your_username';
-- ============================================================
