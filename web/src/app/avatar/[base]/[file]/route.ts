import { decodeColors, recolorSvg } from "@/lib/avatar-look";
import { applyWearables } from "@/lib/avatar-wear";
import { AVATAR_BASES, type AvatarBase } from "@/lib/data/types";

/**
 * SVG del avatar con los colores que eligió el estudiante. Solo cambia colores de una
 * lista cerrada (nada del usuario llega al SVG), y la respuesta se cachea: la URL ya
 * incluye el código de colores.
 */
export async function GET(request: Request, ctx: RouteContext<"/avatar/[base]/[file]">) {
  const { base, file } = await ctx.params;
  if (!(AVATAR_BASES as readonly string[]).includes(base) || !new RegExp(`^${base}-[a-z-]+\\.svg$`).test(file)) {
    return new Response("No encontrado", { status: 404 });
  }
  const original = await fetch(new URL(`/assets/avatares/${base}/${file}`, request.url), { cache: "force-cache" });
  if (!original.ok) return new Response("No encontrado", { status: 404 });

  const look = decodeColors(new URL(request.url).searchParams.get("c") ?? "");
  const svg = applyWearables(recolorSvg(await original.text(), base as AvatarBase, look), base as AvatarBase, look);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
