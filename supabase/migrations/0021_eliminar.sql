-- Eliminar cursos, grupos y cuentas desde el panel del administrador.
--  · Cada función prepara la eliminación (comprueba permisos, guarda lo que no se debe perder y deja registro);
--    el borrado en sí lo hace el servidor después, con su llave de servicio.
--  · Los pagos se copian a payments_archive (registro contable) antes de borrar el curso o la cuenta.
--  · Las constancias ya expedidas no se borran: guardan su propia copia del nombre del curso y siguen verificables.
--  · Nunca se elimina una cuenta de administrador ni la propia cuenta.
-- Se puede ejecutar varias veces.

create table if not exists public.admin_log (
  id         bigserial primary key,
  admin_id   uuid,
  action     text not null,
  target     text not null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_log enable row level security;
revoke all on public.admin_log from anon, authenticated;

-- Copia contable de pagos cuyo curso o cuenta se eliminó (sin llaves foráneas: sobrevive al borrado).
create table if not exists public.payments_archive (
  reference    text primary key,
  provider     text not null,
  amount_cop   integer not null,
  status       text not null,
  course_slug  text not null,
  course_title text,
  student_name text,
  payer_name   text,
  provider_ref text,
  created_at   timestamptz not null,
  approved_at  timestamptz,
  archived_at  timestamptz not null default now(),
  reason       text not null
);
alter table public.payments_archive enable row level security;
revoke all on public.payments_archive from anon, authenticated;

create or replace function public.archive_payments(p_user uuid, p_course text, p_reason text)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into payments_archive (reference, provider, amount_cop, status, course_slug, course_title, student_name, payer_name,
                                provider_ref, created_at, approved_at, reason)
  select pa.reference, pa.provider, pa.amount_cop, pa.status, pa.course_slug, c.title, s.display_name, f.display_name,
         pa.provider_ref, pa.created_at, pa.approved_at, p_reason
    from payments pa
    left join courses c on c.slug = pa.course_slug
    left join profiles s on s.id = pa.user_id
    left join profiles f on f.id = pa.payer_id
   where (p_user is not null and (pa.user_id = p_user or pa.payer_id = p_user))
      or (p_course is not null and pa.course_slug = p_course)
  on conflict (reference) do update set status = excluded.status, approved_at = excluded.approved_at;
  get diagnostics n = row_count;
  return n;
end $$;

-- Curso o clase (portal): devuelve cuánto se va a perder, para avisar en pantalla.
create or replace function public.admin_preparar_eliminar_curso(p_admin uuid, p_course text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c record; students integer; archived integer; groups integer;
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  select * into c from courses where slug = p_course;
  if not found then raise exception 'curso_no_encontrado'; end if;
  select count(distinct pr.user_id)::int into students
    from mission_progress pr join missions m on m.id = pr.mission_id where m.course_slug = p_course;
  select count(*)::int into groups from classes where course_slug = p_course;
  archived := public.archive_payments(null, p_course, 'curso_eliminado');
  -- Los grupos ligados a este curso quedan archivados (ya no dan acceso a nada).
  update classes set archived_at = coalesce(archived_at, now()) where course_slug = p_course;
  insert into admin_log (admin_id, action, target, detail)
  values (p_admin, 'eliminar_curso', p_course,
          jsonb_build_object('title', c.title, 'kind', c.kind, 'students', students, 'payments', archived, 'groups', groups));
  return jsonb_build_object('title', c.title, 'students', students, 'payments', archived, 'groups', groups);
end $$;

-- Grupo (clase con código): quita el acceso que dio el código y deja registro.
create or replace function public.admin_preparar_eliminar_grupo(p_admin uuid, p_class uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cl record; members integer;
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  select * into cl from classes where id = p_class;
  if not found then raise exception 'clase_no_encontrada'; end if;
  select count(*)::int into members from class_members where class_id = p_class;
  update course_access set revoked_at = now() where via_class = p_class and revoked_at is null;
  insert into admin_log (admin_id, action, target, detail)
  values (p_admin, 'eliminar_grupo', p_class::text, jsonb_build_object('name', cl.name, 'code', cl.code, 'members', members, 'course', cl.course_slug));
  return jsonb_build_object('name', cl.name, 'members', members);
end $$;

-- Cuenta de estudiante, familia o docente.
create or replace function public.admin_preparar_eliminar_cuenta(p_admin uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr record; groups integer; archived integer;
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  if p_user = p_admin then raise exception 'no_a_ti_mismo'; end if;
  select * into pr from profiles where id = p_user;
  if not found then raise exception 'persona_no_encontrada'; end if;
  if pr.is_admin then raise exception 'no_admin'; end if;
  select count(*)::int into groups from classes where teacher_id = p_user;
  -- Sus grupos se borran con la cuenta: el acceso que dieron sus códigos también se quita.
  update course_access set revoked_at = now()
   where revoked_at is null and via_class in (select id from classes where teacher_id = p_user);
  archived := public.archive_payments(p_user, null, 'cuenta_eliminada');
  insert into admin_log (admin_id, action, target, detail)
  values (p_admin, 'eliminar_cuenta', p_user::text,
          jsonb_build_object('name', pr.display_name, 'role', pr.role, 'groups', groups, 'payments', archived));
  return jsonb_build_object('name', pr.display_name, 'role', pr.role, 'groups', groups, 'payments', archived);
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'public.archive_payments(uuid, text, text)',
    'public.admin_preparar_eliminar_curso(uuid, text)',
    'public.admin_preparar_eliminar_grupo(uuid, uuid)',
    'public.admin_preparar_eliminar_cuenta(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
