-- improvements: clone / avoid previous / reminders

alter table groups
  add column if not exists source_group_id uuid references groups (id) on delete set null;

alter table groups
  add column if not exists avoid_previous boolean not null default true;

alter table groups
  add column if not exists reminder_sent_at timestamptz;

create index if not exists groups_source_idx on groups (source_group_id);
create index if not exists groups_reminder_idx on groups (event_at)
  where reminder_sent_at is null and status in ('drawn', 'revealed') and archived = false;
