-- Administrador, cuentas de docente y suscripciones por curso.
--  · Rol «admin»: control total desde el panel de administración.
--  · Las cuentas de docente solo las crea el administrador (el registro público solo da estudiante o familia).
--  · Cursos independientes: la primera lección de cada curso es gratis; las demás piden acceso al curso
--    (suscripción). Mientras no haya pagos en línea, el administrador da el acceso a mano.
-- Se puede ejecutar varias veces.

-- ============ Roles ============
-- El administrador es una cuenta de docente con la marca is_admin (así no hay que tocar la regla de roles).
-- La marca solo se pone a mano desde Supabase: ver docs/despliegue.md.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- El rol de docente solo puede venir de app_metadata, que únicamente escribe el servidor.
-- Quien se registra en la web solo puede ser estudiante o familia. Nadie se vuelve admin al registrarse.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  staff text := new.raw_app_meta_data->>'role';
  r text := coalesce(new.raw_user_meta_data->>'role', 'estudiante');
  n text := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Despertado');
  b text := coalesce(new.raw_user_meta_data->>'avatar', 'aria');
begin
  if staff = 'docente' then r := staff;
  elsif r not in ('estudiante', 'familia') then r := 'estudiante'; end if;
  if b not in ('aria', 'leo', 'tomas', 'nuri') then b := 'aria'; end if;
  insert into public.profiles (id, role, display_name, avatar, consent_at)
  values (new.id, r, left(n, 24), jsonb_build_object('base', b), now())
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.is_admin(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = p_user and is_admin);
$$;

-- ============ Precios y acceso a cursos ============
alter table public.courses add column if not exists price_cop integer check (price_cop is null or price_cop >= 0);

create table if not exists public.course_access (
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_slug text not null references public.courses(slug) on delete cascade,
  source      text not null default 'admin' check (source in ('admin', 'pago')),
  granted_by  uuid references auth.users(id) on delete set null,
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,
  -- Quitar un acceso no borra la fila: queda marcado (y sirve de historial).
  revoked_at  timestamptz,
  primary key (user_id, course_slug)
);
alter table public.course_access add column if not exists revoked_at timestamptz;
alter table public.course_access enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_access' and policyname = 'accesos propios') then
    create policy "accesos propios" on public.course_access for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.course_access from anon, authenticated;
grant select on public.course_access to authenticated;

-- Docentes (y el administrador, que también es docente) ven todos los cursos completos.
create or replace function public.has_course_access(p_user uuid, p_course text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = p_user and (role = 'docente' or is_admin))
      or exists (select 1 from course_access
                  where user_id = p_user and course_slug = p_course and revoked_at is null
                    and (expires_at is null or expires_at > now()));
$$;

-- Regla de apertura de una misión (la usan complete_mission, answer_question y use_aid):
--  · Dentro de un curso, las misiones se abren en orden. Los cursos ya no dependen unos de otros.
--  · La primera lección es gratis; las demás necesitan acceso al curso. Sin acceso, lanza
--    «requiere_suscripcion» para que la web explique cómo desbloquearlo.
create or replace function public.mission_is_locked(p_user uuid, p_mission uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare m record;
begin
  select course_slug, position into m from missions where id = p_mission;
  if not found then return true; end if;
  if exists (
    select 1 from missions prev
     where prev.course_slug = m.course_slug and prev.position < m.position
       and not exists (select 1 from mission_progress pr
                        where pr.user_id = p_user and pr.mission_id = prev.id and pr.completed_at is not null)
  ) then return true; end if;
  if m.position > 1 and not public.has_course_access(p_user, m.course_slug) then
    raise exception 'requiere_suscripcion';
  end if;
  return false;
end $$;

-- ============ Clases: el administrador también puede crear clases y ver el informe de cualquiera ============
-- (renombrar, nuevo código, archivar y quitar estudiantes siguen siendo de cada docente: ver 0009).
create or replace function public.create_class(p_teacher uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; n text := btrim(coalesce(p_name, ''));
begin
  perform 1 from profiles where id = p_teacher and (role = 'docente' or is_admin) for update;
  if not found then raise exception 'solo_docentes'; end if;
  if char_length(n) < 2 or char_length(n) > 60 then raise exception 'nombre_invalido'; end if;
  if (select count(*) from classes where teacher_id = p_teacher and archived_at is null) >= 30 then raise exception 'demasiadas_clases'; end if;
  insert into classes (teacher_id, name, code) values (p_teacher, n, public.new_class_code()) returning * into r;
  return jsonb_build_object('id', r.id, 'name', r.name, 'code', r.code);
end $$;

create or replace function public.class_report(p_teacher uuid, p_class uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare cl record;
begin
  select * into cl from classes where id = p_class and (teacher_id = p_teacher or public.is_admin(p_teacher));
  if not found then raise exception 'clase_no_encontrada'; end if;
  return jsonb_build_object(
    'class', jsonb_build_object('id', cl.id, 'name', cl.name, 'code', cl.code, 'created_at', cl.created_at, 'archived', cl.archived_at is not null),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.display_name, 'avatar', coalesce(p.avatar->>'base', 'aria'),
        'xp', p.xp, 'streak', p.streak, 'last_active', p.last_active, 'joined_at', m.joined_at,
        'progress', coalesce((
          select jsonb_agg(jsonb_build_object('mission_id', pr.mission_id, 'best_score', pr.best_score, 'attempts', pr.attempts, 'completed', pr.completed_at is not null))
            from mission_progress pr where pr.user_id = p.id), '[]'::jsonb)
      ) order by p.display_name)
        from class_members m join profiles p on p.id = m.student_id
       where m.class_id = cl.id), '[]'::jsonb),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object('mission_id', x.mission_id, 'position', x.position, 'answered', x.answered, 'right', x.right_count))
        from (
          select q.mission_id, q.position, count(*)::int as answered, count(*) filter (where a.choice = q.correct_index)::int as right_count
            from attempts t
            join class_members m on m.student_id = t.user_id and m.class_id = cl.id
            cross join lateral unnest(t.answers) with ordinality as a(choice, ord)
            join (select qq.mission_id, qq.position, qq.correct_index,
                         row_number() over (partition by qq.mission_id order by qq.position) as rn
                    from questions qq) q on q.mission_id = t.mission_id and q.rn = a.ord
           where t.finished_at is not null and a.choice >= 0
           group by q.mission_id, q.position
        ) x), '[]'::jsonb)
  );
