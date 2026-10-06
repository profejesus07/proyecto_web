"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { isAdmin } from "@/lib/roles";

export type CertState = { error?: string; message?: string } | undefined;

const MESSAGES: Record<string, string> = {
  curso_sin_terminar: "Todavía no terminas todas las lecciones del curso.",
  curso_incompleto: "Este curso aún no tiene sus datos de intensidad y formador. Escríbenos para revisarlo.",
  curso_no_encontrado: "Solo los cursos cortos tienen constancia de asistencia.",
  falta_configuracion: "La plataforma todavía no tiene configurada la firma. Escríbenos y la expedimos pronto.",
};

const requestSchema = z.object({
  name: z.string().trim().min(5, "Escribe tu nombre completo (nombres y apellidos).").max(120)
    .regex(/^[\p{L} .'-]+$/u, "El nombre solo puede tener letras, espacios y . ' -")
    .refine((v) => v.split(/\s+/).length >= 2, "Escribe nombres y apellidos."),
  docType: z.enum(["CC", "TI", "CE", "PPT", "PA"], { error: "Elige el tipo de documento." }),
  docNumber: z.string().trim().regex(/^[A-Za-z0-9-]{4,20}$/, "El número de documento no es válido (solo letras, números y guiones)."),
  confirm: z.literal("on", { error: "Confirma que tus datos son correctos." }),
});

export async function requestCertificateAction(slug: string, _prev: CertState, fd: FormData): Promise<CertState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión terminó. Vuelve a ingresar." };
  const parsed = requestSchema.safeParse({ name: fd.get("name"), docType: fd.get("docType"), docNumber: fd.get("docNumber"), confirm: fd.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa tus datos." };
  let code: string;
  try {
    code = (await getRepo().issueCertificate(viewer.id, slug, parsed.data.name, parsed.data.docType, parsed.data.docNumber)).code;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    for (const [k, v] of Object.entries(MESSAGES)) if (msg.includes(k)) return { error: v };
    return { error: "No pudimos expedir la constancia. Inténtalo de nuevo." };
  }
  revalidatePath("/perfil");
  revalidatePath(`/portales/${slug}`);
  redirect(`/constancia/${code}`);
}

const settingsSchema = z.object({
  issuerName: z.string().trim().min(3, "Escribe el nombre del responsable.").max(120),
  issuerTitle: z.string().trim().max(160).nullable(),
  issuerDoc: z.string().trim().max(40).nullable(),
  city: z.string().trim().min(2, "Escribe la ciudad de expedición.").max(80),
  signaturePng: z.string().startsWith("data:image/png;base64,", "La firma debe ser una imagen PNG.").max(400_000, "La imagen de la firma es muy pesada (máximo unos 250 KB).").nullable(),
});

export async function saveIssuerSettingsAction(_prev: CertState, fd: FormData): Promise<CertState> {
  const viewer = await getViewer();
  if (!viewer || !isAdmin(viewer.role)) return { error: "Solo el administrador puede cambiar esto." };
  const opt = (k: string) => {
    const v = String(fd.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  const parsed = settingsSchema.safeParse({
    issuerName: String(fd.get("issuerName") ?? ""), issuerTitle: opt("issuerTitle"), issuerDoc: opt("issuerDoc"),
    city: String(fd.get("city") ?? ""), signaturePng: opt("signaturePng"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  await getRepo().saveIssuerSettings(parsed.data);
  revalidatePath("/admin", "layout");
  return { message: "Datos del responsable guardados." };
}
