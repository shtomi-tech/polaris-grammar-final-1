create table if not exists public.polaris_students (
  id text primary key,
  display_name text not null,
  access_token text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.polaris_progress (
  student_id text primary key references public.polaris_students(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.polaris_students enable row level security;
alter table public.polaris_progress enable row level security;

create or replace function public.polaris_auth_student(
  p_student_id text,
  p_access_token text
)
returns table(id text, display_name text)
language sql
security definer
set search_path = public
as $$
  select s.id, s.display_name
  from public.polaris_students s
  where s.id = p_student_id
    and s.access_token = p_access_token
    and s.active = true
  limit 1;
$$;

create or replace function public.polaris_load_progress(
  p_student_id text,
  p_access_token text
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(p.progress, '{}'::jsonb)
  from public.polaris_students s
  left join public.polaris_progress p on p.student_id = s.id
  where s.id = p_student_id
    and s.access_token = p_access_token
    and s.active = true
  limit 1;
$$;

create or replace function public.polaris_save_progress(
  p_student_id text,
  p_access_token text,
  p_progress jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.polaris_students s
    where s.id = p_student_id
      and s.access_token = p_access_token
      and s.active = true
  ) then
    raise exception 'invalid student token';
  end if;

  insert into public.polaris_progress (student_id, progress, updated_at)
  values (p_student_id, coalesce(p_progress, '{}'::jsonb), now())
  on conflict (student_id) do update
    set progress = excluded.progress,
        updated_at = now();
end;
$$;

grant execute on function public.polaris_auth_student(text, text) to anon;
grant execute on function public.polaris_load_progress(text, text) to anon;
grant execute on function public.polaris_save_progress(text, text, jsonb) to anon;
