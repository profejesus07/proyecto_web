/**
 * Plantilla de Excel para cargar cursos y clases. Trae instrucciones y un ejemplo completo
 * (un módulo con su explicación, un reto y la prueba del Guardián) que se puede importar tal cual.
 */
import { ELEMENT_LABEL, GUARDIANS } from "@/content/guardians";
import type { Cell } from "@/lib/excel-import";

type Styled = { value: Cell; fontWeight?: "bold"; backgroundColor?: string; color?: string; wrap?: boolean };
export interface TemplateSheet { sheet: string; data: (Styled | null)[][]; columns: { width: number }[] }

const H = (value: string): Styled => ({ value, fontWeight: "bold", backgroundColor: "#241C6E", color: "#FFFFFF" });
const C = (value: Cell): Styled | null => (value === null || value === undefined || value === "" ? null : { value, wrap: typeof value === "string" && value.length > 40 });
const row = (...cells: Cell[]) => cells.map(C);

export function templateSheets(): TemplateSheet[] {
  const guardians = GUARDIANS.map((g) => g.name).join(", ");
  const elements = Object.values(ELEMENT_LABEL).join(", ");
  return [
    {
      sheet: "Instrucciones",
      columns: [{ width: 110 }],
      data: [
        [H("Cómo cargar un curso o una clase desde Excel")],
        ...[
          "1. Llena las hojas «Curso», «Módulos», «Lecciones» y «Actividades». Puedes borrar el ejemplo y escribir el tuyo.",
          "2. En Admin → Contenido → «Importar desde Excel», sube el archivo. Se crea como borrador (sin publicar) para que lo revises.",
          "3. Si algo falta o está mal, verás la hoja y la fila exactas para corregirlo.",
          "",
          "Curso: «Tipo» es curso (curso corto, menos de 160 horas, con módulos) o clase (por periodos, acceso anual, hasta 2000 horas).",
          `Guardianes: ${guardians}. Elementos: ${elements}.`,
          "",
          "Módulos (solo cursos cortos): cada módulo tiene un número, un título y su Guardián.",
          "",
          "Lecciones: «Tipo» es Explicación (texto para leer, y video opcional de YouTube o Vimeo) o Reto (con actividades).",
          "Cada módulo debe tener una lección de explicación (lo ideal: la primera) y terminar con un reto marcado como «Jefe: sí».",
          "En la explicación: deja una línea en blanco entre párrafos; «## » para un subtítulo, «- » para una lista y **así** para negrita.",
          "En una clase, usa «Periodo» (1 a 4) en lugar de «Módulo».",
          "",
          "Actividades: cada fila es una actividad de un reto (columna «Lección»). Tipos:",
          "• Selección múltiple: escribe las opciones en Opción 1…6 y en «Correcta» el número de la opción correcta.",
          "• Verdadero o falso: escribe la afirmación y en «Correcta» pon Verdadero o Falso.",
          "• Completar: las respuestas aceptadas van en Opción 1…6 (no importan mayúsculas ni tildes).",
          "• Ordenar: los pasos van en Opción 1…6 en el orden correcto; el estudiante los verá desordenados.",
          "• Relacionar: cada pareja va en Opción N (izquierda) y Derecha N (derecha).",
        ].map((t) => [C(t)]),
      ],
    },
    {
      sheet: "Curso",
      columns: [{ width: 24 }, { width: 70 }],
      data: [
        [H("Campo"), H("Valor")],
        row("Tipo", "curso"),
        row("Título", "Aprender a aprender"),
        row("Descripción", "Estrategias sencillas para estudiar mejor: dividir los retos, repasar y explicar con tus palabras."),
        row("Guardián", "Petrox"),
        row("Elemento", "Naturaleza"),
        row("Horas", 12),
        row("Formador", "Jesús David Álvarez Sáez"),
        row("Título del formador", "Magíster en Educación"),
        row("Área", ""),
        row("Grado", ""),
        row("Año lectivo", ""),
        row("Fin del año lectivo", ""),
        row("Precio", 20000),
        row("Gratis", "no"),
      ],
    },
    {
      sheet: "Módulos",
      columns: [{ width: 10 }, { width: 36 }, { width: 60 }, { width: 16 }],
      data: [
        [H("Módulo"), H("Título"), H("Descripción"), H("Guardián")],
        row(1, "Paso a paso", "Dividir un reto grande en pasos que sí puedes terminar.", "Petrox"),
      ],
    },
    {
      sheet: "Lecciones",
      columns: [{ width: 9 }, { width: 9 }, { width: 9 }, { width: 13 }, { width: 34 }, { width: 40 }, { width: 70 }, { width: 34 }, { width: 7 }, { width: 7 }],
      data: [
        [H("Lección"), H("Módulo"), H("Periodo"), H("Tipo"), H("Título"), H("Introducción"), H("Explicación"), H("Video"), H("XP"), H("Jefe")],
        row(1, 1, "", "Explicación", "Cómo se come un elefante", "Hoy descubrirás el truco de los retos grandes.",
          "Un reto grande asusta porque lo vemos completo.\n\n## El truco\nDivídelo en **pasos pequeños** y empieza por el primero.\n\n- Escribe el objetivo.\n- Haz una lista de pasos.\n- Elige el primero y hazlo hoy.", "", 20, "no"),
        row(2, 1, "", "Reto", "Ordenar el camino", "Pon a prueba lo que aprendiste.", "", "", 50, "no"),
        row(3, 1, "", "Reto", "Petrox, el gólem que cree que todo es demasiado grande", "¡Demuéstrale a Petrox que sí se puede!", "", "", 80, "sí"),
      ],
    },
    {
      sheet: "Actividades",
      columns: [{ width: 9 }, { width: 18 }, { width: 50 }, ...Array.from({ length: 6 }, () => ({ width: 18 })), { width: 10 }, ...Array.from({ length: 6 }, () => ({ width: 16 })), { width: 30 }, { width: 40 }],
      data: [
        [H("Lección"), H("Tipo"), H("Enunciado"), H("Opción 1"), H("Opción 2"), H("Opción 3"), H("Opción 4"), H("Opción 5"), H("Opción 6"), H("Correcta"),
          H("Derecha 1"), H("Derecha 2"), H("Derecha 3"), H("Derecha 4"), H("Derecha 5"), H("Derecha 6"), H("Pista"), H("Retroalimentación")],
        row(2, "Selección múltiple", "¿Qué haces primero ante un reto enorme?", "Esperar a tener ganas", "Dividirlo en pasos", "Hacerlo todo de una vez", "", "", "", 2, "", "", "", "", "", "", "Piensa en el elefante.", "Dividirlo en pasos lo vuelve posible."),
        row(2, "Ordenar", "Ordena los pasos para empezar un proyecto.", "Escribir el objetivo", "Listar los pasos", "Hacer el primer paso", "", "", "", "", "", "", "", "", "", "", "", "Primero el objetivo, luego el plan y luego la acción."),
        row(3, "Verdadero o falso", "Un reto grande se vence haciendo un paso pequeño cada día.", "", "", "", "", "", "", "Verdadero", "", "", "", "", "", "", "", "Así es: la constancia vence a lo enorme."),
        row(3, "Relacionar", "Relaciona cada idea con su ejemplo.", "Objetivo", "Paso", "", "", "", "", "", "Aprobar el examen", "Repasar un tema hoy", "", "", "", "", "", "El objetivo es la meta; el paso es lo que haces hoy."),
        row(3, "Completar", "Para vencer un reto grande lo divido en pasos ___.", "pequeños", "pequenos", "", "", "", "", "", "", "", "", "", "", "", "", "Pasos pequeños: así se empieza."),
      ],
    },
  ];
}
