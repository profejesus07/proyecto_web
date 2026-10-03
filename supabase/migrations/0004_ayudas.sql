-- Ayudas consumibles: Pista y 50/50.
-- Se compran con monedas (se acumulan), se gastan una a una dentro de una misión y tienen tope diario.
-- Cada misión regala una Pista al día. Todo se decide aquí, en el servidor; el navegador nunca ve la respuesta correcta.
-- Sin DROP: se puede ejecutar varias veces.

create table if not exists public.consumables (
  user_id    uuid not null references auth.users(id) on delete cascade,
  item_id    text not null,
  quantity   integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Cada ayuda usada en una pregunta. Usarla otra vez en la misma pregunta el mismo día no cobra de nuevo.
create table if not exists public.aid_uses (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     text not null,
  mission_id  uuid not null references public.missions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  used_on     date not null,
  free        boolean not null default false,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (user_id, item_id, question_id, used_on)
);
create index if not exists aid_uses_user_day_idx on public.aid_uses (user_id, used_on);

alter table public.consumables enable row level security;
alter table public.aid_uses    enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'consumables' and policyname = 'ayudas propias') then
    create policy "ayudas propias" on public.consumables for select to authenticated using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'aid_uses' and policyname = 'ayudas usadas propias') then
    create policy "ayudas usadas propias" on public.aid_uses for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;

revoke all on public.consumables, public.aid_uses from anon, authenticated;
grant select on public.consumables, public.aid_uses to authenticated;

-- Compra una unidad de una ayuda. El precio y el máximo que se puede guardar los decide el servidor.
create or replace function public.buy_consumable(p_user uuid, p_item text, p_price integer, p_max integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare prof record; have integer;
begin
  if p_price is null or p_price <= 0 then raise exception 'precio_invalido'; end if;
  select * into prof from profiles where id = p_user for update;
  if not found then raise exception 'perfil_no_encontrado'; end if;
  select quantity into have from consumables where user_id = p_user and item_id = p_item;
  if coalesce(have, 0) >= p_max then raise exception 'reserva_llena'; end if;
  if prof.coins < p_price then raise exception 'monedas_insuficientes'; end if;
  update profiles set coins = coins - p_price where id = p_user returning * into prof;
  insert into consumables (user_id, item_id, quantity) values (p_user, p_item, 1)
  on conflict (user_id, item_id) do update set quantity = consumables.quantity + 1, updated_at = now()
  returning quantity into have;
  insert into ledger (user_id, kind, delta, reason, ref) values (p_user, 'coins', -p_price, 'compra', p_item);
  return jsonb_build_object('coins', prof.coins, 'quantity', have);
end $$;

-- Usa una ayuda en una pregunta.
--   Pista: devuelve el texto de la pista. La primera de cada misión en el día es gratis.
--   50/50: devuelve las opciones incorrectas que se quitan (la mitad, redondeando hacia arriba, y siempre queda al menos una incorrecta).
--   p_daily_cap: máximo de unidades pagadas que se pueden gastar al día. p_min_xp: XP mínima para usarla.
create or replace function public.use_aid(p_user uuid, p_question uuid, p_item text, p_daily_cap integer, p_min_xp integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  qq record; prof record; prev record;
  today date := (now() at time zone 'America/Bogota')::date;
  is_free boolean := false; used_today integer; have integer;
  wrong integer[]; n_remove integer; out_payload jsonb;
begin
  if p_item not in ('obj_ayuda_pista', 'obj_ayuda_5050') then raise exception 'ayuda_invalida'; end if;

  select q.id, q.mission_id, q.options, q.correct_index, q.hint, mi.course_slug, mi.position
    into qq
    from questions q join missions mi on mi.id = q.mission_id join courses c on c.slug = mi.course_slug
   where q.id = p_question and c.published;
  if not found then raise exception 'pregunta_no_encontrada'; end if;

  select * into prof from profiles where id = p_user for update;
  if not found then raise exception 'perfil_no_encontrado'; end if;

  if exists (
    select 1 from missions prev_m
     where prev_m.course_slug = qq.course_slug and prev_m.position < qq.position
       and not exists (select 1 from mission_progress pr
                        where pr.user_id = p_user and pr.mission_id = prev_m.id and pr.completed_at is not null)
  ) then raise exception 'mision_bloqueada'; end if;

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

revoke all on function public.buy_consumable(uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.use_aid(uuid, uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.buy_consumable(uuid, text, integer, integer) to service_role;
grant execute on function public.use_aid(uuid, uuid, text, integer, integer) to service_role;
