/** Structured, manually paginated exam. No imported HTML is injected into the printable tree. */
export type FormulaLanguage = 'arabic' | 'latin';
export interface QuestionFormula { language: FormulaLanguage; value: string }
export interface ExamImage { src: string; name: string; width: number; align: 'right' | 'center' | 'left' }
export type BranchNumbering = 'auto' | 'arabic' | 'latin' | 'none';
export interface ExamPart {
  id: string;
  text: string;
  score?: number;
  formula?: QuestionFormula;
  image?: ExamImage;
  subNumbering?: BranchNumbering;
  subItems?: string[];
}
export interface ExamQuestion {
  id: string;
  title: string;
  prompt: string;
  score: number;
  formula?: QuestionFormula;
  image?: ExamImage;
  parts: ExamPart[];
  page?: number;
  branchNumbering?: BranchNumbering;
}
export interface StructuredExam {
  questions: ExamQuestion[];
  closing: string;
  pageCount?: number;
  showFreeText?: boolean;
}
let seq = 0;
export const newId = () => `q${Date.now().toString(36)}${(++seq).toString(36)}`;
export function newPart(): ExamPart { return { id: newId(), text: '' }; }
export function newQuestion(page = 0): ExamQuestion { return { id: newId(), title: '', prompt: '', score: 20, parts: [newPart()], page, branchNumbering: 'auto' }; }
export const newExam = (): StructuredExam => ({
  questions: [
    { id: newId(), title: '', prompt: 'عرّف خمسة مما يأتي:', score: 10, page: 0, parts: [
      { id: newId(), text: 'التكاثر الخضري' }, { id: newId(), text: 'التطعيم' },
    ] },
  ],
  closing: 'مع تمنياتنا لكم بالتوفيق والنجاح',
  pageCount: 1,
  showFreeText: false,
});

const styleOK = (s: unknown) => ['auto','arabic','latin','none'].includes(String(s));
function sanitizeImage(raw: unknown): ExamImage | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.src !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[\w+/=]+$/i.test(r.src) || r.src.length > 1_800_000) return null;
  if (typeof r.width !== 'number' || !Number.isFinite(r.width) || r.width < 15 || r.width > 100) return null;
  if (r.align !== 'right' && r.align !== 'center' && r.align !== 'left') return null;
  return { src: r.src, name: typeof r.name === 'string' ? r.name.slice(0, 160) : '', width: r.width, align: r.align };
}
function sanitizeFormula(raw: unknown): QuestionFormula | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if ((r.language !== 'arabic' && r.language !== 'latin') || typeof r.value !== 'string' || r.value.length > 1500) return null;
  return { language: r.language, value: r.value };
}
export function sanitizeStructured(raw: unknown): StructuredExam | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (!Array.isArray(item.questions) || item.questions.length > 100) return null;
  const count = item.pageCount === undefined ? 1 : Number(item.pageCount);
  if (!Number.isInteger(count) || count < 1 || count > 30) return null;
  const questions: ExamQuestion[] = [];
  for (const maybe of item.questions) {
    if (!maybe || typeof maybe !== 'object') return null;
    const q = maybe as Record<string, unknown>;
    if (typeof q.id !== 'string' || typeof q.title !== 'string' || typeof q.prompt !== 'string' ||
      typeof q.score !== 'number' || !Number.isFinite(q.score) || q.score < 0 || q.score > 10000 ||
      !Array.isArray(q.parts) || q.parts.length > 100 || q.prompt.length > 10000 || q.title.length > 500) return null;
    const page = q.page === undefined ? 0 : Number(q.page);
    if (!Number.isInteger(page) || page < 0 || page >= count) return null;
    if (q.branchNumbering !== undefined && !styleOK(q.branchNumbering)) return null;
    const parts: ExamPart[] = [];
    for (const maybePart of q.parts) {
      if (!maybePart || typeof maybePart !== 'object') return null;
      const p = maybePart as Record<string, unknown>;
      if (typeof p.id !== 'string' || typeof p.text !== 'string' || p.text.length > 10000) return null;
      if (p.score !== undefined && (typeof p.score !== 'number' || !Number.isFinite(p.score) || p.score < 0 || p.score > 10000)) return null;
      if (p.subNumbering !== undefined && !styleOK(p.subNumbering)) return null;
      if (p.subItems !== undefined && (!Array.isArray(p.subItems) || p.subItems.length > 50 || p.subItems.some(x => typeof x !== 'string' || x.length > 1000))) return null;
      const formula = p.formula === undefined ? undefined : sanitizeFormula(p.formula);
      const image = p.image === undefined ? undefined : sanitizeImage(p.image);
      if ((p.formula !== undefined && !formula) || (p.image !== undefined && !image)) return null;
      parts.push({id:p.id,text:p.text,
        ...(p.score === undefined ? {} : { score:p.score as number }),
        ...(formula ? {formula} : {}), ...(image ? {image} : {}),
        ...(p.subNumbering ? {subNumbering:p.subNumbering as BranchNumbering} : {}),
        ...(p.subItems ? {subItems:p.subItems as string[]} : {}),
      });
    }
    const formula = q.formula === undefined ? undefined : sanitizeFormula(q.formula);
    const image = q.image === undefined ? undefined : sanitizeImage(q.image);
    if ((q.formula !== undefined && !formula) || (q.image !== undefined && !image)) return null;
    questions.push({ id:q.id, title:q.title, prompt:q.prompt, score:q.score, parts, page,
      ...(formula ? { formula } : {}), ...(image ? { image } : {}),
      branchNumbering:q.branchNumbering as BranchNumbering || 'auto',
    });
  }
  return {
    questions, closing: typeof item.closing === 'string' ? item.closing.slice(0, 500) : '',
    pageCount:count, showFreeText:item.showFreeText === true,
  };
}
