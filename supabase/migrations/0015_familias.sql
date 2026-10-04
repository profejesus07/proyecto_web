-- Panel de familias (Guardianes del Hogar).
-- El estudiante genera un código de familia en su perfil y lo comparte: así da su permiso.
-- La familia lo escribe y queda vinculada; ve, solo para leer, el avance de su hijo o hija:
-- nombre de aventurero, rango, racha, lecciones, notas, clases y constancias.
-- Nunca ve el correo, la contraseña ni las respuestas. Cualquiera de los dos puede desvincularse
-- (queda registrado con revoked_at; no se borra). Todo pasa por funciones del servidor.
-- Sin DROP ni borrados: se puede ejecutar varias veces.

create table if not exists public.family_codes (
  student_id uuid primary key references auth.users(id) on delete cascade,
  code       text not null unique check (code ~ '^[A-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.family_links (
  family_id  uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (family_id, student_id)
);
create index if not exists family_links_student_idx on public.family_links (student_id);

alter table public.family_codes enable row level security;
alter table public.family_links enable row level security;
revoke all on public.family_codes, public.family_links from anon, authenticated;

-- Código de 8 caracteres sin letras que se confunden (sin O, 0, I, 1).
create or replace function public.new_family_code() returns text language plpgsql volatile set search_path = public as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text;
begin
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '') into c from generate_series(1, 8);
    exit when not exists (select 1 from family_codes where code = c);
  end loop;
  return c;
end $$;

-- Código del estudiante (se crea la primera vez). Con p_renew, cambia: el anterior deja de servir.
create or replace function public.family_code(p_student uuid, p_renew boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  perform 1 from profiles where id = p_student and role = 'estudiante';
  if not found then raise exception 'solo_estudiantes'; end if;
  insert into family_codes (student_id, code) values (p_student, public.new_family_code())
    on conflict (student_id) do update set code = case when p_renew then public.new_family_code() else family_codes.code end,
                                           created_at = case when p_renew then now() else family_codes.created_at end
    returning code into c;
  return c;
end $$;

-- La familia se vincula con el código que le dio el estudiante.
create or replace function public.link_family(p_family uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare st record; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  perform 1 from profiles where id = p_family and role = 'familia' for update;
  if not found then raise exception 'solo_familias'; end if;
  select p.id, p.display_name into st from family_codes f join profiles p on p.id = f.student_id
   where f.code = c and p.role = 'estudiante';
  if not found then raise exception 'codigo_invalido'; end if;
  if (select count(*) from family_links where family_id = p_family and revoked_at is null and student_id <> st.id) >= 8 then
    raise exception 'demasiados_hijos';
  end if;
  if (select count(*) from family_links where student_id = st.id and revoked_at is null and family_id <> p_family) >= 4 then
    raise exception 'demasiadas_familias';
  end if;
  insert into family_links (family_id, student_id) values (p_family, st.id)
    on conflict (family_id, student_id) do update set revoked_at = null, created_at = now();
  return jsonb_build_object('id', st.id, 'name', st.display_name);
end $$;

-- Desvincular: la familia (p_actor = familia) o el estudiante (p_actor = estudiante).
create or replace function public.unlink_family(p_actor uuid, p_family uuid, p_student uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_actor <> p_family and p_actor <> p_student then raise exception 'no_autorizado'; end if;
  update family_links set revoked_at = now() where family_id = p_family and student_id = p_student and revoked_at is null;
end $$;

-- Familias vinculadas a un estudiante (para que sepa quién ve su avance).
create or replace function public.student_families(p_student uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name, 'since', l.created_at) order by l.created_at), '[]'::jsonb)
    from family_links l join profiles p on p.id = l.family_id
   where l.student_id = p_student and l.revoked_at is null;
$$;

-- Lo que ve la familia de cada hijo o hija vinculado.
create or replace function public.family_overview(p_family uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform 1 from profiles where id = p_family and role = 'familia';
  if not found then raise exception 'solo_familias'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.display_name,
      'avatar', coalesce(p.avatar->>'base', 'aria'), 'look', coalesce(p.avatar->'look', '{}'::jsonb),
      'xp', p.xp, 'streak', p.streak, 'last_active', p.last_active, 'since', l.created_at,
      'week_attempts', (select count(*)::int from attempts a where a.user_id = p.id and a.finished_at > now() - interval '7 days'),
      'courses', coalesce((
        select jsonb_agg(jsonb_build_object(
          'slug', c.slug, 'title', c.title, 'kind', c.kind,
          'total', (select count(*)::int from missions m where m.course_slug = c.slug),
          'lessons', coalesce((
            select jsonb_agg(jsonb_build_object('position', m.position, 'title', m.title, 'best_score', pr.best_score,
                                                'attempts', pr.attempts, 'completed', pr.completed_at is not null) order by m.position)
              from mission_progress pr join missions m on m.id = pr.mission_id
             where pr.user_id = p.id and m.course_slug = c.slug), '[]'::jsonb)
        ) order by c.position)
          from courses c
         where c.published and exists (select 1 from mission_progress pr join missions m on m.id = pr.mission_id
                                        where pr.user_id = p.id and m.course_slug = c.slug)), '[]'::jsonb),
      'classes', coalesce((
        select jsonb_agg(jsonb_build_object('name', cl.name, 'teacher', t.display_name) order by cl.name)
          from class_members cm join classes cl on cl.id = cm.class_id join profiles t on t.id = cl.teacher_id
         where cm.student_id = p.id and cl.archived_at is null), '[]'::jsonb),
      'certificates', coalesce((
        select jsonb_agg(jsonb_build_object('code', ce.code, 'course_title', ce.course_title, 'hours', ce.hours, 'issued_at', ce.issued_at) order by ce.issued_at desc)
          from certificates ce where ce.user_id = p.id), '[]'::jsonb)
    ) order by p.display_name)
      from family_links l join profiles p on p.id = l.student_id
     where l.family_id = p_family and l.revoked_at is null and p.role = 'estudiante'), '[]'::jsonb);
end $$;

revoke all on function public.new_family_code() from public, anon, authenticated;
revoke all on function public.family_code(uuid, boolean) from public, anon, authenticated;
revoke all on function public.link_family(uuid, text) from public, anon, authenticated;
revoke all on function public.unlink_family(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.student_families(uuid) from public, anon, authenticated;
revoke all on function public.family_overview(uuid) from public, anon, authenticated;
grant execute on function public.new_family_code() to service_role;
grant execute on function public.family_code(uuid, boolean) to service_role;
grant execute on function public.link_family(uuid, text) to service_role;
grant execute on function public.unlink_family(uuid, uuid, uuid) to service_role;
grant execute on function public.student_families(uuid) to service_role;
grant execute on function public.family_overview(uuid) to service_role;
