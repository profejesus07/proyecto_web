-- Bienvenida de Sora y lectura de Crónicas.
-- Las cambia solo el servidor (el navegador sigue pudiendo editar únicamente su nombre).
-- Sin DROP: se puede ejecutar varias veces.

alter table public.profiles add column if not exists intro_seen_at timestamptz;
alter table public.profiles add column if not exists chronicles_read text[] not null default '{}';
