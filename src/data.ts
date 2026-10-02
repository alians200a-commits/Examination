import type { JSONContent } from '@tiptap/core';
import type { StructuredExam } from './formExam';
import type { Stage, ExamKind, NumberingChoice } from './curriculum';

export type Theme = 'official' | 'graphite' | 'emerald' | 'burgundy' | 'indigo';

export interface ExamMeta {
  country: string;
  ministry: string;
  directorate: string;
  school: string;
  examTitle: string;
  grade: string;
  subject: string;
  examDate: string;
  day: string;
  schoolFooter: string;
  round: string;
  duration: string;
  teacher: string;
  note: string;
  stage: Stage;
  examKind: ExamKind;
  hijriDate: string;
  numbering: NumberingChoice;
  fontFamily: string;
  fontSize: string;
  customFontSrc: string;
  customFontName: string;
}

export interface LogoSettings {
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  /** نسبة الارتفاع إلى العرض (لحجز مساحة الشعار في أعلى الترويسة). */
  ratio: number;
}

export interface Project {
  version: 2;
  meta: ExamMeta;
  theme: Theme;
  logo: LogoSettings;
  document: JSONContent;
  mode?: 'form' | 'free';
  structured?: StructuredExam;
}

export const defaults: ExamMeta = {
  country: 'جمهورية العراق',
  ministry: 'وزارة التربية',
  directorate: 'المديرية العامة للتربية',
  school: '',
  examTitle: 'أسئلة امتحانات الشهر الأول',
  grade: 'الصف السادس الابتدائي',
  subject: 'العلوم',
  examDate: '2027-2026',
  day: '',
  schoolFooter: 'no',
  round: '',
  duration: 'ساعة واحدة',
  teacher: '',
  note: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال 20 درجة ولكل فرع 10 درجات.',
  stage: 'primary',
  examKind: 'الشهر الأول',
  hijriDate: '',
  numbering: 'auto',
  fontFamily: "'Noto Naskh Arabic', serif",
  fontSize: '12',
  customFontSrc: '',
  customFontName: '',
};

/** المساحة (كنسبة من عرض الترويسة) التي تُحجز أعلى الترويسة حتى لا يغطي الشعار النص. */
export const logoBand = (width: number, ratio: number) => width * ratio + 1.5;

/** الموضع الافتراضي: منتصف الشعار في المساحة المحجوزة فوق عنوان الامتحان. */
export function logoHome(width: number, ratio: number) {
  const HEADER_PX = 703;       // عرض محتوى A4 (186mm)
  const BASE_HEIGHT_PX = 142;  // ارتفاع الترويسة بدون شعار
  const band = (logoBand(width, ratio) / 100) * HEADER_PX;
  return { x: 50, y: Math.round(((band / 2) / (BASE_HEIGHT_PX + band)) * 1000) / 10 };
}

export const defaultLogo: LogoSettings = {
  src: '',
  name: '',
  width: 12,
  ratio: 1,
  ...logoHome(12, 1),
};

export const sampleDocument = `
<h2>س/1 ـ عرّف خمسة مما يأتي: <strong>(10 درجات)</strong></h2>
<table><tbody>
<tr><td>1. التكاثر الخضري</td><td>2. التطعيم</td><td>3. الفسيلة</td></tr>
<tr><td>4. العمود الفقري</td><td>5. الجهاز العصبي</td><td>6. غلاف البذرة</td></tr>
</tbody></table>
<h2>س/2 ـ املأ الفراغات الآتية بما يناسبها: <strong>(10 درجات)</strong></h2>
<ol>
<li>تركيب يوجد داخل البذرة ويعد غذاءً للجنين يسمى ( .................... ).</li>
<li>تسمى المراحل التي تمر بها البذرة أثناء نموها ( .................... ).</li>
<li>يتكون العمود الفقري من ( .......... ) فقرة.</li>
</ol>
<h2>س/3 ـ أجب عما يأتي: <strong>(10 درجات)</strong></h2>
<p><strong>أ ـ</strong> ارسم مع التأشير الذرة والعيون؟</p>
<p><strong>ب ـ</strong> اذكر بعض الوظائف التخصصية المهمة للعظام في جسم الإنسان.</p>
<h2>س/4 ـ اختر الإجابة الصحيحة من بين الأقواس: <strong>(10 درجات)</strong></h2>
<ol>
<li>من البذور ذوات الفلقة الواحدة: ( أ ـ الفاصوليا، ب ـ الذرة ).</li>
<li>من النباتات التي يتم تكثيرها بالتطعيم: ( أ ـ البرتقال، ب ـ الموز ).</li>
</ol>
<h2>س/5 ـ عدّد فقط: <strong>(10 درجات)</strong></h2>
<p>أ ـ طرائق انتشار البذور. &nbsp;&nbsp; ب ـ أنواع فسائل نخلة التمر.</p>
`;

