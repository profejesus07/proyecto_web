-- Constancias de asistencia de los cursos cortos (educación informal: Ley 115 de 1994 y
-- Decreto 1075 de 2015, art. 2.6.6.8). Firma electrónica: Ley 527 de 1999 y Decreto 2364 de 2012.
--  · platform_settings: datos del responsable que firma (una sola fila) y su firma en PNG.
--  · certificates: cada constancia es una «foto» fija de los datos al expedirla, con número consecutivo
--    y código de verificación público. No se edita ni se borra.
-- Sin borrados. Se puede ejecutar varias veces.

create table if not exists public.platform_settings (
  id            boolean primary key default true check (id),
  issuer_name   text check (issuer_name is null or char_length(issuer_name) between 3 and 120),
  issuer_title  text check (issuer_title is null or char_length(issuer_title) between 3 and 160),
  issuer_doc    text check (issuer_doc is null or char_length(issuer_doc) between 4 and 40),
  city          text check (city is null or char_length(city) between 2 and 80),
  signature_png text check (signature_png is null or (signature_png like 'data:image/png;base64,%' and length(signature_png) < 400000)),
  updated_at    timestamptz not null default now()
);
insert into public.platform_settings (id) values (true) on conflict do nothing;
alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from anon, authenticated;

create sequence if not exists public.certificate_number_seq;

create table if not exists public.certificates (
  id               uuid primary key default gen_random_uuid(),
  number           integer not null unique default nextval('public.certificate_number_seq'),
  code             text not null unique check (code ~ '^UMB-[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  user_id          uuid references auth.users(id) on delete set null,
  course_slug      text not null,
  participant_name text not null check (char_length(participant_name) between 5 and 120),
  doc_type         text not null check (doc_type in ('CC', 'TI', 'CE', 'PPT', 'PA')),
  doc_number       text not null check (doc_number ~ '^[A-Za-z0-9-]{4,20}$'),
  course_title     text not null,
  hours            integer not null check (hours between 1 and 159),
  trainer_name     text not null,
  trainer_title    text not null,
  issuer_name      text not null,
  issuer_title     text,
  city             text,
  started_on       date not null,
  finished_on      date not null,
  issued_at        timestamptz not null default now(),
  unique (user_id, course_slug)
);
alter table public.certificates enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificates' and policyname = 'constancias propias') then
    create policy "constancias propias" on public.certificates for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.certificates from anon, authenticated;
grant select on public.certificates to authenticated;

-- Expide (o devuelve la ya expedida) la constancia de un curso corto terminado.
create or replace function public.issue_certificate(p_user uuid, p_course text, p_name text, p_doc_type text, p_doc_number text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c record; st record; existing record; n_missions integer; n_done integer;
  started date; finished date; new_code text; alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  nm text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  doc text := upper(btrim(coalesce(p_doc_number, '')));
begin
  select * into existing from certificates where user_id = p_user and course_slug = p_course;
  if found then return jsonb_build_object('code', existing.code, 'new', false); end if;

  select * into c from courses where slug = p_course and kind = 'curso' and published;
  if not found then raise exception 'curso_no_encontrado'; end if;
  if c.hours is null or c.trainer_name is null or c.trainer_title is null then raise exception 'curso_incompleto'; end if;

  select count(*), count(*) filter (where exists (
           select 1 from mission_progress pr where pr.user_id = p_user and pr.mission_id = m.id and pr.completed_at is not null))
    into n_missions, n_done
    from missions m where m.course_slug = p_course;
  if n_missions = 0 or n_done < n_missions then raise exception 'curso_sin_terminar'; end if;

  select * into st from platform_settings where id;
  if st.issuer_name is null or st.signature_png is null then raise exception 'falta_configuracion'; end if;

  select min(d)::date, max(f)::date into started, finished from (
    select (coalesce(t.started_at, pr.completed_at) at time zone 'America/Bogota') as d,
           (pr.completed_at at time zone 'America/Bogota') as f
      from missions m
      join mission_progress pr on pr.mission_id = m.id and pr.user_id = p_user
      left join lateral (select min(a.started_at) as started_at from attempts a where a.user_id = p_user and a.mission_id = m.id) t on true
     where m.course_slug = p_course
  ) x;

  loop
    select 'UMB-' || string_agg(substr(alphabet, 1 + floor(random() * 32)::int, 1), '') filter (where i <= 4)
                 || '-' || string_agg(substr(alphabet, 1 + floor(random() * 32)::int, 1), '') filter (where i > 4)
      into new_code from generate_series(1, 8) i;
    exit when not exists (select 1 from certificates where code = new_code);
  end loop;

  insert into certificates (code, user_id, course_slug, participant_name, doc_type, doc_number, course_title, hours,
                            trainer_name, trainer_title, issuer_name, issuer_title, city, started_on, finished_on)
  values (new_code, p_user, p_course, nm, p_doc_type, doc, c.title, c.hours,
          c.trainer_name, c.trainer_title, st.issuer_name, st.issuer_title, st.city, started, finished);
  return jsonb_build_object('code', new_code, 'new', true);
end $$;

revoke all on function public.issue_certificate(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.issue_certificate(uuid, text, text, text, text) to service_role;
