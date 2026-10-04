-- Pagos en línea con Wompi y Mercado Pago.
--  · El precio sale siempre de la base de datos (courses.price_cop), nunca del navegador.
--  · Cada intento de pago tiene una referencia única (UMB-…) que viaja a la pasarela y vuelve en su aviso.
--  · El servidor solo marca un pago como aprobado después de verificar el aviso (firma o consulta a la pasarela).
--    Esta función además comprueba que el valor y la moneda coincidan antes de activar el curso.
--  · Quien paga puede ser el propio estudiante o su familia vinculada (paga por su hijo o hija).
-- Se puede ejecutar varias veces. Sin borrados.

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,
  user_id      uuid not null references auth.users(id) on delete cascade,   -- quien recibe el curso
  payer_id     uuid not null references auth.users(id) on delete cascade,   -- quien paga (estudiante o familia)
  course_slug  text not null references public.courses(slug),   -- un curso con pagos no se puede borrar (registro contable)
  provider     text not null check (provider in ('wompi', 'mercadopago')),
  amount_cop   integer not null check (amount_cop > 0),
  status       text not null default 'pendiente' check (status in ('pendiente', 'aprobado', 'rechazado', 'anulado', 'error')),
  provider_ref text,      -- id de la transacción en la pasarela
  detail       text,      -- estado tal como lo dio la pasarela (o el motivo de un error)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  approved_at  timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
create index if not exists payments_payer_idx on public.payments (payer_id, created_at desc);
alter table public.payments enable row level security;
-- Solo el servidor (service_role) lee y escribe pagos.
revoke all on public.payments from anon, authenticated;

-- Empieza un pago. Devuelve la referencia y el valor que hay que cobrar.
create or replace function public.start_payment(p_payer uuid, p_student uuid, p_course text, p_provider text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c record; payer record; ref text;
begin
  if p_provider not in ('wompi', 'mercadopago') then raise exception 'pasarela_invalida'; end if;
  select * into payer from profiles where id = p_payer;
  if not found then raise exception 'perfil_no_encontrado'; end if;
  if p_student is null or p_student = p_payer then
    if payer.role <> 'estudiante' then raise exception 'solo_estudiantes'; end if;
    p_student := p_payer;
  else
    -- Una familia solo paga por un estudiante que la tiene vinculada.
    if payer.role <> 'familia' or not exists (select 1 from family_links l join profiles p on p.id = l.student_id
                                               where l.family_id = p_payer and l.student_id = p_student and l.revoked_at is null
                                                 and p.role = 'estudiante') then
      raise exception 'no_vinculado';
    end if;
  end if;
  select * into c from courses where slug = p_course and published;
  if not found then raise exception 'curso_no_encontrado'; end if;
  if coalesce(c.price_cop, 0) <= 0 then raise exception 'sin_precio'; end if;
  if public.has_course_access(p_student, p_course) then raise exception 'ya_tiene_acceso'; end if;
  if (select count(*) from payments where payer_id = p_payer and created_at > now() - interval '1 day') >= 20 then
    raise exception 'demasiados_intentos';
  end if;
  ref := 'UMB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into payments (reference, user_id, payer_id, course_slug, provider, amount_cop)
  values (ref, p_student, p_payer, p_course, p_provider, c.price_cop);
  return jsonb_build_object('reference', ref, 'amount', c.price_cop, 'title', c.title, 'student', p_student);
end $$;

-- Registra lo que dijo la pasarela (ya verificado por el servidor) y, si se aprobó, activa el curso.
-- Es idempotente: los avisos repetidos o fuera de orden no cambian un pago aprobado (salvo una anulación).
create or replace function public.settle_payment(p_reference text, p_provider text, p_provider_ref text, p_status text,
                                                 p_amount_cop numeric, p_currency text, p_detail text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pay record; c record; exp timestamptz; st text := p_status;
begin
  if st not in ('pendiente', 'aprobado', 'rechazado', 'anulado', 'error') then raise exception 'estado_invalido'; end if;
  select * into pay from payments where reference = p_reference and provider = p_provider for update;
  if not found then raise exception 'pago_no_encontrado'; end if;

  if pay.status = 'aprobado' then
    if st = 'anulado' then
      -- Reembolso o anulación: se quita el acceso que dio este pago.
      update payments set status = 'anulado', detail = left(coalesce(p_detail, 'anulado'), 200), updated_at = now() where id = pay.id;
      update course_access set revoked_at = now()
       where user_id = pay.user_id and course_slug = pay.course_slug and source = 'pago' and revoked_at is null;
      return jsonb_build_object('status', 'anulado', 'user_id', pay.user_id, 'course', pay.course_slug);
    end if;
    return jsonb_build_object('status', 'aprobado', 'user_id', pay.user_id, 'course', pay.course_slug);
  end if;

  if st = 'aprobado' and (upper(coalesce(p_currency, '')) <> 'COP' or p_amount_cop is null or round(p_amount_cop) <> pay.amount_cop) then
    st := 'error';
    p_detail := 'valor_distinto: ' || coalesce(p_amount_cop::text, '?') || ' ' || coalesce(p_currency, '?');
  end if;

  update payments set status = st, provider_ref = coalesce(p_provider_ref, provider_ref), detail = left(p_detail, 200), updated_at = now(),
                      approved_at = case when st = 'aprobado' then now() else approved_at end
   where id = pay.id;

  if st = 'aprobado' then
    select * into c from courses where slug = pay.course_slug;
    -- Clase: hasta el fin del año lectivo (o un año si no tiene fecha). Curso corto: sin vencimiento.
    exp := case when c.kind = 'clase' then coalesce(public.class_access_expiry(c.slug), now() + interval '1 year') end;
    insert into course_access (user_id, course_slug, source, granted_by, expires_at)
    values (pay.user_id, pay.course_slug, 'pago', null, exp)
    on conflict (user_id, course_slug) do update
      set source = 'pago', granted_by = null, granted_at = now(), revoked_at = null,
          expires_at = case
            when course_access.revoked_at is null and course_access.expires_at is null then null   -- ya era permanente
            when excluded.expires_at is null then null
            when course_access.revoked_at is null then greatest(course_access.expires_at, excluded.expires_at)
            else excluded.expires_at end;
  end if;
  return jsonb_build_object('status', st, 'user_id', pay.user_id, 'course', pay.course_slug);
end $$;

-- Pagos recientes para el panel del administrador.
create or replace function public.admin_payments(p_admin uuid, p_limit integer default 100)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(p_admin) then raise exception 'solo_admin'; end if;
  return coalesce((
    select jsonb_agg(x order by x->>'created_at' desc) from (
      select jsonb_build_object(
        'reference', pa.reference, 'provider', pa.provider, 'amount', pa.amount_cop, 'status', pa.status, 'detail', pa.detail,
        'provider_ref', pa.provider_ref, 'created_at', pa.created_at, 'approved_at', pa.approved_at,
        'course_slug', pa.course_slug, 'course_title', c.title,
        'student', s.display_name, 'payer', case when pa.payer_id = pa.user_id then null else f.display_name end) as x
        from payments pa
        join courses c on c.slug = pa.course_slug
        join profiles s on s.id = pa.user_id
        join profiles f on f.id = pa.payer_id
       order by pa.created_at desc
       limit least(greatest(coalesce(p_limit, 100), 1), 500)
    ) t), '[]'::jsonb);
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'public.start_payment(uuid, uuid, text, text)',
    'public.settle_payment(text, text, text, text, numeric, text, text)',
    'public.admin_payments(uuid, integer)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
