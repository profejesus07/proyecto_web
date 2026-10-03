export const PASS_MARK = 70;

export interface Grade {
  total: number;
  correct: number;
  /** porcentaje entero 0-100 */
  score: number;
  passed: boolean;
  perQuestion: boolean[];
}

/**
 * Califica en el servidor. `key` son las respuestas correctas y `answers` las del estudiante.
 * Una respuesta ausente (-1) cuenta como incorrecta.
 */
export function gradeAnswers(key: readonly number[], answers: readonly number[]): Grade {
  if (key.length === 0) throw new Error("sin_preguntas");
  if (answers.length !== key.length) throw new Error("respuestas_incompletas");
  const perQuestion = key.map((k, i) => answers[i] === k);
  const correct = perQuestion.filter(Boolean).length;
  const score = Math.round((correct / key.length) * 100);
  return { total: key.length, correct, score, passed: score >= PASS_MARK, perQuestion };
}
