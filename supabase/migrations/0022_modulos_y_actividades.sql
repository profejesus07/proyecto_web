-- Módulos, actividades de varios tipos y cursos gratis.
--  · Un curso corto se organiza en módulos; cada módulo tiene sus lecciones (missions) y su propio Guardián,
--    que aparece como jefe en la última lección del módulo. Así cada módulo trae su parte de la historia.
--    Las lecciones siguen numeradas en orden dentro del curso (missions.position), agrupadas por módulo.
--  · Actividades (questions.kind):
--      opcion      selección múltiple (como siempre)
--      vf          verdadero o falso (options = ["Verdadero", "Falso"])
--      completar   respuesta corta: options = respuestas aceptadas (se compara sin tildes ni mayúsculas)
--      ordenar     options = pasos en el orden correcto (el estudiante los recibe desordenados)
--      relacionar  options = columna izquierda; data.right = su pareja en el mismo orden
--    En las actividades que no son de opciones, correct_index = 0 y el intento guarda 0 (bien) o 1 (mal):
--    así la nota, los poderes y el repaso siguen funcionando igual.
--  · courses.is_free: el curso completo es gratis para todos.
-- Se puede ejecutar varias veces. Sin borrados.

-- ============ Cursos gratis ============
alter table public.courses add column if not exists is_free boolean not null default false;

create or replace function public.has_course_access(p_user uuid, p_course text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from courses where slug = p_course and is_free)
      or exists (select 1 from profiles where id = p_user and (role = 'docente' or is_admin))
      or exists (select 1 from course_access
                  where user_id = p_user and course_slug = p_course and revoked_at is null
                    and (expires_at is null or expires_at > now()));
$$;

-- ============ Módulos ============
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  course_slug text not null references public.courses(slug) on delete cascade,
  position    integer not null,
  title       text not null check (char_length(title) between 2 and 80),
  summary     text not null default '' check (char_length(summary) <= 400),
  guardian    text not null,
  created_at  timestamptz not null default now()
);
create index if not exists modules_course_idx on public.modules (course_slug, position);
alter table public.modules enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'modules' and policyname = 'modulos publicados') then
    create policy "modulos publicados" on public.modules for select to anon, authenticated
      using (exists (select 1 from public.courses c where c.slug = course_slug and c.published));
  end if;
end $$;
revoke all on public.modules from anon, authenticated;
grant select on public.modules to anon, authenticated;

alter table public.missions add column if not exists module_id uuid references public.modules(id) on delete set null;
create index if not exists missions_module_idx on public.missions (module_id);

-- Los cursos cortos que ya existían quedan con un solo módulo, con su Guardián de siempre.
do $$ declare c record; mid uuid; begin
  for c in select * from courses co where co.kind = 'curso'
             and exists (select 1 from missions mi where mi.course_slug = co.slug and mi.module_id is null) loop
    select id into mid from modules where course_slug = c.slug order by position limit 1;
    if mid is null then
      insert into modules (course_slug, position, title, summary, guardian)
      values (c.slug, 1, 'Módulo 1', '', c.guardian) returning id into mid;
    end if;
    update missions set module_id = mid where course_slug = c.slug and module_id is null;
  end loop;
end $$;

-- Vuelve a numerar las lecciones de un curso: primero por módulo, luego por su orden dentro del módulo.
create or replace function public.renumber_course(p_course text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update missions set position = position + 100000 where course_slug = p_course;
  with o as (
    select mi.id, row_number() over (order by coalesce(mo.position, 0), mi.position) as rn
      from missions mi left join modules mo on mo.id = mi.module_id
     where mi.course_slug = p_course)
  update missions mi set position = o.rn from o where mi.id = o.id;
  with o as (select id, row_number() over (order by position, created_at) as rn from modules where course_slug = p_course)
  update modules mo set position = o.rn from o where mo.id = o.id;
end $$;

-- ============ Actividades ============
alter table public.questions add column if not exists kind text not null default 'opcion';
alter table public.questions add column if not exists data jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'questions_kind_check') then
    alter table public.questions add constraint questions_kind_check check (kind in ('opcion', 'vf', 'completar', 'ordenar', 'relacionar'));
  end if;
