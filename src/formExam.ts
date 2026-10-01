/** Video-inspired question-by-question exam composer. No HTML/JS from imports is rendered. */
export type FormulaLanguage = 'arabic' | 'latin';
export interface QuestionFormula { language: FormulaLanguage; value: string }
export interface ExamPart {
  id: string;
  text: string;
  score?: number;
  formula?: QuestionFormula;
}
export interface ExamQuestion {
  id: string;
  title: string;
  prompt: string;
  score: number;
  formula?: QuestionFormula;
  parts: ExamPart[];
}
export interface StructuredExam {
  questions: ExamQuestion[];
  closing: string;
}

let seq = 0;
export const newId = () => `q${Date.now().toString(36)}${(++seq).toString(36)}`;
export function newPart(): ExamPart { return { id: newId(), text: '' }; }
export function newQuestion(): ExamQuestion {
  return { id: newId(), title: '', prompt: '', score: 20, parts: [newPart()] };
}
export const newExam = (): StructuredExam => ({
  questions: [
    { id: newId(), title: 'أقسام الكلام', prompt: 'صنّف الكلمات الآتية في جدول بحسب نوعها (اسم، فعل، حرف):', score: 20, parts: [{ id: newId(), text: 'الشجرة – يكتب – إلى – في – قرأ – قل' }] },
    { id: newId(), title: 'المفرد والمثنى والجمع', prompt: 'املأ الفراغات الآتية بما يناسبها:', score: 20, parts: [
      { id: newId(), text: '............. تلميذان ماهران.' },
      { id: newId(), text: '............. معلمات مجتهدات.' },
    ] },
  ],
  closing: 'مع تمنياتنا لكم بالتوفيق والنجاح',
});

export function sanitizeStructured(raw: unknown): StructuredExam | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (!Array.isArray(item.questions) || item.questions.length > 100) return null;
  const questions: ExamQuestion[] = [];
  for (const maybe of item.questions) {
    if (!maybe || typeof maybe !== 'object') return null;
    const q = maybe as Record<string, unknown>;
    if (typeof q.id !== 'string' || typeof q.title !== 'string' || typeof q.prompt !== 'string' ||
        typeof q.score !== 'number' || !Number.isFinite(q.score) || q.score < 0 || q.score > 10000 ||
        !Array.isArray(q.parts) || q.parts.length > 100 || q.prompt.length > 10000 || q.title.length > 500) return null;
    const parts: ExamPart[] = [];
    for (const maybePart of q.parts) {
      if (!maybePart || typeof maybePart !== 'object') return null;
      const p = maybePart as Record<string, unknown>;
      if (typeof p.id !== 'string' || typeof p.text !== 'string' || p.text.length > 10000) return null;
      if (p.score !== undefined && (typeof p.score !== 'number' || !Number.isFinite(p.score) || p.score < 0 || p.score > 10000)) return null;
      const formula = sanitizeFormula(p.formula);
      if (p.formula !== undefined && !formula) return null;
      parts.push({ id: p.id, text: p.text, ...(p.score !== undefined ? { score: p.score as number } : {}), ...(formula ? { formula } : {}) });
    }
    const formula = sanitizeFormula(q.formula);
    if (q.formula !== undefined && !formula) return null;
    questions.push({ id: q.id, title: q.title, prompt: q.prompt, score: q.score,
      ...(formula ? { formula } : {}), parts });
  }
  return { questions, closing: typeof item.closing === 'string' ? item.closing.slice(0, 500) : '' };
}
function sanitizeFormula(raw: unknown): QuestionFormula | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if ((item.language !== 'arabic' && item.language !== 'latin') || typeof item.value !== 'string' || item.value.length > 1500) return null;
  return { language: item.language, value: item.value };
}
