-- Lecciones de explicación y horas para clases.
--
-- 1. Cada lección es un «reto» (con actividades, como hasta ahora) o una «explicación»: un texto
--    (y un video opcional) que se lee antes de practicar. No tiene preguntas ni puede ser jefe.
--    Se completa al leerla, con complete_reading.
--    La muestra gratis de un curso de pago llega hasta su primer reto (la explicación inicial
--    sola no deja probar nada): son gratis todas las lecciones hasta el primer reto, incluido.
-- 2. Las clases también llevan intensidad horaria (horas en el año, hasta 2000). Los cursos cortos
--    siguen por debajo de 160 horas (educación informal).

alter table public.missions add column if not exists kind text not null default 'reto';
alter table public.missions add column if not exists body text not null default '';
alter table public.missions add column if not exists video_url text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'missions_kind_check' and conrelid = 'public.missions'::regclass) then
    alter table public.missions add constraint missions_kind_check check (kind in ('reto', 'explicacion'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'missions_body_check' and conrelid = 'public.missions'::regclass) then
    alter table public.missions add constraint missions_body_check check (char_length(body) <= 20000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'missions_video_check' and conrelid = 'public.missions'::regclass) then
    alter table public.missions add constraint missions_video_check
      check (video_url is null or (video_url ~ '^https://' and char_length(video_url) <= 300));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'missions_explicacion_no_jefe' and conrelid = 'public.missions'::regclass) then
    alter table public.missions add constraint missions_explicacion_no_jefe check (not (kind = 'explicacion' and is_boss));
  end if;
end $$;

-- Horas: el límite de 160 aplica solo a los cursos cortos.
alter table public.courses drop constraint if exists courses_hours_check;
alter table public.courses add constraint courses_hours_check
  check (hours is null or (hours between 1 and 2000 and (kind <> 'curso' or hours < 160)));

-- Completar una explicación: misma lógica que una misión aprobada (desbloqueo, acceso, XP, racha).
create or replace function public.complete_reading(p_user uuid, p_mission uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k text;
begin
  select kind into k from missions where id = p_mission;
  if not found then raise exception 'mision_no_encontrada'; end if;
  if k <> 'explicacion' then raise exception 'no_es_explicacion'; end if;
  return public.complete_mission(p_user, p_mission, 100, 0, '{}');
end $$;

revoke all on function public.complete_reading(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_reading(uuid, uuid) to service_role;

-- Lecciones gratis de un curso de pago: hasta el primer reto (incluido).
create or replace function public.free_until(p_course text) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select min(position) from missions where course_slug = p_course and kind = 'reto'), 1);
$$;

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
  if m.position > public.free_until(m.course_slug) and not public.has_course_access(p_user, m.course_slug) then
    raise exception 'requiere_suscripcion';
  end if;
  return false;
end $$;

revoke all on function public.free_until(text) from public, anon, authenticated;
grant execute on function public.free_until(text) to service_role;
revoke all on function public.mission_is_locked(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mission_is_locked(uuid, uuid) to service_role;
