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

-- >>> 0004_ayudas.sql
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

-- >>> 0005_seed_portal_del_primer_intento.sql
-- Contenido de ejemplo: El Portal del Primer Intento
-- Generado por supabase/build_setup.py. No editar a mano.

insert into public.courses (slug,title,summary,element,guardian,position,published) values ('portal-del-primer-intento','El Portal del Primer Intento','Equivocarse no es perder: es parte de aprender. Al final te espera Ignaris, el dragón joven cuyas llamas se apagan cada vez que tiene miedo de intentarlo.','fuego','ignaris',2,true)
  on conflict (slug) do update set title=excluded.title, summary=excluded.summary, element=excluded.element, guardian=excluded.guardian, position=excluded.position, published=excluded.published;

insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('60a71a72-6b6d-5140-a936-044b789148e5','portal-del-primer-intento',1,'La llama del primer intento','Ignaris no se atreve a empezar nada por miedo a hacerlo mal. Muéstrale que el primer paso no tiene que ser perfecto.',60,false)
  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('6e65b9a7-4bb3-5470-82c9-0b2fcd9de8b5','60a71a72-6b6d-5140-a936-044b789148e5',1,'Tienes que escribir un cuento y la hoja en blanco te da miedo. ¿Cuál es el mejor primer paso?','["Esperar a tener la idea perfecta", "Escribir una primera frase, aunque no sea perfecta", "Copiar un cuento de internet", "Dejarlo para el último día"]'::jsonb,1,'Un borrador se puede mejorar; una hoja en blanco, no.','Empezar con algo imperfecto te da material para mejorar. La idea perfecta casi nunca llega mientras esperas.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('37de0298-4374-515a-b5bd-cd27576c1fa0','60a71a72-6b6d-5140-a936-044b789148e5',2,'Valentina quiere aprender a montar en bicicleta, pero le da miedo caerse. ¿Qué le ayuda más?','["Practicar en un lugar seguro, con casco y poco a poco", "No intentarlo nunca", "Bajar una loma muy empinada el primer día", "Solo ver videos, sin subirse nunca"]'::jsonb,0,'El miedo baja cuando el primer intento es pequeño y seguro.','Un primer intento pequeño y seguro reduce el miedo y te deja aprender sin arriesgar demasiado.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('5554f901-6b53-5ef5-aaca-b2d633facb3e','60a71a72-6b6d-5140-a936-044b789148e5',3,'¿Qué significa decir «todavía no me sale»?','["Que nunca te va a salir", "Que no eres bueno para eso", "Que estás aprendiendo y con práctica te puede salir", "Que es culpa de otra persona"]'::jsonb,2,'Fíjate en la palabra «todavía».','«Todavía» significa que vas en camino: con práctica, lo que hoy no sale mañana puede salir.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('1177d6bd-5b05-598a-8af4-940b7c7c4522','60a71a72-6b6d-5140-a936-044b789148e5',4,'Antes de un examen sientes nervios. ¿Qué es cierto?','["Sentir nervios es normal y puedes responder igual", "Los nervios significan que te va a ir mal", "Si tienes nervios, mejor no presentarlo", "Solo sienten nervios los que no estudiaron"]'::jsonb,0,'Hasta los deportistas profesionales sienten nervios antes de jugar.','Los nervios son normales cuando algo te importa. Respirar despacio y empezar por una pregunta fácil ayuda mucho.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;

insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('9f57076b-f4a7-5529-9db9-8e108c73252c','portal-del-primer-intento',2,'Los errores son pistas','Cada error deja una huella que dice por dónde seguir. Ayuda a Kuro a leerlas.',60,false)
  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('adabac70-1b70-5213-8f25-504b8794634a','9f57076b-f4a7-5529-9db9-8e108c73252c',1,'Te equivocaste en una suma. ¿Qué es lo más útil?','["Borrar todo y no volver a mirarla", "Revisar en qué paso estuvo el error", "Decir que las matemáticas no son para ti", "Pedir que no cuenten esa tarea"]'::jsonb,1,'Un error te dice dónde mirar.','Encontrar el paso exacto del error te enseña qué practicar y evita que lo repitas.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('734ca0fd-a0eb-5421-bd4f-8a3c3b6d9f3b','9f57076b-f4a7-5529-9db9-8e108c73252c',2,'Una científica prueba una idea y no funciona. ¿Qué hace?','["Anota qué pasó y prueba un cambio", "Esconde los resultados", "Deja la ciencia para siempre", "Repite exactamente lo mismo cien veces"]'::jsonb,0,'Un experimento que falla también da información.','Cada intento que no funciona descarta una posibilidad y acerca la respuesta. Por eso en ciencia se anotan los errores.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('bbced9bf-197e-5b93-99a0-34ca1ee5a558','9f57076b-f4a7-5529-9db9-8e108c73252c',3,'¿Cuál de estas frases trata al error como una pista?','["Soy un desastre", "Esto no es para mí", "Ya sé que este camino no funciona; probaré otro", "Nunca más lo intento"]'::jsonb,2,'Busca la frase que mira hacia adelante.','Esa frase convierte el error en información: ya sabes qué no funciona y puedes probar otra cosa.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('a006ac7a-64be-56c2-a354-84bb1746a268','9f57076b-f4a7-5529-9db9-8e108c73252c',4,'Tu profesora te devuelve el trabajo con correcciones. ¿Para qué sirven?','["Para hacerte sentir mal", "Para mostrarte qué mejorar en el próximo intento", "Para que no vuelvas a entregar trabajos", "Para nada; mejor no leerlas"]'::jsonb,1,'Las correcciones son como un mapa.','Las correcciones señalan exactamente qué mejorar. Leerlas es la forma más rápida de avanzar.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;

insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('ee43a599-93b0-5c2b-a86b-4b0b00447f8d','portal-del-primer-intento',3,'Intentarlo de otra manera','Repetir lo mismo da el mismo resultado. Aprende a cambiar de estrategia antes de enfrentar al dragón.',70,false)
  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('9676ac66-5dce-5aa6-8b59-eeea2d8a0b71','ee43a599-93b0-5c2b-a86b-4b0b00447f8d',1,'Llevas un rato con un problema y no te sale. ¿Qué puedes probar?','["Hacer lo mismo, pero más rápido", "Rendirte y no volver a intentarlo", "Hacer un dibujo o un esquema del problema", "Esperar a que se resuelva solo"]'::jsonb,2,'Cambia la forma de mirarlo.','Cambiar de estrategia, por ejemplo dibujando el problema, muchas veces deja ver lo que antes no veías.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('39c28e08-292d-5b33-85d3-5ad77d7dee59','ee43a599-93b0-5c2b-a86b-4b0b00447f8d',2,'¿Cuándo es buena idea pedir ayuda?','["Nunca: pedir ayuda es de débiles", "Después de intentarlo y saber qué parte no entiendes", "Antes de leer la pregunta", "Solo si nadie te ve"]'::jsonb,1,'Pedir ayuda funciona mejor cuando sabes qué preguntar.','Pedir ayuda es una estrategia de los buenos aprendices. Funciona mejor si ya lo intentaste y sabes qué parte te traba.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('d89593a9-b170-5c9c-9d40-4b355a917d8b','ee43a599-93b0-5c2b-a86b-4b0b00447f8d',3,'Sebastián falla el mismo tiro libre varias veces. ¿Qué le ayuda más?','["Cambiar una cosa pequeña en cada intento y fijarse en el resultado", "Patear más fuerte sin pensar", "Culpar al balón", "Dejar de practicar"]'::jsonb,0,'Probar, mirar y ajustar.','Ajustar una sola cosa a la vez y observar qué pasa es la forma en que mejoran los deportistas.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('695f4cd5-260a-5256-a70a-4270c8959387','ee43a599-93b0-5c2b-a86b-4b0b00447f8d',4,'Después de varios intentos lograste algo difícil. ¿Qué aprendiste?','["Que tuviste suerte", "Que era fácil desde el principio", "Que ya no necesitas aprender nada más", "Que la práctica y los intentos te hicieron mejorar"]'::jsonb,3,'Piensa en todo lo que pasó antes del logro.','No fue suerte: cada intento te enseñó algo. Recordarlo te da valor para el siguiente reto.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;

insert into public.missions (id,course_slug,position,title,intro,xp_reward,is_boss) values ('dde52c31-4a94-50ff-86b9-084ac1e3d9a5','portal-del-primer-intento',4,'Ignaris, el dragón que teme equivocarse','Las llamas de Ignaris se apagan cada vez que duda. Enséñale que equivocarse es parte de aprender y su fuego volverá a brillar.',150,true)
  on conflict (id) do update set title=excluded.title, intro=excluded.intro, xp_reward=excluded.xp_reward, is_boss=excluded.is_boss;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('22e8e0c0-cb1b-5902-b4d6-2aaf86a51180','dde52c31-4a94-50ff-86b9-084ac1e3d9a5',1,'Ignaris ruge: «¡Si me equivoco, todos se van a reír de mí!». ¿Qué le respondes?','["Tienes razón, mejor no lo intentes", "Todos nos equivocamos al aprender; lo importante es seguir intentando", "Haz que otro lo haga por ti", "Equivócate a escondidas"]'::jsonb,1,'¿Conoces a alguien que haya aprendido algo sin equivocarse nunca?','Equivocarse es parte de aprender para todo el mundo. Quien sigue intentando es quien mejora.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('2c279222-3bb2-5c9b-98cd-db661b901f36','dde52c31-4a94-50ff-86b9-084ac1e3d9a5',2,'¿Cuál es el mejor primer paso ante una tarea que te da miedo?','["Esperar a dejar de sentir miedo", "Hacerla toda de una vez esta noche", "Empezar por una parte pequeña durante cinco minutos", "Decir que ya la hiciste"]'::jsonb,2,'Empezar pequeño apaga el miedo.','Cinco minutos con una parte pequeña rompen el bloqueo; casi siempre, después es más fácil seguir.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('8c46fba9-a5e3-58e9-b9dc-68f9a34884d5','dde52c31-4a94-50ff-86b9-084ac1e3d9a5',3,'Te equivocaste en una pregunta de esta misma prueba. ¿Qué haces?','["Leo la explicación para entender por qué", "Cierro la página y no vuelvo", "Pienso que no sirvo para esto", "Culpo a la pregunta"]'::jsonb,0,'El repaso del final está ahí por algo.','La explicación convierte el error en aprendizaje, y en el siguiente intento lo harás mejor.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('773df992-f6cb-5913-807e-86ab2e8dfa05','dde52c31-4a94-50ff-86b9-084ac1e3d9a5',4,'¿Cuál de estas frases ayuda a Ignaris a volver a intentarlo?','["Nunca voy a poder", "Es imposible", "Los demás son mejores que yo", "Todavía no me sale, pero voy a probar otra forma"]'::jsonb,3,'Busca la frase que abre una puerta.','«Todavía» y «otra forma» convierten un tropiezo en un plan para el próximo intento.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('0f14e8a0-3a69-55d0-8490-af8465ef7cfa','dde52c31-4a94-50ff-86b9-084ac1e3d9a5',5,'Intentaste algo tres veces de la misma manera y no salió. ¿Qué conviene?','["Intentarlo igual una cuarta vez", "Cambiar de estrategia o pedir ayuda", "Abandonarlo para siempre", "Esconder que no te salió"]'::jsonb,1,'Si un camino no te lleva, prueba otro.','Repetir lo mismo da el mismo resultado; cambiar de estrategia o pedir ayuda abre caminos nuevos.')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;
insert into public.questions (id,mission_id,position,prompt,options,correct_index,hint,explanation) values ('1ca4c12f-0a59-5e9c-b877-113d5f9935b2','dde52c31-4a94-50ff-86b9-084ac1e3d9a5',6,'Al final, ¿qué apaga el miedo de Ignaris?','["Probar, equivocarse, aprender y volver a intentar", "No intentar nada nuevo", "Hacer solo lo que ya sabe", "Esperar a ser perfecto"]'::jsonb,0,'Es la habilidad que vence a este Guardián.','Probar, equivocarse y reintentar es la forma de aprender cualquier cosa. ¡Con eso purificas a Ignaris!')
  on conflict (id) do update set prompt=excluded.prompt, options=excluded.options, correct_index=excluded.correct_index, hint=excluded.hint, explanation=excluded.explanation;


-- >>> 0006_orden_de_portales.sql
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

-- >>> 0007_intentos.sql
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

-- >>> 0008_bienvenida_y_cronicas.sql
-- Bienvenida de Sora y lectura de Crónicas.
-- Las cambia solo el servidor (el navegador sigue pudiendo editar únicamente su nombre).
-- Sin DROP: se puede ejecutar varias veces.

alter table public.profiles add column if not exists intro_seen_at timestamptz;
alter table public.profiles add column if not exists chronicles_read text[] not null default '{}';

-- >>> 0009_clases.sql
-- Clases del Maestro del Gremio: el docente crea grupos con un código y sus estudiantes se unen.
-- El docente ve solo a los estudiantes de sus clases: nombre de aventurero, rango y avance.
-- Nunca ve el correo ni los datos de acceso. Todo pasa por funciones del servidor.
-- Sin DROP: se puede ejecutar varias veces.

create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 60),
  code        text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists classes_teacher_idx on public.classes (teacher_id);

create table if not exists public.class_members (
  class_id   uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index if not exists class_members_student_idx on public.class_members (student_id);

alter table public.classes       enable row level security;
alter table public.class_members enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'classes' and policyname = 'clases propias') then
    create policy "clases propias" on public.classes for select to authenticated using (teacher_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'class_members' and policyname = 'membresias propias') then
    create policy "membresias propias" on public.class_members for select to authenticated using (student_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.classes, public.class_members from anon, authenticated;
grant select on public.classes, public.class_members to authenticated;

-- Código de 6 caracteres sin letras que se confunden (sin O, 0, I, 1).
create or replace function public.new_class_code() returns text language plpgsql volatile set search_path = public as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text;
begin
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '') into c from generate_series(1, 6);
    exit when not exists (select 1 from classes where code = c);
  end loop;
  return c;
end $$;

create or replace function public.create_class(p_teacher uuid, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; n text := btrim(coalesce(p_name, ''));
begin
  perform 1 from profiles where id = p_teacher and role = 'docente' for update;
  if not found then raise exception 'solo_docentes'; end if;
  if char_length(n) < 2 or char_length(n) > 60 then raise exception 'nombre_invalido'; end if;
  if (select count(*) from classes where teacher_id = p_teacher and archived_at is null) >= 30 then raise exception 'demasiadas_clases'; end if;
  insert into classes (teacher_id, name, code) values (p_teacher, n, public.new_class_code()) returning * into r;
  return jsonb_build_object('id', r.id, 'name', r.name, 'code', r.code);
end $$;

-- Un estudiante se une con el código que le da su docente.
create or replace function public.join_class(p_student uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cl record; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  perform 1 from profiles where id = p_student and role = 'estudiante' for update;
  if not found then raise exception 'solo_estudiantes'; end if;
  select * into cl from classes where code = c and archived_at is null;
  if not found then raise exception 'codigo_invalido'; end if;
  if (select count(*) from class_members where student_id = p_student) >= 10 then raise exception 'demasiadas_clases'; end if;
  if (select count(*) from class_members where class_id = cl.id) >= 200 then raise exception 'clase_llena'; end if;
  insert into class_members (class_id, student_id) values (cl.id, p_student) on conflict do nothing;
  return jsonb_build_object('id', cl.id, 'name', cl.name);
end $$;

create or replace function public.leave_class(p_student uuid, p_class uuid)
returns void language sql security definer set search_path = public as $$
  delete from class_members where class_id = p_class and student_id = p_student;
$$;

-- Acciones del docente sobre sus propias clases (cualquier otra clase responde «clase_no_encontrada»).
create or replace function public.manage_class(p_teacher uuid, p_class uuid, p_action text, p_arg text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cl record; n text;
begin
  select * into cl from classes where id = p_class and teacher_id = p_teacher for update;
  if not found then raise exception 'clase_no_encontrada'; end if;
  case p_action
    when 'nuevo_codigo' then
      update classes set code = public.new_class_code() where id = cl.id returning * into cl;
    when 'renombrar' then
      n := btrim(coalesce(p_arg, ''));
      if char_length(n) < 2 or char_length(n) > 60 then raise exception 'nombre_invalido'; end if;
      update classes set name = n where id = cl.id returning * into cl;
    when 'archivar' then
      update classes set archived_at = coalesce(archived_at, now()) where id = cl.id returning * into cl;
    when 'quitar' then
      delete from class_members where class_id = cl.id and student_id = p_arg::uuid;
    else raise exception 'accion_invalida';
  end case;
  return jsonb_build_object('id', cl.id, 'name', cl.name, 'code', cl.code, 'archived', cl.archived_at is not null);
end $$;

-- Informe de una clase para su docente: estudiantes, avance por misión y aciertos por pregunta.
create or replace function public.class_report(p_teacher uuid, p_class uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare cl record;
begin
  select * into cl from classes where id = p_class and teacher_id = p_teacher;
  if not found then raise exception 'clase_no_encontrada'; end if;
  return jsonb_build_object(
    'class', jsonb_build_object('id', cl.id, 'name', cl.name, 'code', cl.code, 'created_at', cl.created_at, 'archived', cl.archived_at is not null),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.display_name, 'avatar', coalesce(p.avatar->>'base', 'aria'),
        'xp', p.xp, 'streak', p.streak, 'last_active', p.last_active, 'joined_at', m.joined_at,
        'progress', coalesce((
          select jsonb_agg(jsonb_build_object('mission_id', pr.mission_id, 'best_score', pr.best_score, 'attempts', pr.attempts, 'completed', pr.completed_at is not null))
            from mission_progress pr where pr.user_id = p.id), '[]'::jsonb)
      ) order by p.display_name)
        from class_members m join profiles p on p.id = m.student_id
       where m.class_id = cl.id), '[]'::jsonb),
    -- Por pregunta: cuántos intentos terminados la respondieron y cuántos acertaron.
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object('mission_id', x.mission_id, 'position', x.position, 'answered', x.answered, 'right', x.right_count))
        from (
          select q.mission_id, q.position, count(*)::int as answered, count(*) filter (where a.choice = q.correct_index)::int as right_count
            from attempts t
            join class_members m on m.student_id = t.user_id and m.class_id = cl.id
            cross join lateral unnest(t.answers) with ordinality as a(choice, ord)
            join (select qq.mission_id, qq.position, qq.correct_index,
                         row_number() over (partition by qq.mission_id order by qq.position) as rn
                    from questions qq) q on q.mission_id = t.mission_id and q.rn = a.ord
           where t.finished_at is not null and a.choice >= 0
           group by q.mission_id, q.position
        ) x), '[]'::jsonb)
  );
end $$;

revoke all on function public.new_class_code() from public, anon, authenticated;
revoke all on function public.create_class(uuid, text) from public, anon, authenticated;
revoke all on function public.join_class(uuid, text) from public, anon, authenticated;
revoke all on function public.leave_class(uuid, uuid) from public, anon, authenticated;
revoke all on function public.manage_class(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.class_report(uuid, uuid) from public, anon, authenticated;
grant execute on function public.new_class_code() to service_role;
grant execute on function public.create_class(uuid, text) to service_role;
grant execute on function public.join_class(uuid, text) to service_role;
grant execute on function public.leave_class(uuid, uuid) to service_role;
grant execute on function public.manage_class(uuid, uuid, text, text) to service_role;
grant execute on function public.class_report(uuid, uuid) to service_role;
