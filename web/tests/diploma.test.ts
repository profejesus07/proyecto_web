import { describe, expect, it } from "vitest";
import { escapeXml, renderDiploma } from "@/lib/diploma";

describe("diploma del juego", () => {
  it("escribe nombre, curso y fecha", () => {
    const svg = renderDiploma({ name: "Luna", course: "El Portal de los Pasos Pequeños", date: "3 de octubre de 2026" });
    expect(svg).toContain(">Luna</text>");
    expect(svg).toContain(">El Portal de los Pasos Pequeños</text>");
    expect(svg).toContain(">3 de octubre de 2026</text>");
    expect(svg).toContain("UMBRAL · GREMIO DE APRENDICES");
    expect(svg).not.toMatch(/__[A-Z_]+__/);
  });

  it("escapa lo que escribe el estudiante para que no rompa el SVG", () => {
    const svg = renderDiploma({ name: `<script>alert("x")</script> & 'co'`, course: "Curso", date: "hoy" });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &apos;co&apos;");
    expect(escapeXml("a<b>&")).toBe("a&lt;b&gt;&amp;");
  });

  it("achica la letra de los nombres y cursos largos", () => {
    const corto = renderDiploma({ name: "Ana", course: "Curso", date: "hoy" });
    const largo = renderDiploma({ name: "María Fernanda de los Ángeles", course: "Pensamiento matemático para la vida cotidiana y el trabajo", date: "hoy" });
    expect(corto).toContain('font-size="58"');
    expect(largo).not.toContain('font-size="58"');
    expect(largo).not.toContain('id="cert_curso" x="561" y="526" text-anchor="middle" font-size="34"');
  });
});