end $$;

-- Texto comparable: minúsculas, sin tildes ni signos, espacios simples.
create or replace function public.norm_answer(t text) returns text
language sql immutable set search_path = public as $$
  select trim(regexp_replace(regexp_replace(translate(lower(coalesce(t, '')), 'áéíóúüñàèìòù', 'aeiouunaeiou'), '[^a-z0-9 ]+', ' ', 'g'), '\s+', ' ', 'g'));
$$;

-- Responde cualquier tipo de actividad. Revisa la respuesta aquí y la guarda con answer_question
-- (que maneja el intento, el Escudo de Calma y la Lluvia de Estrellas).
create or replace function public.answer_activity(p_user uuid, p_mission uuid, p_index integer, p_response jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q record; n integer; ok boolean; choice integer; r jsonb; given jsonb;
begin
  select count(*)::int into n from questions where mission_id = p_mission;
  if n = 0 then raise exception 'sin_preguntas'; end if;
  if p_index is null or p_index < 0 or p_index >= n then raise exception 'pregunta_invalida'; end if;
  select * into q from questions where mission_id = p_mission order by position offset p_index limit 1;

  if q.kind in ('opcion', 'vf') then
    if jsonb_typeof(p_response) <> 'number' then raise exception 'respuesta_invalida'; end if;
    return public.answer_question(p_user, p_mission, p_index, (p_response #>> '{}')::integer);
  end if;

  if q.kind = 'completar' then
    if jsonb_typeof(p_response) <> 'string' or char_length(p_response #>> '{}') > 200 then raise exception 'respuesta_invalida'; end if;
    ok := public.norm_answer(p_response #>> '{}') <> ''
          and exists (select 1 from jsonb_array_elements_text(q.options) a where public.norm_answer(a) = public.norm_answer(p_response #>> '{}'));
  elsif q.kind = 'ordenar' then
    if jsonb_typeof(p_response) <> 'array' or jsonb_array_length(p_response) <> jsonb_array_length(q.options) then raise exception 'respuesta_invalida'; end if;
    ok := p_response = q.options;
  else -- relacionar
    given := q.data->'right';
    if jsonb_typeof(p_response) <> 'array' or jsonb_array_length(p_response) <> jsonb_array_length(q.options) then raise exception 'respuesta_invalida'; end if;
    ok := p_response = given;
  end if;

  choice := case when ok then 0 else 1 end;
  r := public.answer_question(p_user, p_mission, p_index, choice);
  -- Con el Escudo activo no se muestra la solución.
  if coalesce((r->>'shielded')::boolean, false) then return r; end if;
  return r || jsonb_build_object('solution', case q.kind
    when 'completar' then to_jsonb(q.options->>0)
    when 'ordenar' then q.options
    else jsonb_build_object('left', q.options, 'right', q.data->'right') end);
end $$;

-- ============ Ayudas y poderes según el tipo de actividad ============
create or replace function public.use_aid(p_user uuid, p_question uuid, p_item text, p_daily_cap integer, p_min_xp integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  qq record; prof record; prev record;
  today date := (now() at time zone 'America/Bogota')::date;
  is_free boolean := false; used_today integer; have integer;
  wrong integer[]; n_remove integer; out_payload jsonb;
begin
  if p_item not in ('obj_ayuda_pista', 'obj_ayuda_5050') then raise exception 'ayuda_invalida'; end if;

  select q.id, q.mission_id, q.options, q.correct_index, q.hint, q.kind
    into qq
    from questions q join missions mi on mi.id = q.mission_id join courses c on c.slug = mi.course_slug
   where q.id = p_question and c.published;
  if not found then raise exception 'pregunta_no_encontrada'; end if;

  select * into prof from profiles where id = p_user for update;
  if not found then raise exception 'perfil_no_encontrado'; end if;

  if public.mission_is_locked(p_user, qq.mission_id) then raise exception 'mision_bloqueada'; end if;

  -- Ya la usó hoy en esta pregunta: se devuelve lo mismo sin cobrar.
  select * into prev from aid_uses where user_id = p_user and item_id = p_item and question_id = p_question and used_on = today;
  if found then
    select quantity into have from consumables where user_id = p_user and item_id = p_item;
    return prev.payload || jsonb_build_object('charged', false, 'free', prev.free, 'left', coalesce(have, 0));
  end if;

  if prof.xp < coalesce(p_min_xp, 0) then raise exception 'rango_insuficiente'; end if;

  if p_item = 'obj_ayuda_pista' then
    if coalesce(trim(qq.hint), '') = '' then raise exception 'sin_pista'; end if;
    is_free := not exists (select 1 from aid_uses where user_id = p_user and item_id = p_item
                            and mission_id = qq.mission_id and used_on = today and free);
    out_payload := jsonb_build_object('hint', qq.hint);
  else
    -- El 50/50 solo sirve en selección múltiple (en verdadero/falso revelaría la respuesta).
    if qq.kind <> 'opcion' then raise exception 'no_aplica'; end if;
    select array_agg(i order by random()) into wrong
      from generate_series(0, jsonb_array_length(qq.options) - 1) as i
     where i <> qq.correct_index;
    n_remove := least(ceil(coalesce(array_length(wrong, 1), 0) / 2.0)::integer, coalesce(array_length(wrong, 1), 0) - 1);
    if n_remove < 1 then raise exception 'no_aplica'; end if;
    out_payload := jsonb_build_object('removed', (select to_jsonb(array_agg(x order by x)) from unnest(wrong[1:n_remove]) as x));
  end if;

  if is_free then
    select quantity into have from consumables where user_id = p_user and item_id = p_item;
  else
    select count(*) into used_today from aid_uses where user_id = p_user and item_id = p_item and used_on = today and not free;
    if used_today >= p_daily_cap then raise exception 'tope_diario'; end if;
    update consumables set quantity = quantity - 1, updated_at = now()
     where user_id = p_user and item_id = p_item and quantity > 0
    returning quantity into have;
    if not found then raise exception 'sin_unidades'; end if;
  end if;

  insert into aid_uses (user_id, item_id, mission_id, question_id, used_on, free, payload)
  values (p_user, p_item, qq.mission_id, p_question, today, is_free, out_payload);

  return out_payload || jsonb_build_object('charged', not is_free, 'free', is_free, 'left', coalesce(have, 0));
end $$;

create or replace function public.use_power(p_user uuid, p_mission uuid, p_index integer, p_item text, p_daily_cap integer, p_min_xp integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  q record; prof record; prev record; att record; keys integer[]; n integer;
  today date := (now() at time zone 'America/Bogota')::date;
  permanent boolean := p_item in ('obj_poder_sombra', 'obj_poder_aliento');
  answered boolean := false; used_today integer; have integer; out_payload jsonb;
  wrong integer[]; v_choice integer; v_stems text[]; v_hints jsonb;
  stop constant text[] := array['para','como','cual','cuales','esta','este','esto','estos','estas','pero','porque','donde','cuando',
    'entre','sobre','tiene','tienes','todo','todos','toda','todas','cada','hace','hacer','puede','puedes','desde','hasta','ellos','ella',
    'solo','otro','otra','otros','otras','mismo','algo','tambien','antes','despues','ahora','siempre','nunca','menos','mucho','mucha',
    'poco','bien','tiene','seria','eres','estas','sera','sean','esos','esas','aqui','alla','pues','cosa','cosas','vamos'];
begin
  if p_item not in ('obj_poder_rayo', 'obj_poder_escudo', 'obj_poder_aura', 'obj_poder_lluvia', 'obj_poder_kuro', 'obj_poder_pulso',
                    'obj_poder_sombra', 'obj_poder_aliento') then raise exception 'poder_invalido'; end if;
  perform 1 from missions mi join courses c on c.slug = mi.course_slug where mi.id = p_mission and c.published;
  if not found then raise exception 'mision_no_encontrada'; end if;
  select * into prof from profiles where id = p_user for update;
  if not found then raise exception 'perfil_no_encontrado'; end if;
  if public.mission_is_locked(p_user, p_mission) then raise exception 'mision_bloqueada'; end if;

  select array_agg(correct_index order by position), count(*)::int into keys, n from questions where mission_id = p_mission;
  if n = 0 then raise exception 'sin_preguntas'; end if;
  if p_index is null or p_index < 0 or p_index >= n then raise exception 'pregunta_invalida'; end if;
  select * into q from questions where mission_id = p_mission order by position offset p_index limit 1;

  select * into att from attempts where user_id = p_user and mission_id = p_mission and finished_at is null for update;
  if found and coalesce(array_length(att.answers, 1), 0) = n then answered := att.answers[p_index + 1] >= 0; end if;

  -- Ya lo usó hoy en esta pregunta: se devuelve lo mismo sin cobrar (el Segundo Aliento no se repite).
  select * into prev from aid_uses where user_id = p_user and item_id = p_item and question_id = q.id and used_on = today;
  if found then
    if p_item = 'obj_poder_aliento' then raise exception 'ya_usado'; end if;
    select quantity into have from consumables where user_id = p_user and item_id = p_item;
    return prev.payload || jsonb_build_object('charged', false, 'left', coalesce(have, 0));
  end if;

  if prof.xp < coalesce(p_min_xp, 0) then raise exception 'rango_insuficiente'; end if;
  if permanent and not exists (select 1 from inventory where user_id = p_user and item_id = p_item) then raise exception 'no_lo_tienes'; end if;

  if p_item = 'obj_poder_rayo' then
    if answered then raise exception 'ya_respondida'; end if;
    if coalesce(trim(q.hint), '') = '' then raise exception 'sin_pista'; end if;
    -- Raíces (5 letras, sin tildes) de las palabras que la pregunta comparte con su pista.
    select coalesce(array_agg(s), '{}') into v_stems from (
      select distinct left(w, 5) as s from regexp_split_to_table(translate(lower(q.prompt), 'áéíóúüñ', 'aeiouun'), '[^a-z0-9]+') w
       where length(w) >= 4 and not (w = any(stop))
      intersect
      select distinct left(w, 5) from regexp_split_to_table(translate(lower(q.hint), 'áéíóúüñ', 'aeiouun'), '[^a-z0-9]+') w
       where length(w) >= 4 and not (w = any(stop))
    ) t;
    out_payload := jsonb_build_object('stems', to_jsonb(v_stems),
      'lead', case when cardinality(v_stems) = 0 then array_to_string((regexp_split_to_array(trim(q.hint), '\s+'))[1:6], ' ') || '…' end);
  elsif p_item in ('obj_poder_escudo', 'obj_poder_lluvia') then
    if answered then raise exception 'ya_respondida'; end if;
    -- La Lluvia premia acertar por cuenta propia: no vale si la respuesta ya se vio hoy (Segundo Aliento o Sombra Dorada).
    if p_item = 'obj_poder_lluvia' and exists (select 1 from aid_uses where user_id = p_user and question_id = q.id and used_on = today
                                                 and item_id in ('obj_poder_aliento', 'obj_poder_sombra')) then
      raise exception 'no_aplica';
    end if;
    out_payload := jsonb_build_object('spent', false);
  elsif p_item = 'obj_poder_aura' then
    if answered then raise exception 'ya_respondida'; end if;
    -- Solo tiene sentido si queda otra pregunta por responder.
    if (att.id is null and n < 2) or (att.id is not null and (select count(*) from unnest(att.answers) with ordinality a(v, i) where v = -1 and i <> p_index + 1) = 0) then
      raise exception 'no_aplica';
    end if;
    out_payload := '{}'::jsonb;
  elsif p_item = 'obj_poder_kuro' then
    if answered then raise exception 'ya_respondida'; end if;
    select array_agg(i order by random()) into wrong from generate_series(0, jsonb_array_length(q.options) - 1) as i where i <> q.correct_index;
    out_payload := jsonb_build_object('hint', nullif(trim(q.hint), ''),
      'removed', case when q.kind = 'opcion' and coalesce(array_length(wrong, 1), 0) >= 2 then jsonb_build_array(wrong[1]) else '[]'::jsonb end);
    if out_payload->>'hint' is null and jsonb_array_length(out_payload->'removed') = 0 then raise exception 'no_aplica'; end if;
  elsif p_item = 'obj_poder_pulso' then
    select jsonb_object_agg(qq.id, qq.hint) into v_hints from questions qq
     where qq.mission_id = p_mission and coalesce(trim(qq.hint), '') <> ''
       and exists (select 1 from aid_uses u where u.user_id = p_user and u.question_id = qq.id and u.item_id in ('obj_ayuda_pista', 'obj_poder_kuro'));
    if v_hints is null then raise exception 'sin_recuerdos'; end if;
    out_payload := jsonb_build_object('hints', v_hints);
  elsif p_item = 'obj_poder_sombra' then
    if answered then raise exception 'ya_respondida'; end if;
    -- Marca la opción elegida: solo tiene sentido en preguntas con opciones.
    if q.kind not in ('opcion', 'vf') then raise exception 'no_aplica'; end if;
    select a.answers[p_index + 1] into v_choice from attempts a
     where a.user_id = p_user and a.mission_id = p_mission and a.finished_at is not null
       and coalesce(array_length(a.answers, 1), 0) = n and a.answers[p_index + 1] = keys[p_index + 1]
     order by a.finished_at desc limit 1;
    if v_choice is null then raise exception 'sin_jugada'; end if;
    out_payload := jsonb_build_object('choice', v_choice);
  else -- Segundo Aliento
    if not answered or att.answers[p_index + 1] = keys[p_index + 1] then raise exception 'no_aplica'; end if;
    update attempts set answers[p_index + 1] = -1 where id = att.id;
    out_payload := jsonb_build_object('reset', true);
  end if;

  select count(*) into used_today from aid_uses where user_id = p_user and item_id = p_item and used_on = today;
  if used_today >= p_daily_cap then raise exception 'tope_diario'; end if;
  if not permanent then
    update consumables set quantity = quantity - 1, updated_at = now()
     where user_id = p_user and item_id = p_item and quantity > 0 returning quantity into have;
    if not found then raise exception 'sin_unidades'; end if;
  end if;
  insert into aid_uses (user_id, item_id, mission_id, question_id, used_on, free, payload)
  values (p_user, p_item, p_mission, q.id, today, false, out_payload);
  return out_payload || jsonb_build_object('charged', true, 'left', coalesce(have, 0));
end $$;

-- ============ Un jefe por módulo ============
create or replace function public.complete_mission(
  p_user uuid, p_mission uuid, p_score integer, p_pass_mark integer, p_items_on_first text[] default '{}'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  m record; prof record; prog record;
  had_prog boolean; passed boolean; first boolean := false;
  xp_gain integer := 0; coin_gain integer := 0; gem_gain integer := 0;
  today date := (now() at time zone 'America/Bogota')::date;
  new_streak integer; granted text[] := '{}'; item text; ok boolean;
  boss_done boolean := false; course_done boolean := false;
begin
  if p_score < 0 or p_score > 100 then raise exception 'puntaje_invalido'; end if;
  passed := p_score >= p_pass_mark;

  select mi.id, mi.course_slug, mi.position, mi.xp_reward, mi.is_boss
    into m
    from missions mi join courses c on c.slug = mi.course_slug
   where mi.id = p_mission and c.published;
  if not found then raise exception 'mision_no_encontrada'; end if;

  select * into prof from profiles where id = p_user for update;
  if not found then raise exception 'perfil_no_encontrado'; end if;

  if public.mission_is_locked(p_user, p_mission) then raise exception 'mision_bloqueada'; end if;

  select * into prog from mission_progress where user_id = p_user and mission_id = p_mission;
  had_prog := found;
  first := passed and (not had_prog or prog.completed_at is null);

  insert into mission_progress (user_id, mission_id, best_score, attempts, completed_at)
  values (p_user, p_mission, p_score, 1, case when passed then now() end)
  on conflict (user_id, mission_id) do update set
    best_score   = greatest(mission_progress.best_score, excluded.best_score),
    attempts     = mission_progress.attempts + 1,
    completed_at = coalesce(mission_progress.completed_at, excluded.completed_at),
    updated_at   = now();

  if prof.last_active = today then new_streak := greatest(prof.streak, 1);
  elsif prof.last_active = today - 1 then new_streak := prof.streak + 1;
  else new_streak := 1; end if;

  if first then
    xp_gain   := m.xp_reward;
    coin_gain := 10 + case when p_score = 100 then 10 else 0 end + case when m.is_boss then 100 else 0 end;
    gem_gain  := case when m.is_boss then 5 else 0 end;
    if m.is_boss then
      boss_done := true;
      -- Con módulos hay un jefe por módulo: el curso queda «vencido» solo con el jefe de la última lección.
      if m.position = (select max(position) from missions where course_slug = m.course_slug) then
        insert into boss_defeats (user_id, course_slug) values (p_user, m.course_slug) on conflict do nothing;
      end if;
    end if;
    foreach item in array p_items_on_first loop
      insert into inventory (user_id, item_id, source) values (p_user, item, 'logro') on conflict do nothing;
      get diagnostics ok = row_count;
      if ok then granted := granted || item; end if;
    end loop;
  end if;

  if new_streak > prof.streak or prof.last_active is distinct from today then
    foreach item in array (case new_streak when 3 then array['obj_insignia_racha3'] when 7 then array['obj_insignia_racha7'] when 30 then array['obj_insignia_racha30'] else '{}'::text[] end) loop
      insert into inventory (user_id, item_id, source) values (p_user, item, 'racha') on conflict do nothing;
      get diagnostics ok = row_count;
      if ok then granted := granted || item; end if;
    end loop;
  end if;

  update profiles set xp = xp + xp_gain, coins = coins + coin_gain, gems = gems + gem_gain,
                      streak = new_streak, last_active = today
   where id = p_user
   returning * into prof;

  if xp_gain   > 0 then insert into ledger (user_id, kind, delta, reason, ref) values (p_user, 'xp',    xp_gain,   'mision', p_mission::text); end if;
  if coin_gain > 0 then insert into ledger (user_id, kind, delta, reason, ref) values (p_user, 'coins', coin_gain, 'mision', p_mission::text); end if;
  if gem_gain  > 0 then insert into ledger (user_id, kind, delta, reason, ref) values (p_user, 'gems',  gem_gain,  'jefe',   p_mission::text); end if;

  course_done := not exists (
    select 1 from missions mi where mi.course_slug = m.course_slug
       and not exists (select 1 from mission_progress pr
                        where pr.user_id = p_user and pr.mission_id = mi.id and pr.completed_at is not null));

  return jsonb_build_object(
    'passed', passed, 'first', first, 'score', p_score,
    'xp_gain', xp_gain, 'coins_gain', coin_gain, 'gems_gain', gem_gain,
    'xp', prof.xp, 'coins', prof.coins, 'gems', prof.gems, 'streak', prof.streak,
    'boss_defeated', boss_done, 'course_done', course_done, 'granted', to_jsonb(granted));
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'public.renumber_course(text)',
    'public.answer_activity(uuid, uuid, integer, jsonb)',
    'public.use_aid(uuid, uuid, text, integer, integer)',
    'public.use_power(uuid, uuid, integer, text, integer, integer)',
    'public.complete_mission(uuid, uuid, integer, integer, text[])',
    'public.has_course_access(uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
