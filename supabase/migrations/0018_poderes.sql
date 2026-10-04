-- Poderes: objetos de la tienda (y dos de rango S) con efecto real dentro de las misiones.
-- Como las ayudas, todo se decide aquí: el navegador nunca ve la respuesta correcta antes de tiempo.
--   Rayo de Claridad      resalta las palabras de la pregunta relacionadas con la pista.
--   Escudo de Calma       si fallas esta pregunta, la respuesta no queda fija y puedes intentarlo otra vez.
--   Aura de Concentración deja la pregunta para el final (más tiempo para pensarla).
--   Lluvia de Estrellas   si aciertas esta pregunta, +15 XP.
--   Invocación de Kuro    la pista y una opción incorrecta menos.
--   Pulso de Memoria      vuelve a mostrar las pistas que ya habías visto en la misión.
--   Sombra Dorada (S)     si ya acertaste esta pregunta antes, marca la respuesta que elegiste.
--   Segundo Aliento (S)   devuelve una pregunta fallada para responderla otra vez.
-- Se registran en aid_uses (una vez por pregunta y día). Sin borrados ni DROP.

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
      'removed', case when coalesce(array_length(wrong, 1), 0) >= 2 then jsonb_build_array(wrong[1]) else '[]'::jsonb end);
    if out_payload->>'hint' is null and jsonb_array_length(out_payload->'removed') = 0 then raise exception 'no_aplica'; end if;
  elsif p_item = 'obj_poder_pulso' then
    select jsonb_object_agg(qq.id, qq.hint) into v_hints from questions qq
     where qq.mission_id = p_mission and coalesce(trim(qq.hint), '') <> ''
       and exists (select 1 from aid_uses u where u.user_id = p_user and u.question_id = qq.id and u.item_id in ('obj_ayuda_pista', 'obj_poder_kuro'));
    if v_hints is null then raise exception 'sin_recuerdos'; end if;
    out_payload := jsonb_build_object('hints', v_hints);
  elsif p_item = 'obj_poder_sombra' then
    if answered then raise exception 'ya_respondida'; end if;
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

-- answer_question con los poderes que actúan al responder: Escudo de Calma y Lluvia de Estrellas.
create or replace function public.answer_question(p_user uuid, p_mission uuid, p_index integer, p_choice integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  qs record; att record; n integer; q record; stored integer; right_count integer; pw record; bonus integer := 0;
  today date := (now() at time zone 'America/Bogota')::date;
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
    -- Escudo de Calma: un error en esta pregunta no queda fijo (y no se muestra la correcta).
    if p_choice <> q.correct_index then
      select * into pw from aid_uses where user_id = p_user and item_id = 'obj_poder_escudo' and question_id = q.id and used_on = today
                                       and not coalesce((payload->>'spent')::boolean, false) for update;
      if found then
        update aid_uses set payload = payload || '{"spent": true}'::jsonb where id = pw.id;
        select count(*)::int into right_count from generate_subscripts(att.answers, 1) as i where att.answers[i] = qs.keys[i];
        return jsonb_build_object('index', p_index, 'shielded', true, 'correct', false,
          'answered', (select count(*)::int from unnest(att.answers) a where a >= 0), 'right', right_count, 'total', n);
      end if;
    end if;
    stored := p_choice;
    update attempts set answers[p_index + 1] = p_choice where id = att.id returning * into att;
    -- Lluvia de Estrellas: si acierta, XP extra.
    select * into pw from aid_uses where user_id = p_user and item_id = 'obj_poder_lluvia' and question_id = q.id and used_on = today
                                     and not coalesce((payload->>'spent')::boolean, false) for update;
    if found then
      if stored = q.correct_index then
        bonus := 15;
        update profiles set xp = xp + bonus where id = p_user;
        insert into ledger (user_id, kind, delta, reason, ref) values (p_user, 'xp', bonus, 'poder', 'obj_poder_lluvia');
      end if;
      update aid_uses set payload = payload || jsonb_build_object('spent', true, 'bonus', bonus) where id = pw.id;
    end if;
  end if;

  select count(*)::int into right_count from generate_subscripts(att.answers, 1) as i where att.answers[i] = qs.keys[i];

  return jsonb_build_object(
    'index', p_index, 'choice', stored, 'correct', stored = q.correct_index,
    'correct_index', q.correct_index, 'explanation', q.explanation,
    'answered', (select count(*)::int from unnest(att.answers) a where a >= 0),
    'right', right_count, 'total', n, 'bonus_xp', bonus);
end $$;

revoke all on function public.use_power(uuid, uuid, integer, text, integer, integer) from public, anon, authenticated;
grant execute on function public.use_power(uuid, uuid, integer, text, integer, integer) to service_role;
revoke all on function public.answer_question(uuid, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.answer_question(uuid, uuid, integer, integer) to service_role;
