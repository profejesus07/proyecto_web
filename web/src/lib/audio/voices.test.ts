import { describe, expect, it, vi } from "vitest";

vi.mock("./music", () => ({ duckMusic: () => {} }));
const { phrases, pickVoice, profileFor, sentences, speakable, voiceGender, voiceScore } = await import("./voices");

const v = (name: string, lang: string, localService = true) => ({ name, lang, localService, voiceURI: name, default: false }) as SpeechSynthesisVoice;
const LIST = [
  v("eSpeak Spanish", "es"),
  v("Microsoft Sabina - Spanish (Mexico)", "es-MX"),
  v("Microsoft Dalia Online (Natural) - Spanish (Mexico)", "es-MX", false),
  v("Microsoft Salome Online (Natural) - Spanish (Colombia)", "es-CO", false),
  v("Microsoft Gonzalo Online (Natural) - Spanish (Colombia)", "es-CO", false),
  v("Microsoft Jorge Online (Natural) - Spanish (Mexico)", "es-MX", false),
  v("Google español de Estados Unidos", "es-US", false),
  v("Samantha", "en-US"),
];

describe("voces de los personajes", () => {
  it("prefiere voces naturales en español latinoamericano y descarta las robóticas", () => {
    const sorted = [...LIST].sort((a, b) => voiceScore(b) - voiceScore(a)).map((x) => x.name);
    expect(sorted[0]).toMatch(/Online \(Natural\)/);
    expect(voiceScore(LIST[0])).toBeLessThan(voiceScore(LIST[1]));
    expect(voiceScore(LIST[7])).toBeLessThan(-50);
  });

  it("reconoce el género por el nombre de la voz", () => {
    expect(voiceGender(LIST[2])).toBe("f");
    expect(voiceGender(LIST[4])).toBe("m");
    expect(voiceGender(LIST[6])).toBe("f");
  });

  it("cada personaje recibe una voz de su género y, si hay varias, una distinta", () => {
    const sora = pickVoice(profileFor("Maestra Sora"), LIST);
    const kuro = pickVoice(profileFor("Kuro"), LIST);
    const eon = pickVoice(profileFor("Archivista Eon"), LIST);
    const kael = pickVoice(profileFor("Kael, tu rival"), LIST);
    expect(sora).toMatchObject({ matched: true });
    expect(voiceGender(sora.voice!)).toBe("f");
    expect(sora.voice!.name).not.toBe(kuro.voice!.name);
    expect(voiceGender(eon.voice!)).toBe("m");
    expect(eon.voice!.name).not.toBe(kael.voice!.name);
  });

  it("sin voces del género del personaje usa la mejor disponible", () => {
    const only = [v("Microsoft Dalia Online (Natural) - Spanish (Mexico)", "es-MX", false)];
    expect(pickVoice(profileFor("Archivista Eon"), only)).toMatchObject({ matched: false });
    expect(pickVoice(profileFor("Archivista Eon"), [v("Alex", "en-US")]).voice).toBeNull();
  });

  it("tono casi natural y velocidad de conversación (ni lenta ni apurada)", () => {
    for (const name of ["Maestra Sora", "Kuro", "Archivista Eon", "Kael", "Forjadora Brann", "Petrox", "Zhaal, el Vacío", "Abuela Amara", "Alguien sin perfil"]) {
      const p = profileFor(name);
      expect(p.pitch).toBeGreaterThanOrEqual(0.94);
      expect(p.pitch).toBeLessThanOrEqual(1.06);
      expect(p.rate).toBeGreaterThanOrEqual(0.97);
      expect(p.rate).toBeLessThanOrEqual(1.06);
    }
  });

  it("limpia el texto y lo parte en frases", () => {
    expect(speakable("🐾 ¡Ganaste +50 XP! «Bien» · 80% → sigue")).toBe("¡Ganaste +50 puntos de experiencia! Bien, 80 por ciento, sigue");
    expect(sentences("Hola. ¿Cómo estás? Bien.")).toEqual(["Hola.", "¿Cómo estás?", "Bien."]);
    const long = "Una frase muy larga, ".repeat(20);
    expect(sentences(long).every((s) => s.length <= 180)).toBe(true);
  });

  it("lee cada párrafo de corrido y hace pausa después de un título y entre párrafos", () => {
    const p = phrases("Bienvenido al Gremio\nSoy la Maestra Sora. ¿Listo? Vamos, paso a paso: así se aprende.\nEmpecemos.");
    // Las frases del párrafo van juntas: el motor les da la entonación y las pausas de los puntos.
    expect(p.map((x) => x.text)).toEqual(["Bienvenido al Gremio", "Soy la Maestra Sora. ¿Listo? Vamos, paso a paso: así se aprende.", "Empecemos."]);
    const [titulo, parrafo] = p.map((x) => x.pause);
    expect(titulo).toBeGreaterThan(parrafo);
    expect(parrafo).toBeGreaterThanOrEqual(300);
    expect(p.at(-1)!.pause).toBe(0);
  });

  it("un párrafo largo se parte en trozos de hasta 180 caracteres, por frases y con pausas cortas", () => {
    const frase = "Esta es una frase de prueba con varias palabras.";
    const p = phrases(Array(8).fill(frase).join(" "));
    expect(p.length).toBeGreaterThan(1);
    expect(p.every((x) => x.text.length <= 180)).toBe(true);
    expect(p.every((x) => x.text.endsWith("."))).toBe(true); // no corta una frase por la mitad
    expect(p.slice(0, -1).every((x) => x.pause > 0 && x.pause < 400)).toBe(true);
  });
});
