import type { JSONContent } from '@tiptap/core';
export type Theme = 'official' | 'modern' | 'green' | 'sand';
export type Format = 'image' | 'video';
export type Aspect = 'portrait' | 'landscape';
export interface ExamMeta {
  country: string; ministry: string; directorate: string; examTitle: string;
  grade: string; subject: string; examDate: string; teacher: string;
  school: string; duration: string;
}
export interface Project {
  version: 1;
  meta: ExamMeta;
  theme: Theme;
  format: Format;
  aspect: Aspect;
  document: JSONContent;
}
export const defaults: ExamMeta = {
  country: 'جمهورية العراق', ministry: 'وزارة التربية', directorate: 'المديرية العامة للتربية',
  examTitle: 'أسئلة امتحانات الشهر الأول', grade: 'للصف السادس الابتدائي',
  subject: 'العلوم', examDate: '2026 - 2027', teacher: '', school: '', duration: 'ساعة واحدة',
};
export const samples = `
<h2>س/1 ـ عرّف خمسًا مما يأتي: <strong>(10 درجات)</strong></h2>
<table><tbody>
<tr><td>1. التكاثر الخضري</td><td>2. التطعيم</td><td>3. الفسيلة</td></tr>
<tr><td>4. العمود الفقري</td><td>5. الجهاز العصبي</td><td>6. غلاف البذرة</td></tr>
</tbody></table>
<h2>س/2 ـ املأ الفراغات الآتية بما يناسبها: <strong>(10 درجات)</strong></h2>
<ol><li>تركيب يوجد داخل البذرة ويعد غذاءً للجنين يسمى ( .................... ).</li>
<li>تسمى المراحل التي تمر بها البذرة أثناء نموها ( .................... ).</li>
<li>يتكون العمود الفقري من ( .......... ) فقرة.</li></ol>
<h2>س/3 ـ أجب عما يأتي: <strong>(10 درجات)</strong></h2>
<p><strong>أ ـ</strong> ارسم مع التأشير الذرة والعيون؟</p>
<p><strong>ب ـ</strong> اذكر بعض الوظائف التخصصية المهمة للعظام في جسم الإنسان.</p>
<h2>س/4 ـ اختر الإجابة الصحيحة: <strong>(10 درجات)</strong></h2>
<ol><li>من البذور ذوات الفلقة الواحدة: ( أ ـ الفاصوليا، ب ـ الذرة ).</li>
<li>من النباتات التي يتم تكثيرها بالتطعيم: ( أ ـ البرتقال، ب ـ الموز ).</li></ol>
<h2>س/5 ـ عدّد فقط: <strong>(10 درجات)</strong></h2>
<p>أ ـ طرائق انتشار البذور. &nbsp;&nbsp; ب ـ أنواع فسائل نخلة التمر.</p>
`;
export const templates = [
  { id: 'definition', label: 'تعريفات', desc: 'سؤال مقسّم إلى مصطلحات', html: '<h2>س/ ـ عرّف خمسًا مما يأتي: <strong>(10 درجات)</strong></h2><table><tbody><tr><td>1. المصطلح الأول</td><td>2. المصطلح الثاني</td><td>3. المصطلح الثالث</td></tr><tr><td>4. المصطلح الرابع</td><td>5. المصطلح الخامس</td><td>6. المصطلح السادس</td></tr></tbody></table><p></p>' },
  { id: 'blanks', label: 'املأ الفراغات', desc: 'فقرات مع مساحات للإجابة', html: '<h2>س/ ـ املأ الفراغات الآتية: <strong>(10 درجات)</strong></h2><ol><li>السؤال الأول ( .................... ).</li><li>السؤال الثاني ( .................... ).</li><li>السؤال الثالث ( .................... ).</li></ol><p></p>' },
  { id: 'mcq', label: 'اختيار من متعدد', desc: 'أربعة خيارات لكل فقرة', html: '<h2>س/ ـ اختر الإجابة الصحيحة: <strong>(10 درجات)</strong></h2><p>1. اكتب السؤال هنا:</p><p>أ ـ الاختيار الأول &nbsp;&nbsp; ب ـ الاختيار الثاني &nbsp;&nbsp; ج ـ الاختيار الثالث &nbsp;&nbsp; د ـ الاختيار الرابع</p><p></p>' },
  { id: 'essay', label: 'سؤال مقالي', desc: 'فراغ للإجابة أو الرسم', html: '<h2>س/ ـ أجب عما يأتي: <strong>(10 درجات)</strong></h2><p>أ ـ اكتب السؤال هنا.</p><p>........................................................................................</p><p>........................................................................................</p><p></p>' },
  { id: 'list', label: 'عدّد فقط', desc: 'عدة أفرع مرتبة', html: '<h2>س/ ـ عدّد فقط: <strong>(10 درجات)</strong></h2><p>أ ـ السؤال الأول؟</p><p>ب ـ السؤال الثاني؟</p><p>ج ـ السؤال الثالث؟</p><p></p>' },
];
export const THEME_OPTIONS: { id: Theme; label: string; colors: [string, string] }[] = [
  { id: 'official', label: 'رسمي أزرق', colors: ['#223c68', '#f0f3f9'] },
  { id: 'modern', label: 'كحلي حديث', colors: ['#142d49', '#e8eff7'] },
  { id: 'green', label: 'زمردي', colors: ['#1d685b', '#e8f4f0'] },
  { id: 'sand', label: 'أكاديمي دافئ', colors: ['#865f40', '#f6f0e8'] },
];
export const STORAGE_KEY = 'examination-arabic-studio-v1';