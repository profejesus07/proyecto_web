import { avatarSrc, type AvatarLook } from "@/lib/avatar-look";

/* Los SVG animados se usan como imagen: conservan su animación y no necesitan JavaScript. */
/* eslint-disable @next/next/no-img-element */
export function Sprite({
  src, alt, width, height, className = "", priority = false, decorative = false,
}: {
  src: string; alt: string; width?: number; height?: number; className?: string; priority?: boolean; decorative?: boolean;
}) {
  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={`sprite ${className}`}
    />
  );
}

export const asset = {
  scene: (name: string, state: string) => `/assets/escenarios/${name}/${name}-${state}.svg`,
  enemy: (slug: string, anim = "reposo") => `/assets/enemigos/${slug}/${slug}-${anim}.svg`,
  boss: (slug: string, anim = "reposo") => `/assets/jefes/${slug}/${slug}-${anim}.svg`,
  /** Con `look`, el SVG sale con los colores y el atuendo del Vestidor. */
  avatar: (base: string, rank: string, look?: AvatarLook) => avatarSrc(base, rank, look),
  avatarAnim: (base: string, anim: string) => `/assets/avatares/${base}/${base}-${anim}.svg`,
  sora: (anim = "reposo") => `/assets/guias/sora/sora-${anim}.svg`,
  eon: (anim = "reposo") => `/assets/personajes/eon/eon-${anim}.svg`,
  kuro: (anim = "reposo", stage: "cachorro" | "joven" | "majestuoso" = "cachorro") => `/assets/guias/kuro-${stage}/kuro-${stage}-${anim}.svg`,
};
