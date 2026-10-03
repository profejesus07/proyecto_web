-- ============================================================
-- UMBRAL · configuración completa de la base de datos
-- Pega todo este archivo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar más de una vez sin problema.
-- Generado por supabase/build_setup.py
-- ============================================================

-- >>> 0001_init.sql
-- UMBRAL · esquema inicial
-- Se puede ejecutar varias veces sin romper nada (idempotente).

-- ============ Perfiles ============
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'estudiante' check (role in ('estudiante','docente','familia')),
  display_name  text not null default 'Despertado' check (char_length(display_name) between 2 and 24),
  avatar        jsonb not null default '{"base":"aria"}'::jsonb,
  equipped      jsonb not null default '{}'::jsonb,
  xp            integer not null default 0 check (xp >= 0),
  coins         integer not null default 0 check (coins >= 0),
  gems          integer not null default 0 check (gems >= 0),
  streak        integer not null default 0 check (streak >= 0),
  last_active   date,
  consent_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- Crea el perfil al registrarse (el rol solo puede ser uno de los tres permitidos).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(new.raw_user_meta_data->>'role', 'estudiante');
  n text := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Despertado');
  b text := coalesce(new.raw_user_meta_data->>'avatar', 'aria');
begin
  if r not in ('estudiante','docente','familia') then r := 'estudiante'; end if;
  if b not in ('aria','leo','tomas','nuri') then b := 'aria'; end if;
  insert into public.profiles (id, role, display_name, avatar, consent_at)
  values (new.id, r, left(n, 24), jsonb_build_object('base', b), now())
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Contenido ============
create table if not exists public.courses (
  slug       text primary key,
  title      text not null,
  summary    text not null,
  element    text not null check (element in ('luz','sombra','fuego','agua','naturaleza','eter')),
  guardian   text not null,
  position   integer not null default 0,
  published  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.missions (
  id          uuid primary key default gen_random_uuid(),
  course_slug text not null references public.courses(slug) on delete cascade,
  position    integer not null,
  title       text not null,
  intro       text not null default '',
  xp_reward   integer not null default 50 check (xp_reward >= 0),
  is_boss     boolean not null default false,
  unique (course_slug, position)
);

create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  mission_id    uuid not null references public.missions(id) on delete cascade,
  position      integer not null,
  prompt        text not null,
  options       jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  correct_index integer not null check (correct_index >= 0),
  hint          text not null default '',
  explanation   text not null default '',
  unique (mission_id, position)
);

-- ============ Progreso y economía ============
create table if not exists public.mission_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  mission_id   uuid not null references public.missions(id) on delete cascade,
  best_score   integer not null check (best_score between 0 and 100),
  attempts     integer not null default 1,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, mission_id)
);

create table if not exists public.boss_defeats (
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_slug text not null references public.courses(slug) on delete cascade,
  defeated_at timestamptz not null default now(),
  primary key (user_id, course_slug)
);

create table if not exists public.inventory (
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     text not null,
  source      text not null default 'tienda',
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Libro de movimientos: cada cambio de XP, monedas o gemas queda registrado.
create table if not exists public.ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('xp','coins','gems')),
  delta      integer not null,
  reason     text not null,
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.ledger (user_id, created_at desc);
create index if not exists missions_course_idx on public.missions (course_slug, position);
create index if not exists questions_mission_idx on public.questions (mission_id, position);

-- ============ Seguridad por filas (RLS) ============
alter table public.profiles          enable row level security;
alter table public.courses           enable row level security;
alter table public.missions          enable row level security;
alter table public.questions         enable row level security;
alter table public.mission_progress  enable row level security;
alter table public.boss_defeats      enable row level security;
alter table public.inventory         enable row level security;
alter table public.ledger            enable row level security;

drop policy if exists "perfil propio: leer"        on public.profiles;
drop policy if exists "perfil propio: editar"      on public.profiles;
drop policy if exists "cursos publicados"          on public.courses;
drop policy if exists "misiones de cursos publicados" on public.missions;
drop policy if exists "progreso propio"            on public.mission_progress;
drop policy if exists "jefes vencidos propios"     on public.boss_defeats;
drop policy if exists "inventario propio"          on public.inventory;
drop policy if exists "movimientos propios"        on public.ledger;

create policy "perfil propio: leer"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "perfil propio: editar" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "cursos publicados"     on public.courses  for select to anon, authenticated using (published);
create policy "misiones de cursos publicados" on public.missions for select to anon, authenticated
  using (exists (select 1 from public.courses c where c.slug = course_slug and c.published));
