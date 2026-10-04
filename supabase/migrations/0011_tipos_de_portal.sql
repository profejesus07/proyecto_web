-- Dos formas de usar UMBRAL:
--  · «clase» (forma 1): por área, grado y año lectivo, con lecciones repartidas en 4 periodos. Acceso anual.
--  · «curso» (forma 2): curso corto de educación informal (Decreto 1075 de 2015, art. 2.6.6.8):
--    menos de 160 horas, con formador, y al terminarlo se expide una constancia de asistencia.
-- El contenido se crea desde el editor del administrador. Se puede ejecutar varias veces.

alter table public.courses add column if not exists kind text not null default 'curso' check (kind in ('clase', 'curso'));
alter table public.courses add column if not exists area text check (area is null or char_length(area) between 2 and 60);
alter table public.courses add column if not exists grade text check (grade is null or char_length(grade) between 1 and 20);
alter table public.courses add column if not exists school_year integer check (school_year is null or school_year between 2020 and 2100);
-- Último día de acceso de una clase (fin del año lectivo).
alter table public.courses add column if not exists access_until date;
-- Intensidad horaria de un curso corto: educación informal, siempre menos de 160 horas.
alter table public.courses add column if not exists hours integer check (hours is null or hours between 1 and 159);
alter table public.courses add column if not exists trainer_name text check (trainer_name is null or char_length(trainer_name) between 3 and 120);
alter table public.courses add column if not exists trainer_title text check (trainer_title is null or char_length(trainer_title) between 3 and 160);
alter table public.courses add column if not exists updated_at timestamptz not null default now();

-- Periodo académico (1 a 4) de cada lección de una clase.
alter table public.missions add column if not exists period integer check (period is null or period between 1 and 4);
