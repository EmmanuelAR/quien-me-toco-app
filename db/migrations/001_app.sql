-- app schema: solo lo necesario para amigo secreto (sin chain)

create extension if not exists pgcrypto;

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_at timestamptz not null,
  place text not null default '',
  budget_min integer not null default 0,
  budget_max integer not null default 0,
  currency text not null default 'CRC',
  rules text not null default '',
  status text not null default 'open'
    check (status in ('open', 'closed', 'drawn', 'revealed')),
  owner_user_id text not null,
  invite_token text not null unique,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  purge_after timestamptz not null
);

create index if not exists groups_owner_idx on groups (owner_user_id);
create index if not exists groups_invite_idx on groups (invite_token);
create index if not exists groups_purge_idx on groups (purge_after);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  user_id text,
  name text not null,
  email text,
  wishlist_ideas text not null default '',
  wishlist_sizes text not null default '',
  wishlist_links text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists members_group_idx on members (group_id);
create unique index if not exists members_group_user_uidx
  on members (group_id, user_id)
  where user_id is not null;

create table if not exists exclusions (
  group_id uuid not null references groups (id) on delete cascade,
  a_id uuid not null references members (id) on delete cascade,
  b_id uuid not null references members (id) on delete cascade,
  primary key (group_id, a_id, b_id),
  check (a_id <> b_id)
);

create table if not exists assignments (
  group_id uuid not null references groups (id) on delete cascade,
  giver_id uuid not null references members (id) on delete cascade,
  receiver_id uuid not null references members (id) on delete cascade,
  primary key (group_id, giver_id),
  unique (group_id, receiver_id)
);
