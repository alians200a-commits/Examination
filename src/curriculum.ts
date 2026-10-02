/** Iraqi school choices. Grade-four primary is intentionally limited to Arabic and Maths for this application. */
export type Stage = 'primary' | 'intermediate' | 'preparatory';
export type Numbering = 'arabic' | 'latin';
export type NumberingChoice = 'auto' | Numbering;

const primaryAll = ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'العلوم', 'الاجتماعيات'];
const intermediateAll = ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'الأحياء', 'الكيمياء', 'الفيزياء', 'الاجتماعيات', 'التاريخ', 'الجغرافية'];
const preparatoryShared = ['التربية الإسلامية', 'اللغة العربية', 'اللغة الإنكليزية', 'الرياضيات', 'الفرنسية'];
const preparatoryScience = [...preparatoryShared, 'الأحياء', 'الكيمياء', 'الفيزياء', 'علم الأرض'];
const preparatoryLiterary = [...preparatoryShared, 'التاريخ', 'الجغرافية', 'الاقتصاد', 'علم الأرض'];

export const STAGE_LABELS: Record<Stage, string> = {
  primary: 'ابتدائية', intermediate: 'متوسطة', preparatory: 'إعدادية',
};
export const GRADES: Record<Stage, readonly string[]> = {
  primary: ['الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'],
  intermediate: ['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط'],
  preparatory: ['الرابع العلمي', 'الرابع الأدبي', 'الخامس العلمي', 'الخامس الأدبي', 'السادس العلمي', 'السادس الأدبي'],
};
export const EXAM_KINDS = ['نهاية السنة', 'نصف السنة', 'الشهر الأول', 'الشهر الثاني'] as const;
export type ExamKind = typeof EXAM_KINDS[number];
export const EXAM_ROUNDS = ['الدور الأول', 'الدور الثاني'] as const;

export function subjectsFor(stage: Stage, grade: string): string[] {
  if (stage === 'primary') return grade === GRADES.primary[0] ? ['اللغة العربية', 'الرياضيات'] : [...primaryAll];
  if (stage === 'intermediate') return [...intermediateAll];
  const result = grade.includes('الأدبي') ? preparatoryLiterary : preparatoryScience;
  return result.filter(s => s !== 'علم الأرض' || grade.includes('الرابع'));
}

const arabicSecondary = new Set(['التربية الإسلامية', 'اللغة العربية', 'الاجتماعيات', 'التاريخ', 'الجغرافية', 'الاقتصاد']);
export function numberingFor(stage: Stage, subject: string): Numbering {
  return stage === 'primary' ? subject === 'اللغة الإنكليزية' ? 'latin' : 'arabic'
    : arabicSecondary.has(subject) ? 'arabic' : 'latin';
}
export const isStage = (value: unknown): value is Stage => value === 'primary' || value === 'intermediate' || value === 'preparatory';
export const isExamKind = (value: unknown): value is ExamKind => EXAM_KINDS.includes(value as ExamKind);

export function examTitle(kind: ExamKind): string {
  return kind === 'نهاية السنة' ? 'أسئلة امتحانات نهاية السنة'
    : kind === 'نصف السنة' ? 'أسئلة امتحانات نصف السنة'
      : kind === 'الشهر الأول' ? 'أسئلة امتحانات الشهر الأول' : 'أسئلة امتحانات الشهر الثاني';
}
export const arabicDigit = (value: number | string): string => String(value).replace(/\d/g, s => '٠١٢٣٤٥٦٧٨٩'[Number(s)]);
export const digitsFor = (value: number | string, numbering: Numbering): string => numbering === 'arabic' ? arabicDigit(value) : String(value).replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
export const pageLabel = (page: number, numbering: Numbering) => digitsFor(page + 1, numbering);
export function examYear(value: string, numbering: Numbering): string { return digitsFor(value, numbering); }
export function defaultYear() { return '2027-2026'; }
export const PART_LABELS_AR = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن'];
export const PART_LABELS_EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export function partLabel(index: number, numbering: Numbering): string {
  return numbering === 'arabic' ? PART_LABELS_AR[index] || arabicDigit(index + 1) : PART_LABELS_EN[index] || String(index + 1);
}
