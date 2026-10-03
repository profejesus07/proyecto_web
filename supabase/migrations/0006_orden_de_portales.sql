-- Los portales se abren en orden: para entrar a uno hay que terminar todas las misiones
-- (incluido el Guardián) de los portales publicados anteriores. Dentro de un portal,
-- las misiones siguen abriéndose una tras otra.
-- Sin DROP: se puede ejecutar varias veces.

create or replace function public.mission_is_locked(p_user uuid, p_mission uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from missions target
      join courses tc on tc.slug = target.course_slug
      join missions m on true
      join courses c on c.slug = m.course_slug
     where target.id = p_mission
       and c.published
       and (c.position < tc.position or (c.slug = tc.slug and m.position < target.position))
       and not exists (select 1 from mission_progress pr
                        where pr.user_id = p_user and pr.mission_id = m.id and pr.completed_at is not null)
  );
$$;

-- Igual que en 0003, pero con la nueva regla de orden entre portales.
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
      insert into boss_defeats (user_id, course_slug) values (p_user, m.course_slug) on conflict do nothing;
      boss_done := true;
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

-- Igual que en 0004, pero con la nueva regla de orden entre portales.
create or replace function public.use_aid(p_user uuid, p_question uuid, p_item text, p_daily_cap integer, p_min_xp integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  qq record; prof record; prev record;
  today date := (now() at time zone 'America/Bogota')::date;
  is_free boolean := false; used_today integer; have integer;
  wrong integer[]; n_remove integer; out_payload jsonb;
begin
  if p_item not in ('obj_ayuda_pista', 'obj_ayuda_5050') then raise exception 'ayuda_invalida'; end if;

  select q.id, q.mission_id, q.options, q.correct_index, q.hint
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

revoke all on function public.mission_is_locked(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mission_is_locked(uuid, uuid) to service_role;
