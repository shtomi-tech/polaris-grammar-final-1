-- 英文法トレーナー（ポラリス）を「共通スキーマ（全アプリ共用）」の生徒別クラウド同期へ移行。
-- 生徒テーブル app_students は全アプリ共用。進捗は app_progress に app 列で振り分ける
-- （このアプリの app = 'english-practice'）。生徒登録1回で共通スキーマ対応の全アプリが有効。
--
-- ※ 旧 polaris_students / polaris_progress は本移行では引き継がない（進捗リセット前提）。
--    共通スキーマへ全アプリを載せ替え後、旧テーブル・旧RPCは破棄してよい。
--
-- 全文は dev\eiken2-q1\MVP_SCOPE.md §A と共通。すでに他アプリで実行済みなら再実行不要（冪等）。

create table if not exists public.app_students (
  id text primary key,
  display_name text not null,
  access_token text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.app_progress (
  app text not null,
  student_id text not null references public.app_students(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (app, student_id)
);

alter table public.app_students enable row level security;
alter table public.app_progress enable row level security;

create or replace function public.app_auth_student(
  p_student_id text,
  p_access_token text
)
returns table(id text, display_name text)
language sql
security definer
set search_path = public
as $$
  select s.id, s.display_name
  from public.app_students s
  where s.id = p_student_id
    and s.access_token = p_access_token
    and s.active = true
  limit 1;
$$;

create or replace function public.app_load_progress(
  p_app text,
  p_student_id text,
  p_access_token text
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(p.progress, '{}'::jsonb)
  from public.app_students s
  left join public.app_progress p on p.student_id = s.id and p.app = p_app
  where s.id = p_student_id
    and s.access_token = p_access_token
    and s.active = true
  limit 1;
$$;

create or replace function public.app_save_progress(
  p_app text,
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
    from public.app_students s
    where s.id = p_student_id
      and s.access_token = p_access_token
      and s.active = true
  ) then
    raise exception 'invalid student token';
  end if;

  insert into public.app_progress (app, student_id, progress, updated_at)
  values (p_app, p_student_id, coalesce(p_progress, '{}'::jsonb), now())
  on conflict (app, student_id) do update
    set progress = excluded.progress,
        updated_at = now();
end;
$$;

grant execute on function public.app_auth_student(text, text) to anon;
grant execute on function public.app_load_progress(text, text, text) to anon;
grant execute on function public.app_save_progress(text, text, text, jsonb) to anon;

-- 生徒登録（ポータルの印刷パネルが app_students へ発行する共通テンプレと同じ）:
-- insert into public.app_students (id, display_name, access_token, active)
-- values ('<id>', '<name>', '<token>', true)
-- on conflict (id) do update set display_name = excluded.display_name,
--   access_token = excluded.access_token, active = true;