create policy "progreso propio"       on public.mission_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "jefes vencidos propios" on public.boss_defeats    for select to authenticated using (user_id = (select auth.uid()));
create policy "inventario propio"     on public.inventory        for select to authenticated using (user_id = (select auth.uid()));
create policy "movimientos propios"   on public.ledger           for select to authenticated using (user_id = (select auth.uid()));
-- questions: sin políticas. Solo el servidor (service_role) las lee, así las respuestas correctas nunca llegan al navegador.

-- Permisos a nivel de columna: el estudiante solo puede cambiar su nombre.
-- Avatar, objetos equipados, XP, monedas, gemas y racha los cambia solo el servidor, que valida cada cambio.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on public.questions, public.mission_progress, public.boss_defeats, public.inventory, public.ledger from anon, authenticated;
grant select on public.mission_progress, public.boss_defeats, public.inventory, public.ledger to authenticated;
revoke all on public.courses, public.missions from anon, authenticated;
grant select on public.courses, public.missions to anon, authenticated;

-- La función del disparador no debe poder llamarse desde el navegador.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- >>> 0002_seed_primer_portal.sql
-- Contenido de ejemplo: El Portal de los Pasos Pequeños
-- Generado por supabase/build_setup.py. No editar a mano.

insert into public.courses (slug,title,summary,element,guardian,position,published) values ('primer-portal','El Portal de los Pasos Pequeños','Aprende a dividir un reto enorme en pasos que sí puedes terminar. Al final te espera Petrox, el gólem que cree que todo es demasiado grande.','naturaleza','petrox',1,true)
  on conflict (slug) do update set title=excluded.title, summary=excluded.summary, element=excluded.element, guardian=excluded.guardian, position=excluded.position, published=excluded.published;

insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('95b561a6-728d-5a23-b6c4-637014f47fb7','primer-portal',1,'Cómo se come un elefante','Petrox dice que los retos grandes no se pueden vencer. Demuéstrale que se parten en trozos pequeños.',60,false)
  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('0661cc0f-a69c-524e-bcb2-42eb7efdea8f','95b561a6-728d-5a23-b6c4-637014f47fb7',1,'Tienes que armar una maqueta de tu barrio para el viernes. ¿Cuál es el mejor primer paso?','["Hacerla toda la noche del jueves", "Escribir una lista de las partes que necesita: casas, calles y parque", "Esperar a tener más tiempo", "Pedirle a alguien que la haga"]'::jsonb,1,'Piensa en qué te ayuda a saber por dónde empezar.','Una lista convierte un reto enorme en partes que puedes ir terminando una por una.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('d1a430c7-c65b-522c-b427-4e3c7f613eea','95b561a6-728d-5a23-b6c4-637014f47fb7',2,'¿Cuál de estas es una tarea pequeña y clara?','["Estudiar todo el libro", "Leer la página 12 y subrayar tres ideas", "Ser bueno en matemáticas", "Terminar el año"]'::jsonb,1,'Una tarea pequeña se puede terminar hoy y sabes cuándo acabó.','Es corta, concreta y sabes exactamente cuándo la terminaste.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('33b0ff92-f725-5049-aeb2-ad818390b021','95b561a6-728d-5a23-b6c4-637014f47fb7',3,'Si un reto parece enorme, ¿qué conviene hacer?','["Dividirlo en partes que puedas terminar en poco tiempo", "Ignorarlo", "Hacerlo todo de una vez", "Cambiar de tema"]'::jsonb,0,'Los gigantes se vencen por partes.','Dividir el reto lo hace manejable y te deja ver tu avance.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('0469c34b-06f1-54cf-b20e-6f5bcf0893b6','95b561a6-728d-5a23-b6c4-637014f47fb7',4,'Una receta tiene 10 pasos y te asustas. ¿Qué te ayuda más?','["Leer solo el último paso", "Hacer un paso, marcarlo y pasar al siguiente", "Saltarte los pasos difíciles", "Cocinar sin leer la receta"]'::jsonb,1,'Un paso a la vez.','Concentrarte en un solo paso y marcarlo reduce el miedo al total.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;

insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('6e889cc2-7c34-5ca7-b04a-3a3e82ff532c','primer-portal',2,'Ordenar el camino','Los pasos pequeños también necesitan un orden. Ayuda a Kuro a ponerlos en fila.',60,false)
  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('489848fd-0e3f-5447-b690-693c5b4e119b','6e889cc2-7c34-5ca7-b04a-3a3e82ff532c',1,'Ordena para preparar un sándwich: 1) Poner el pan, 2) Lavarse las manos, 3) Comer, 4) Poner el relleno. ¿Cuál es el orden correcto?','["2, 1, 4, 3", "1, 2, 3, 4", "4, 1, 2, 3", "3, 2, 1, 4"]'::jsonb,0,'Antes de tocar la comida, ¿qué haces?','Primero te lavas las manos, luego armas el sándwich y al final lo comes.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('991a9d2e-0edc-5e35-be73-ead6a9988b05','6e889cc2-7c34-5ca7-b04a-3a3e82ff532c',2,'Para hacer un trabajo escrito, ¿qué va primero?','["Entregarlo", "Buscar información", "Escribir la conclusión", "Revisar la ortografía"]'::jsonb,1,'No puedes escribir sobre lo que aún no conoces.','Primero se reúne la información; después se escribe y, al final, se revisa y se entrega.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('5c80858a-e194-5cf7-9a78-2338e734e66c','6e889cc2-7c34-5ca7-b04a-3a3e82ff532c',3,'¿Por qué es útil ordenar los pasos?','["Porque así se ve más bonito", "Porque sabes qué hacer ahora y qué viene después", "Porque siempre lo piden", "Porque así tardas más"]'::jsonb,1,'Piensa en no perderte a la mitad.','Un orden claro te dice qué hacer ahora y evita que te bloquees.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('a77fa3a5-628e-5b4e-b3b5-2c18bb8edf61','6e889cc2-7c34-5ca7-b04a-3a3e82ff532c',4,'Un paso depende de otro cuando…','["Se puede hacer en cualquier momento", "No puedes hacerlo hasta terminar el anterior", "Es más corto", "Es más difícil"]'::jsonb,1,'Como poner el techo antes de hacer las paredes.','Hay pasos que necesitan que otro termine antes, por eso importa el orden.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;

insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('58f63f94-3a15-5bc8-a58b-029f694f28df','primer-portal',3,'Pasos que caben en un día','Un buen plan no es el más largo, es el que sí puedes cumplir. Prepárate para el gólem.',70,false)
  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('68e0b904-7fb8-5c9c-a209-c441fc79c6c6','58f63f94-3a15-5bc8-a58b-029f694f28df',1,'Tienes tres tareas: una de 10 minutos, una de 30 y una de 2 horas. Hoy solo tienes 1 hora. ¿Qué plan es realista?','["Hacer las tres hoy", "Hacer las de 10 y 30 minutos hoy y partir la de 2 horas en bloques para otros días", "Hacer solo la de 2 horas", "No hacer ninguna"]'::jsonb,1,'Suma los minutos y compara con el tiempo que tienes.','Las dos cortas caben en una hora; la larga se divide en bloques para no abandonarla.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('e3fdee42-01a4-5267-851f-f1bb7ddf493d','58f63f94-3a15-5bc8-a58b-029f694f28df',2,'¿Cuál es una meta pequeña para hoy?','["Aprenderme todas las tablas", "Practicar la tabla del 6 durante 10 minutos", "Ser el mejor de la clase", "No equivocarme nunca"]'::jsonb,1,'Una meta pequeña tiene tiempo y resultado claros.','Tiene un tema, un tiempo y se puede cumplir hoy.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('f452d309-138c-5dac-9129-b34554aefe7e','58f63f94-3a15-5bc8-a58b-029f694f28df',3,'Si no logras terminar un paso, lo mejor es…','["Rendirte", "Revisar qué pasó y dividirlo en un paso más pequeño", "Esconderlo", "Hacer otra cosa y olvidarlo"]'::jsonb,1,'Un paso que no sale suele ser demasiado grande.','Partir el paso en uno más pequeño suele destrabarlo.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('7e2a43ac-07a8-5b66-9a94-c458807840a6','58f63f94-3a15-5bc8-a58b-029f694f28df',4,'Marcar cada paso terminado sirve para…','["Ver tu avance y motivarte", "Que otros te copien", "Gastar tinta", "Nada"]'::jsonb,0,'Ver el progreso da energía.','Ver lo que ya hiciste te motiva a seguir.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;

insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('780d2631-5026-522d-a146-0974e16ab246','primer-portal',4,'Petrox, el gólem que cree que todo es demasiado grande','Es la prueba final del portal. Responde con calma: cada acierto parte un bloque de Petrox.',150,true)
  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('927bda1d-01f2-50c8-9c1c-2d206aae5b69','780d2631-5026-522d-a146-0974e16ab246',1,'Petrox te dice: «¡Este proyecto es enorme, no podrás!». ¿Qué respondes?','["Tienes razón, me rindo", "Lo divido en pasos pequeños y empiezo por el primero", "Lo hago todo mañana", "Lo copio de otra persona"]'::jsonb,1,'Recuerda cómo se vence a un gigante.','Dividir el proyecto y empezar por el primer paso es la forma de vencerlo.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('c2c70539-786e-5231-a23b-b1de87064ae7','780d2631-5026-522d-a146-0974e16ab246',2,'Para organizar una fiesta sorpresa, ¿qué orden tiene más sentido?','["Enviar invitaciones, elegir fecha, comprar el pastel", "Elegir fecha, enviar invitaciones, comprar el pastel", "Comprar el pastel, olvidar la fecha, invitar", "Invitar sin decir la fecha"]'::jsonb,1,'Para invitar necesitas saber cuándo es.','La fecha va primero porque las invitaciones y el pastel dependen de ella.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('e9af7621-aab7-5350-bb98-18a91a283d71','780d2631-5026-522d-a146-0974e16ab246',3,'¿Cuál es el mejor primer paso para estudiar para un examen?','["Mirar el tema cinco minutos antes", "Hacer una lista de los temas y escoger uno para hoy", "Dormir sin estudiar", "Estudiarlo todo en una noche"]'::jsonb,1,'Primero sabes qué hay que estudiar.','Una lista de temas y un tema para hoy convierten el examen en pasos.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('d77ca0d3-d1e8-5643-8895-a361b2c4373d','780d2631-5026-522d-a146-0974e16ab246',4,'Un paso pequeño debe ser…','["Vago y larguísimo", "Claro, corto y posible de terminar", "Imposible", "Secreto"]'::jsonb,1,'Recuerda la misión 1.','Si es claro, corto y posible, sabes cómo empezar y cuándo acabaste.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('65903d8a-f716-59dd-a3d6-fb8c21122748','780d2631-5026-522d-a146-0974e16ab246',5,'Si tienes 5 pasos y terminaste 3, ¿cuánto del camino llevas?','["Casi nada", "Más de la mitad", "Todo", "No se puede saber"]'::jsonb,1,'La mitad de 5 es 2,5.','3 de 5 es más de la mitad: ya vas por buen camino.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('e531b621-7804-58b6-91e4-247986e4f22c','780d2631-5026-522d-a146-0974e16ab246',6,'¿Qué aprendiste de Petrox?','["Que los retos grandes se vencen paso a paso", "Que mejor no intentarlo", "Que hay que hacerlo todo hoy", "Que los pasos no sirven"]'::jsonb,0,'Es la lección de todo el portal.','Cualquier montaña se sube paso a paso.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;


-- >>> 0003_game_functions.sql
-- Lógica de juego que debe ser atómica y no falsificable.
-- Solo el servidor (service_role) puede ejecutarlas; el navegador nunca las llama directamente.

-- Registra el resultado de una misión (o de la prueba del Guardián).
--   p_score: porcentaje de aciertos (0-100) calculado por el servidor.
--   p_pass_mark: porcentaje mínimo para aprobar.
--   p_items_on_first: objetos que se entregan solo la primera vez que se aprueba.
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

  -- Bloquea el perfil: dos envíos simultáneos no pueden premiar dos veces.
  select * into prof from profiles where id = p_user for update;
  if not found then raise exception 'perfil_no_encontrado'; end if;

  -- Las misiones se desbloquean en orden.
  if exists (
    select 1 from missions prev
     where prev.course_slug = m.course_slug and prev.position < m.position
       and not exists (select 1 from mission_progress pr
                        where pr.user_id = p_user and pr.mission_id = prev.id and pr.completed_at is not null)
  ) then raise exception 'mision_bloqueada'; end if;

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

  -- Racha: cuenta un día cuando hay actividad.
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

-- Compra un objeto con monedas, de forma atómica. El precio lo decide el servidor desde el catálogo.
create or replace function public.purchase_item(p_user uuid, p_item text, p_price integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare prof record;
begin
  if p_price is null or p_price <= 0 then raise exception 'precio_invalido'; end if;
  select * into prof from profiles where id = p_user for update;
  if not found then raise exception 'perfil_no_encontrado'; end if;
  if exists (select 1 from inventory where user_id = p_user and item_id = p_item) then raise exception 'ya_lo_tienes'; end if;
  if prof.coins < p_price then raise exception 'monedas_insuficientes'; end if;
  update profiles set coins = coins - p_price where id = p_user returning * into prof;
  insert into inventory (user_id, item_id, source) values (p_user, p_item, 'tienda');
  insert into ledger (user_id, kind, delta, reason, ref) values (p_user, 'coins', -p_price, 'compra', p_item);
  return jsonb_build_object('coins', prof.coins, 'item', p_item);
end $$;

revoke all on function public.complete_mission(uuid, uuid, integer, integer, text[]) from public, anon, authenticated;
revoke all on function public.purchase_item(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.complete_mission(uuid, uuid, integer, integer, text[]) to service_role;
grant execute on function public.purchase_item(uuid, text, integer) to service_role;
