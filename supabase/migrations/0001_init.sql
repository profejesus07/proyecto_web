-- UMBRAL · esquema inicial
-- Se puede ejecutar varias veces sin romper nada (idempotente).

-- ============ Perfiles ============
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'estudiante' check (role in ('estudiante','docente','familia')),
  display_name  text not null default 'Despertado' check (char_length(display_name) between 2 and 24),
  avatar        jsonb not null default '{"base":"aria"}'::jsonb,
  equipped      jsonb not null default '{}'::jsonb,
  xp            integer not null default 0 check (xp >= 0),
  coins         integer not null default 0 check (coins >= 0),
  gems          integer not null default 0 check (gems >= 0),
  streak        integer not null default 0 check (streak >= 0),
  last_active   date,
  consent_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- Crea el perfil al registrarse (el rol solo puede ser uno de los tres permitidos).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(new.raw_user_meta_data->>'role', 'estudiante');
  n text := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Despertado');
  b text := coalesce(new.raw_user_meta_data->>'avatar', 'aria');
begin
  if r not in ('estudiante','docente','familia') then r := 'estudiante'; end if;
  if b not in ('aria','leo','tomas','nuri') then b := 'aria'; end if;
  insert into public.profiles (id, role, display_name, avatar, consent_at)
  values (new.id, r, left(n, 24), jsonb_build_object('base', b), now())
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Contenido ============
create table if not exists public.courses (
  slug       text primary key,
  title      text not null,
  summary    text not null,
  element    text not null check (element in ('luz','sombra','fuego','agua','naturaleza','eter')),
  guardian   text not null,
  position   integer not null default 0,
  published  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.missions (
  id          uuid primary key default gen_random_uuid(),
  course_slug text not null references public.courses(slug) on delete cascade,
  position    integer not null,
  title       text not null,
  intro       text not null default '',
  xp_reward   integer not null default 50 check (xp_reward >= 0),
  is_boss     boolean not null default false,
  unique (course_slug, position)
);

create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  mission_id    uuid not null references public.missions(id) on delete cascade,
  position      integer not null,
  prompt        text not null,
  options       jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  correct_index integer not null check (correct_index >= 0),
  hint          text not null default '',
  explanation   text not null default '',
  unique (mission_id, position)
);

-- ============ Progreso y economía ============
create table if not exists public.mission_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  mission_id   uuid not null references public.missions(id) on delete cascade,
  best_score   integer not null check (best_score between 0 and 100),
  attempts     integer not null default 1,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, mission_id)
);

create table if not exists public.boss_defeats (
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_slug text not null references public.courses(slug) on delete cascade,
  defeated_at timestamptz not null default now(),
  primary key (user_id, course_slug)
);

create table if not exists public.inventory (
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     text not null,
  source      text not null default 'tienda',
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Libro de movimientos: cada cambio de XP, monedas o gemas queda registrado.
create table if not exists public.ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('xp','coins','gems')),
  delta      integer not null,
  reason     text not null,
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.ledger (user_id, created_at desc);
create index if not exists missions_course_idx on public.missions (course_slug, position);
create index if not exists questions_mission_idx on public.questions (mission_id, position);

-- ============ Seguridad por filas (RLS) ============
alter table public.profiles          enable row level security;
alter table public.courses           enable row level security;
alter table public.missions          enable row level security;
alter table public.questions         enable row level security;
alter table public.mission_progress  enable row level security;
alter table public.boss_defeats      enable row level security;
alter table public.inventory         enable row level security;
alter table public.ledger            enable row level security;

drop policy if exists "perfil propio: leer"        on public.profiles;
drop policy if exists "perfil propio: editar"      on public.profiles;
drop policy if exists "cursos publicados"          on public.courses;
drop policy if exists "misiones de cursos publicados" on public.missions;
drop policy if exists "progreso propio"            on public.mission_progress;
drop policy if exists "jefes vencidos propios"     on public.boss_defeats;
drop policy if exists "inventario propio"          on public.inventory;
drop policy if exists "movimientos propios"        on public.ledger;

create policy "perfil propio: leer"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "perfil propio: editar" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "cursos publicados"     on public.courses  for select to anon, authenticated using (published);
create policy "misiones de cursos publicados" on public.missions for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.slug = course_slug and c.published));
create policy "progreso propio"       on public.mission_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "jefes vencidos propios" on public.boss_defeats    for select to authenticated using (user_id = (select auth.uid()));
create policy "inventario propio"     on public.inventory        for select to authenticated using (user_id = (select auth.uid()));
create policy "movimientos propios"   on public.ledger           for select to authenticated using (user_id = (select auth.uid()));
-- questions: sin políticas. Solo el servidor (service_role) las lee, así las respuestas correctas nunca llegan al navegador.

-- Permisos a nivel de columna: el estudiante solo puede cambiar su nombre.
-- Avatar, objetos equipados, XP, monedas, gemas y racha los cambia solo el servidor, que valida cada cambio.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on public.questions, public.mission_progress, public.boss_defeats, public.inventory, public.ledger from anon, authenticated;
grant select on public.mission_progress, public.boss_defeats, public.inventory, public.ledger to authenticated;
grant select on public.courses, public.missions to anon, authenticated;