export const questionTemplates = [
  {
    id: 'definition',
    label: 'تعريفات',
    html: '<h2>س/ ـ عرّف خمسة مما يأتي: <strong>(10 درجات)</strong></h2><table><tbody><tr><td>1. المصطلح الأول</td><td>2. المصطلح الثاني</td><td>3. المصطلح الثالث</td></tr><tr><td>4. المصطلح الرابع</td><td>5. المصطلح الخامس</td><td>6. المصطلح السادس</td></tr></tbody></table><p></p>',
  },
  {
    id: 'blanks',
    label: 'املأ الفراغات',
    html: '<h2>س/ ـ املأ الفراغات الآتية بما يناسبها: <strong>(10 درجات)</strong></h2><ol><li>السؤال الأول ( .................... ).</li><li>السؤال الثاني ( .................... ).</li><li>السؤال الثالث ( .................... ).</li></ol><p></p>',
  },
  {
    id: 'mcq',
    label: 'اختيار من متعدد',
    html: '<h2>س/ ـ اختر الإجابة الصحيحة من بين الأقواس: <strong>(10 درجات)</strong></h2><ol><li>اكتب السؤال الأول هنا: ( أ ـ الاختيار الأول، ب ـ الاختيار الثاني ).</li><li>اكتب السؤال الثاني هنا: ( أ ـ الاختيار الأول، ب ـ الاختيار الثاني ).</li></ol><p></p>',
  },
  {
    id: 'truefalse',
    label: 'صح / خطأ',
    html: '<h2>س/ ـ ضع كلمة صح أمام العبارة الصحيحة وخطأ أمام العبارة الخاطئة: <strong>(10 درجات)</strong></h2><ol><li>العبارة الأولى ..........................................</li><li>العبارة الثانية ..........................................</li><li>العبارة الثالثة ..........................................</li></ol><p></p>',
  },
  {
    id: 'essay',
    label: 'سؤال مقالي',
    html: '<h2>س/ ـ أجب عما يأتي: <strong>(10 درجات)</strong></h2><p>أ ـ اكتب السؤال هنا.</p><p>........................................................................................</p><p>........................................................................................</p><p></p>',
  },
  {
    id: 'numbering',
    label: 'عدّد فقط',
    html: '<h2>س/ ـ عدّد فقط: <strong>(10 درجات)</strong></h2><p>أ ـ الفرع الأول.</p><p>ب ـ الفرع الثاني.</p><p>ج ـ الفرع الثالث.</p><p></p>',
  },
  {
    id: 'mathproof',
    label: 'مسألة رياضيات',
    html: '<h2>س/ ـ أوجد / أثبت ما يأتي: <strong>(20 درجة)</strong></h2><p>1) اكتب نص المسألة هنا.</p><p>2) اكتب نص المسألة هنا.</p><p></p>',
  },
];