end $$;

-- ============ Panel de administración ============
-- Personas (con su correo, que solo ve el administrador) y los cursos a los que tienen acceso.
create or replace function public.admin_users(p_admin uuid, p_query text default '')
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare q text := btrim(coalesce(p_query, ''));
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  return coalesce((
    select jsonb_agg(x.j order by x.created_at desc)
      from (
        select u.created_at, jsonb_build_object(
          'id', p.id, 'email', u.email, 'name', p.display_name, 'role', case when p.is_admin then 'admin' else p.role end, 'xp', p.xp,
          'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
          'access', coalesce((select jsonb_agg(jsonb_build_object('course', a.course_slug, 'source', a.source, 'expires_at', a.expires_at) order by a.course_slug)
                                from course_access a where a.user_id = p.id and a.revoked_at is null), '[]'::jsonb)
        ) as j
          from auth.users u join profiles p on p.id = u.id
         where q = '' or u.email ilike '%' || q || '%' or p.display_name ilike '%' || q || '%'
         order by u.created_at desc
         limit 200
      ) x), '[]'::jsonb);
end $$;

create or replace function public.admin_set_role(p_admin uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  if p_role not in ('estudiante', 'familia', 'docente') then raise exception 'rol_invalido'; end if;
  if p_user = p_admin or public.is_admin(p_user) then raise exception 'no_permitido'; end if;
  update profiles set role = p_role where id = p_user;
  if not found then raise exception 'persona_no_encontrada'; end if;
end $$;

create or replace function public.admin_grant_access(p_admin uuid, p_user uuid, p_course text, p_expires timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  perform 1 from courses where slug = p_course;
  if not found then raise exception 'curso_no_encontrado'; end if;
  perform 1 from profiles where id = p_user;
  if not found then raise exception 'persona_no_encontrada'; end if;
  insert into course_access (user_id, course_slug, source, granted_by, expires_at)
  values (p_user, p_course, 'admin', p_admin, p_expires)
  on conflict (user_id, course_slug) do update
    set source = 'admin', granted_by = p_admin, granted_at = now(), expires_at = excluded.expires_at, revoked_at = null;
end $$;

create or replace function public.admin_revoke_access(p_admin uuid, p_user uuid, p_course text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  update course_access set revoked_at = now() where user_id = p_user and course_slug = p_course and revoked_at is null;
end $$;

create or replace function public.admin_set_price(p_admin uuid, p_course text, p_price integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  if p_price is not null and (p_price < 0 or p_price > 100000000) then raise exception 'precio_invalido'; end if;
  update courses set price_cop = p_price where slug = p_course;
  if not found then raise exception 'curso_no_encontrado'; end if;
end $$;

create or replace function public.admin_classes(p_admin uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'code', c.code, 'archived', c.archived_at is not null, 'created_at', c.created_at,
      'teacher', p.display_name, 'members', (select count(*) from class_members m where m.class_id = c.id)
    ) order by c.created_at desc)
      from classes c join profiles p on p.id = c.teacher_id), '[]'::jsonb);
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'public.is_admin(uuid)', 'public.has_course_access(uuid, text)', 'public.mission_is_locked(uuid, uuid)',
    'public.create_class(uuid, text)', 'public.class_report(uuid, uuid)',
    'public.admin_users(uuid, text)', 'public.admin_set_role(uuid, uuid, text)',
    'public.admin_grant_access(uuid, uuid, text, timestamptz)', 'public.admin_revoke_access(uuid, uuid, text)',
    'public.admin_set_price(uuid, text, integer)', 'public.admin_classes(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
