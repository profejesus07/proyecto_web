import { describe, expect, it } from "vitest";
import { inlineParts, parseBody, plainBody, videoEmbedUrl } from "./lessons";

describe("videoEmbedUrl", () => {
  it("acepta YouTube y Vimeo y los convierte en reproductor incrustado", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://vimeo.com/76979871")).toBe("https://player.vimeo.com/video/76979871");
  });
  it("rechaza todo lo demás", () => {
    for (const bad of ["http://youtube.com/watch?v=dQw4w9WgXcQ", "https://evil.com/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://youtube.com/watch?v=<x>", "", null]) {
      expect(videoEmbedUrl(bad)).toBeNull();
    }
  });
});

describe("parseBody", () => {
  it("arma párrafos, subtítulos y listas", () => {
    expect(parseBody("## Idea\nUna línea\nque sigue.\n\n- uno\n- dos\n1. a\n2) b")).toEqual([
      { type: "h", text: "Idea" }, { type: "p", text: "Una línea que sigue." },
      { type: "ul", items: ["uno", "dos"] }, { type: "ol", items: ["a", "b"] },
    ]);
  });
  it("marca la negrita y deja el texto plano para la voz", () => {
    expect(inlineParts("Esto es **clave** hoy")).toEqual([{ text: "Esto es ", bold: false }, { text: "clave", bold: true }, { text: " hoy", bold: false }]);
    expect(plainBody("Hola **mundo**\n- a")).toBe("Hola mundo. a");
  });
});