export const paperPresets = [
  {
    id: 'primary',
    label: 'نمط ابتدائي',
    summary: 'ترويسة رسمية بسيطة وشريط ملاحظة واضح',
    meta: {
      examTitle: 'أسئلة امتحانات الشهر الأول',
      grade: 'للصف السادس الابتدائي',
      subject: 'العلوم',
      duration: 'ساعة واحدة',
      note: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال 20 درجة ولكل فرع 10 درجات.',
  stage: 'primary',
  examKind: 'الشهر الأول',
  hijriDate: '',
  numbering: 'auto',
  fontFamily: "'Noto Naskh Arabic', serif",
  fontSize: '12',
  customFontSrc: '',
  customFontName: '',
    },
    content: sampleDocument,
  },
  {
    id: 'intermediate',
    label: 'نمط متوسط',
    summary: 'مناسب للأول والثاني والثالث المتوسط',
    meta: {
      examTitle: 'أسئلة امتحانات نصف السنة',
      grade: 'الصف الأول المتوسط',
      subject: 'الكيمياء',
      duration: 'ساعة ونصف',
      note: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال 20 درجة ولكل فرع 10 درجات.',
  stage: 'primary',
  examKind: 'الشهر الأول',
  hijriDate: '',
  numbering: 'auto',
  fontFamily: "'Noto Naskh Arabic', serif",
  fontSize: '12',
  customFontSrc: '',
  customFontName: '',
    },
    content: `
<h2>س/1 ـ عرّف ما يأتي (لخمسة فقط): <strong>(20 درجة)</strong></h2>
<p>1- علم الكيمياء &nbsp;&nbsp; 2- الحركة العشوائية &nbsp;&nbsp; 3- الفصل &nbsp;&nbsp; 4- المخاليط</p>
<h2>س/2 ـ املأ الفراغات الآتية بما يناسبها: <strong>(20 درجة)</strong></h2>
<ol>
<li>تسمى المواد التي تذوب في الماء بالمواد الذائبة مثل ....................</li>
<li>ترتيب العناصر في الجدول الدوري بشكل عمودي يسمى ....................</li>
<li>الاسم العادي للزمرة الثامنة هو ....................</li>
</ol>
<h2>س/3 ـ أجب عن فرعين فقط: <strong>(20 درجة)</strong></h2>
<p>أ) ما استعمالات البتروكيمياويات؟</p>
<p>ب) ما خصائص الفلزات؟</p>
<p>ج) مم تتكون الذرة؟</p>
`,
  },
  {
    id: 'preparatory',
    label: 'نمط إعدادي',
    summary: 'ملائم للمراحل المنتهية والمواد العلمية',
    meta: {
      examTitle: 'أسئلة امتحانات نهاية السنة',
      grade: 'الصف السادس العلمي',
      subject: 'الرياضيات',
      duration: 'ثلاث ساعات',
      note: 'ملاحظة: الإجابة عن خمسة أسئلة فقط ولكل سؤال 20 درجة.',
    },
    content: `
<h2>س/1 ـ أجب عن خمسة أسئلة فقط: <strong>(20 درجة)</strong></h2>
<p>أثبت أن: <span data-type="math" data-latex="P \\to Q \\equiv \\neg P \\vee Q"></span></p>
<h2>س/2 ـ جد مجموعة الحل: <strong>(20 درجة)</strong></h2>
<p><span data-type="math" data-latex="x|x|+4=0"></span></p>
<h2>س/3 ـ حل المعادلة الآتية: <strong>(20 درجة)</strong></h2>
<p><span data-type="math" data-latex="2^{x^2-2x+1}=4^{x+3}"></span></p>
<h2>س/4 ـ ارسم: <strong>(20 درجة)</strong></h2>
<p><span data-type="math" data-latex="y=|x-1|+3"></span></p>
`,
  },
] as const;

export const THEME_OPTIONS: { id: Theme; label: string; description: string; colors: [string, string, string] }[] = [
  {
    id: 'official',
    label: 'رسمي أزرق',
    description: 'أعلى وضوح للطباعة الرسمية وتباين هادئ قريب من النماذج الوزارية.',
    colors: ['#163A70', '#E8EEF6', '#0F172A'],
  },
  {
    id: 'graphite',
    label: 'جرافيت أكاديمي',
    description: 'رمادي داكن مع لمسة ذهبية خفيفة مناسبة للمواد النظرية.',
    colors: ['#2B3440', '#F3F4F6', '#B7791F'],
  },
  {
    id: 'emerald',
    label: 'زمردي هادئ',
    description: 'ثيم دراسي مريح بصريًا ومتوازن للعرض على الشاشات والطباعة.',
    colors: ['#0F766E', '#ECFDF5', '#134E4A'],
  },
  {
    id: 'burgundy',
    label: 'عنابي رصين',
    description: 'ثيم جاد ومرتب للامتحانات الأدبية والإنسانية.',
    colors: ['#7F1D1D', '#FEF2F2', '#4C0519'],
  },
  {
    id: 'indigo',
    label: 'نيلي حديث',
    description: 'نيلي واضح مع حياد بصري جيّد للموبايل والتابلت.',
    colors: ['#312E81', '#EEF2FF', '#1E1B4B'],
  },
];

export const STORAGE_KEY = 'examination-arabic-studio-v2';
