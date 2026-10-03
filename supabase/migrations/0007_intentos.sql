-- Intentos de misión: cada respuesta se revisa en el servidor en el momento y queda fija.
-- Así la misión puede reaccionar pregunta a pregunta (enemigos, Guardián, explicación inmediata)
-- sin que nadie pueda cambiar una respuesta después de ver la correcta.
-- La nota final se calcula con las respuestas guardadas, nunca con lo que mande el navegador.
-- Sin DROP: se puede ejecutar varias veces.

create table if not exists public.attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mission_id  uuid not null references public.missions(id) on delete cascade,
  answers     integer[] not null,          -- una por pregunta, en orden; -1 = sin responder
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);
-- Como mucho un intento abierto por estudiante y misión.
create unique index if not exists attempts_open_idx on public.attempts (user_id, mission_id) where finished_at is null;

alter table public.attempts enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attempts' and policyname = 'intentos propios') then
    create policy "intentos propios" on public.attempts for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.attempts from anon, authenticated;
grant select on public.attempts to authenticated;

-- Responde una pregunta (p_index empieza en 0). La primera respuesta es la que cuenta:
-- repetir la llamada devuelve lo ya guardado.
create or replace function public.answer_question(p_user uuid, p_mission uuid, p_index integer, p_choice integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  qs record; att record; n integer; q record; stored integer; right_count integer;
begin
  perform 1 from missions mi join courses c on c.slug = mi.course_slug where mi.id = p_mission and c.published;
  if not found then raise exception 'mision_no_encontrada'; end if;

  perform 1 from profiles where id = p_user for update;
  if not found then raise exception 'perfil_no_encontrado'; end if;
  if public.mission_is_locked(p_user, p_mission) then raise exception 'mision_bloqueada'; end if;

  select array_agg(correct_index order by position) as keys, count(*)::int as total into qs
    from questions where mission_id = p_mission;
  n := qs.total;
  if n = 0 then raise exception 'sin_preguntas'; end if;
  if p_index is null or p_index < 0 or p_index >= n then raise exception 'pregunta_invalida'; end if;

  select * into q from questions where mission_id = p_mission order by position offset p_index limit 1;
  if p_choice is null or p_choice < 0 or p_choice >= jsonb_array_length(q.options) then raise exception 'respuesta_invalida'; end if;

  select * into att from attempts where user_id = p_user and mission_id = p_mission and finished_at is null for update;
  if not found then
    insert into attempts (user_id, mission_id, answers) values (p_user, p_mission, array_fill(-1, array[n])) returning * into att;
  elsif coalesce(array_length(att.answers, 1), 0) <> n then
    -- La misión cambió de preguntas desde que se empezó: se vuelve a empezar.
    update attempts set answers = array_fill(-1, array[n]), started_at = now() where id = att.id returning * into att;
  end if;

  stored := att.answers[p_index + 1];
  if stored = -1 then
    stored := p_choice;
    update attempts set answers[p_index + 1] = p_choice where id = att.id returning * into att;
  end if;

  select count(*)::int into right_count from generate_subscripts(att.answers, 1) as i where att.answers[i] = qs.keys[i];

  return jsonb_build_object(
    'index', p_index, 'choice', stored, 'correct', stored = q.correct_index,
    'correct_index', q.correct_index, 'explanation', q.explanation,
    'answered', (select count(*)::int from unnest(att.answers) a where a >= 0),
    'right', right_count, 'total', n);
end $$;

-- Cierra el intento abierto: calcula la nota con las respuestas guardadas y registra el resultado.
create or replace function public.finish_attempt(p_user uuid, p_mission uuid, p_pass_mark integer, p_items_on_first text[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare att record; keys integer[]; n integer; right_count integer; score integer; r jsonb;
begin
  select * into att from attempts where user_id = p_user and mission_id = p_mission and finished_at is null for update;
  if not found then raise exception 'sin_intento'; end if;
  select array_agg(correct_index order by position) into keys from questions where mission_id = p_mission;
  n := coalesce(array_length(keys, 1), 0);
  if n = 0 then raise exception 'sin_preguntas'; end if;
  if coalesce(array_length(att.answers, 1), 0) <> n or -1 = any(att.answers) then raise exception 'respuestas_incompletas'; end if;

  select count(*)::int into right_count from generate_subscripts(att.answers, 1) as i where att.answers[i] = keys[i];
  score := round(100.0 * right_count / n)::int;

  update attempts set finished_at = now() where id = att.id;
  r := public.complete_mission(p_user, p_mission, score, p_pass_mark, p_items_on_first);
  return r || jsonb_build_object('answers', to_jsonb(att.answers));
end $$;

revoke all on function public.answer_question(uuid, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.finish_attempt(uuid, uuid, integer, text[]) from public, anon, authenticated;
grant execute on function public.answer_question(uuid, uuid, integer, integer) to service_role;
grant execute on function public.finish_attempt(uuid, uuid, integer, text[]) to service_role;
