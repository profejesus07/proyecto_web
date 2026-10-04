-- Mensajes de apoyo de la familia al estudiante (biblia §3.3: «Hoy conquistaste un portal, ¡orgullo!»).
-- Son frases fijas identificadas por una clave (la web tiene el texto): no hay texto libre que moderar.
-- Solo una familia vinculada puede enviarlos, con un máximo de 5 al día por hijo o hija.
-- El estudiante los ve en el Gremio y los marca como leídos. Sin borrados ni DROP.

create table if not exists public.family_messages (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  message    text not null check (message ~ '^[a-z_]{2,30}$'),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists family_messages_student_idx on public.family_messages (student_id, created_at desc);

alter table public.family_messages enable row level security;
revoke all on public.family_messages from anon, authenticated;

create or replace function public.send_family_message(p_family uuid, p_student uuid, p_message text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare sent int;
begin
  perform 1 from family_links where family_id = p_family and student_id = p_student and revoked_at is null for update;
  if not found then raise exception 'no_vinculado'; end if;
  if p_message is null or p_message !~ '^[a-z_]{2,30}$' then raise exception 'mensaje_invalido'; end if;
  select count(*) into sent from family_messages
   where family_id = p_family and student_id = p_student
     and (created_at at time zone 'America/Bogota')::date = (now() at time zone 'America/Bogota')::date;
  if sent >= 5 then raise exception 'demasiados_mensajes'; end if;
  insert into family_messages (family_id, student_id, message) values (p_family, p_student, p_message);
  return jsonb_build_object('remaining', 4 - sent);
end $$;

-- Mensajes sin leer de las familias que siguen vinculadas (últimos 30 días, máximo 5).
create or replace function public.student_messages(p_student uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) from (
    select jsonb_build_object('id', m.id, 'message', m.message, 'created_at', m.created_at,
                              'from', p.display_name, 'guide', p.avatar->'look'->>'guide') as x
      from family_messages m
      join family_links l on l.family_id = m.family_id and l.student_id = m.student_id and l.revoked_at is null
      join profiles p on p.id = m.family_id
     where m.student_id = p_student and m.read_at is null and m.created_at > now() - interval '30 days'
     order by m.created_at desc
     limit 5
  ) t;
$$;

create or replace function public.read_family_messages(p_student uuid)
returns void language sql security definer set search_path = public as $$
  update family_messages set read_at = now() where student_id = p_student and read_at is null;
$$;

-- Cuántos mensajes le quedan hoy a la familia para cada hijo o hija.
create or replace function public.family_messages_left(p_family uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(l.student_id, 5 - coalesce(c.n, 0)), '{}'::jsonb)
    from family_links l
    left join (
      select student_id, count(*)::int as n from family_messages
       where family_id = p_family
         and (created_at at time zone 'America/Bogota')::date = (now() at time zone 'America/Bogota')::date
       group by student_id
    ) c on c.student_id = l.student_id
   where l.family_id = p_family and l.revoked_at is null;
$$;

revoke all on function public.send_family_message(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.student_messages(uuid) from public, anon, authenticated;
revoke all on function public.read_family_messages(uuid) from public, anon, authenticated;
revoke all on function public.family_messages_left(uuid) from public, anon, authenticated;
grant execute on function public.send_family_message(uuid, uuid, text) to service_role;
grant execute on function public.student_messages(uuid) to service_role;
grant execute on function public.read_family_messages(uuid) to service_role;
grant execute on function public.family_messages_left(uuid) to service_role;
